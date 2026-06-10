import React, { useState, useEffect } from 'react';
import * as authService from '../utils/authService';
import { User } from '../types';
import { RainbowText } from '../components/RainbowText';

interface AuthViewProps {
    onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Modals state
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    // Signup state
    const [signupEmail, setSignupEmail] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupGeminiKey, setSignupGeminiKey] = useState('');
    
    // Waitlist state
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistBusiness, setWaitlistBusiness] = useState('');
    const [waitlistUsage, setWaitlistUsage] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Hidden button state
    const [clickCount, setClickCount] = useState(0);
    const [useInternalKey, setUseInternalKey] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('mifeco-saved-email') || '';
        const storedUsername = localStorage.getItem('mifeco-saved-username') || '';
        const storedPassword = localStorage.getItem('mifeco-saved-password') || '';
        const storedInternalKeyFlag = localStorage.getItem('mifeco-use-internal-key') === 'true';

        if (storedEmail || storedUsername) {
            setEmailOrUsername(storedEmail || storedUsername);
        }
        if (storedPassword) {
            setPassword(storedPassword);
        }
        setUseInternalKey(storedInternalKeyFlag);
    }, []);

    const handleHiddenClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 10) {
            const newValue = !useInternalKey;
            setUseInternalKey(newValue);
            if (newValue) {
                localStorage.setItem('mifeco-use-internal-key', 'true');
                alert('Internal Gemini Key Activated');
            } else {
                localStorage.removeItem('mifeco-use-internal-key');
                alert('Internal Gemini Key Deactivated');
            }
            setClickCount(0);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await authService.login(emailOrUsername, password);
            if (user) {
                localStorage.setItem('mifeco-saved-email', user.email);
                localStorage.setItem('mifeco-saved-username', user.username);
                localStorage.setItem('mifeco-saved-password', password);
                onLogin(user);
            } else {
                setError('ACCESS DENIED: Credentials unrecognized.');
            }
        } catch (err: any) {
            console.error(err);
            setError(`SYSTEM_ERR: ${err.message || "Unknown auth error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const newUser = await authService.register(signupUsername, signupEmail, signupPassword, useInternalKey ? undefined : signupGeminiKey);
            if (newUser) {
                localStorage.setItem('mifeco-saved-email', signupEmail);
                localStorage.setItem('mifeco-saved-username', signupUsername);
                localStorage.setItem('mifeco-saved-password', signupPassword);
                
                const user = await authService.login(signupEmail, signupPassword);
                if (user) onLogin(user);
            } else {
                setError('INIT_FAILED: Registration protocol rejected.');
            }
        } catch (err: any) {
            console.error(err);
            setError(`SYSTEM_ERR: ${err.message || "Unknown auth error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWaitlistSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = encodeURIComponent('project_waitlist');
        const body = encodeURIComponent(`Email: ${waitlistEmail}\nBusiness Type: ${waitlistBusiness}\nUsage Intention: ${waitlistUsage}`);
        window.location.href = `mailto:mifecoinc@gmail.com?subject=${subject}&body=${body}`;
        setIsWaitlistModalOpen(false);
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-slate-950 text-white overflow-hidden">
            {/* Left Side - Hero Section (Landing Page Blocks) */}
            <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center bg-slate-900 border-r border-slate-800 relative">
                <div className="max-w-xl relative z-10">
                    <div className="mb-16">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
                            <RainbowText text="MIFECO" />
                        </h1>
                        <p className="text-slate-500 tracking-[0.3em] uppercase text-xs font-bold opacity-80">Project Acceleration Protocol</p>
                    </div>

                    <div className="space-y-10">
                        <div className="flex gap-8 items-start group">
                            <div className="text-cyan-500 font-mono text-xl pt-1">01</div>
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Project Initialization</h3>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md">Rapidly generate comprehensive project structures, including milestones, tasks, and resource requirements using AI.</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-8 items-start group">
                            <div className="text-emerald-500 font-mono text-xl pt-1">02</div>
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Intelligent Planning</h3>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md">Leverage specialized AI agents to create detailed milestone charts, resource lists, and Kanban boards.</p>
                            </div>
                        </div>

                        <div className="flex gap-8 items-start group">
                            <div className="text-amber-500 font-mono text-xl pt-1">03</div>
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Automated Documentation</h3>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md">Automatically generate and refine project documents, specifications, and constraints with AI assistance.</p>
                            </div>
                        </div>

                        <div className="flex gap-8 items-start group">
                            <div className="text-pink-500 font-mono text-xl pt-1">04</div>
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Real-time Tracking</h3>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md">Monitor project progress, workload distribution, and task completion through interactive dashboards.</p>
                            </div>
                        </div>

                        <div className="flex gap-8 items-start group">
                            <div className="text-red-500 font-mono text-xl pt-1">05</div>
                            <div>
                                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">Secure Collaboration</h3>
                                <p className="text-slate-400 text-base leading-relaxed max-w-md">Maintain project integrity with encrypted connections and secure access controls for your entire team.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]" />
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="md:w-1/2 flex flex-col justify-center items-center p-8 md:p-20 bg-slate-950 relative">
                <div className="w-full max-w-md">
                    <div className="mb-12 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">{activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="text-slate-500">Enter your credentials to access the hub</p>
                    </div>

                    <div className="flex mb-10 bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
                        <button 
                            className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${activeTab === 'signin' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => setActiveTab('signin')}
                        >
                            SIGN IN
                        </button>
                        <button 
                            className={`flex-1 py-3 text-center font-bold text-sm rounded-xl transition-all ${activeTab === 'signup' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            onClick={() => setActiveTab('signup')}
                        >
                            SIGN UP
                        </button>
                    </div>
                    
                    <div className="space-y-8">
                        {activeTab === 'signin' ? (
                            <form onSubmit={handleLogin} className="space-y-6">
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-mono">{error}</div>}
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">email or username</label>
                                    <input 
                                        type="text" 
                                        value={emailOrUsername} 
                                        onChange={e => setEmailOrUsername(e.target.value)} 
                                        required 
                                        placeholder="user@mifeco.hub" 
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">password</label>
                                    <input 
                                        type="password" 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required 
                                        placeholder="••••••••" 
                                        className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-[0.98] disabled:opacity-50" 
                                    disabled={loading}
                                >
                                    {loading ? 'AUTHORIZING...' : 'INITIALIZE ACCESS'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignup} className="space-y-5">
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-mono">{error}</div>}
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                    <input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required placeholder="user@mifeco.hub" className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username</label>
                                    <input type="text" value={signupUsername} onChange={e => setSignupUsername(e.target.value)} required placeholder="A. Skywalker" className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                                    <input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required placeholder="••••••••" className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                                </div>
                                {!useInternalKey && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Gemini API Key</label>
                                        <input type="password" value={signupGeminiKey} onChange={e => setSignupGeminiKey(e.target.value)} required placeholder="AIzaSy..." className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                                        <button 
                                            type="button"
                                            onClick={() => setIsKeyModalOpen(true)}
                                            className="text-cyan-500 text-[10px] font-bold uppercase tracking-wider hover:text-cyan-400 transition-colors ml-1"
                                        >
                                            [ GET API KEY ]
                                        </button>
                                    </div>
                                )}
                                <button 
                                    type="submit" 
                                    className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-[0.98] disabled:opacity-50" 
                                    disabled={loading}
                                >
                                    {loading ? 'INITIALIZING...' : 'CREATE ACCOUNT'}
                                </button>
                            </form>
                        )}
                        
                        <div className="pt-6 border-t border-slate-900 text-center">
                            <button 
                                type="button" 
                                onClick={() => setIsWaitlistModalOpen(true)} 
                                className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
                            >
                                Join waitlist for pro version
                            </button>
                        </div>
                    </div>
                </div>
                
                <p 
                    onClick={handleHiddenClick}
                    className="absolute bottom-8 text-slate-800 text-[10px] tracking-[0.5em] font-black cursor-default select-none uppercase"
                >
                    MIFECO © 2026 V4.03
                </p>
            </div>

            {/* Modals */}
            {isWaitlistModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-lg w-full p-8 relative">
                        <button onClick={() => setIsWaitlistModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                        <h2 className="text-2xl font-bold mb-6">Join Pro Waitlist</h2>
                        <form onSubmit={handleWaitlistSubmit}>
                            <div className="mb-4">
                                <label className="block text-xs uppercase text-slate-400 mb-2">Email</label>
                                <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} required placeholder="your@email.com" className="w-full p-3 rounded bg-slate-900 border border-slate-700" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs uppercase text-slate-400 mb-2">Business Type</label>
                                <select value={waitlistBusiness} onChange={e => setWaitlistBusiness(e.target.value)} required className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white">
                                    <option value="" disabled>Select Business Type</option>
                                    <option value="Enterprise">Enterprise</option>
                                    <option value="Startup">Startup</option>
                                    <option value="Agency">Agency</option>
                                    <option value="Freelance">Freelance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs uppercase text-slate-400 mb-2">Usage Intention</label>
                                <select value={waitlistUsage} onChange={e => setWaitlistUsage(e.target.value)} required className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white">
                                    <option value="" disabled>Select Usage Intention</option>
                                    <option value="Project Management">Project Management</option>
                                    <option value="Software Development">Software Development</option>
                                    <option value="Marketing Campaigns">Marketing Campaigns</option>
                                    <option value="Research & Development">Research & Development</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <button type="submit" className="button button-primary w-full p-4">Join Waitlist</button>
                        </form>
                    </div>
                </div>
            )}

            {isKeyModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-8 relative">
                        <button onClick={() => setIsKeyModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                        <h2 className="text-xl font-bold mb-4">How to get a free Google Studio Key</h2>
                        <ol className="text-slate-400 space-y-2 list-decimal list-inside mb-6 text-sm">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Google AI Studio</a>.</li>
                            <li>Sign in with your Google account.</li>
                            <li>Click on the <strong>&quot;Get API key&quot;</strong> button in the left navigation menu.</li>
                            <li>Click <strong>&quot;Create API key&quot;</strong>.</li>
                            <li>Copy the generated key and paste it into the field on this page.</li>
                        </ol>
                        <button className="button button-primary w-full" onClick={() => setIsKeyModalOpen(false)}>Go Back</button>
                    </div>
                </div>
            )}
        </div>
    );
};
