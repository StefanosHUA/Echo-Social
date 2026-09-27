import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../api/apiClient'; // <-- Brought in apiClient
import { spotifyApi } from '../../../api/spotifyApi'; 
import MyGroupies from './MyGroupies'; 

const AVATAR_PRESETS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Echo1&backgroundColor=e879f9",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Echo2&backgroundColor=818cf8",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Echo3&backgroundColor=f472b6",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Echo4&backgroundColor=38bdf8"
];

export default function MyProfile() {
    const [profile, setProfile] = useState(null);
    const [artists, setArtists] = useState([]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', profileImageUrl: '' });

    const [isEditingArtists, setIsEditingArtists] = useState(false);
    const [artistQuery, setArtistQuery] = useState('');
    const [artistResults, setArtistResults] = useState([]);
    const [isSavingArtists, setIsSavingArtists] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // FIX: Use apiClient to auto-inject tokens and route through Gateway (8000)
                const userRes = await apiClient.get('/api/users/me');
                setProfile(userRes.data);
                setEditForm({ username: userRes.data.username, profileImageUrl: userRes.data.profileImageUrl || '' });
                
                const tasteRes = await apiClient.get('/api/tastes/me');
                setArtists(tasteRes.data || []);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchProfileData();
    }, []);

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (artistQuery.trim()) {
                const results = await spotifyApi.searchArtists(artistQuery);
                setArtistResults(results);
            } else {
                setArtistResults([]);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [artistQuery]);
    
    const handleSaveProfile = async () => {
        try {
            // FIX: Route through Gateway
            await apiClient.put('/api/users/profile', editForm);
            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
        } catch (err) {
            alert("Failed to update profile");
        }
    };

    const handleRemoveArtist = (artistId) => {
        if (artists.length <= 3) {
            alert("You must have at least 3 artists on rotation.");
            return;
        }
        setArtists(artists.filter(a => a.id !== artistId));
    };

    const handleAddArtist = (artist) => {
        if (artists.find(a => a.id === artist.id)) return; 
        setArtists([...artists, artist]);
        setArtistQuery('');
        setArtistResults([]);
    };

    const handleSaveArtists = async () => {
        setIsSavingArtists(true);
        try {
            // FIX: Route through Gateway
            await apiClient.put('/api/tastes/update', artists);
            setIsEditingArtists(false);
        } catch (err) {
            alert(err.response?.data || "Failed to update artists");
        } finally {
            setIsSavingArtists(false);
        }
    };

    if (!profile) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-fuchsia-400">Loading...</div>;

    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}&backgroundColor=1e293b`;
    const displayAvatar = isEditing ? (editForm.profileImageUrl || defaultAvatar) : (profile.profileImageUrl || defaultAvatar);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
            <div className="max-w-xl mx-auto flex flex-col gap-8">
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                    <div className="flex flex-col items-center mt-4">
                        <img 
                            src={displayAvatar} 
                            alt="Profile" 
                            className="w-28 h-28 rounded-full border-4 border-slate-950 shadow-lg object-cover bg-slate-800 transition-all duration-300"
                        />
                        <h2 className="text-2xl font-black mt-4">{profile.username || 'Anonymous User'}</h2>
                        <p className="text-sm text-slate-400">{profile.email}</p>
                        
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="mt-6 bg-slate-800 hover:bg-slate-700 text-sm font-semibold px-6 py-2 rounded-full transition"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="mt-6 w-full flex flex-col gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <input 
                                    type="text" placeholder="Username" value={editForm.username}
                                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                                    className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm focus:border-fuchsia-500 outline-none"
                                />
                                <div className="text-xs text-slate-400 font-semibold mb-1">Choose an Avatar:</div>
                                <div className="flex gap-2">
                                    {AVATAR_PRESETS.map((url, i) => (
                                        <img 
                                            key={i} src={url} alt="preset" 
                                            onClick={() => setEditForm({...editForm, profileImageUrl: url})}
                                            className={`w-10 h-10 rounded-full cursor-pointer border-2 ${editForm.profileImageUrl === url ? 'border-fuchsia-500' : 'border-transparent hover:border-slate-500'} transition`}
                                        />
                                    ))}
                                </div>
                                <input 
                                    type="text" placeholder="Or paste a custom image URL..." value={editForm.profileImageUrl}
                                    onChange={e => setEditForm({...editForm, profileImageUrl: e.target.value})}
                                    className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm focus:border-fuchsia-500 outline-none"
                                />
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({ username: profile.username, profileImageUrl: profile.profileImageUrl || '' });
                                    }} className="flex-1 bg-slate-800 p-2 rounded-lg text-sm hover:bg-slate-700 transition">Cancel</button>
                                    <button onClick={handleSaveProfile} className="flex-1 bg-fuchsia-600 p-2 rounded-lg text-sm font-bold hover:bg-fuchsia-500 transition">Save</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 border-t border-slate-800 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-200">My Artists on Rotation</h3>
                            {!isEditingArtists && (
                                <button onClick={() => setIsEditingArtists(true)} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-medium">
                                    + Edit Artists
                                </button>
                            )}
                        </div>
                        
                        {isEditingArtists ? (
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {artists.map(artist => (
                                        <div key={artist.id} className="bg-slate-800 pl-3 pr-1 py-1 rounded-full flex items-center gap-2 border border-slate-700">
                                            <span className="text-sm font-medium text-slate-200">{artist.name}</span>
                                            <button 
                                                onClick={() => handleRemoveArtist(artist.id)}
                                                className="bg-slate-700 hover:bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <input 
                                    type="text" 
                                    placeholder="Search to add more artists..." 
                                    value={artistQuery}
                                    onChange={e => setArtistQuery(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-sm focus:border-fuchsia-500 outline-none w-full"
                                />

                                {artistResults.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                        {artistResults.map(artist => (
                                            <div 
                                                key={artist.id} 
                                                onClick={() => handleAddArtist(artist)}
                                                className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                                            >
                                                <img src={artist.imageUrl} alt={artist.name} className="w-8 h-8 rounded-full object-cover" />
                                                <span className="text-sm font-semibold">{artist.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => setIsEditingArtists(false)} className="flex-1 bg-slate-800 p-2 rounded-lg text-sm hover:bg-slate-700">Cancel</button>
                                    <button onClick={handleSaveArtists} disabled={isSavingArtists} className="flex-1 bg-fuchsia-600 p-2 rounded-lg text-sm font-bold hover:bg-fuchsia-500 transition">
                                        {isSavingArtists ? 'Saving...' : 'Save Artists'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {artists.map((artist, idx) => (
                                    <div key={idx} className="flex flex-col items-center shrink-0 w-20">
                                        <img src={artist.imageUrl} alt={artist.name} className="w-16 h-16 rounded-full object-cover shadow-md mb-2 bg-slate-800" />
                                        <span className="text-xs text-center text-slate-300 truncate w-full">{artist.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <MyGroupies />

                <div className="text-center pb-8">
                   <a href="/" className="text-sm text-slate-500 hover:text-fuchsia-400 transition">← Back to Feed</a>
                </div>
            </div>
        </div>
    );
}