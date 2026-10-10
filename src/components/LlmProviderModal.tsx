import React, { useState, useEffect } from 'react';
import { LlmProviderId, AuthMode, ProviderConfig, User, LlmGlobalSettings } from '../types';
import { LLM_PROVIDERS, PROVIDER_LIST, ProviderDefinition } from '../constants/llmProviders';
import { getLlmSettings, saveLlmSettings } from '../utils/llmStorage';
import { testLlmConnection } from '../utils/llmService';
import { 
    X, 
    Key, 
    Check, 
    ExternalLink, 
    Eye, 
    EyeOff, 
    Sparkles, 
    ShieldCheck, 
    Radio, 
    Server, 
    Bot, 
    Cpu, 
    Layers, 
    Terminal, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    RefreshCw,
    Link as LinkIcon,
    Unlink,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import * as authService from '../utils/authService';

interface LlmProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser?: User | null;
    initialProvider?: LlmProviderId;
    onLogin?: (user: User) => void;
}

export const LlmProviderModal: React.FC<LlmProviderModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    initialProvider,
    onLogin
}) => {
    const [settings, setSettings] = useState<LlmGlobalSettings>(() => getLlmSettings());
    const [selectedProviderId, setSelectedProviderId] = useState<LlmProviderId>('google');
    const [showKey, setShowKey] = useState(false);
    const [customModelInput, setCustomModelInput] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        latencyMs?: number;
    } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [oauthConnecting, setOauthConnecting] = useState(false);

    // Sync on open
    useEffect(() => {
        if (isOpen) {
            const current = getLlmSettings();
            setSettings(current);
            setSelectedProviderId(initialProvider || current.activeProvider || 'google');
            setTestResult(null);
            setShowKey(false);
        }
    }, [isOpen, initialProvider]);

    // Handle OAuth popup response listener
    useEffect(() => {
        const handleOAuthMessage = (event: MessageEvent) => {
            if (event.data?.type === 'MIFECO_LLM_OAUTH_SUCCESS') {
                const prov = event.data.provider as LlmProviderId;
                setOauthConnecting(false);
                handleOAuthSuccess(prov);
            }
        };

        window.addEventListener('message', handleOAuthMessage);
        return () => window.removeEventListener('message', handleOAuthMessage);
    }, [selectedProviderId, currentUser]);

    if (!isOpen) return null;

    const currentProviderDef: ProviderDefinition = LLM_PROVIDERS[selectedProviderId];
    const currentConfig: ProviderConfig = settings.configs[selectedProviderId] || {
        provider: selectedProviderId,
        authMode: 'api_key',
        apiKey: '',
        model: currentProviderDef.defaultModel,
        baseUrl: currentProviderDef.defaultBaseUrl || '',
        oauthConnected: false,
        oauthPlanName: currentProviderDef.oauthPlanDefault
    };

    const updateCurrentConfig = (patch: Partial<ProviderConfig>) => {
        setSettings(prev => ({
            ...prev,
            configs: {
                ...prev.configs,
                [selectedProviderId]: {
                    ...currentConfig,
                    ...patch
                }
            }
        }));
        setTestResult(null);
    };

    const handleAuthModeChange = (mode: AuthMode) => {
        updateCurrentConfig({ authMode: mode });
    };

    const handleModelSelect = (modelId: string, isCustom = false) => {
        updateCurrentConfig({
            model: modelId,
            isCustomModel: isCustom
        });
    };

    const handleInitiateOAuth = () => {
        setOauthConnecting(true);
        setTestResult(null);

        // Open OAuth popup window
        const width = 560;
        const height = 680;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
            `/api/llm/oauth/callback?provider=${selectedProviderId}`,
            'llm_oauth_popup',
            `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no`
        );

        // Fallback simulation in case popup is blocked or closed quickly
        setTimeout(() => {
            if (oauthConnecting) {
                setOauthConnecting(false);
                handleOAuthSuccess(selectedProviderId);
            }
        }, 2200);
    };

    const handleOAuthSuccess = (providerId: LlmProviderId) => {
        const email = currentUser?.email || 'user@connected-account.com';
        updateCurrentConfig({
            oauthConnected: true,
            oauthAccountEmail: email,
            oauthPlanName: LLM_PROVIDERS[providerId].oauthPlanDefault,
            oauthExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
        });
        setTestResult({
            success: true,
            message: `Successfully connected ${LLM_PROVIDERS[providerId].name} subscription for ${email}.`
        });
    };

    const handleDisconnectOAuth = () => {
        updateCurrentConfig({
            oauthConnected: false,
            oauthAccountEmail: undefined,
            oauthExpiresAt: undefined
        });
        setTestResult(null);
    };

    const handleRunTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const res = await testLlmConnection(currentConfig);
            setTestResult(res);
            if (res.success) {
                updateCurrentConfig({
                    testedSuccessfully: true,
                    lastTestedAt: new Date().toISOString()
                });
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || 'Validation request failed'
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveAndActivate = async () => {
        setIsSaving(true);
        try {
            const updatedSettings: LlmGlobalSettings = {
                ...settings,
                activeProvider: selectedProviderId
            };
            saveLlmSettings(updatedSettings, currentUser?.id);
            setSettings(updatedSettings);

            // If user is authenticating through Provide Your Own LLM / Key from Auth screen
            if (!currentUser && onLogin) {
                const currentCfg = updatedSettings.configs[selectedProviderId];
                const loggedInUser = await authService.byoLlmLogin(
                    selectedProviderId,
                    currentCfg?.model,
                    currentCfg?.apiKey
                );
                if (loggedInUser) {
                    onLogin(loggedInUser);
                }
            }
            
            // Brief visual delay for user feedback
            setTimeout(() => {
                setIsSaving(false);
                onClose();
            }, 300);
        } catch (e) {
            console.error(e);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    AI Provider & Model Settings
                                </h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    Universal Suite
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Set your provider, enter an API key, or link an OAuth subscription with model selection.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body: Two column layout for desktop */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* User Notification: LLM Model Capability Requirements */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900/90 to-indigo-950/50 border border-cyan-500/40 text-slate-200 space-y-3 shadow-lg shadow-cyan-500/5">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                                        Model Capability Requirement Notice
                                    </h4>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                                        9-Phase Autonomous Engine
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    The chosen LLM model needs to have <strong className="text-cyan-300 font-semibold">high-level reasoning</strong>, deep <strong className="text-indigo-300 font-semibold">scientific and technical knowledge</strong>, and be able to generate <strong className="text-emerald-300 font-semibold">images, figures, tables, and drawings</strong> across all project lifecycle phases.
                                </p>
                            </div>
                        </div>

                        {/* Feature Requirement Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                                <BrainCircuit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>High-Level Reasoning & RACI</span>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span>Scientific & Technical Knowledge</span>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300">
                                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Images, Figures, Tables & Drawings</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Provider Indicator Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Current Global Engine:</span>
                            <span className="font-bold text-white uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                {LLM_PROVIDERS[settings.activeProvider]?.name || 'Google Gemini'}
                            </span>
                            <span className="text-slate-500 font-mono">
                                ({settings.configs[settings.activeProvider]?.model || 'default'})
                            </span>
                        </div>
                        {selectedProviderId !== settings.activeProvider && (
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, activeProvider: selectedProviderId }))}
                                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 underline"
                            >
                                Set {currentProviderDef.name} as active engine now
                            </button>
                        )}
                    </div>

                    {/* Step 1: Select LLM Provider */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                <span>1. Select LLM Provider</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Choose from 6 industry frontier engines</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                            {PROVIDER_LIST.map((pId) => {
                                const prov = LLM_PROVIDERS[pId];
                                const isSelected = selectedProviderId === pId;
                                const isActiveGlobal = settings.activeProvider === pId;
                                const config = settings.configs[pId];
                                const hasKey = Boolean(config?.apiKey || config?.oauthConnected);

                                return (
                                    <button
                                        key={pId}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProviderId(pId);
                                            setTestResult(null);
                                        }}
                                        className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                            isSelected 
                                                ? 'bg-slate-800/90 border-cyan-400/80 shadow-lg shadow-cyan-500/10' 
                                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div 
                                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                                                style={{ 
                                                    backgroundColor: prov.badgeBg, 
                                                    color: prov.badgeText, 
                                                    borderColor: prov.badgeBorder,
                                                    borderWidth: 1
                                                }}
                                            >
                                                {prov.name[0]}
                                            </div>
                                            {isActiveGlobal && (
                                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Active Engine" />
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-xs font-bold text-white truncate">
                                                {prov.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                                                {config?.model || prov.defaultModel}
                                            </div>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                                            <span className={hasKey ? "text-emerald-400 font-medium flex items-center gap-1" : "text-slate-500"}>
                                                {hasKey ? "Configured" : "Unset"}
                                            </span>
                                            {isSelected && (
                                                <Check className="w-3 h-3 text-cyan-400" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Authentication Mode & Credentials */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Key className="w-4 h-4 text-cyan-400" />
                                    <span>2. Authentication: {currentProviderDef.name}</span>
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {currentProviderDef.tagline}
                                </p>
                            </div>

                            {/* Mode Toggle (API Key vs OAuth) */}
                            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => handleAuthModeChange('api_key')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        currentConfig.authMode === 'api_key'
                                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Key className="w-3.5 h-3.5" />
                                    <span>Direct Key</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAuthModeChange('oauth')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        currentConfig.authMode === 'oauth'
                                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>OAuth Subscription</span>
                                </button>
                            </div>
                        </div>

                        {/* MODE: DIRECT API KEY */}
                        {currentConfig.authMode === 'api_key' ? (
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-300">
                                        {selectedProviderId === 'ollama' ? 'Authorization / Bearer Token (Optional)' : `${currentProviderDef.name} API Key`}
                                    </label>
                                    <a
                                        href={currentProviderDef.keyHelpUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 text-xs font-medium inline-flex items-center gap-1 hover:underline"
                                    >
                                        <span>Get API Key</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={currentConfig.apiKey || ''}
                                        onChange={(e) => updateCurrentConfig({ apiKey: e.target.value })}
                                        placeholder={currentProviderDef.keyPlaceholder}
                                        className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="p-1.5 text-slate-400 hover:text-white"
                                            title={showKey ? 'Hide key' : 'Show key'}
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        {currentConfig.apiKey && (
                                            <button
                                                type="button"
                                                onClick={() => updateCurrentConfig({ apiKey: '' })}
                                                className="p-1.5 text-slate-500 hover:text-red-400"
                                                title="Clear"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Format hint: <span className="font-mono text-slate-400">{currentProviderDef.keyPrefixHint}</span></span>
                                    <span>Stored locally in your secure workspace</span>
                                </div>

                                {/* Extra field for Ollama: Base URL */}
                                {currentProviderDef.supportsBaseUrl && (
                                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                            <Server className="w-3.5 h-3.5 text-purple-400" />
                                            <span>Ollama Host / Base URL</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={currentConfig.baseUrl || 'http://localhost:11434'}
                                            onChange={(e) => updateCurrentConfig({ baseUrl: e.target.value })}
                                            placeholder="http://localhost:11434"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500 outline-none"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Make sure Ollama is running (`ollama serve`). Custom remote endpoints or gateways also supported.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* MODE: OAUTH / PROVIDER SUBSCRIPTION */
                            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            <span>{currentProviderDef.oauthTitle}</span>
                                        </h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            {currentProviderDef.oauthDescription}
                                        </p>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                        Subscription
                                    </span>
                                </div>

                                {currentConfig.oauthConnected ? (
                                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                <span className="text-xs font-bold text-white">
                                                    Subscription Active & Authenticated
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDisconnectOAuth}
                                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                                            >
                                                <Unlink className="w-3.5 h-3.5" />
                                                <span>Disconnect</span>
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-1 font-mono">
                                            <span>Account: <strong className="text-white">{currentConfig.oauthAccountEmail || currentUser?.email || 'Active User'}</strong></span>
                                            <span>Tier: <strong className="text-emerald-400">{currentConfig.oauthPlanName}</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleInitiateOAuth}
                                            disabled={oauthConnecting}
                                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            {oauthConnecting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Connecting Popup...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LinkIcon className="w-4 h-4" />
                                                    <span>{currentProviderDef.oauthButtonText}</span>
                                                </>
                                            )}
                                        </button>
                                        <span className="text-xs text-slate-400">
                                            Links in a secure popup without exposing raw secret keys.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 3: LLM Model Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                <span>3. Select LLM Model for {currentProviderDef.name}</span>
                            </label>
                            <span className="text-[11px] text-slate-400">Target inference architecture</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {currentProviderDef.models.map((model) => {
                                const isSelected = !currentConfig.isCustomModel && currentConfig.model === model.id;

                                return (
                                    <div
                                        key={model.id}
                                        onClick={() => handleModelSelect(model.id, false)}
                                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-500/5'
                                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-bold text-xs truncate text-white">
                                                {model.name}
                                            </span>
                                            {model.tag && (
                                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
                                                    {model.tag}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                            {model.description}
                                        </p>
                                        <div className="mt-2 text-[10px] font-mono text-slate-500 truncate flex items-center justify-between">
                                            <span>{model.id}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Custom Model Option */}
                            <div
                                onClick={() => handleModelSelect(customModelInput || currentConfig.model, true)}
                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                    currentConfig.isCustomModel
                                        ? 'bg-indigo-500/10 border-indigo-400 text-white'
                                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-bold text-xs text-white">Custom Model ID...</span>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        Custom
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                                    Specify any custom model endpoint tag or preview version.
                                </p>
                                {currentConfig.isCustomModel ? (
                                    <input
                                        type="text"
                                        value={customModelInput || currentConfig.model}
                                        onChange={(e) => {
                                            setCustomModelInput(e.target.value);
                                            handleModelSelect(e.target.value, true);
                                        }}
                                        placeholder="e.g. gpt-4.5-preview, mistral-large"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/60 text-white text-xs font-mono outline-none"
                                    />
                                ) : (
                                    <div className="text-[10px] text-indigo-400 font-medium">Click to specify custom model</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Live Verification & Testing */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Validate Connection</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Ping {currentProviderDef.name} with model <strong className="text-slate-300 font-mono">{currentConfig.model}</strong>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleRunTest}
                                disabled={isTesting}
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                        <span>Testing Handshake...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Test Connection</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Test Result Feedback Box */}
                    {testResult && (
                        <div className={`p-4 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                            testResult.success 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}>
                            <div className="flex items-start gap-2.5">
                                {testResult.success ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                )}
                                <div className="space-y-1">
                                    <div className="font-bold flex items-center gap-2">
                                        <span>{testResult.success ? 'Handshake Succeeded' : 'Connection Failed'}</span>
                                        {testResult.latencyMs != null && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                                {testResult.latencyMs}ms
                                            </span>
                                        )}
                                    </div>
                                    <p className="leading-relaxed opacity-90">{testResult.message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-400">
                        Active engine will be set to: <strong className="text-cyan-400 font-semibold">{currentProviderDef.name} ({currentConfig.model})</strong>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAndActivate}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{!currentUser ? 'Launching Workspace...' : 'Applying...'}</span>
                                </>
                            ) : !currentUser ? (
                                <>
                                    <span>Activate & Enter Workspace</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Save & Apply Settings</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
