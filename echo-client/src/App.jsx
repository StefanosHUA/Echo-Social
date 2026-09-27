import React, { useState, useEffect } from 'react';
import AuthPage from './features/auth/components/AuthPage';
import HomePage from './features/feed/components/HomePage';
import Onboarding from './features/auth/components/Onboarding';
import ProfileSettings from './features/auth/components/ProfileSettings';
import MyProfile from './features/profile/components/MyProfile';
import PublicProfile from './features/profile/components/PublicProfile';
import DiscoverGroupies from './features/feed/components/DiscoverGroupies';

// 1. Import Navbar from the exact location in your screenshot
import Navbar from './features/feed/components/Navbar';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('echo_token'));
    const [needsOnboarding, setNeedsOnboarding] = useState(() => localStorage.getItem('echo_needs_onboarding') === 'true');
    const [currentPath] = useState(window.location.pathname);

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('echo_token'));
            setNeedsOnboarding(localStorage.getItem('echo_needs_onboarding') === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(handleStorageChange, 500);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const getCurrentUserId = () => {
        try {
            const currentToken = localStorage.getItem('echo_token');
            if (!currentToken) return null;
            return JSON.parse(atob(currentToken.split('.')[1])).userId;
        } catch (e) { return null; }
    };

    // 2. Return Auth/Onboarding BEFORE the layout (so they don't get the Navbar)
    if (!token) return <AuthPage />;
    if (needsOnboarding) return <Onboarding />;
    
    // 3. Determine which page component to render
    const renderPage = () => {
        if (currentPath.startsWith('/profile/')) {
            const targetUserId = currentPath.split('/')[2];
            return targetUserId === getCurrentUserId() ? <MyProfile /> : <PublicProfile userId={targetUserId} />;
        }
        if (currentPath === '/profile') return <MyProfile />;
        if (currentPath === '/settings') return <ProfileSettings />;
        if (currentPath === '/groupies') return <DiscoverGroupies />;
        return <HomePage />;
    };

    // 4. The Global Layout Wrapper
    // The Navbar sits at the top, and renderPage() swaps out the content below it.
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
            <Navbar />
            <div className="flex-1 overflow-x-hidden">
                {renderPage()}
            </div>
        </div>
    );
}