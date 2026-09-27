import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AUTH_URL = 'http://localhost:8081/api/auth';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', rememberMe: false });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Live validation states for Sign Up
    const [validations, setValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false
    });

    // Check password strength on every keystroke
    useEffect(() => {
        if (isLogin) return; // Skip validation checks if just logging in
        
        const p = formData.password;
        setValidations({
            length: p.length >= 8,
            uppercase: /[A-Z]/.test(p),
            lowercase: /[a-z]/.test(p),
            number: /[0-9]/.test(p),
            special: /[@$!%*?&]/.test(p),
            match: p === formData.confirmPassword && p.length > 0
        });
    }, [formData.password, formData.confirmPassword, isLogin]);

    const isPasswordStrong = validations.length && validations.uppercase && validations.lowercase && validations.number && validations.special;
    
    // Disable submit button if signup validation fails
    const canSubmit = isLogin || (isPasswordStrong && validations.match && formData.username.length >= 3 && formData.email.includes('@'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!canSubmit) return;
        
        setError('');
        setIsLoading(true);
        
        try {
            const endpoint = isLogin ? '/login' : '/signup';
            
            const payload = isLogin 
                ? { username: formData.username, password: formData.password }
                : { username: formData.username, email: formData.email, password: formData.password };

            const response = await axios.post(`${AUTH_URL}${endpoint}`, payload, { withCredentials: true });
            
            localStorage.setItem('echo_token', response.data.token);
            
            if (!isLogin) {
                localStorage.setItem('echo_needs_onboarding', 'true');
            }
            
            window.location.href = '/'; 
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Authentication failed. Please check your inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ username: '', email: '', password: '', confirmPassword: '', rememberMe: false });
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-300">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-black text-fuchsia-400 tracking-wider">ECHO</h1>
                    <p className="text-slate-400 text-sm mt-1">Connect through the music you love</p>
                </div>

                <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
                    <button 
                        type="button"
                        onClick={() => { setIsLogin(true); resetForm(); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${isLogin ? 'bg-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        Log In
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setIsLogin(false); resetForm(); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${!isLogin ? 'bg-fuchsia-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        Sign Up
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <input 
                        type="text" 
                        placeholder={isLogin ? "Username or Email" : "Username (3+ chars)"} 
                        required
                        value={formData.username}
                        className="bg-slate-950 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition placeholder-slate-500"
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                    />
                    
                    {!isLogin && (
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            required
                            value={formData.email}
                            className="bg-slate-950 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition placeholder-slate-500"
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                    )}

                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            required
                            value={formData.password}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition placeholder-slate-500 pr-16"
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                        >
                            {showPassword ? "HIDE" : "SHOW"}
                        </button>
                    </div>

                    {!isLogin && (
                        <>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="Confirm Password" 
                                    required
                                    value={formData.confirmPassword}
                                    className={`w-full bg-slate-950 border p-3.5 rounded-xl focus:outline-none transition pr-16 
                                        ${formData.confirmPassword.length > 0 
                                            ? (validations.match ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' : 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500') 
                                            : 'border-slate-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500'}`}
                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-3.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                                >
                                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>

                            {/* Dynamic Password Strength Checklist */}
                            {formData.password && (
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 transition-all">
                                    <p className="text-xs font-bold text-slate-400 mb-1">Password Requirements:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Requirement text="8+ characters" isValid={validations.length} />
                                        <Requirement text="Uppercase letter" isValid={validations.uppercase} />
                                        <Requirement text="Lowercase letter" isValid={validations.lowercase} />
                                        <Requirement text="Number" isValid={validations.number} />
                                        <Requirement text="Special char (!@#$)" isValid={validations.special} />
                                        <Requirement text="Passwords match" isValid={validations.match} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {isLogin && (
                        <div className="flex items-center justify-between text-sm px-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition">
                                <input 
                                    type="checkbox" 
                                    checked={formData.rememberMe}
                                    className="rounded border-slate-700 bg-slate-950 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-slate-900"
                                    onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
                                />
                                Remember Me
                            </label>
                            <a href="#" className="text-fuchsia-400 hover:text-fuchsia-300 transition">Forgot password?</a>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || !canSubmit}
                        className="mt-2 bg-fuchsia-600 text-white p-3.5 rounded-xl font-bold hover:bg-fuchsia-500 transition shadow-[0_0_15px_rgba(192,38,211,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center h-12"
                    >
                        {isLoading ? "Authenticating..." : (isLogin ? 'Enter Echo' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Minimalist checkmark component
function Requirement({ text, isValid }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            <div className={`flex items-center justify-center w-4 h-4 rounded-full border ${isValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-700'}`}>
                {isValid && '✓'}
            </div>
            <span className={isValid ? "text-slate-200" : "text-slate-500"}>
                {text}
            </span>
        </div>
    );
}