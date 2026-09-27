import axios from 'axios';

const axiosClient = axios.create({
    // Point to the Gateway
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;