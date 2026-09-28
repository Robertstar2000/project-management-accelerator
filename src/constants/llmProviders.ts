import { LlmProviderId, ModelOption } from '../types';

export interface ProviderDefinition {
    id: LlmProviderId;
    name: string;
    tagline: string;
    description: string;
    brandColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    defaultModel: string;
    models: ModelOption[];
    keyPrefixHint: string;
    keyHelpUrl: string;
    keyPlaceholder: string;
    supportsBaseUrl?: boolean;
    defaultBaseUrl?: string;
    oauthTitle: string;
    oauthDescription: string;
    oauthPlanDefault: string;
    oauthButtonText: string;
}

export const LLM_PROVIDERS: Record<LlmProviderId, ProviderDefinition> = {
    google: {
        id: 'google',
        name: 'Google Gemini',
        tagline: 'Native multimodal reasoning with ultra-large context',
        description: 'Google AI models featuring Gemini 2.5 Flash and Pro with native multimodal reasoning and fast synthesis.',
        brandColor: '#06b6d4', // cyan
        badgeBg: 'rgba(6, 182, 212, 0.1)',
        badgeBorder: 'rgba(6, 182, 212, 0.3)',
        badgeText: '#22d3ee',
        defaultModel: 'gemini-2.5-flash',
        models: [
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                description: 'Ultra-fast, high capability model for adaptive planning & synthesis',
                recommended: true,
                tag: 'Recommended'
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                description: 'Flagship reasoning for complex architecture and multi-phase risk analysis',
                tag: 'Advanced'
            },
            {
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                description: 'Low-latency generation for rapid task breakdowns',
                tag: 'High Speed'
            },
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                description: 'Extended 2M token context window for massive project archives',
                tag: 'Deep Context'
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                description: 'High throughput, cost-efficient workhorse model',
                tag: 'Standard'
            }
        ],
        keyPrefixHint: 'AIzaSy...',
        keyHelpUrl: 'https://aistudio.google.com/app/apikey',
        keyPlaceholder: 'AIzaSy... (from Google AI Studio)',
        oauthTitle: 'Google Gemini Subscription / Cloud OAuth',
        oauthDescription: 'Connect using your Google account or Google Cloud Gemini Advanced enterprise license.',
        oauthPlanDefault: 'Gemini Advanced / Workspace Subscription',
        oauthButtonText: 'Connect Google Subscription'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        tagline: 'Industry standard reasoning, coding, and structured output',
        description: 'OpenAI GPT-4o, o1, and o3 family of models offering state-of-the-art analytical rigor.',
        brandColor: '#10b981', // emerald
        badgeBg: 'rgba(16, 185, 129, 0.1)',
        badgeBorder: 'rgba(16, 185, 129, 0.3)',
        badgeText: '#34d399',
        defaultModel: 'gpt-4o',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Flagship omni model with high intelligence and fast execution',
                recommended: true,
                tag: 'Flagship'
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: 'Lightweight, rapid response model optimized for agile scheduling',
                tag: 'Fast'
            },
            {
                id: 'o1',
                name: 'o1',
                description: 'Deep reasoning model specialized in complex engineering logic',
                tag: 'Reasoning'
            },
            {
                id: 'o3-mini',
                name: 'o3-mini',
                description: 'High-speed reasoning model with configurable effort tiers',
                tag: 'Reasoning'
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: 'High accuracy model with 128k context support',
                tag: 'Legacy'
            }
        ],
        keyPrefixHint: 'sk-proj-... or sk-...',
        keyHelpUrl: 'https://platform.openai.com/api-keys',
        keyPlaceholder: 'sk-proj-... (from OpenAI Platform)',
        oauthTitle: 'ChatGPT Plus & Team Subscription',
        oauthDescription: 'Link your active ChatGPT Plus, Team, or Enterprise subscription using OAuth.',
        oauthPlanDefault: 'ChatGPT Plus / Team Account',
        oauthButtonText: 'Connect ChatGPT Subscription'
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        tagline: 'Nuanced technical drafting and deep hybrid reasoning',
        description: 'Claude 3.7 Sonnet and 3.5 family offering superior code quality and structured specifications.',
        brandColor: '#f59e0b', // amber
        badgeBg: 'rgba(245, 158, 11, 0.1)',
        badgeBorder: 'rgba(245, 158, 11, 0.3)',
        badgeText: '#fbbf24',
        defaultModel: 'claude-3-7-sonnet-20250219',
        models: [
            {
                id: 'claude-3-7-sonnet-20250219',
                name: 'Claude 3.7 Sonnet',
                description: 'Hybrid reasoning and leading technical synthesis architecture',
                recommended: true,
                tag: 'Latest'
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet',
                description: 'High intelligence and precise document generation',
                tag: 'Proven'
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude 3.5 Haiku',
                description: 'Sub-second responsiveness with remarkable accuracy',
                tag: 'Ultra-Fast'
            },
            {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                description: 'Deep narrative analysis for high-level governance and policy',
                tag: 'Heavyweight'
            }
        ],
        keyPrefixHint: 'sk-ant-...',
        keyHelpUrl: 'https://console.anthropic.com/settings/keys',
        keyPlaceholder: 'sk-ant-api03-... (from Anthropic Console)',
        oauthTitle: 'Anthropic Workspaces / Claude Pro OAuth',
        oauthDescription: 'Authenticate via your Claude Pro subscription or enterprise Anthropic Workspace account.',
        oauthPlanDefault: 'Claude Pro / Workspace Subscription',
        oauthButtonText: 'Connect Claude Subscription'
    },
    ollama: {
        id: 'ollama',
        name: 'Ollama',
        tagline: 'Local, air-gapped open weights execution with zero cloud egress',
        description: 'Connect directly to your local workstation or private server running Ollama without API meter charges.',
        brandColor: '#8b5cf6', // violet
        badgeBg: 'rgba(139, 92, 246, 0.1)',
        badgeBorder: 'rgba(139, 92, 246, 0.3)',
        badgeText: '#a78bfa',
        defaultModel: 'llama3.3:70b',
        supportsBaseUrl: true,
        defaultBaseUrl: 'http://localhost:11434',
        models: [
            {
                id: 'llama3.3:70b',
                name: 'Llama 3.3 70B',
                description: 'State-of-the-art open source flagship for comprehensive planning',
                recommended: true,
                tag: 'Flagship Open'
            },
            {
                id: 'llama3.1:8b',
                name: 'Llama 3.1 8B',
                description: 'Runs on most laptops and consumer GPUs with great efficiency',
                tag: 'Lightweight'
            },
            {
                id: 'deepseek-r1:14b',
                name: 'DeepSeek R1 14B',
                description: 'Open reasoning model for structured math, logic, and planning',
                tag: 'Reasoning'
            },
            {
                id: 'deepseek-r1:8b',
                name: 'DeepSeek R1 8B',
                description: 'Fast local reasoning model for quick document evaluations',
                tag: 'Fast R1'
            },
            {
                id: 'qwen2.5:14b',
                name: 'Qwen 2.5 14B',
                description: 'Strong coding and multi-language capabilities',
                tag: 'Technical'
            },
            {
                id: 'mistral:latest',
                name: 'Mistral 7B / Nemo',
                description: 'Snappy European open foundation model',
                tag: 'Compact'
            }
        ],
        keyPrefixHint: 'Optional Bearer Token or leave blank for local daemon',
        keyHelpUrl: 'https://ollama.com',
        keyPlaceholder: 'Optional API Key / Authorization Token',
        oauthTitle: 'Ollama Daemon / Private Gateway Auth',
        oauthDescription: 'Link your authenticated corporate Ollama gateway or local proxy daemon.',
        oauthPlanDefault: 'Local Host Server (11434)',
        oauthButtonText: 'Verify Local Ollama Gateway'
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        tagline: 'Universal API gateway across 200+ models with unified credits',
        description: 'Single endpoint routing to Anthropic, OpenAI, Meta, DeepSeek, and Google with transparent routing.',
        brandColor: '#0ea5e9', // sky
        badgeBg: 'rgba(14, 165, 233, 0.1)',
        badgeBorder: 'rgba(14, 165, 233, 0.3)',
        badgeText: '#38bdf8',
        defaultModel: 'anthropic/claude-3.7-sonnet',
        models: [
            {
                id: 'anthropic/claude-3.7-sonnet',
                name: 'Claude 3.7 Sonnet',
                description: 'Anthropic Claude 3.7 Sonnet via OpenRouter routing',
                recommended: true,
                tag: 'Flagship'
            },
            {
                id: 'openai/gpt-4o',
                name: 'GPT-4o',
                description: 'OpenAI GPT-4o routed via OpenRouter high-availability pool',
                tag: 'High Avail'
            },
            {
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek R1',
                description: 'DeepSeek flagship reasoning model via OpenRouter API',
                tag: 'Reasoning'
            },
            {
                id: 'meta-llama/llama-3.3-70b-instruct',
                name: 'Llama 3.3 70B Instruct',
                description: 'Meta open weights hosted on ultra-low latency infrastructure',
                tag: 'Fast'
            },
            {
                id: 'google/gemini-2.0-flash-001',
                name: 'Gemini 2.0 Flash',
                description: 'Google Gemini 2.0 Flash routed through OpenRouter balance',
                tag: 'Affordable'
            }
        ],
        keyPrefixHint: 'sk-or-v1-...',
        keyHelpUrl: 'https://openrouter.ai/keys',
        keyPlaceholder: 'sk-or-v1-... (from OpenRouter.ai)',
        oauthTitle: 'OpenRouter PKCE OAuth Subscription',
        oauthDescription: 'Connect directly to your OpenRouter account to use your subscription credits seamlessly.',
        oauthPlanDefault: 'OpenRouter Credit Subscription',
        oauthButtonText: 'Connect OpenRouter OAuth'
    }
};

export const PROVIDER_LIST: LlmProviderId[] = ['google', 'openai', 'anthropic', 'ollama', 'openrouter'];
