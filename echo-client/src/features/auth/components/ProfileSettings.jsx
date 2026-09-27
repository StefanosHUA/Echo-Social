import React, { useState } from 'react';
import axios from 'axios';

const USER_API_URL = 'http://localhost:8081/api/users';

export default function ProfileSettings() {
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const validations = {
        length: passwords.newPassword.length >= 8,
        uppercase: /[A-Z]/.test(passwords.newPassword),
        number: /[0-9]/.test(passwords.newPassword),
        special: /[^A-Za-z0-9]/.test(passwords.newPassword),
        match: passwords.newPassword !== '' && passwords.newPassword === passwords.confirmPassword
    };

    const isFormValid = Object.values(validations).every(Boolean) && passwords.oldPassword.length > 0;

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('echo_token');
            const payload = {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            };

            await axios.put(`${USER_API_URL}/password`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage({ text: 'Password updated successfully!', type: 'success' });
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' }); 
        } catch (error) {
            setMessage({ text: error.response?.data || 'Failed to update password.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-100 py-8 sm:py-12">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
                
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-100 mb-2">Account Security</h1>
                    <p className="text-xs sm:text-sm text-slate-400">Manage your password and account settings.</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-xs sm:text-sm font-medium text-center mb-6 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4 sm:gap-5">
                    <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Current Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter current password" 
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 sm:p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition text-sm"
                            value={passwords.oldPassword}
                            onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                        />
                    </div>

                    <div className="border-t border-slate-800 my-1 sm:my-2"></div>

                    <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">New Password</label>
                        <input 
                            type="password" 
                            placeholder="Create a new password" 
                            className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 sm:p-3.5 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition text-sm"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        />
                    </div>

                    <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <div className={`text-[10px] sm:text-xs flex items-center gap-2 transition-colors ${validations.length ? 'text-green-400' : 'text-slate-500'}`}>
                            {validations.length ? '✓' : '○'} At least 8 characters
                        </div>
                        <div className={`text-[10px] sm:text-xs flex items-center gap-2 transition-colors ${validations.uppercase ? 'text-green-400' : 'text-slate-500'}`}>
                            {validations.uppercase ? '✓' : '○'} One uppercase letter
                        </div>
                        <div className={`text-[10px] sm:text-xs flex items-center gap-2 transition-colors ${validations.number ? 'text-green-400' : 'text-slate-500'}`}>
                            {validations.number ? '✓' : '○'} One number
                        </div>
                        <div className={`text-[10px] sm:text-xs flex items-center gap-2 transition-colors ${validations.special ? 'text-green-400' : 'text-slate-500'}`}>
                            {validations.special ? '✓' : '○'} One special character (!@#$%^&*)
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Confirm Password</label>
                        <input 
                            type="password" 
                            placeholder="Type it again" 
                            className={`w-full bg-slate-950 border p-3 sm:p-3.5 rounded-xl focus:outline-none transition text-sm ${
                                passwords.confirmPassword.length > 0 
                                    ? (validations.match ? 'border-green-500/50 focus:border-green-500 focus:ring-1 focus:ring-green-500' : 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500')
                                    : 'border-slate-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500'
                            }`}
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        />
                        {passwords.confirmPassword.length > 0 && !validations.match && (
                            <p className="text-[10px] sm:text-xs text-red-400 mt-2">Passwords do not match.</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !isFormValid}
                        className="mt-2 sm:mt-4 bg-fuchsia-600 text-white p-3 sm:p-4 rounded-xl font-bold hover:bg-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-900/20 text-sm sm:text-base"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
                
                <div className="mt-6 sm:mt-8 text-center">
                   <a href="/" className="text-xs sm:text-sm font-medium text-slate-500 hover:text-fuchsia-400 transition">← Back to Feed</a>
                </div>
            </div>
        </div>
    );
}