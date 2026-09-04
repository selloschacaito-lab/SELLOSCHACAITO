import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6JO6BcsfCoHvP2CmYc9dm1myIG8CIj7b__Oe-LuEeY2-g' });

async function testGeneration() {
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Hola mundo'
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.error("Error generation:", err);
  }
}

testGeneration();
