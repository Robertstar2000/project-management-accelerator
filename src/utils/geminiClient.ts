import { GoogleGenAI } from "@google/genai";
import { getActiveLlmConfig, getLlmSettings } from "./llmStorage";
import { executeLlmGeneration } from "./llmService";

export const getGeminiKey = () => {
    const settings = getLlmSettings();
    const googleConfig = settings.configs.google;
    
    const useInternalKey = localStorage.getItem('mifeco-use-internal-key') === 'true';
    if (useInternalKey) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
    
    if (googleConfig?.apiKey) return googleConfig.apiKey;
    const localKey = localStorage.getItem('hmap-gemini-api-key');
    if (localKey) return localKey;
    return process.env.API_KEY || process.env.GEMINI_API_KEY;
};

export const getGeminiClient = () => {
    const activeConfig = getActiveLlmConfig();

    // If using Google with a direct key, we can use official GoogleGenAI SDK or universal adapter
    if (activeConfig.provider === 'google' && activeConfig.authMode === 'api_key') {
        const key = activeConfig.apiKey || getGeminiKey();
        if (key) {
            const rawSdk = new GoogleGenAI({ apiKey: key });
            return {
                models: {
                    generateContent: async (params: any) => {
                        try {
                            // If a specific model was set in active settings, use it when generic model is passed
                            const effectiveModel = activeConfig.model || params.model;
                            return await rawSdk.models.generateContent({
                                ...params,
                                model: params.model?.includes('image') ? params.model : effectiveModel
                            });
                        } catch (err: any) {
                            console.warn("Direct Google SDK call failed, falling back to universal proxy:", err);
                            return await executeLlmGeneration(params);
                        }
                    }
                }
            };
        }
    }

    // Universal client adapter for OpenAI, Anthropic, Ollama, OpenRouter, and Google OAuth
    return {
        models: {
            generateContent: async (params: any) => {
                const effectiveModel = activeConfig.model || params.model;
                return await executeLlmGeneration({
                    ...params,
                    model: params.model?.includes('image') ? params.model : effectiveModel
                });
            }
        }
    };
};
