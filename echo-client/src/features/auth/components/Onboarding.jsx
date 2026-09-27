import React, { useState, useEffect } from 'react';
import { spotifyApi } from '../../../api/spotifyApi';
import axios from 'axios';

export default function Onboarding() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query) {
                const artists = await spotifyApi.searchArtists(query);
                setResults(artists);
            } else {
                setResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const toggleArtist = (artist) => {
        if (selectedArtists.find(a => a.id === artist.id)) {
            setSelectedArtists(selectedArtists.filter(a => a.id !== artist.id));
        } else if (selectedArtists.length < 3) {
            setSelectedArtists([...selectedArtists, artist]);
        }
    };

    const handleComplete = async () => {
        if (selectedArtists.length !== 3) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('echo_token');
            await axios.post('http://localhost:8081/api/tastes/onboard', selectedArtists, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            localStorage.removeItem('echo_needs_onboarding');
            window.location.href = '/';
        } catch (error) {
            console.error("Failed to save tastes", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-black text-fuchsia-400 mb-2 text-center">Vibe Check</h1>
                <p className="text-sm sm:text-base text-slate-400 text-center mb-6">Select exactly 3 foundational artists to tune your algorithm.</p>
                
                <input 
                    type="text" 
                    placeholder="Search artists (e.g., Odesza, Fred again..)" 
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 sm:p-4 rounded-xl focus:outline-none focus:border-fuchsia-500 mb-6 text-sm sm:text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                {results.length > 0 && (
                    <div className="flex flex-col gap-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {results.map(artist => {
                            const isSelected = selectedArtists.some(a => a.id === artist.id);
                            return (
                                <div 
                                    key={artist.id} 
                                    onClick={() => toggleArtist(artist)}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition border ${isSelected ? 'bg-fuchsia-600/20 border-fuchsia-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <img src={artist.imageUrl || 'https://via.placeholder.com/50'} alt={artist.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                                    <span className="font-semibold text-sm sm:text-base">{artist.name}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                    <span className="text-sm text-slate-400 order-2 sm:order-1">
                        <strong className="text-fuchsia-400">{selectedArtists.length}</strong> / 3 selected
                    </span>
                    <button 
                        onClick={handleComplete}
                        disabled={selectedArtists.length !== 3 || isLoading}
                        className="w-full sm:w-auto bg-fuchsia-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                        {isLoading ? 'Saving...' : 'Enter Echo'}
                    </button>
                </div>
            </div>
        </div>
    );
}