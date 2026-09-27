import axios from 'axios';

const CLIENT_ID = '177a73a89efa461fa54ca23dca7210a7';
const CLIENT_SECRET = '6d36d5b327324af2bac2da29a3447dca';

let cachedToken = null;
let tokenExpiration = 0;

const getSpotifyToken = async () => {
    if (cachedToken && Date.now() < tokenExpiration) return cachedToken;

    const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({ grant_type: 'client_credentials' }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            }
        }
    );

    cachedToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in - 300) * 1000;
    return cachedToken;
};

export const spotifyApi = {
    searchTracks: async (query) => {
        if (!query.trim()) return [];
        const token = await getSpotifyToken();

        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { q: query, type: 'track', limit: 5 }
        });

        return response.data.tracks.items.map(track => ({
            id: track.id,
            trackName: track.name,
            artistName: track.artists.map(a => a.name).join(', '),
            albumCoverUrl: track.album.images[0]?.url || '',
            spotifyTrackUri: track.uri
        }));
    },

    searchArtists: async (query) => {
        if (!query.trim()) return [];
        const token = await getSpotifyToken();

        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { q: query, type: 'artist', limit: 5 }
        });

        return response.data.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images[0]?.url || ''
        }));
    }

};