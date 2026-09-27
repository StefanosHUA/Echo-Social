import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient'; // <-- Adjust path if needed
import PostCard from '../../feed/components/PostCard'; 

export default function PublicProfile({ userId }) {
    const [targetUser, setTargetUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAlreadySynced, setIsAlreadySynced] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch the user's basic profile details via Gateway
                try {
                    const profileRes = await apiClient.get(`/api/users/${userId}`);
                    setTargetUser(profileRes.data);
                } catch (e) {
                    console.error("Failed to fetch user profile details", e);
                }

                // Fetch the user's specific post timeline via Gateway
                const postsRes = await apiClient.get(`/api/posts/user/${userId}?page=0&size=20`);
                
                // Check if you are already connected to this user via Gateway
                const connectionsRes = await apiClient.get('/api/sync/connections');
                const myConnections = connectionsRes.data || [];
                
                setIsAlreadySynced(myConnections.includes(userId));
                setPosts(postsRes.data.content || []);
            } catch (err) {
                console.error("Failed to fetch public profile data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    const displayUsername = targetUser?.username || `User: ${userId.substring(0, 8)}`;
    const displayAvatar = targetUser?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=1e293b`;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center">
                    <img 
                        src={displayAvatar} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full border-4 border-slate-950 shadow-xl mb-4 object-cover bg-slate-800"
                    />
                    <h1 className="text-2xl font-black text-fuchsia-400 mb-1">
                        {displayUsername}
                    </h1>
                </div>

                <h2 className="text-lg font-bold text-slate-300 mt-4 px-2">Recent Tracks</h2>
                
                {loading ? (
                    <div className="text-center text-fuchsia-400 animate-pulse mt-10">Loading catalog...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center p-12 bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
                        This user hasn't posted any tracks yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isSynced={isAlreadySynced}
                                onPostDeleted={() => {}} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}