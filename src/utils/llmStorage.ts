import { LlmGlobalSettings, LlmProviderId, ProviderConfig } from '../types';
import { LLM_PROVIDERS, PROVIDER_LIST } from '../constants/llmProviders';

const STORAGE_KEY = 'mifeco-llm-settings-v2';

export const getDefaultSettings = (): LlmGlobalSettings => {
    // Check backwards compatibility
    const oldGeminiKey = localStorage.getItem('hmap-gemini-api-key') || '';

    const configs: Record<LlmProviderId, ProviderConfig> = {} as any;


    PROVIDER_LIST.forEach(pId => {
        const def = LLM_PROVIDERS[pId];
        configs[pId] = {
            provider: pId,
            authMode: 'api_key',
            apiKey: pId === 'google' ? oldGeminiKey : '',
            baseUrl: def.defaultBaseUrl || '',
            model: def.defaultModel,
            isCustomModel: false,
            oauthConnected: false,
            oauthPlanName: def.oauthPlanDefault
        };
    });

    return {
        activeProvider: 'google',
        configs
    };
};

export const getLlmSettings = (): LlmGlobalSettings => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const defaults = getDefaultSettings();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }

        const parsed = JSON.parse(raw) as LlmGlobalSettings;
        // Merge with defaults to guarantee all providers exist
        const defaults = getDefaultSettings();
        const mergedConfigs = { ...defaults.configs, ...parsed.configs };
        
        PROVIDER_LIST.forEach(pId => {
            if (!mergedConfigs[pId]) {
                mergedConfigs[pId] = defaults.configs[pId];
            }
        });

        // Migrate deprecated or preview Google models to gemini-3.8-flash
        if (mergedConfigs.google && (!mergedConfigs.google.model || mergedConfigs.google.model.startsWith('gemini-1.') || mergedConfigs.google.model.startsWith('gemini-2.') || mergedConfigs.google.model === 'gemini-3-flash-preview')) {
            mergedConfigs.google.model = 'gemini-3.8-flash';
        }

        // Ensure active provider is valid
        const active = PROVIDER_LIST.includes(parsed.activeProvider) ? parsed.activeProvider : 'google';

        return {
            activeProvider: active,
            configs: mergedConfigs
        };
    } catch (e) {
        console.error('Failed to load LLM settings from storage:', e);
        return getDefaultSettings();
    }
};

export const saveLlmSettings = (settings: LlmGlobalSettings, userId?: string) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        // Sync legacy keys for backward compatibility
        const googleConfig = settings.configs.google;
        if (googleConfig?.apiKey) {
            localStorage.setItem('hmap-gemini-api-key', googleConfig.apiKey);
        }

        // Notify app components of configuration change
        window.dispatchEvent(new CustomEvent('mifeco-llm-settings-updated', { detail: settings }));

        // Sync to backend if user is logged in
        if (userId) {
            fetch(`/api/users/${userId}/llm-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            }).catch(err => console.warn('Failed to sync LLM config to server:', err));
        }
    } catch (e) {
        console.error('Failed to save LLM settings:', e);
    }
};

export const getActiveLlmConfig = (): ProviderConfig => {
    const settings = getLlmSettings();
    return settings.configs[settings.activeProvider] || settings.configs.google;
};

/**
 * Detects the LLM provider based on API key prefix or host string.
 */
export const detectProviderFromKey = (key: string): LlmProviderId => {
    const trimmed = (key || '').trim();
    if (trimmed.startsWith('sk-ant-')) return 'anthropic';
    if (trimmed.startsWith('sk-or-')) return 'openrouter';
    if (trimmed.startsWith('sk-')) return 'openai';
    if (trimmed.startsWith('AIza')) return 'google';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes(':11434')) return 'ollama';
    return 'google';
};

/**
 * Applies a user-supplied API key, automatically determining the target provider
 * and activating it globally across the workspace.
 */
export const applyUserApiKey = (key: string, userId?: string): LlmGlobalSettings => {
    const trimmed = (key || '').trim();
    if (!trimmed) return getLlmSettings();

    const provider = detectProviderFromKey(trimmed);
    const settings = getLlmSettings();

    const currentConfig = settings.configs[provider] || {
        provider,
        authMode: 'api_key',
        apiKey: '',
        baseUrl: LLM_PROVIDERS[provider].defaultBaseUrl || '',
        model: LLM_PROVIDERS[provider].defaultModel,
        isCustomModel: false,
        oauthConnected: false,
        oauthPlanName: LLM_PROVIDERS[provider].oauthPlanDefault
    };

    const updatedSettings: LlmGlobalSettings = {
        ...settings,
        activeProvider: provider,
        configs: {
            ...settings.configs,
            [provider]: {
                ...currentConfig,
                apiKey: trimmed,
                authMode: 'api_key'
            }
        }
    };

    saveLlmSettings(updatedSettings, userId);
    return updatedSettings;
};

/**
 * Resolves the effective model for a provider to ensure cross-model compatibility.
 * Prevents Google-specific model strings from being dispatched to OpenAI/Anthropic/Ollama,
 * while respecting explicit user configurations and image generation requirements.
 */
export const getEffectiveModelForProvider = (
    provider: LlmProviderId,
    requestedModel?: string,
    configuredModel?: string
): string => {
    const def = LLM_PROVIDERS[provider] || LLM_PROVIDERS.google;
    const activeModel = configuredModel || def.defaultModel;

    // Image-specific requests always retain image model tag
    if (requestedModel && requestedModel.includes('image')) {
        return requestedModel;
    }

    if (provider === 'google') {
        // If user explicitly configured a model in the modal (e.g. gemini-3.1-pro-preview or gemini-3.1-flash-lite),
        // prioritize it over generic hardcoded 'gemini-3.8-flash' caller defaults
        if (configuredModel && configuredModel !== 'gemini-3.8-flash' && requestedModel === 'gemini-3.8-flash') {
            return configuredModel;
        }
        const modelToUse = requestedModel || activeModel;
        if (modelToUse.startsWith('gemini-1.') || modelToUse.startsWith('gemini-2.') || modelToUse === 'gemini-3-flash-preview') {
            return 'gemini-3.8-flash';
        }
        return modelToUse;
    }

    // For non-Google providers (OpenAI, Anthropic, Ollama, OpenRouter):
    // Internal callers in the app often pass 'gemini-3.8-flash' by default.
    // Replace Google-specific model identifiers with the user's active provider model.
    if (!requestedModel || requestedModel.startsWith('gemini-')) {
        return activeModel;
    }

    return requestedModel;
};

export const syncLlmSettingsFromServer = async (userId: string): Promise<LlmGlobalSettings | null> => {
    try {
        const res = await fetch(`/api/users/${userId}/llm-config`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.configs && data.activeProvider) {
                saveLlmSettings(data);
                return data;
            }
        }
    } catch (e) {
        console.warn('Could not load remote LLM settings:', e);
    }
    return null;
};
