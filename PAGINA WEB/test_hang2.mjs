async function test() {
  console.log("Fetching...");
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=DUMMY_KEY_ABC123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hello" }] }] })
    });
    console.log("Status:", res.status);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
