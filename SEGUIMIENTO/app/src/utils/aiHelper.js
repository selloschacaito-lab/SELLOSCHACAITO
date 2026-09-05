import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// La clave de Gemini ya NO vive en el navegador: esta función llama a la Cloud Function
// `generateAIContent` (ver /functions/index.js), que corre en el servidor de Firebase,
// guarda la clave como secreto y solo responde a usuarios con sesión iniciada.
const callGenerateAIContent = httpsCallable(functions, 'generateAIContent');

/**
 * Generates content using Google Gemini (a través de la Cloud Function segura).
 * Mantiene la misma firma que antes: recibe { contents, config } y devuelve { text, model }.
 */
export async function generateWithGemini(options) {
  try {
    const { data } = await callGenerateAIContent(options);
    return data;
  } catch (err) {
    const message = err?.message || 'No se pudo conectar con el servicio de Inteligencia Artificial.';
    throw new Error(message);
  }
}
