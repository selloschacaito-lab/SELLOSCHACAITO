async function test(modelName) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=DUMMY', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hi" }] }] })
  });
  const data = await res.json();
  console.log(modelName, data.error.code, data.error.message);
}
await test('gemini-1.5-flash');
await test('gemini-flash-latest');
