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
        description: 'Google AI frontier models featuring Gemini 3.8 Flash, Gemini 4 Argon, and Gemini 3.5 Flash with native multimodal reasoning, scientific problem solving, and visual generation.',
        brandColor: '#06b6d4', // cyan
        badgeBg: 'rgba(6, 182, 212, 0.1)',
        badgeBorder: 'rgba(6, 182, 212, 0.3)',
        badgeText: '#22d3ee',
        defaultModel: 'gemini-3.8-flash',
        models: [
            {
                id: 'gemini-3.8-flash',
                name: 'Gemini 3.8 Flash',
                description: 'Current intelligent Flash generation for long-horizon software engineering, autonomous agents & structured outputs',
                recommended: true,
                tag: 'Recommended Flagship'
            },
            {
                id: 'gemini-4-argon',
                name: 'Gemini 4 Argon',
                description: 'Google frontier model for deep reasoning in complex engineering, science, and cybersecurity defense workflows',
                tag: 'Frontier Deep Reasoning'
            },
            {
                id: 'gemini-3.5-flash',
                name: 'Gemini 3.5 Flash',
                description: 'High-speed flagship for fast, long-horizon multi-agent planning and lifecycle generation',
                tag: 'Fast Multi-Agent'
            },
            {
                id: 'gemini-3.1-flash-lite-image',
                name: 'Gemini 3.1 Flash Lite Image',
                description: 'Native multimodal generator for technical drawings, architectural figures, images, and visual diagrams',
                tag: 'Image & Figure Generation'
            },
            {
                id: 'gemini-3.5-flash-lite',
                name: 'Gemini 3.5 Flash Lite',
                description: 'Ultra low-latency lightweight model for high-throughput, real-time task breakdowns',
                tag: 'High Speed'
            },
            {
                id: 'gemini-flash-latest',
                name: 'Gemini Flash (Latest)',
                description: 'Always routes dynamically to the latest production Google Gemini Flash release',
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
        description: 'OpenAI GPT-6 series (Astra, 6.1 Sol, Luna), GPT-5.5, and o3/o4-mini offering state-of-the-art reasoning, code synthesis, and multimodal analysis.',
        brandColor: '#10b981', // emerald
        badgeBg: 'rgba(16, 185, 129, 0.1)',
        badgeBorder: 'rgba(16, 185, 129, 0.3)',
        badgeText: '#34d399',
        defaultModel: 'gpt-6.1-sol',
        models: [
            {
                id: 'gpt-6.1-sol',
                name: 'GPT-6.1 Sol',
                description: 'Latest default flagship for complex professional tasks, software engineering, and scientific derivation',
                recommended: true,
                tag: 'Latest Flagship'
            },
            {
                id: 'gpt-6-astra',
                name: 'GPT-6 Astra',
                description: 'OpenAI most intelligent model for demanding multi-step reasoning, autonomous agents, and deep research',
                tag: 'Frontier Intelligence'
            },
            {
                id: 'gpt-5.5',
                name: 'GPT-5.5 Instant',
                description: 'High-speed natural response system with deep reasoning, 256K+ context, and multimodal architecture',
                tag: 'High-Speed Omni'
            },
            {
                id: 'o3',
                name: 'OpenAI o3',
                description: 'Frontier deep thinking model excelling in advanced math, scientific proofs, and autonomous tool use',
                tag: 'Deep Reasoning'
            },
            {
                id: 'o4-mini',
                name: 'o4-mini',
                description: 'Next-generation fast reasoning model optimized for mathematical, programming, and visual tasks',
                tag: 'Fast STEM Reasoning'
            },
            {
                id: 'gpt-6-luna',
                name: 'GPT-6 Luna',
                description: 'Ultra-efficient, cost-sensitive model for high-volume rapid task synthesis',
                tag: 'Fast & Efficient'
            },
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Classic omni model with multimodal vision, diagram analysis, and JSON structured outputs',
                tag: 'Omni Vision'
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
        description: 'Claude Sonnet 5.5, Opus 5.5, Sonnet 4.5, and 3.7 Sonnet offering superior code quality, hybrid reasoning, and structured specifications.',
        brandColor: '#f59e0b', // amber
        badgeBg: 'rgba(245, 158, 11, 0.1)',
        badgeBorder: 'rgba(245, 158, 11, 0.3)',
        badgeText: '#fbbf24',
        defaultModel: 'claude-sonnet-5-5',
        models: [
            {
                id: 'claude-sonnet-5-5',
                name: 'Claude Sonnet 5.5',
                description: 'Latest production flagship offering lightning-fast execution, agentic coding, and technical specifications',
                recommended: true,
                tag: 'Latest Flagship'
            },
            {
                id: 'claude-opus-5-5',
                name: 'Claude Opus 5.5',
                description: 'Leading frontier model for deep reasoning, long-running agent workflows, and mission-critical architecture',
                tag: 'Frontier Reasoning'
            },
            {
                id: 'claude-3-7-sonnet-20250219',
                name: 'Claude 3.7 Sonnet',
                description: 'Frontier hybrid reasoning with extended thinking mode & deep system architecture synthesis',
                tag: 'Hybrid Thinking'
            },
            {
                id: 'claude-haiku-5-5',
                name: 'Claude Haiku 5.5',
                description: 'Fastest, low-cost model engineered for high-throughput automated task generation and agile tickets',
                tag: 'Ultra-Fast'
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet v2',
                description: 'Classic industry benchmark for technical specifications, complex code, and system engineering',
                tag: 'Stable Benchmark'
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
        description: 'Frontier high-reasoning models by xAI (Grok 4.7, 4.6, 4.5) with real-time technical domain understanding, STEM knowledge, and multimodal visual analysis.',
        docsUrl: 'https://docs.x.ai',
        authModes: ['api_key'],
        defaultModel: 'grok-4.7',
        defaultBaseUrl: 'https://api.x.ai/v1',
        models: [
            {
                id: 'grok-4.7',
                name: 'Grok 4.7',
                description: 'Latest flagship Grok model with state-of-the-art coding, complex multi-step reasoning, and 1M+ context window',
                recommended: true,
                tag: 'Latest Flagship'
            },
            {
                id: 'grok-4.6',
                name: 'Grok 4.6',
                description: 'Engineered for long-running autonomous agents, visual diagrams, interactive projects, and multi-step execution',
                tag: 'Agentic Execution'
            },
            {
                id: 'grok-4.5',
                name: 'Grok 4.5',
                description: 'Frontier knowledge model with deep technical reasoning, code generation, and Opus-class intelligence',
                tag: 'Deep Reasoning'
            },
            {
                id: 'grok-4.3',
                name: 'Grok 4.3',
                description: 'Standard workhorse model with massive 1M token context window and verified technical accuracy',
                tag: '1M Context'
            },
            {
                id: 'grok-2-latest',
                name: 'Grok 2 (Latest)',
                description: 'Classic xAI production checkpoint for structured generation and coding',
                tag: 'Classic Checkpoint'
            },
            {
                id: 'grok-2-vision-1212',
                name: 'Grok 2 Vision',
                description: 'Multimodal vision model capable of analyzing diagrams, charts, figures, and technical drawings',
                tag: 'Vision & Multimodal'
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
        defaultModel: 'deepseek-r1:70b',
        supportsBaseUrl: true,
        defaultBaseUrl: 'http://localhost:11434',
        models: [
            {
                id: 'deepseek-r1:70b',
                name: 'DeepSeek R1 70B',
                description: 'Frontier open reasoning model for scientific, mathematical, and logical derivation tasks',
                recommended: true,
                tag: 'Deep Reasoning'
            },
            {
                id: 'deepseek-v3.2:latest',
                name: 'DeepSeek V3.2',
                description: 'Latest hybrid MoE model balancing computational speed with advanced reasoning and agent performance',
                tag: 'Latest MoE Flagship'
            },
            {
                id: 'llama3.3:70b',
                name: 'Llama 3.3 70B',
                description: 'State-of-the-art open source flagship for comprehensive technical planning and architecture',
                tag: 'Flagship Open'
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
                id: 'qwen2.5:72b',
                name: 'Qwen 2.5 72B',
                description: 'Frontier multilingual and technical knowledge model supporting over 29 languages',
                tag: 'Technical STEM'
            },
            {
                id: 'llama3.2:3b',
                name: 'Llama 3.2 3B',
                description: 'Compact edge model with low memory footprint for instant local responses',
                tag: 'Lightweight Edge'
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
        defaultModel: 'anthropic/claude-sonnet-5-5',
        models: [
            {
                id: 'anthropic/claude-sonnet-5-5',
                name: 'Claude Sonnet 5.5',
                description: 'Anthropic Claude Sonnet 5.5 flagship routed via OpenRouter high-availability cluster',
                recommended: true,
                tag: 'Latest Flagship'
            },
            {
                id: 'openai/gpt-6.1-sol',
                name: 'GPT-6.1 Sol',
                description: 'OpenAI GPT-6.1 Sol frontier model for professional engineering and reasoning',
                tag: 'OpenAI Flagship'
            },
            {
                id: 'x-ai/grok-4.7',
                name: 'xAI Grok 4.7',
                description: 'xAI latest frontier model with deep reasoning and 1M context via OpenRouter',
                tag: 'Grok Flagship'
            },
            {
                id: 'deepseek/deepseek-r1',
                name: 'DeepSeek R1',
                description: 'DeepSeek flagship open reasoning model via OpenRouter API cluster',
                tag: 'Frontier Reasoning'
            },
            {
                id: 'anthropic/claude-3.7-sonnet',
                name: 'Claude 3.7 Sonnet',
                description: 'Anthropic Claude 3.7 Sonnet hybrid reasoning with extended thinking mode',
                tag: 'Hybrid Thinking'
            },
            {
                id: 'openai/o3',
                name: 'OpenAI o3',
                description: 'OpenAI high-reasoning STEM model via OpenRouter pool',
                tag: 'Deep Reasoning'
            },
            {
                id: 'openai/gpt-4o',
                name: 'GPT-4o',
                description: 'OpenAI GPT-4o routed via OpenRouter high-availability pool',
                tag: 'Omni Vision'
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

