const fetch = require('node-fetch');
async function test() {
  const payload = {
    systemInstruction: {
      parts: [{ text: "You are a bot." }]
    },
    contents: [
      { role: "user", parts: [{ text: "Hello" }] }
    ]
  };
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=DUMMY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
