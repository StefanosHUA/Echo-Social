import React, { useState } from 'react';
import axios from 'axios';

const AUTH_URL = 'http://localhost:8081/api/auth';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '', rememberMe: false });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            // withCredentials allows the browser to accept the HttpOnly cookie
            const response = await axios.post(`${AUTH_URL}/login`, formData, { withCredentials: true });
            localStorage.setItem('echo_token', response.data.token); // Keep for now as fallback
            window.location.href = '/feed';
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16 p-8 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 font-sans text-slate-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-fuchsia-400 tracking-wider mb-2">ECHO</h2>
                <p className="text-sm text-slate-400">Connect through the music you love</p>
            </div>
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <input 
                        type="text" 
                        placeholder="Username or Email" 
                        required
                        className="w-full border border-slate-700 bg-slate-950 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition placeholder-slate-500" 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                    />
                </div>
                
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        required
                        className="w-full border border-slate-700 bg-slate-950 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition placeholder-slate-500"
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200 transition"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-700 bg-slate-950 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-slate-900"
                            onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
                        />
                        Remember Me
                    </label>
                    <a href="#" className="text-fuchsia-400 hover:text-fuchsia-300 transition">Forgot Password?</a>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="mt-2 bg-fuchsia-600 text-white p-3.5 rounded-xl font-bold hover:bg-fuchsia-500 transition shadow-[0_0_15px_rgba(192,38,211,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center h-12"
                >
                    {isLoading ? "Authenticating..." : "Enter Echo"}
                </button>
            </form>
        </div>
    );
}