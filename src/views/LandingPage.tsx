import React, { useState, useEffect } from 'react';
import { Project, User, LlmGlobalSettings } from '../types';
import { RainbowText } from '../components/RainbowText';
import { getLlmSettings } from '../utils/llmStorage';
import { LLM_PROVIDERS, PROVIDER_LIST } from '../constants/llmProviders';
import { 
    FolderKanban, 
    PlusCircle, 
    Sparkles, 
    Key, 
    Users, 
    ArrowRight, 
    CheckCircle2, 
    Activity, 
    Cpu,
    Check
} from 'lucide-react';

interface LandingPageProps {
    onSelectProject: (project: Project | null) => void;
    onNewProject: () => void;
    currentUser: User;
    projects: Project[];
    onOpenKeyModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onSelectProject, 
    onNewProject, 
    currentUser, 
    projects,
    onOpenKeyModal 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [llmSettings, setLlmSettings] = useState<LlmGlobalSettings>(() => getLlmSettings());

    useEffect(() => {
        const updateSettingsState = () => {
            setLlmSettings(getLlmSettings());
        };
        updateSettingsState();
        window.addEventListener('mifeco-llm-settings-updated', updateSettingsState);
        return () => window.removeEventListener('mifeco-llm-settings-updated', updateSettingsState);
    }, []);

    const filteredProjects = projects.filter(p => 

        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
    const totalTeamMembers = projects.reduce((acc, p) => acc + (p.team?.length || 0), 0);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80 mb-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Mission Command Active
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Welcome back, <span className="text-cyan-400">{currentUser.username}</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        <RainbowText text="PM ACCELERATOR" /> • MIFECO Autonomous Project Intelligence Center
                    </p>
                </div>

                {/* Quick Action Button */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onNewProject}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Create New Project</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                        <FolderKanban className="w-4 h-4 text-cyan-400" />
                        <span>Active Projects</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">{projects.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Total Planned Tasks</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">{totalTasks}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Team Allocations</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-indigo-400">{totalTeamMembers}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span>System Status</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-400 flex items-center gap-2 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span>Ready (v5.0)</span>
                    </div>
                </div>
            </div>

            {/* Primary Action Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Project Directory Card */}
                <div 
                    onClick={() => onSelectProject(null)}
                    className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group relative overflow-hidden shadow-xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                        <FolderKanban className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        Project Database & Workspaces
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Access existing projects, review Gantt timelines, inspect 9-phase documents, and track multi-agent planning logs.
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        <span>Open Workspaces ({projects.length})</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>

                {/* Initiate New Project Card */}
                <div 
                    onClick={onNewProject}
                    className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group relative overflow-hidden shadow-xl"
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                        Initialize New Lifecycle
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Launch the 9-phase Hyper-Agile project generator. Define objectives, scope boundaries, and auto-synthesize charters.
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        <span>Launch Setup Wizard</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Recent Workspaces Quick List (if any exist) */}
            {projects.length > 0 && (
                <div className="mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Recent Workspaces</h3>
                            <p className="text-xs text-slate-400">Quickly resume active project planning and monitoring</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {projects.length > 3 && (
                                <input
                                    type="text"
                                    placeholder="Filter projects..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 outline-none w-44"
                                />
                            )}
                            <button 
                                onClick={() => onSelectProject(null)}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold shrink-0"
                            >
                                View All ({projects.length}) →
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(searchTerm ? filteredProjects : projects.slice(0, 6)).map((project) => (
                            <div 
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer transition-all"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="text-sm font-bold text-white truncate">{project.name}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                                        Phase {project.phase || 1}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                                    {project.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                                    <span>{project.tasks?.length || 0} Tasks</span>
                                    <span>{project.team?.length || 0} Members</span>
                                    <span>${(project.budget || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Engine & LLM Provider Command Center */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800/90 shadow-xl mb-10 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-800/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Cpu className="w-4 h-4" />
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                Autonomous AI Engine & Provider Suite
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                5 Providers Supported
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                            Configure your LLM provider, enter direct API keys, or connect subscriptions via OAuth. Powers 9-phase document synthesis, Gantt scheduling, and risk analysis.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {onOpenKeyModal && (
                            <button 
                                onClick={onOpenKeyModal}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/15 transition-all"
                            >
                                <Key className="w-4 h-4" />
                                <span>Enter Your Own Key / Configure</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Provider Status Cards Row */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {PROVIDER_LIST.map((pId) => {
                        const prov = LLM_PROVIDERS[pId];
                        const cfg = llmSettings.configs[pId];
                        const isActive = llmSettings.activeProvider === pId;
                        const isConnected = Boolean(cfg?.apiKey || cfg?.oauthConnected);

                        return (
                            <div 
                                key={pId}
                                onClick={onOpenKeyModal}
                                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                    isActive 
                                        ? 'bg-slate-900 border-cyan-400/70 shadow-md shadow-cyan-500/10' 
                                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span 
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: prov.badgeBg, color: prov.badgeText }}
                                    >
                                        {prov.name}
                                    </span>
                                    {isActive && (
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Active Engine" />
                                    )}
                                </div>
                                <div className="text-xs font-mono text-slate-300 truncate">
                                    {cfg?.model || prov.defaultModel}
                                </div>
                                <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400">
                                    <span className={isConnected ? "text-emerald-400 font-medium" : "text-slate-500"}>
                                        {cfg?.oauthConnected ? "OAuth Linked" : isConnected ? "Key Saved" : "Unconfigured"}
                                    </span>
                                    {isActive && <Check className="w-3 h-3 text-cyan-400" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Active Provider Overview & Fast Key Input */}
                <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-400">
                            Active Engine: <strong className="text-white font-semibold">{LLM_PROVIDERS[llmSettings.activeProvider]?.name}</strong>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="text-xs font-mono text-cyan-400">
                            Model: {llmSettings.configs[llmSettings.activeProvider]?.model || 'default'}
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="text-xs text-slate-400">
                            Mode: <span className="text-slate-200 capitalize">{llmSettings.configs[llmSettings.activeProvider]?.authMode === 'oauth' ? 'Subscription OAuth' : 'Direct API Key'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onOpenKeyModal}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1"
                        >
                            <span>Open Detailed LLM Modal & Switch Models</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* System Tag */}
            <div className="text-center text-xs text-slate-600 font-mono py-4">
                PM ACCELERATOR • MIFECO PROTOCOL V5.0 • PRODUCTION SYNCHRONIZED
            </div>
        </div>
    );
};

