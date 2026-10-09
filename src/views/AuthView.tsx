import React, { useState, useEffect, useRef } from 'react';
import * as authService from '../utils/authService';
import { User } from '../types';
import { RainbowText } from '../components/RainbowText';
import { LlmProviderModal } from '../components/LlmProviderModal';
import { MifecoStripeModal } from '../components/MifecoStripeModal';
import { getLlmSettings, applyUserApiKey, detectProviderFromKey } from '../utils/llmStorage';

import { 
    Cpu, 
    ShieldCheck, 
    Users, 
    BarChart3, 
    Sparkles, 
    Lock, 
    Mail, 
    User as UserIcon, 
    Eye, 
    EyeOff, 
    Key, 
    ArrowRight, 
    CheckCircle2, 
    Activity, 
    Zap, 
    Clock, 
    FileText, 
    ChevronRight,
    X,
    CreditCard,
    Loader2
} from 'lucide-react';


interface AuthViewProps {
    onLogin: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Auth & Modals state
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // AI Studio Environment Detection (Only shows Studio Test Login in AI Studio)
    const isAiStudio = typeof window !== 'undefined' && (
        window.location.hostname.includes('ais-') ||
        window.location.hostname.includes('run.app') ||
        window.location.hostname.includes('aistudio') ||
        window.location.hostname.includes('localhost') ||
        window.self !== window.top ||
        window.location.search.includes('studio')
    );


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

    // Interactive Preview State
    const [previewTab, setPreviewTab] = useState<'timeline' | 'kanban' | 'agents'>('timeline');

    // Hidden protocol state
    const [clickCount, setClickCount] = useState(0);
    const [useInternalKey, setUseInternalKey] = useState(false);

    const authFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedEmail = localStorage.getItem('mifeco-saved-email') || '';
        const storedUsername = localStorage.getItem('mifeco-saved-username') || '';
        const storedInternalKeyFlag = localStorage.getItem('mifeco-use-internal-key') === 'true';

        if (storedEmail || storedUsername) {
            setEmailOrUsername(storedEmail || storedUsername);
        }
        setUseInternalKey(storedInternalKeyFlag);
    }, []);

    const scrollToAuth = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        setError('');
        if (authFormRef.current) {
            authFormRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleHiddenClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 10) {
            const newValue = !useInternalKey;
            setUseInternalKey(newValue);
            if (newValue) {
                localStorage.setItem('mifeco-use-internal-key', 'true');
            } else {
                localStorage.removeItem('mifeco-use-internal-key');
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
                if (user.geminiKey) {
                    applyUserApiKey(user.geminiKey, user.id);
                }
                onLogin(user);
            } else {
                setError('ACCESS DENIED: Credentials not recognized. Please check your username and password.');
            }
        } catch (err: any) {
            console.error(err);
            setError(`SYSTEM_ERR: ${err.message || "Authentication failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!useInternalKey && signupGeminiKey.trim()) {
                applyUserApiKey(signupGeminiKey);
            }
            const newUser = await authService.register(signupUsername, signupEmail, signupPassword, useInternalKey ? undefined : signupGeminiKey);
            if (newUser) {
                localStorage.setItem('mifeco-saved-email', signupEmail);
                localStorage.setItem('mifeco-saved-username', signupUsername);
                if (!useInternalKey && signupGeminiKey.trim()) {
                    applyUserApiKey(signupGeminiKey, newUser.id);
                }
                
                const user = await authService.login(signupEmail, signupPassword);
                if (user) {
                    if (user.geminiKey) {
                        applyUserApiKey(user.geminiKey, user.id);
                    }
                    onLogin(user);
                }
            } else {
                setError('INIT_FAILED: Registration protocol rejected.');
            }
        } catch (err: any) {
            console.error(err);
            setError(`SYSTEM_ERR: ${err.message || "Registration failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setError('');
        setLoading(true);
        const demoEmail = 'demo@mifeco.io';
        const demoPass = 'mifeco-demo-2026';
        const demoUser = 'Lead Architect';
        try {
            // Attempt login first
            try {
                const user = await authService.login(demoEmail, demoPass);
                if (user) {
                    onLogin(user);
                    return;
                }
            } catch {
                // If demo account doesn't exist yet, register it automatically
                const newUser = await authService.register(demoUser, demoEmail, demoPass);
                if (newUser) {
                    const user = await authService.login(demoEmail, demoPass);
                    if (user) {
                        onLogin(user);
                        return;
                    }
                }
            }
        } catch (err: any) {
            setError(`DEMO_INIT_ERR: ${err.message || "Could not launch demo session"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleStudioTestLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const user = await authService.studioTestLogin('robertstar2000@gmail.com', 'AI Studio Architect');
            if (user) {
                localStorage.setItem('mifeco-use-internal-key', 'true');
                onLogin(user);
            }
        } catch (err: any) {
            console.error(err);
            setError(`STUDIO_TEST_ERR: ${err.message || "Failed to initialize Studio test session"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWaitlistSubmit = (e: React.FormEvent) => {

        e.preventDefault();
        const subject = encodeURIComponent('MIFECO Enterprise Waitlist Request');
        const body = encodeURIComponent(`Email: ${waitlistEmail}\nOrganization Type: ${waitlistBusiness}\nPrimary Usage Focus: ${waitlistUsage}`);
        window.location.href = `mailto:mifecoinc@gmail.com?subject=${subject}&body=${body}`;
        setIsWaitlistModalOpen(false);
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black font-sans relative overflow-x-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[10%] w-[500px] sm:w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
                <div className="absolute top-[40%] right-[-5%] w-[400px] sm:w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px]" />
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
            </div>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
                            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
                                    <RainbowText text="PM ACCELERATOR" />
                                </span>
                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    MIFECO v5.0
                                </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 hidden sm:block">
                                MIFECO Autonomous Project Planning
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-cyan-400 transition-colors">Capabilities</a>
                        <a href="#preview" className="hover:text-cyan-400 transition-colors">Live Simulation</a>
                        <a href="#phases" className="hover:text-cyan-400 transition-colors">9-Phase Lifecycle</a>
                        <button 
                            onClick={() => setIsWaitlistModalOpen(true)}
                            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            Enterprise Pro
                        </button>
                    </nav>

                    {/* Action CTAs */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {isAiStudio && (
                            <button
                                onClick={handleStudioTestLogin}
                                disabled={loading}
                                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                                title="1-Click test login using Studio Gemini Key"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Studio Test Login</span>
                                <span className="sm:hidden">Studio</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsStripeModalOpen(true)}
                            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Business (Stripe)</span>
                            <span className="sm:hidden">Stripe</span>
                        </button>
                        <button
                            onClick={() => scrollToAuth('signin')}
                            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md shadow-white/5"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </header>


            {/* Main Content Area */}
            <main className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 lg:pt-20 pb-12 sm:pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* Hero Text & Value Proposition */}
                        <div className="lg:col-span-7 flex flex-col items-start text-left">
                            {/* Live Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold tracking-wide mb-6 shadow-inner">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                <span>Autonomous Multi-Agent Project Lifecycle Protocol</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
                                Transform Project Ambition into{' '}
                                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Precision Execution
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
                                Synthesize complete, production-grade project ecosystems in minutes. Generate full 9-phase document suites, orchestrate 6 specialized AI planning agents, and balance Gantt timelines, Kanban boards, and team workloads automatically.
                            </p>

                            {/* CTA Button Group */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
                                <button
                                    onClick={() => scrollToAuth('signup')}
                                    className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99]"
                                >
                                    <span>Get Started Free</span>
                                    <ArrowRight className="w-4 h-4 text-slate-950" />
                                </button>
                                <button
                                    onClick={handleDemoLogin}
                                    disabled={loading}
                                    className="px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
                                >
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    <span>Launch Interactive Demo</span>
                                </button>
                            </div>

                            {/* Trust Stats Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 w-full">
                                <div>
                                    <div className="text-xl sm:text-2xl font-black text-white">9 Phases</div>
                                    <div className="text-xs text-slate-400 font-medium">Standardized Lifecycle</div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black text-cyan-400">6 Agents</div>
                                    <div className="text-xs text-slate-400 font-medium">Autonomous Synthesis</div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black text-indigo-400">100% Sync</div>
                                    <div className="text-xs text-slate-400 font-medium">Gantt & Kanban Parity</div>
                                </div>
                                <div>
                                    <div className="text-xl sm:text-2xl font-black text-emerald-400">Instant</div>
                                    <div className="text-xs text-slate-400 font-medium">Zip & JSON Export</div>
                                </div>
                            </div>
                        </div>

                        {/* Auth Card (Right on desktop, stacked on mobile) */}
                        <div ref={authFormRef} className="lg:col-span-5 w-full">
                            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                                
                                {/* Form Mode Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                            {activeTab === 'signin' ? 'Sign In to Workspace' : 'Create Account'}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                            {activeTab === 'signin' 
                                                ? 'Access your project database & active teams' 
                                                : 'Initialize your cloud workspace & AI engine'}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* CONDITIONAL: AI Studio Test Login (ONLY appears when run in AI Studio) */}
                                {isAiStudio && (
                                    <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-xs font-bold text-white">
                                                    AI Studio Environment Detected
                                                </span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                                                Studio Key
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
                                            Developer test session: authenticates immediately using the container&apos;s Studio Gemini Key.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleStudioTestLogin}
                                            disabled={loading}
                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Launching Studio Mode...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-3.5 h-3.5 text-slate-950" />
                                                    <span>Studio Test Login (Uses Studio Gemini Key)</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Access Pathways: Demo Free (BYO LLM) vs Mifeco Business (Stripe Authority) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                                    {/* Demo Free Tier */}
                                    <div 
                                        onClick={() => setIsKeyModalOpen(true)}
                                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                                                    Demo Free
                                                </span>
                                                <Key className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                            </div>
                                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                                Provide Your Own LLM
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-snug mt-1">
                                                Free access with Google, OpenAI, Anthropic, Ollama, or OpenRouter.
                                            </p>
                                        </div>
                                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                                            <span className="font-semibold text-cyan-400 group-hover:underline">Configure LLM Key →</span>
                                        </div>
                                    </div>

                                    {/* Paid Access via Stripe Authority */}
                                    <div 
                                        onClick={() => setIsStripeModalOpen(true)}
                                        className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950/90 to-emerald-950/20 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                                    Paid Access
                                                </span>
                                                <CreditCard className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                                                PM Accelerator Business ($49/mo)
                                            </div>
                                            <p className="text-[10px] text-slate-300 leading-snug mt-1">
                                                PM Accelerator Business Tier: Unlocks unlimited multi-agent lifecycle generation, dedicated model inference, team collaboration, and priority SLA via MIFECO business Stripe authority.
                                            </p>
                                        </div>
                                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                                            <span className="font-semibold text-emerald-400 group-hover:underline">Mifeco Stripe Authority Checkout →</span>
                                            <a 
                                                href="https://buy.stripe.com/test_pm_accelerator_business" 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[9px] text-slate-400 hover:text-white underline"
                                                title="Direct Stripe Payment Link"
                                            >
                                                Live Payment Link
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Switcher */}
                                <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-5">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('signin'); setError(''); }}
                                        className={`flex-1 py-2 text-xs font-bold tracking-wider rounded-lg transition-all ${activeTab === 'signin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        SIGN IN
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab('signup'); setError(''); }}
                                        className={`flex-1 py-2 text-xs font-bold tracking-wider rounded-lg transition-all ${activeTab === 'signup' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        REGISTER
                                    </button>
                                </div>


                                {/* Error Banner */}
                                {error && (
                                    <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2.5">
                                        <span className="text-sm shrink-0">⚠️</span>
                                        <span className="leading-snug">{error}</span>
                                    </div>
                                )}

                                {/* Sign In Form */}
                                {activeTab === 'signin' ? (
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                Email or Username
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={emailOrUsername} 
                                                    onChange={e => setEmailOrUsername(e.target.value)} 
                                                    required 
                                                    placeholder="user@domain.com or username" 
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                    Password
                                                </label>
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                                                >
                                                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    value={password} 
                                                    onChange={e => setPassword(e.target.value)} 
                                                    required 
                                                    placeholder="••••••••••••" 
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl bg-white hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-white/5 flex items-center justify-center gap-2" 
                                        >
                                            {loading ? 'Authorizing Access...' : 'Sign In to Workspace'}
                                            {!loading && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </form>
                                ) : (
                                    /* Sign Up Form */
                                    <form onSubmit={handleSignup} className="space-y-3.5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    value={signupEmail} 
                                                    onChange={e => setSignupEmail(e.target.value)} 
                                                    required 
                                                    placeholder="yourname@domain.com" 
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                Username / Full Name
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={signupUsername} 
                                                    onChange={e => setSignupUsername(e.target.value)} 
                                                    required 
                                                    placeholder="e.g. Alex Morgan" 
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="password" 
                                                    value={signupPassword} 
                                                    onChange={e => setSignupPassword(e.target.value)} 
                                                    required 
                                                    placeholder="••••••••••••" 
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                                                />
                                            </div>
                                        </div>

                                        {!useInternalKey && (
                                            <div className="space-y-1 pt-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                                                            AI Provider & Key (Optional)
                                                        </label>
                                                        {signupGeminiKey.trim() && (
                                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                                                                {detectProviderFromKey(signupGeminiKey)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsKeyModalOpen(true)}
                                                        className="text-cyan-400 text-xs font-medium hover:underline flex items-center gap-1"
                                                    >
                                                        <Key className="w-3 h-3" />
                                                        <span>Enter Key / Provider</span>
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                                        <Key className="w-4 h-4" />
                                                    </div>
                                                    <input 
                                                        type="password" 
                                                        value={signupGeminiKey} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setSignupGeminiKey(val);
                                                            if (val.trim()) {
                                                                applyUserApiKey(val);
                                                            }
                                                        }} 
                                                        placeholder="API Key or click 'Enter Key / Provider' above" 
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600 font-mono" 
                                                    />
                                                </div>
                                            </div>
                                        )}


                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl bg-white hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.99] disabled:opacity-50 mt-2 shadow-lg shadow-white/5 flex items-center justify-center gap-2" 
                                        >
                                            {loading ? 'Creating Workspace...' : 'Create Account & Initialize'}
                                            {!loading && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </form>
                                )}

                                {/* One Click Fast Actions Helper */}
                                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <span>Quick start options:</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsKeyModalOpen(true)}
                                            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline"
                                        >
                                            <Key className="w-3 h-3" />
                                            <span>Set LLM Provider</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={handleDemoLogin}
                                            disabled={loading}
                                            className="text-slate-300 hover:text-cyan-400 font-medium flex items-center gap-1 hover:underline"
                                        >
                                            <span>Demo Free Account</span>
                                            <ChevronRight className="w-3 h-3 text-cyan-400" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsStripeModalOpen(true)}
                                            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                                        >
                                            <CreditCard className="w-3 h-3" />
                                            <span>Stripe Authority ($49)</span>
                                        </button>
                                        {isAiStudio && (
                                            <button
                                                type="button"
                                                onClick={handleStudioTestLogin}
                                                disabled={loading}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                <span>Studio Test Login</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </section>

                {/* Live Simulation Preview Showcase */}
                <section id="preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-slate-800/60">
                    <div className="text-center max-w-3xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide uppercase mb-3">
                            <Activity className="w-3.5 h-3.5" />
                            Live Workspace Simulation
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                            Unified Real-Time Mission Control
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base">
                            Experience dynamic synchronization across Gantt timelines, Kanban task flows, and agent consensus in one integrated view.
                        </p>
                    </div>

                    {/* Simulated App Card */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                        {/* Simulation Top Bar */}
                        <div className="bg-slate-950/90 px-4 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                </div>
                                <div className="h-4 w-px bg-slate-800 mx-1" />
                                <span className="font-bold text-white text-sm">Project: Orbital Gateway Infrastructure</span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Phase 7: Execution
                                </span>
                            </div>

                            {/* View Switcher in Mock */}
                            <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
                                <button
                                    onClick={() => setPreviewTab('timeline')}
                                    className={`px-3 py-1.5 rounded-md transition-all ${previewTab === 'timeline' ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Timeline Gantt
                                </button>
                                <button
                                    onClick={() => setPreviewTab('kanban')}
                                    className={`px-3 py-1.5 rounded-md transition-all ${previewTab === 'kanban' ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Kanban Board
                                </button>
                                <button
                                    onClick={() => setPreviewTab('agents')}
                                    className={`px-3 py-1.5 rounded-md transition-all ${previewTab === 'agents' ? 'bg-slate-800 text-cyan-400 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Agent Consensus
                                </button>
                            </div>
                        </div>

                        {/* Simulation Content Body */}
                        <div className="p-5 sm:p-8">
                            {previewTab === 'timeline' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                                        <span>Task Item & Role</span>
                                        <div className="hidden sm:flex gap-8">
                                            <span>Week 1-2</span>
                                            <span>Week 3-4</span>
                                            <span>Week 5-6</span>
                                            <span>Week 7-8</span>
                                        </div>
                                    </div>
                                    
                                    {/* Task Row 1 */}
                                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <div>
                                                <div className="text-sm font-semibold text-white">Synthesize System Architecture & SOW</div>
                                                <div className="text-xs text-slate-400">Assigned: Lead Architect (A. Vance)</div>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-64 bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                                            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full w-full" />
                                        </div>
                                    </div>

                                    {/* Task Row 2 */}
                                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                                            <div>
                                                <div className="text-sm font-semibold text-white">Deploy Multi-Region Database & Auth Engine</div>
                                                <div className="text-xs text-slate-400">Assigned: Backend Lead (K. Larson)</div>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-64 bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                                            <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full w-3/4" />
                                        </div>
                                    </div>

                                    {/* Task Row 3 */}
                                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                                            <div>
                                                <div className="text-sm font-semibold text-white">Telemetry & Critical Risk Auditing</div>
                                                <div className="text-xs text-slate-400">Assigned: Risk Sentinel Agent</div>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-64 bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full w-2/5" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'kanban' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                            <span>To Do (3)</span>
                                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                                <div className="font-semibold text-white">Subcontractor RFP Review</div>
                                                <div className="text-slate-400 text-[11px] mt-1">Due in 4 days • Priority High</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                                <div className="font-semibold text-white">Load Testing Matrix</div>
                                                <div className="text-slate-400 text-[11px] mt-1">Due in 7 days • QA Team</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                                        <div className="flex justify-between items-center text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
                                            <span>In Progress (2)</span>
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs">
                                                <div className="font-semibold text-white">Schema Migration v5.2</div>
                                                <div className="text-cyan-400 text-[11px] mt-1">Active Synthesis • 70% Done</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                                        <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                                            <span>Completed (6)</span>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 text-xs">
                                                <div className="font-semibold text-white">Charter & WBS Approval</div>
                                                <div className="text-emerald-400 text-[11px] mt-1">Verified • All Signoffs</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewTab === 'agents' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Cpu className="w-4 h-4 text-cyan-400" />
                                            <span className="text-sm font-bold text-white">Planner Agent</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Parsed WBS into 24 synchronized tasks with critical path dependencies.</p>
                                        <div className="mt-3 text-[11px] font-mono text-cyan-400">STATUS: CONSENSUS REACHED</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-emerald-400" />
                                            <span className="text-sm font-bold text-white">Resource Allocator</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Mapped 7 project roles and equipment budgets to $185k labor ceiling.</p>
                                        <div className="mt-3 text-[11px] font-mono text-emerald-400">STATUS: BALANCED</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/20 sm:col-span-2 lg:col-span-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm font-bold text-white">Risk Sentinel</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Continuously monitors scope drift, milestone slip, and change log history.</p>
                                        <div className="mt-3 text-[11px] font-mono text-purple-400">STATUS: 0 BLOCKERS DETECTED</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 4 Core Architectural Capabilities (Features) */}
                <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-slate-800/60">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-3">
                            <Cpu className="w-3.5 h-3.5" />
                            Platform Architecture
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                            Engineered for Rigorous Project Control
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base">
                            MIFECO replaces fragmented spreadsheets and ad-hoc checklists with a unified, mathematical lifecycle management engine.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">9-Phase Lifecycle</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Automated document generation for Charters, SOWs, WBS work packages, and Critical Reviews with AI drafting.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">6-Agent Engine</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Specialized AI agents collaborate to generate timelines, decompose complex tasks, and estimate material costs.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Resource Parity</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Live team registry keeps role assignments, labor rates, and physical resource costs unified across all tracking tabs.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Risk Sentinel</h3>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Continuous risk auditing detects schedule drift, budget overruns, and unassigned critical path items automatically.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 9-Phase Lifecycle Interactive Roadmap Strip */}
                <section id="phases" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-slate-800/60">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <div className="text-xs uppercase font-bold tracking-widest text-cyan-400 mb-1">Standardized Governance</div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">The 9-Phase HMAP Methodology</h2>
                        </div>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-md">
                            Each phase produces strictly schema-validated JSON deliverables with instant markdown generation and export capability.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
                        {[
                            { num: '01', title: 'Concept', desc: 'Opportunity & Needs' },
                            { num: '02', title: 'Definition', desc: 'Charter & RFP' },
                            { num: '03', title: 'Planning', desc: 'WBS & Schedule' },
                            { num: '04', title: 'Approval', desc: 'Stakeholder Gate' },
                            { num: '05', title: 'SOW', desc: 'Statement of Work' },
                            { num: '06', title: 'Design', desc: 'Architecture Spec' },
                            { num: '07', title: 'Execution', desc: 'Gantt & Kanban' },
                            { num: '08', title: 'Validation', desc: 'QA & Compliance' },
                            { num: '09', title: 'Review', desc: 'Post-Mortem' },
                        ].map((phase, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center hover:border-slate-700 transition-colors">
                                <div className="text-xs font-mono font-bold text-cyan-400 mb-1">{phase.num}</div>
                                <div className="text-sm font-bold text-white">{phase.title}</div>
                                <div className="text-[11px] text-slate-500 mt-1 leading-tight">{phase.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final Call to Action Strip */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                            Ready to Accelerate Your Next Project?
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
                            Join engineering teams, technical program managers, and lead architects building with the MIFECO protocol.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => scrollToAuth('signup')}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-lg"
                            >
                                Create Free Workspace
                            </button>
                            <button
                                onClick={handleDemoLogin}
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all"
                            >
                                Try Demo Without Account
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">MIFECO</span>
                        <span>© 2026 Autonomous Project Protocol</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setIsWaitlistModalOpen(true)}
                            className="hover:text-slate-300 transition-colors"
                        >
                            Enterprise Waitlist
                        </button>
                        <button 
                            onClick={() => setIsKeyModalOpen(true)}
                            className="hover:text-slate-300 transition-colors"
                        >
                            Gemini API Setup
                        </button>
                        <span 
                            onClick={handleHiddenClick}
                            className="cursor-pointer font-mono tracking-widest text-[10px] uppercase text-slate-700 hover:text-slate-500 transition-colors"
                        >
                            [SYS-V5.0]
                        </span>
                    </div>
                </div>
            </footer>

            {/* Pro Waitlist Modal */}
            {isWaitlistModalOpen && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsWaitlistModalOpen(false)} 
                            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Zap className="w-4 h-4" />
                            <span>Enterprise Tier Preview</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Join Pro & Enterprise Waitlist</h2>
                        <p className="text-slate-400 text-xs sm:text-sm mb-6">
                            Unlock multi-tenant cloud persistence, team collaboration workspaces, and dedicated Gemini 2.5 Pro agents.
                        </p>

                        <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Work Email</label>
                                <input 
                                    type="email" 
                                    value={waitlistEmail} 
                                    onChange={e => setWaitlistEmail(e.target.value)} 
                                    required 
                                    placeholder="alex@enterprise.com" 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Organization Type</label>
                                <select 
                                    value={waitlistBusiness} 
                                    onChange={e => setWaitlistBusiness(e.target.value)} 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 outline-none"
                                >
                                    <option value="" disabled>Select Organization Type</option>
                                    <option value="Enterprise">Enterprise (500+)</option>
                                    <option value="Growth Stage">Growth Stage (50-500)</option>
                                    <option value="Startup">Startup (&lt;50)</option>
                                    <option value="Consultancy">Consultancy / Agency</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1.5">Primary Focus</label>
                                <select 
                                    value={waitlistUsage} 
                                    onChange={e => setWaitlistUsage(e.target.value)} 
                                    required 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-cyan-500 outline-none"
                                >
                                    <option value="" disabled>Select Primary Focus</option>
                                    <option value="Project Management">Technical Program Management</option>
                                    <option value="Software Development">Software Architecture & SOW Delivery</option>
                                    <option value="Hardware & Aerospace">Hardware & Systems Engineering</option>
                                    <option value="Consulting Deliverables">Client Deliverables & WBS</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all"
                            >
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Universal LLM Provider & Key Modal */}
            <LlmProviderModal
                isOpen={isKeyModalOpen}
                onClose={() => {
                    setIsKeyModalOpen(false);
                    const s = getLlmSettings();
                    const activeCfg = s.configs[s.activeProvider];
                    if (activeCfg?.apiKey) {
                        setSignupGeminiKey(activeCfg.apiKey);
                    }
                }}
            />

            {/* Mifeco Business Stripe Authority Modal */}
            <MifecoStripeModal
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
                onSuccess={(user) => onLogin(user)}
                initialEmail={emailOrUsername || signupEmail}
            />
        </div>
    );
};


