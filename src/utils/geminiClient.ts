import { GoogleGenAI } from "@google/genai";

export const getGeminiKey = () => {
    const useInternalKey = localStorage.getItem('mifeco-use-internal-key') === 'true';
    if (useInternalKey) {
        return process.env.API_KEY || process.env.GEMINI_API_KEY;
    }
    const localKey = localStorage.getItem('hmap-gemini-api-key');
    if (localKey) return localKey;
    return process.env.API_KEY || process.env.GEMINI_API_KEY;
};

export const getGeminiClient = () => {
    const key = getGeminiKey();
    if (!key) {
        throw new Error("Gemini API key is missing. Please add it in the Landing Page.");
    }
    return new GoogleGenAI({ apiKey: key });
};
