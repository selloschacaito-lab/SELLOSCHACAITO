import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6JO6BcsfCoHvP2CmYc9dm1myIG8CIj7b__Oe-LuEeY2-g' });

const dummyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function testGeneration(modelName) {
  const start = Date.now();
  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            { text: "What is this image?" },
            { inlineData: { data: dummyImageBase64, mimeType: 'image/png' } }
          ]
        }
      ]
    });
    console.log(`${modelName} Success in ${Date.now() - start}ms:`, result.text);
  } catch (err) {
    console.error(`${modelName} Error in ${Date.now() - start}ms:`, err.message || err);
  }
}

async function run() {
  await testGeneration('gemini-3.5-flash-lite');
  await testGeneration('gemini-flash-latest');
}

run();
