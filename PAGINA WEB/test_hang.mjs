async function test() {
  const payload = {
    contents: [
      { role: "model", parts: [{ text: "Hello" }] },
      { role: "user", parts: [{ text: "Hello again" }] }
    ]
  };
  console.log("Fetching...");
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=DUMMY_KEY_ABC123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
