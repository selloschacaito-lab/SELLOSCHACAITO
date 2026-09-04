import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

/**
 * Generates content using Google Gemini with automatic fallback across available models.
 */
export async function generateWithGemini(options) {
  if (!apiKey) {
    throw new Error('Falta la API Key de Gemini en las variables de entorno.');
  }

  let lastError = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...options,
        model: modelName
      });
      return {
        text: response.text,
        model: modelName
      };
    } catch (err) {
      console.warn('[Gemini] Model ' + modelName + ' error, trying fallback...', err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo conectar con el servicio de Inteligencia Artificial.');
}
