import React, { useState } from 'react';
import { apiClient } from '../../../api/apiClient'; // <-- Uses API Gateway (port 8000) with auto-token injection
import SyncModal from '../../auth/components/SyncModal';

export default function PostCard({ post, isSynced, onPostDeleted, currentUserProfilePic }) {
    const getDecodedToken = () => {
        const token = localStorage.getItem('echo_token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    const decodedToken = getDecodedToken();
    const currentUserId = decodedToken ? decodedToken.userId : null;
    const currentUsername = decodedToken ? decodedToken.sub : 'Unknown';

    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    
    const [isLiked, setIsLiked] = useState(() => {
        if (post.likedUserIds) return post.likedUserIds.includes(currentUserId);
        if (post.likedByCurrentUser !== undefined) return post.likedByCurrentUser;
        if (post.hasLiked !== undefined) return post.hasLiked;
        return false;
    });

    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState(post.comments || []);
    const [showComments, setShowComments] = useState(false);

    const isMyPost = currentUserId === post.userId;
    const isLocked = !isMyPost && !isSynced;

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        
        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/posts/${post.id}`);
            onPostDeleted(post.id);
        } catch (err) {
            console.error("Failed to delete post", err);
            alert("Failed to delete post.");
            setIsDeleting(false);
        }
    };

    const handleToggleLike = async () => {
        if (isLocked) return setShowSyncModal(true); 
        
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            await apiClient.post(`/api/posts/${post.id}/likes/toggle`, {
                userId: currentUserId
            });
        } catch (err) {
            setIsLiked(!newLikedState);
            setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
        }
    };

    const handleCommentSubmit = async () => {
        if (isLocked) return setShowSyncModal(true); 
        if (!commentText.trim()) return;
        
        try {
            const res = await apiClient.post(`/api/posts/${post.id}/comments`, { 
                userId: currentUserId,
                content: commentText 
            });
            
            setComments(prev => [...prev, res.data || { 
                id: Date.now(), 
                userId: currentUserId, 
                content: commentText, 
                username: currentUsername 
            }]);
            
            setCommentText("");
            setShowComments(true);
        } catch (err) {
            console.error("Failed to post comment", err);
            alert("Failed to post comment.");
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;

        try {
            await apiClient.delete(`/api/posts/${post.id}/comments/${commentId}`, {
                params: { userId: currentUserId }
            });
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const formattedDate = new Date(post.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const trackId = post.spotifyTrackUri ? post.spotifyTrackUri.split(':').pop() : null;
    const displayUsername = isMyPost ? currentUsername : (post.username || (post.userId ? post.userId.substring(0, 8) : 'Unknown'));

    const finalAvatar = isMyPost 
        ? currentUserProfilePic 
        : (post.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}&backgroundColor=1e293b`);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative transition hover:border-slate-700 overflow-hidden">
            
            {/* User Header */}
            <div className="flex justify-between items-start sm:items-center mb-4 gap-2 relative z-10">
                <div className="flex items-center gap-3">
                    <a href={`/profile/${post.userId}`}>
                        <img 
                            src={finalAvatar} 
                            alt="Avatar" 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-slate-800 hover:opacity-80 transition cursor-pointer"
                        />
                    </a>
                    <div className="flex flex-col">
                        <a href={`/profile/${post.userId}`}>
                            <h3 className="font-bold text-slate-100 text-sm sm:text-base hover:text-fuchsia-400 transition cursor-pointer">
                                {displayUsername}
                            </h3>
                        </a>
                        <p className="text-[10px] sm:text-xs text-slate-400">{formattedDate}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isLocked && (
                        <button 
                            onClick={() => setShowSyncModal(true)}
                            className="bg-fuchsia-600/10 text-fuchsia-400 hover:bg-fuchsia-600 hover:text-white px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition shadow-[0_0_10px_rgba(192,38,211,0.2)]"
                        >
                            + Sync
                        </button>
                    )}
                    {isMyPost && (
                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-xs text-slate-500 hover:text-rose-500 font-medium transition disabled:opacity-50"
                        >
                            {isDeleting ? '...' : 'Delete'}
                        </button>
                    )}
                </div>
            </div>

            {/* Post Caption (Hidden/Blurred if locked) */}
            {post.caption && (
                <div className={`mb-4 transition-all duration-300 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                    <p className="text-sm sm:text-base text-slate-200 whitespace-pre-wrap">{post.caption}</p>
                </div>
            )}

            {/* Spotify Player Area */}
            {trackId && (
                <div className="relative mb-4 overflow-hidden rounded-xl bg-slate-950 min-h-[80px]">
                    
                    {/* The actual iframe, blurred and disabled if locked */}
                    <div className={`transition-all duration-500 ${isLocked ? 'blur-md opacity-30 pointer-events-none' : ''}`}>
                        <iframe 
                            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`} 
                            width="100%" 
                            height="80" 
                            frameBorder="0" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"
                            title="Spotify Player"
                        ></iframe>
                    </div>
                    
                    {/* The Lock Overlay Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-[2px] z-20">
                            <span className="text-lg leading-none mb-0.5">🔒</span>
                            <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase mb-1.5">Private Frequency</span>
                            <button 
                                onClick={() => setShowSyncModal(true)}
                                className="text-[10px] font-black text-fuchsia-400 bg-slate-900/90 px-3 py-1 rounded-full border border-fuchsia-500/50 hover:bg-fuchsia-600 hover:text-white transition-all shadow-[0_0_10px_rgba(192,38,211,0.2)]"
                            >
                                Sync to Unlock
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Interactions Bar */}
            <div className={`flex items-center gap-4 mt-4 transition-all ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                <button 
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 text-sm transition ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
                >
                    {isLiked ? '♥' : '♡'} <span>{likeCount}</span>
                </button>
                <button 
                    onClick={() => {
                        if (isLocked) setShowSyncModal(true);
                        else setShowComments(!showComments);
                    }}
                    className="flex items-center gap-1.5 text-sm hover:text-fuchsia-400 transition"
                >
                    💬 <span>{comments.length}</span>
                </button>
            </div>

            {/* Comments Section (Hidden if locked) */}
            {showComments && comments.length > 0 && !isLocked && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    {comments.map((c, i) => (
                        <div key={c.id || i} className="flex justify-between items-start text-xs sm:text-sm group">
                            <div className="flex-1 pr-2">
                                <span className="font-bold text-slate-200 mr-2">{c.username || 'User'}</span>
                                <span className="text-slate-400 break-words">{c.content || c.text}</span>
                            </div>
                            {c.userId === currentUserId && (
                                <button 
                                    onClick={() => handleCommentDelete(c.id)}
                                    className="text-xs font-semibold text-slate-600 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 shrink-0"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Comment Input Field */}
            <div className="mt-4 flex gap-2 items-center">
                <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                    placeholder={isLocked ? "Sync to comment..." : "Add a comment..."} 
                    disabled={isLocked}
                    className="flex-1 w-full bg-slate-950 border border-slate-800 text-xs sm:text-sm rounded-full px-3 sm:px-4 py-2 focus:outline-none focus:border-fuchsia-500/50 transition text-slate-200 disabled:opacity-50"
                />
                <button 
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || isLocked}
                    className="text-fuchsia-400 font-bold text-xs sm:text-sm px-2 hover:text-fuchsia-300 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    Post
                </button>
            </div>

            {showSyncModal && (
                <SyncModal 
                    receiverId={post.userId}
                    receiverName={displayUsername}
                    onClose={() => setShowSyncModal(false)}
                />
            )}
        </div>
    );
}