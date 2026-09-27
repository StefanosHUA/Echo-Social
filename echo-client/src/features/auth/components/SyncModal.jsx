import React, { useState, useEffect } from 'react';
import { spotifyApi } from '../../../api/spotifyApi';
import { apiClient } from '../../../api/apiClient';

export default function SyncModal({ receiverId, receiverName, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Debounced Spotify Track Search
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (query) {
                const tracks = await spotifyApi.searchTracks(query);
                setResults(tracks);
            } else {
                setResults([]);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [query]);

    const handleSendSync = async () => {
        if (!selectedTrack) return;
        setIsSending(true);
        try {
            await apiClient.post(`http://localhost:8081/api/sync/request/${receiverId}?trackId=${selectedTrack.id}`);
            alert('B2B Sync Request Sent!');
            onClose();
        } catch (error) {
            console.error(error);
            
            // Safely extract the exact error message from the backend
            let errorMessage = 'Failed to send request.';
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            alert(errorMessage);
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-fuchsia-400">Sync with {receiverName || 'User'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300">&times;</button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <p className="text-sm text-slate-400 mb-4">
                        Send an icebreaker track. If they vibe with it, the connection is made.
                    </p>

                    <input 
                        type="text"
                        placeholder="Search for a track..."
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl focus:outline-none focus:border-fuchsia-500 mb-4"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {results.map(track => (
                            <div 
                                key={track.id}
                                onClick={() => setSelectedTrack(track)}
                                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition border ${selectedTrack?.id === track.id ? 'bg-fuchsia-600/20 border-fuchsia-500' : 'border-transparent hover:bg-slate-800'}`}
                            >
                                <img src={track.albumCoverUrl} alt="Album" className="w-10 h-10 rounded-md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-200 truncate">{track.trackName}</p>
                                    <p className="text-xs text-slate-500 truncate">{track.artistName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-slate-200">Cancel</button>
                    <button 
                        onClick={handleSendSync}
                        disabled={!selectedTrack || isSending}
                        className="bg-fuchsia-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Sending...' : 'Send B2B Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}