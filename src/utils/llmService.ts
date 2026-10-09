import { getActiveLlmConfig, getEffectiveModelForProvider } from './llmStorage';
import { ProviderConfig } from '../types';

const cleanJsonFences = (text: string): string => {
    if (!text) return '';
    let trimmed = text.trim();
    if (trimmed.startsWith('```json')) {
        trimmed = trimmed.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (trimmed.startsWith('```')) {
        trimmed = trimmed.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return trimmed.trim();
};

export interface GenerateOptions {
    model?: string;
    contents?: any;
    prompt?: string;
    config?: {
        temperature?: number;
        responseMimeType?: string;
        responseSchema?: any;
        thinkingConfig?: { thinkingBudget?: number };
        imageConfig?: { aspectRatio?: string };
    };
}

export interface GenerateResult {
    text?: string;
    candidates?: Array<{
        content: {
            parts: Array<{
                text?: string;
                inlineData?: {
                    mimeType: string;
                    data: string;
                };
            }>;
        };
    }>;
    raw?: any;
}

export const testLlmConnection = async (config: ProviderConfig): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
    model?: string;
}> => {
    try {
        const res = await fetch('/api/llm/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: config.provider,
                authMode: config.authMode,
                apiKey: config.apiKey,
                baseUrl: config.baseUrl,
                model: config.model,
                isCustomModel: config.isCustomModel
            })
        });

        const data = await res.json();
        if (!res.ok) {
            return {
                success: false,
                message: data.error || data.message || `HTTP ${res.status}: Failed to connect`
            };
        }
        return {
            success: data.success,
            message: data.message,
            latencyMs: data.latencyMs,
            model: data.model
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message || 'Network error while attempting connection test'
        };
    }
};

export const executeLlmGeneration = async (options: GenerateOptions): Promise<GenerateResult> => {
    const activeConfig = getActiveLlmConfig();
    const effectiveModel = getEffectiveModelForProvider(
        activeConfig.provider,
        options.model,
        activeConfig.model
    );

    // Send through server proxy to bypass browser CORS and securely handle all providers
    const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            provider: activeConfig.provider,
            authMode: activeConfig.authMode,
            apiKey: activeConfig.apiKey,
            baseUrl: activeConfig.baseUrl,
            model: effectiveModel,
            prompt: options.prompt,
            contents: options.contents,
            config: options.config
        })
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `AI generation failed on ${activeConfig.provider.toUpperCase()} (${res.status})`);
    }

    const data = await res.json();
    let text = data.text || '';
    if (options.config?.responseMimeType === 'application/json') {
        text = cleanJsonFences(text);
    }

    return {
        text,
        candidates: data.candidates || [
            {
                content: {
                    parts: [{ text }]
                }
            }
        ],
        raw: data.raw
    };
};
