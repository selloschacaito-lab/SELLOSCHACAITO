import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // wait for gravy button
  await page.waitForSelector('button[title^="Pregúntale"]', { timeout: 10000 });
  await page.click('button[title^="Pregúntale"]');
  
  // wait for input
  await page.waitForSelector('input[placeholder="Escribe tu pregunta a Gravy..."]');
  await page.type('input[placeholder="Escribe tu pregunta a Gravy..."]', 'Quiero un sello de nombre y rif');
  await page.click('button[type="submit"]');
  
  // wait for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // check if typing
  const html = await page.content();
  if (html.includes('animation: "bounce')) {
    console.log("Still typing after 5 seconds");
  } else {
    console.log("Not typing anymore");
  }
  
  await browser.close();
})();
