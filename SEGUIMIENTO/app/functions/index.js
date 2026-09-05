const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenAI } = require('@google/genai');

// La clave real vive únicamente aquí, como secreto de Cloud Functions
// (se configura con `firebase functions:secrets:set GEMINI_API_KEY`),
// nunca en el código del navegador.
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

// Reemplaza la llamada directa a Gemini que antes hacía el navegador.
// Solo responde a usuarios con sesión de Firebase Auth iniciada (misma
// protección que ya usa el resto de la app).
exports.generateAIContent = onCall({ secrets: [geminiApiKey], region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar esta función.');
  }

  const { contents, config } = request.data || {};
  if (!contents) {
    throw new HttpsError('invalid-argument', 'Falta el contenido a procesar.');
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

  let lastError = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({ contents, config, model: modelName });
      return { text: response.text, model: modelName };
    } catch (err) {
      console.warn(`[Gemini] Modelo ${modelName} falló, probando el siguiente...`, err.message || err);
      lastError = err;
    }
  }

  throw new HttpsError('internal', lastError?.message || 'No se pudo conectar con el servicio de Inteligencia Artificial.');
});
