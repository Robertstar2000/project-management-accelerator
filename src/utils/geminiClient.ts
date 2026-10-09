import { getActiveLlmConfig, getLlmSettings, getEffectiveModelForProvider } from "./llmStorage";
import { executeLlmGeneration } from "./llmService";

export const getGeminiKey = () => {
    const settings = getLlmSettings();
    const googleConfig = settings.configs.google;
    if (googleConfig?.apiKey) return googleConfig.apiKey;
    const localKey = localStorage.getItem('hmap-gemini-api-key');
    if (localKey) return localKey;
    return '';
};

export const getGeminiClient = () => {
    return {
        models: {
            generateContent: async (params: any) => {
                const activeConfig = getActiveLlmConfig();
                const isImageRequest = Boolean(
                    (typeof params.model === 'string' && params.model.includes('image')) ||
                    params.config?.imageConfig
                );

                // If this is an image generation request, route to Google Gemini image model
                if (isImageRequest) {
                    const imageModel = params.model || 'gemini-3.1-flash-lite-image';
                    const key = activeConfig.provider === 'google' ? (activeConfig.apiKey || getGeminiKey()) : getGeminiKey();
                    const res = await fetch('/api/gemini/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: imageModel,
                            contents: params.contents,
                            prompt: params.prompt,
                            config: params.config,
                            apiKey: key || undefined
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        return {
                            text: data.text || '',
                            candidates: data.candidates || [
                                { content: { parts: [{ text: data.text || '' }] } }
                            ]
                        };
                    }
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to generate image artifact');
                }

                // Resolve model tailored to active provider (e.g. OpenAI gpt-4o/o1/o3, Anthropic claude, Ollama, Google gemini)
                const effectiveModel = getEffectiveModelForProvider(
                    activeConfig.provider,
                    params.model,
                    activeConfig.model
                );

                // Call server-side Gemini API endpoint when Google is active provider
                if (activeConfig.provider === 'google') {
                    try {
                        const key = activeConfig.apiKey || getGeminiKey();
                        const res = await fetch('/api/gemini/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: effectiveModel,
                                contents: params.contents,
                                prompt: params.prompt,
                                config: params.config,
                                apiKey: key || undefined
                            })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            return {
                                text: data.text || '',
                                candidates: data.candidates || [
                                    { content: { parts: [{ text: data.text || '' }] } }
                                ]
                            };
                        }
                    } catch (err) {
                        console.warn("Direct server /api/gemini/generate route encountered error, trying fallback:", err);
                    }
                }

                // Route through universal provider generation for OpenAI, Anthropic, Ollama, OpenRouter, and Google fallback
                return await executeLlmGeneration({
                    ...params,
                    model: effectiveModel
                });
            }
        }
    };
};

