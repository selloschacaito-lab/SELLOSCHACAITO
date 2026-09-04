async function test() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=DUMMY');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
