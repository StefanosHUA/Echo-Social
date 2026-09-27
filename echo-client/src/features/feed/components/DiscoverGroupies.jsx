import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient'; // <-- Adjust path if needed
import SyncModal from '../../auth/components/SyncModal';

export default function DiscoverGroupies() {
    const [groupies, setGroupies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedReceiver, setSelectedReceiver] = useState(null);

    useEffect(() => {
        const fetchGroupies = async () => {
            try {
                // FIX: Use apiClient to route through the Gateway (port 8000) automatically
                const res = await apiClient.get('/api/discover/groupies');
                setGroupies(res.data);
            } catch (err) {
                console.error("Failed to fetch groupies", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGroupies();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-fuchsia-400 mb-2">Discover Groupies</h1>
                        <p className="text-slate-400 text-sm">People who share your vibe. Ranked by musical overlap.</p>
                    </div>
                    <a href="/" className="text-sm font-semibold text-slate-500 hover:text-fuchsia-400 transition">← Back to Feed</a>
                </div>

                {loading ? (
                    <div className="text-center text-fuchsia-400 animate-pulse mt-20">Scanning frequencies...</div>
                ) : groupies.length === 0 ? (
                    <div className="text-center p-12 bg-slate-900 rounded-3xl border border-slate-800 text-slate-400">
                        No matches found yet. Try adding more artists to your profile!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {groupies.map(groupie => {
                            const displayAvatar = groupie.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupie.userId}&backgroundColor=1e293b`;
                            const displayUsername = groupie.username || `User: ${groupie.userId.substring(0, 8)}`;

                            return (
                                <div key={groupie.userId} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden group hover:border-fuchsia-500/50 transition">
                                    
                                    <div className="absolute top-0 left-0 w-full bg-fuchsia-600/10 border-b border-fuchsia-500/20 py-1.5 px-3 text-xs font-bold text-fuchsia-400">
                                        {groupie.sharedArtistNames.length} Shared Artist{groupie.sharedArtistNames.length !== 1 ? 's' : ''}
                                    </div>

                                    <img 
                                        src={displayAvatar} 
                                        alt="Avatar" 
                                        className="w-24 h-24 rounded-full border-4 border-slate-950 shadow-lg object-cover bg-slate-800 mt-6 mb-4"
                                    />
                                    
                                    <h3 className="text-lg font-black text-slate-100 mb-2 truncate w-full">{displayUsername}</h3>
                                    
                                    <p className="text-xs text-slate-400 mb-6 line-clamp-2 min-h-[2rem]">
                                        {groupie.sharedArtistNames.slice(0, 3).join(', ')}
                                        {groupie.sharedArtistNames.length > 3 && ` +${groupie.sharedArtistNames.length - 3} more`}
                                    </p>

                                    <button 
                                        onClick={() => setSelectedReceiver({ ...groupie, username: displayUsername })}
                                        className="w-full bg-slate-800 hover:bg-fuchsia-600 text-slate-200 hover:text-white py-2.5 rounded-xl text-sm font-bold transition shadow-md"
                                    >
                                        Send Sync
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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