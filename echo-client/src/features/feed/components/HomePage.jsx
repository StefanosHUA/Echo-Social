import React, { useState, useEffect } from 'react';
// Make sure this path correctly points to your apiClient.js file
import { apiClient } from '../../../api/apiClient'; 
import FeedView from './FeedView';
import SyncModal from '../../auth/components/SyncModal';

export default function HomePage() {
    const [profilePic, setProfilePic] = useState(null);
    const [currentUser, setCurrentUser] = useState({ username: '', profileImageUrl: '' });
    const [suggestedGroupies, setSuggestedGroupies] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [refreshFeed, setRefreshFeed] = useState(0); 

    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('echo_token');
            if (!token) return 'Fallback';
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch (e) {
            return 'Fallback';
        }
    };

    const currentUserId = getUserIdFromToken();
    const defaultAvatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}&backgroundColor=1e293b`;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // We use apiClient here, so headers and baseURL are automatically injected
                const userRes = await apiClient.get('/api/users/me');
                setCurrentUser({
                    username: userRes.data.username,
                    profileImageUrl: userRes.data.profileImageUrl
                });
                setProfilePic(userRes.data.profileImageUrl);

                // We use apiClient here too
                const groupiesRes = await apiClient.get('/api/discover/groupies');
                setSuggestedGroupies(groupiesRes.data || []);
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            }
        };
        fetchDashboardData();
    }, []);

    // A helper to render the suggested groupies list (reused for both mobile and desktop)
    const renderGroupiesList = (isMobile) => {
        if (suggestedGroupies.length === 0) {
            return (
                <div className="text-center py-6 text-sm text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                    Scanning for matching frequencies...<br/>
                    <a href="/profile" className="text-fuchsia-400 text-xs mt-2 inline-block hover:underline">Add more artists to match!</a>
                </div>
            );
        }

        if (isMobile) {
            // Mobile: Horizontal scrolling carousel
            return (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                    {suggestedGroupies.slice(0, 5).map((groupie, idx) => {
                        const displayAvatar = groupie.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupie.userId}&backgroundColor=1e293b`;
                        const displayUsername = groupie.username || `User: ${groupie.userId.substring(0, 8)}`;
                        
                        return (
                            <div key={idx} className="shrink-0 w-40 bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center snap-center">
                                <a href={`/profile/${groupie.userId}`}>
                                    <img src={displayAvatar} alt={displayUsername} className="w-14 h-14 rounded-full object-cover border border-slate-700 mb-2" />
                                </a>
                                <span className="text-sm font-bold text-slate-200 truncate w-full mb-1">{displayUsername}</span>
                                <span className="text-[10px] text-slate-400 mb-3">{groupie.sharedArtistNames.length} shared artists</span>
                                <button 
                                    onClick={() => setSelectedReceiver({ ...groupie, username: displayUsername })}
                                    className="w-full text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 py-1.5 rounded-full transition-all"
                                >
                                    Sync
                                </button>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Desktop: Vertical list
        return (
            <div className="flex flex-col gap-5">
                {suggestedGroupies.slice(0, 4).map((groupie, idx) => {
                    const displayAvatar = groupie.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupie.userId}&backgroundColor=1e293b`;
                    const displayUsername = groupie.username || `User: ${groupie.userId.substring(0, 8)}`;
                    
                    return (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <a href={`/profile/${groupie.userId}`} className="relative">
                                    <img src={displayAvatar} alt={displayUsername} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-700 group-hover:border-fuchsia-400 transition-colors" />
                                </a>
                                <div className="flex flex-col">
                                    <a href={`/profile/${groupie.userId}`}>
                                        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{displayUsername}</span>
                                    </a>
                                    <span className="text-xs text-slate-400">
                                        {groupie.sharedArtistNames.length} shared artist{groupie.sharedArtistNames.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedReceiver({ ...groupie, username: displayUsername })}
                                className="text-xs font-bold text-fuchsia-400 hover:text-white bg-fuchsia-400/10 hover:bg-fuchsia-500 px-3 py-1.5 rounded-full transition-all"
                            >
                                Sync
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-slate-900 overflow-hidden font-sans text-slate-100">
            
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[40%] right-[-5%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="flex-1 relative z-10">
                <main className="w-full max-w-[90rem] mx-auto py-4 sm:py-8 px-4 flex flex-col lg:grid lg:grid-cols-[1fr_minmax(auto,42rem)_1fr] gap-6 lg:gap-10 items-start">
                    
                    <div className="hidden lg:block"></div>

                    {/* Center Column: The Main Feed */}
                    <div className="w-full flex flex-col gap-4 sm:gap-6">
                        
                        {/* MOBILE ONLY: Inline Groupie Carousel (Appears above the feed) */}
                        <div className="block lg:hidden mb-2">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <h3 className="text-sm font-black text-white tracking-wide">Top Groupies For You</h3>
                                <a href="/groupies" className="text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300">View All</a>
                            </div>
                            {renderGroupiesList(true)}
                        </div>

                        <FeedView 
                            refreshTrigger={refreshFeed} 
                            currentUserProfilePic={profilePic || defaultAvatarFallback}
                            currentUsername={currentUser.username} 
                        />
                    </div>

                    {/* Right Column: Sidebar (Hides on mobile, appears on desktop) */}
                    <div className="hidden lg:flex flex-col gap-6 sticky top-24 w-80">
                        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base font-black text-white tracking-wide">Top Groupies For You</h3>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded-full">Live</span>
                            </div>
                            
                            {renderGroupiesList(false)}

                            {suggestedGroupies.length > 0 && (
                                <a href="/groupies" className="mt-6 flex justify-center py-3 w-full border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors">
                                    View All Potential Groupies
                                </a>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-md py-8 sm:py-12 mt-8">
                <div className="max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
                    <div className="text-2xl sm:text-3xl mb-3">📻</div>
                    <h3 className="text-sm sm:text-base font-black text-slate-200 mb-2">Welcome to the Front Row</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                        Share your current rotation, discover new artists, and sync up with people who match your exact frequency.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
                        <a href="#" className="hover:text-fuchsia-400 transition-colors">Rules</a>
                        <a href="#" className="hover:text-fuchsia-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-fuchsia-400 transition-colors">About</a>
                    </div>
                </div>
            </footer>

            {selectedReceiver && (
                <SyncModal 
                    receiverId={selectedReceiver.userId}
                    receiverName={selectedReceiver.username}
                    onClose={() => setSelectedReceiver(null)}
                />
            )}
        </div>
    );
}