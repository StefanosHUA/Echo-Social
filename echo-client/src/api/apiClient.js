import axios from 'axios';

export const apiClient = axios.create({
    // FIX: Match the browser's "localhost" origin exactly
    baseURL: 'http://localhost:8000', 
    withCredentials: true 
});

// 1. Inject the Access Token into every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('echo_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Catch 401s and 403s, Refresh the Token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes('/api/auth/refresh')) {
            return Promise.reject(error);
        }

        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // FIX: Match localhost here as well
                const res = await axios.post('http://localhost:8000/api/auth/refresh', {}, {
                    withCredentials: true
                });

                const newAccessToken = res.data.token;
                localStorage.setItem('echo_token', newAccessToken);

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
                
            } catch (refreshError) {
                localStorage.removeItem('echo_token');
                window.location.href = '/'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);