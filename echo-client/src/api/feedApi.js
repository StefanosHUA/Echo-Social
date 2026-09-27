import { apiClient } from './apiClient';

// Use a relative path. apiClient will route this to port 8000.
const FEED_BASE_URL = '/api';

export const feedApi = {
    getFeed: async (page = 0, size = 10) => {
        const response = await apiClient.get(`${FEED_BASE_URL}/posts`, {
            params: { 
                pageNo: page,   
                pageSize: size  
            }
        });
        return response.data;
    },

    createPost: async (postData) => {
        const response = await apiClient.post(`${FEED_BASE_URL}/posts`, postData);
        return response.data;
    },

    toggleLike: async (postId, userId) => {
        const response = await apiClient.post(`${FEED_BASE_URL}/posts/${postId}/likes/toggle`, {
            userId: userId
        });
        return response.data;
    },

    addComment: async (postId, userId, content) => {
        const response = await apiClient.post(`${FEED_BASE_URL}/posts/${postId}/comments`, {
            userId,
            content
        });
        return response.data;
    },

    deletePost: async (postId) => {
        await apiClient.delete(`${FEED_BASE_URL}/posts/${postId}`); 
    },

    deleteComment: async (postId, commentId, userId) => {
        await apiClient.delete(`${FEED_BASE_URL}/posts/${postId}/comments/${commentId}`, {
            params: { userId }
        });
    }
};