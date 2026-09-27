import axios from 'axios';

// Point directly to the Gateway instead of the user-service
const AUTH_URL = 'http://localhost:8000/api/auth';

export const authApi = {
    signup: async (userData) => {
        const response = await axios.post(`${AUTH_URL}/signup`, userData);
        return response.data;
    }
};