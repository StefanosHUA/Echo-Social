import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../api/apiClient'; // <-- Adjust path if needed

export default function Navbar() {
    const [profilePic, setProfilePic] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [pendingSyncs, setPendingSyncs] = useState([]);
    
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('echo_token');
            if (!token) return 'Fallback';
            return JSON.parse(atob(token.split('.')[1])).userId;
        } catch (e) { return 'Fallback'; }
    };

    const currentUserId = getUserIdFromToken();
    const defaultAvatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}&backgroundColor=1e293b`;

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const userRes = await apiClient.get('/api/users/me');
                setProfilePic(userRes.data.profileImageUrl);

                const syncRes = await apiClient.get('/api/sync/pending');
                setPendingSyncs(syncRes.data || []);
            } catch (e) {
                console.error("Failed to load navbar data", e);
            }
        };
        fetchNavData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSyncAction = async (syncId, action) => {
        try {
            await apiClient.post(`/api/sync/${action}/${syncId}`);
            setPendingSyncs(prev => prev.filter(s => s.syncId !== syncId));
            if (action === 'accept') window.location.reload(); // Quick refresh to update feed
        } catch (err) {
            alert(`Failed to ${action} request.`);
        }
    };

    const handleLogout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (err) {
            console.error("Logout failed on server", err);
        } finally {
            localStorage.removeItem('echo_token');
            window.location.href = '/'; 
        }
    };

    return (
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-md">
            <a href="/" className="text-2xl font-black text-fuchsia-400 tracking-widest hover:text-fuchsia-300 transition">ECHO</a>
            
            <div className="flex items-center gap-5">
                <a href="/groupies" className="text-xl hover:scale-110 transition-transform" title="Discover Groupies">
                    🔍
                </a>

                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative p-2 text-slate-300 hover:text-fuchsia-400 transition"
                    >
                        🔔
                        {pendingSyncs.length > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                            <div className="p-3 border-b border-slate-800 font-bold text-sm text-slate-200 bg-slate-800/50">
                                Pending Syncs ({pendingSyncs.length})
                            </div>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {pendingSyncs.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-slate-500">No new requests.</div>
                                ) : (
                                    pendingSyncs.map(sync => (
                                        <div key={sync.syncId} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/50 transition">
                                            <div className="flex items-center gap-3 mb-3">
                                                <img src={sync.senderProfilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sync.senderId}&backgroundColor=1e293b`} alt="Sender" className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                                                <span className="text-sm font-semibold text-slate-200">{sync.senderUsername}</span>
                                            </div>
                                            
                                            {sync.icebreakerTrackId && (
                                                <iframe 
                                                    src={`https://open.spotify.com/embed/track/${sync.icebreakerTrackId}?utm_source=generator&theme=0`} 
                                                    width="100%" height="80" frameBorder="0" allow="encrypted-media" className="rounded-lg mb-3"
                                                ></iframe>
                                            )}
                                            
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSyncAction(sync.syncId, 'decline')} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-950 hover:bg-slate-800 border border-slate-700 transition">Pass</button>
                                                <button onClick={() => handleSyncAction(sync.syncId, 'accept')} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition">Sync</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                        className="flex items-center gap-2 focus:outline-none transition transform hover:scale-105"
                    >
                        <img 
                            src={profilePic || defaultAvatarFallback} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full border-2 border-slate-700 hover:border-fuchsia-400 transition object-cover bg-slate-800"
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                            <a href="/profile" className="px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-fuchsia-400 transition">👤 My Profile</a>
                            <a href="/settings" className="px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-fuchsia-400 transition">⚙️ Settings</a>
                            <div className="border-t border-slate-800"></div>
                            <button onClick={handleLogout} className="text-left px-4 py-3 text-sm font-medium text-rose-500 hover:bg-slate-800 transition">🚪 Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}