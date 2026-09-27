import { createContext, useContext } from 'react';

// Hardcoded mock user UUID for MVP testing (matches what we used in Postman)
const MOCK_USER = {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    username: "AthensGrooves",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
};

const AuthContext = createContext(MOCK_USER);

export const AuthProvider = ({ children }) => {
    return (
        <AuthContext.Provider value={MOCK_USER}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);