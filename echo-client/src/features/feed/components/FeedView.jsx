import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../../api/apiClient';
import { feedApi } from '../../../api/feedApi';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

export default function FeedView({ refreshTrigger, currentUserProfilePic, currentUsername }) {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    
    const [connections, setConnections] = useState([]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                // apiClient automatically uses port 8000 and injects the Authorization header
                const res = await apiClient.get('/api/sync/connections');
                setConnections(res.data || []);
            } catch (err) {
                console.error("Failed to fetch connections", err);
            }
        };
        fetchConnections();
    }, [refreshTrigger]); 

    const fetchFeed = async (pageNumber) => {
        setLoading(true);
        try {
            const data = await feedApi.getFeed(pageNumber, 10);
            
            setPosts(prev => {
                if (pageNumber === 0) return data.content;
                
                const existingIds = new Set(prev.map(p => p.id));
                const newPosts = data.content.filter(p => !existingIds.has(p.id));
                return [...prev, ...newPosts];
            });
            
            setHasMore(!data.last);
        } catch (err) {
            console.error("Failed to fetch feed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed(page);
    }, [page]);

    useEffect(() => {
        if (refreshTrigger > 0) {
            setPage(0);
            fetchFeed(0);
        }
    }, [refreshTrigger]);

    const observer = useRef();
    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const handleNewPostCreated = (newPost) => setPosts(prev => [newPost, ...prev]);
    const handlePostDeleted = (postId) => setPosts(prev => prev.filter(post => post.id !== postId));

    return (
        <div className="w-full flex flex-col gap-4 sm:gap-6 relative z-10">
            
            <CreatePost 
                onPostCreated={handleNewPostCreated} 
                currentUserProfilePic={currentUserProfilePic} 
                currentUsername={currentUsername} 
            />
            
            <div className="w-full flex flex-col gap-4 sm:gap-6">
                {posts.map((post, index) => {
                    const isAlreadySynced = connections.includes(post.userId);

                    if (posts.length === index + 1) {
                        return (
                            <div ref={lastElementRef} key={post.id} className="w-full">
                                <PostCard 
                                    post={post} 
                                    isSynced={isAlreadySynced} 
                                    currentUserProfilePic={currentUserProfilePic}
                                    onPostDeleted={postId => handlePostDeleted(postId)} 
                                />
                            </div>
                        );
                    }
                    return (
                        <div key={post.id} className="w-full">
                            <PostCard 
                                post={post} 
                                isSynced={isAlreadySynced} 
                                currentUserProfilePic={currentUserProfilePic}
                                onPostDeleted={postId => handlePostDeleted(postId)} 
                            />
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div className="py-8 w-full flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-fuchsia-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading frequencies...</span>
                </div>
            )}
            
            {!hasMore && posts.length > 0 && (
                <div className="py-12 w-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-12 h-1 bg-slate-800 rounded-full mb-4"></div>
                    <span className="text-sm font-semibold tracking-wide text-slate-400">You're all caught up.</span>
                </div>
            )}
        </div>
    );
}