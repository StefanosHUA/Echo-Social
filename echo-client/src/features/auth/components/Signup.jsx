import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

export default function Signup() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Live validation states
    const [validations, setValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false
    });

    // Check strength on every keystroke
    useEffect(() => {
        const p = formData.password;
        setValidations({
            length: p.length >= 8,
            uppercase: /[A-Z]/.test(p),
            lowercase: /[a-z]/.test(p),
            number: /[0-9]/.test(p),
            special: /[@$!%*?&]/.test(p),
            match: p === formData.confirmPassword && p.length > 0
        });
    }, [formData.password, formData.confirmPassword]);

    const isPasswordStrong = validations.length && validations.uppercase && validations.lowercase && validations.number && validations.special;
    const canSubmit = isPasswordStrong && validations.match && formData.username.length >= 3 && formData.email.includes('@');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!canSubmit) return;
        
        setIsSubmitting(true);
        setError('');

        try {
            // Strip confirmPassword before sending to backend
            const { confirmPassword, ...submitData } = formData;
            const response = await authApi.signup(submitData);
            
            localStorage.setItem('echo_token', response.token);
            window.location.href = '/'; 
        } catch (err) {
            const apiError = err.response?.data?.message || err.response?.data || 'Signup failed. Please try again.';
            setError(typeof apiError === 'string' ? apiError : 'Registration failed. Check your input.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-10">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-fuchsia-400 tracking-wider mb-2">Join ECHO</h2>
                    <p className="text-sm text-slate-400">Connect through the music you love.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm p-3 rounded-xl text-center mb-6 font-medium">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 transition" 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                    />
                    
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 transition"
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                    
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            required
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 transition pr-16"
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-fuchsia-400 transition"
                        >
                            {showPassword ? 'HIDE' : 'SHOW'}
                        </button>
                    </div>

                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Confirm Password" 
                            required
                            className={`w-full bg-slate-950 border p-3.5 rounded-xl focus:outline-none transition pr-16 
                                ${formData.confirmPassword.length > 0 
                                    ? (validations.match ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') 
                                    : 'border-slate-800 focus:border-fuchsia-500'}`}
                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-fuchsia-400 transition"
                        >
                            {showConfirmPassword ? 'HIDE' : 'SHOW'}
                        </button>
                    </div>

                    {/* Dynamic Password Strength Checklist */}
                    {formData.password && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 my-2 transition-all">
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

                    <button 
                        type="submit" 
                        disabled={!canSubmit || isSubmitting}
                        className="w-full bg-fuchsia-600 text-white p-3.5 rounded-xl font-bold hover:bg-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
            </div>
            
            <div className="text-center mt-6">
                <span className="text-slate-400 text-sm">Already have an account? </span>
                <a href="/login" className="text-fuchsia-400 text-sm font-bold hover:text-fuchsia-300 transition">Log in</a>
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