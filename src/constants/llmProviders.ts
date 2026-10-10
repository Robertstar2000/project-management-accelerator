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
        tagline: 'Native multimodal reasoning with ultra-large context & image synthesis',
        description: 'Google AI frontier models featuring Gemini 3.8 Flash and Gemini 3.1 Pro with native multimodal reasoning, scientific problem solving, and visual generation.',
        brandColor: '#06b6d4', // cyan
        badgeBg: 'rgba(6, 182, 212, 0.1)',
        badgeBorder: 'rgba(6, 182, 212, 0.3)',
        badgeText: '#22d3ee',
        defaultModel: 'gemini-3.8-flash',
        models: [
            {
                id: 'gemini-3.8-flash',
                name: 'Gemini 3.8 Flash',
                description: 'Next-generation fast flagship model for adaptive planning, multi-agent synthesis & structured outputs',
                recommended: true,
                tag: 'Recommended Flagship'
            },
            {
                id: 'gemini-3.1-pro-preview',
                name: 'Gemini 3.1 Pro Preview',
                description: 'Frontier reasoning model for advanced STEM, complex system architecture, and deep technical risk auditing',
                tag: 'Deep Reasoning & STEM'
            },
            {
                id: 'gemini-3.1-flash-lite-image',
                name: 'Gemini 3.1 Flash Lite Image',
                description: 'Native multimodal generator for technical drawings, architectural figures, images, and visual diagrams',
                tag: 'Image & Figure Generation'
            },
            {
                id: 'gemini-nano-banana-2.1',
                name: 'Gemini Nano Banana 2.1',
                description: 'High-resolution visual synthesis model for detailed diagrams, charts, figures, and technical renderings',
                tag: 'High-Res Drawings'
            },
            {
                id: 'gemini-3.1-flash-lite',
                name: 'Gemini 3.1 Flash Lite',
                description: 'Ultra low-latency lightweight model for high-speed rapid task breakdowns',
                tag: 'High Speed'
            },
            {
                id: 'gemini-flash-latest',
                name: 'Gemini Flash (Latest)',
                description: 'Always routes to the latest production Google Gemini Flash release',
                tag: 'Latest Stable'
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
        tagline: 'Frontier reasoning, scientific intelligence, and structured execution',
        description: 'OpenAI GPT-4o, o3-mini, o1, and GPT-4.5 family offering state-of-the-art reasoning, code synthesis, and multimodal analysis.',
        brandColor: '#10b981', // emerald
        badgeBg: 'rgba(16, 185, 129, 0.1)',
        badgeBorder: 'rgba(16, 185, 129, 0.3)',
        badgeText: '#34d399',
        defaultModel: 'gpt-4o',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Flagship omni model with high intelligence, image/figure analysis, and fast multimodal synthesis',
                recommended: true,
                tag: 'Flagship Omni'
            },
            {
                id: 'o3-mini',
                name: 'o3-mini',
                description: 'Next-generation high-speed reasoning model specialized in STEM, math, and complex logic with configurable thinking',
                tag: 'Frontier Reasoning'
            },
            {
                id: 'o1',
                name: 'o1',
                description: 'Deep reasoning frontier model for complex science, math, and systems architecture specifications',
                tag: 'Deep Reasoning'
            },
            {
                id: 'gpt-4.5-preview',
                name: 'GPT-4.5 Preview',
                description: 'Frontier model with deep world knowledge, high-level scientific reasoning, and nuanced technical understanding',
                tag: 'Frontier Knowledge'
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: 'Lightweight, rapid response model optimized for agile scheduling and real-time task breakdowns',
                tag: 'Fast & Efficient'
            },
            {
                id: 'chatgpt-4o-latest',
                name: 'ChatGPT-4o Latest',
                description: 'Continuously updated dynamic GPT-4o checkpoint used in ChatGPT production',
                tag: 'Dynamic'
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
        tagline: 'Nuanced technical drafting, hybrid reasoning, and systems architecture',
        description: 'Claude 3.7 Sonnet and 3.5 family offering superior code quality, hybrid reasoning, and structured specifications.',
        brandColor: '#f59e0b', // amber
        badgeBg: 'rgba(245, 158, 11, 0.1)',
        badgeBorder: 'rgba(245, 158, 11, 0.3)',
        badgeText: '#fbbf24',
        defaultModel: 'claude-3-7-sonnet-20250219',
        models: [
            {
                id: 'claude-3-7-sonnet-20250219',
                name: 'Claude 3.7 Sonnet',
                description: 'Frontier hybrid reasoning with extended thinking mode & state-of-the-art technical architecture synthesis',
                recommended: true,
                tag: 'Hybrid Reasoning'
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet v2',
                description: 'Proven industry benchmark for technical specifications, complex code, and system engineering',
                tag: 'Proven Benchmark'
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude 3.5 Haiku',
                description: 'Sub-second responsiveness with remarkable technical accuracy for agile workflows',
                tag: 'Ultra-Fast'
            },
            {
                id: 'claude-3-opus-20240229',
                name: 'Claude 3 Opus',
                description: 'Deep narrative analysis for high-level governance, compliance, and enterprise policy',
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
    grok: {
        id: 'grok',
        name: 'xAI Grok',
        tagline: 'High-reasoning frontier models with deep technical knowledge by xAI',
        badgeBg: 'rgba(255, 255, 255, 0.1)',
        badgeText: '#ffffff',
        badgeBorder: 'rgba(255, 255, 255, 0.3)',
        brandColor: '#ffffff',
        description: 'Frontier high-reasoning models by xAI with real-time technical domain understanding, STEM knowledge, and multimodal visual analysis.',
        docsUrl: 'https://docs.x.ai',
        authModes: ['api_key'],
        defaultModel: 'grok-2-latest',
        defaultBaseUrl: 'https://api.x.ai/v1',
        models: [
            {
                id: 'grok-2-latest',
                name: 'Grok 2 (Latest)',
                description: 'xAI flagship model with state-of-the-art reasoning, deep technical synthesis, and coding',
                recommended: true,
                tag: 'Flagship Reasoning'
            },
            {
                id: 'grok-2-vision-1212',
                name: 'Grok 2 Vision',
                description: 'Multimodal vision model capable of analyzing diagrams, charts, figures, and technical drawings',
                tag: 'Vision & Multimodal'
            },
            {
                id: 'grok-beta',
                name: 'Grok Beta',
                description: 'High-speed reasoning model with real-time technical domain understanding and logic',
                tag: 'Fast Reasoning'
            },
            {
                id: 'grok-vision-beta',
                name: 'Grok Vision Beta',
                description: 'Multimodal preview for technical drawings, charts, tables, and image comprehension',
                tag: 'Multimodal Drawings'
            }
        ],
        keyPrefixHint: 'xai-...',
        keyHelpUrl: 'https://console.x.ai',
        keyPlaceholder: 'xai-... (from console.x.ai)',
        oauthTitle: 'xAI Console Access',
        oauthDescription: 'Access Grok frontier models using your xAI API key.',
        oauthPlanDefault: 'xAI Developer Plan',
        oauthButtonText: 'Connect xAI'
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
                description: 'State-of-the-art open source flagship for comprehensive technical planning and architecture',
                recommended: true,
                tag: 'Flagship Open'
            },
            {
                id: 'deepseek-r1:70b',
                name: 'DeepSeek R1 70B',
                description: 'Frontier open reasoning model for scientific, mathematical, and logical derivation tasks',
                tag: 'Deep Reasoning'
            },
            {
                id: 'deepseek-r1:14b',
                name: 'DeepSeek R1 14B',
                description: 'High-speed open reasoning model for structured logic, math, and technical planning',
                tag: 'Fast Reasoning'
            },
            {
                id: 'qwen2.5-coder:32b',
                name: 'Qwen 2.5 Coder 32B',
                description: 'Leading open model for software engineering, architecture blueprints, and JSON schemas',
                tag: 'Code & Architecture'
            },
            {
                id: 'llama3.1:8b',
                name: 'Llama 3.1 8B',
                description: 'Runs efficiently on consumer GPUs and laptops with low memory footprint',
                tag: 'Lightweight'
            },
            {
                id: 'mistral-small:latest',
                name: 'Mistral Small 24B',
                description: 'High efficiency European foundation model optimized for rapid agile workflows',
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
        description: 'Single endpoint routing to Anthropic, OpenAI, xAI, Meta, DeepSeek, and Google with transparent routing.',
        brandColor: '#0ea5e9', // sky
        badgeBg: 'rgba(14, 165, 233, 0.1)',
        badgeBorder: 'rgba(14, 165, 233, 0.3)',
        badgeText: '#38bdf8',
        defaultModel: 'anthropic/claude-3.7-sonnet',
        models: [
            {
                id: 'anthropic/claude-3.7-sonnet',
                name: 'Claude 3.7 Sonnet',
                description: 'Anthropic Claude 3.7 Sonnet hybrid reasoning routed via OpenRouter',
                recommended: true,
                tag: 'Hybrid Flagship'
            },
            {
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek R1',
                description: 'DeepSeek flagship open reasoning model via OpenRouter API cluster',
                tag: 'Frontier Reasoning'
            },
            {
                id: 'openai/gpt-4o',
                name: 'GPT-4o',
                description: 'OpenAI GPT-4o routed via OpenRouter high-availability pool',
                tag: 'Omni Vision'
            },
            {
                id: 'openai/o3-mini',
                name: 'o3-mini',
                description: 'OpenAI high-speed frontier STEM reasoning model via OpenRouter',
                tag: 'Fast Reasoning'
            },
            {
                id: 'x-ai/grok-2-1212',
                name: 'xAI Grok 2',
                description: 'xAI flagship model with real-time technical knowledge and reasoning',
                tag: 'Grok Reasoning'
            },
            {
                id: 'x-ai/grok-2-vision-1212',
                name: 'xAI Grok 2 Vision',
                description: 'Multimodal vision model for technical figures, diagrams, and drawings',
                tag: 'Grok Vision'
            },
            {
                id: 'meta-llama/llama-3.3-70b-instruct',
                name: 'Llama 3.3 70B Instruct',
                description: 'Meta open weights hosted on ultra-low latency infrastructure',
                tag: 'Open Flagship'
            },
            {
                id: 'google/gemini-flash-latest',
                name: 'Gemini Flash (Latest)',
                description: 'Google Gemini Flash routed through OpenRouter balance',
                tag: 'Fast Synthesis'
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

export const PROVIDER_LIST: LlmProviderId[] = ['google', 'openai', 'anthropic', 'grok', 'openrouter', 'ollama'];

