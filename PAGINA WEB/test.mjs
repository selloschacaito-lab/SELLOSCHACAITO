async function test() {
  const payload = {
    system_instruction: {
      parts: { text: "You are a bot." }
    },
    contents: [
      { role: "user", parts: [{ text: "Hello" }] },
      { role: "user", parts: [{ text: "Hello again" }] }
    ]
  };
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=DUMMY_KEY_ABC123', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
