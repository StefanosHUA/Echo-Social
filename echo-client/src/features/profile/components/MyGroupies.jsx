import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient'; 
import axios from 'axios';

export default function MyGroupies() {
    const [groupies, setGroupies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroupies = async () => {
            try {
                const res = await apiClient.get('/api/sync/groupies/details');
                setGroupies(res.data);
            } catch (err) {
                console.error("Failed to load groupies", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGroupies();
    }, []);

    const handleUnsync = async (friendId) => {
        if (!window.confirm("Are you sure you want to un-sync? Their posts will disappear from your feed.")) return;

        try {
            const token = localStorage.getItem('echo_token');
            await axios.delete(`http://localhost:8081/api/sync/remove/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroupies(prev => prev.filter(g => g.userId !== friendId));
        } catch (err) {
            alert("Failed to remove connection.");
        }
    };

    if (loading) return <div className="text-fuchsia-400 animate-pulse text-center p-8">Loading connections...</div>;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-black text-slate-100 mb-6">My Groupies ({groupies.length})</h2>
            
            {groupies.length === 0 ? (
                <p className="text-slate-500 text-sm text-center">You haven't synced with anyone yet. Head to the Discover tab!</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {groupies.map((groupie, index) => (
                        <div key={`${groupie.userId}-${index}`} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                            <div className="flex items-center gap-4">
                                <a href={`/profile/${groupie.userId}`}>
                                    <img 
                                        src={groupie.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${groupie.userId}&backgroundColor=1e293b`} 
                                        alt="Avatar" 
                                        className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 object-cover hover:opacity-80 transition cursor-pointer"
                                    />
                                </a>
                                <a href={`/profile/${groupie.userId}`} className="font-bold text-slate-200 hover:text-fuchsia-400 transition cursor-pointer">
                                    {groupie.username || groupie.userId.substring(0, 8)}
                                </a>
                            </div>
                            <button 
                                onClick={() => handleUnsync(groupie.userId)}
                                className="text-xs font-bold text-slate-500 hover:text-rose-500 transition px-3 py-1.5 border border-slate-800 hover:border-rose-500/50 rounded-lg"
                            >
                                Un-sync
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}