import { getBotSettings } from './src/services/db.js';
import { queryGeminiAI } from './src/services/gravyService.js';

async function test() {
  const settings = await getBotSettings();
  console.log("Got settings", settings.enabled);
  try {
    const res = await queryGeminiAI("Hola", [], settings, []);
    console.log("Success:", res.text.substring(0, 50));
  } catch (e) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}
test();
