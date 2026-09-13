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
            <div className="md:w-1/2 p-10 md:p-24 flex flex-col justify-center relative overflow-hidden" style={{ background: 'linear-gradient(150deg, rgba(139,92,246,0.16) 0%, rgba(245,158,11,0.08) 45%, rgba(2,6,23,0) 80%)' }}>
                <div className="max-w-xl relative z-10">
                    <div className="mb-12">
                        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-5 rounded-full" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(139,92,246,0.45)', background: 'rgba(139,92,246,0.10)', fontSize: '11px', letterSpacing: '0.22em', fontWeight: 700, color: '#c4b5fd' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            MIFECO DELIVERY ENGINE
                        </div>
                        <h1 className="font-black tracking-tighter mb-4 leading-tight" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.6rem)' }}>
                            <RainbowText text="MIFECO" />
                            <span className="block text-white" style={{ fontSize: '0.45em', letterSpacing: '-0.02em', marginTop: '0.4em', background: 'linear-gradient(90deg,#c4b5fd,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>From signed deal to started work, in minutes</span>
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed" style={{ maxWidth: '520px' }}>
                            Project Accelerator is the execution engine behind project management: it turns a rough idea or one-line brief into proposals, resource plans, schedules, and live tracking — so your team starts billable work sooner.
                        </p>
                    </div>

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                        {[
                            { n: '01', c: '#22d3ee', t: 'Project Initialization', d: 'Rapidly generate comprehensive project structures, including milestones, tasks, and resource requirements using AI.' },
                            { n: '02', c: '#34d399', t: 'Intelligent Planning', d: 'Leverage specialized AI agents to create detailed milestone charts, resource lists, and Kanban boards.' },
                            { n: '03', c: '#fbbf24', t: 'Automated Documentation', d: 'Automatically generate and refine project documents, specifications, and constraints with AI assistance.' },
                            { n: '04', c: '#f472b6', t: 'Real-time Tracking', d: 'Monitor project progress, workload distribution, and task completion through interactive dashboards.' },
                            { n: '05', c: '#f87171', t: 'Secure Collaboration', d: 'Maintain project integrity with encrypted connections and secure access controls for your entire team.' },
                        ].map((f) => (
                            <div key={f.n} className="p-5 rounded-2xl transition-all hover:-translate-y-1" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)' }}>
                                <div className="font-mono text-lg font-bold mb-2" style={{ color: f.c }}>{f.n}</div>
                                <h3 className="text-white text-base font-bold mb-2 tracking-tight">{f.t}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-0">{f.d}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6">
                        {[
                            { i: '⚡', l: 'Proposals in minutes, not days' },
                            { i: '🛡️', l: 'You review every output' },
                            { i: '🔑', l: 'Bring your own AI key' },
                        ].map((b) => (
                            <div key={b.l} className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-xl" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 0.8rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(2,6,23,0.55)', fontSize: '11px', color: '#94a3b8' }}>
                                <span>{b.i}</span> {b.l}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-25 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[130px]" style={{ background: 'rgba(139,92,246,0.25)' }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[130px]" style={{ background: 'rgba(245,158,11,0.18)' }} />
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="md:w-1/2 flex flex-col justify-center items-center p-8 md:p-20 bg-slate-950 relative">
                <div className="w-full max-w-md">
                    {/* Subscribe CTA (TEST mode Payment Link — visible to signed-out visitors; not live) */}
                    <div style={{ border: '1px solid rgba(139,92,246,0.4)', background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(245,158,11,0.08))', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                        <a
                            href="https://buy.stripe.com/test_bJeaEXbl0gwC7jy7E1dQQ01"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-test="stripe-payment-link-public"
                            className="button button-primary"
                            style={{ display: 'inline-block', padding: '1rem 2.5rem', fontSize: '1.1rem', textAlign: 'center', background: 'linear-gradient(90deg,#8b5cf6,#f59e0b)', border: 'none', color: '#fff', borderRadius: '0.9rem', fontWeight: 800, boxShadow: '0 12px 30px -12px rgba(139,92,246,0.65)' }}
                        >
                            Sign up for a paid subscription — $49/MO
                        </a>
                        <span style={{ display: 'block', color: 'var(--secondary-text, #94a3b8)', fontSize: '0.75rem', letterSpacing: '1px', marginTop: '0.6rem' }}>
                            TEST mode payment link — not live
                        </span>
                    </div>
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
                                    {loading ? 'AUTHORIZING...' : 'Sign in to use your own key'}
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
                        <div className="pt-4 text-center">
                            <a
                                href="https://buy.stripe.com/bJe3cw72j5LM5DY5DS7Vm06"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-test="open-source-support-link"
                                data-buy-button-id="buy_btn_1UEyKaLFWluMTxK7KJNimjix"
                                className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors"
                            >
                                Support Open-Source Development (optional)
                            </a>
                        </div>
                        
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
