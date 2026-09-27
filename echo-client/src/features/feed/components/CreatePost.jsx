import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { feedApi } from '../../../api/feedApi';
import { spotifyApi } from '../../../api/spotifyApi';

export default function CreatePost({ onPostCreated, currentUserProfilePic, currentUsername }) {
    // If you removed useAuth earlier, just use getUserIdFromToken() here instead.
    // Assuming useAuth is still valid based on your previous files.
    const { userId } = useAuth(); 
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearchChange = async (e) => {
        const val = e.target.value;
        setSearchTerm(val);

        if (val.length > 2) {
            setSearching(true);
            try {
                const results = await spotifyApi.searchTracks(val);
                setSearchResults(results);
            } catch (err) {
                console.error("Spotify search error:", err);
            } finally {
                setSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectTrack = (track) => {
        setSelectedTrack(track);
        setSearchTerm(track.trackName + ' - ' + track.artistName);
        setSearchResults([]); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTrack || loading) return;

        setLoading(true);
        try {
            const newPost = await feedApi.createPost({
                userId,
                spotifyTrackUri: selectedTrack.spotifyTrackUri,
                trackName: selectedTrack.trackName,
                artistName: selectedTrack.artistName,
                albumCoverUrl: selectedTrack.albumCoverUrl,
                previewUrl: selectedTrack.previewUrl,
                caption,
                profileImageUrl: currentUserProfilePic, 
                username: currentUsername
            });
            
            onPostCreated(newPost);
            setSelectedTrack(null);
            setSearchTerm('');
            setCaption('');
        } catch (err) {
            console.error("Failed to create post:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        // FIXED: Replaced max-w-xl mx-auto with w-full, upgraded to premium glassmorphism
        <div className="w-full bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative transition hover:border-slate-600/50 mb-2">
            <h3 className="text-base font-black text-white tracking-wide mb-4">Share a Track & Squad Up</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search Spotify tracks (e.g., Techno, Odesza)..." 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                    />
                    {searching && <span className="absolute right-4 top-3.5 text-xs font-bold text-fuchsia-400 animate-pulse">Searching...</span>}

                    {searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map(track => (
                                <div 
                                    key={track.id}
                                    onClick={() => handleSelectTrack(track)}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-none transition-colors"
                                >
                                    <img src={track.albumCoverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shadow-md" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-white truncate">{track.trackName}</p>
                                        <p className="text-xs text-slate-400 truncate">{track.artistName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <textarea 
                    placeholder="Write a caption or coordinate an event meetup..." 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows="2"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                />
                <button 
                    type="submit"
                    disabled={loading || !selectedTrack}
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(192,38,211,0.2)] hover:shadow-[0_0_25px_rgba(192,38,211,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {loading ? "Publishing..." : "Publish Track to Feed"}
                </button>
            </form>
        </div>
    );
}