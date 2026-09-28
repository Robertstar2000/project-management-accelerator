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
