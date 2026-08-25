import fs from 'fs';
import path from 'path';

const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/sellos-chacaito/databases/(default)/documents/products';
const DIST_DIR = path.resolve('dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

const formatDimensions = (dim) => {
  if (!dim) return '';
  return dim.replace(/(\d+)\s*[xX*×]\s*(\d+)/g, '$1 × $2').trim();
};

const extractValue = (field) => {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(extractValue);
  }
  if (field.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(field.mapValue.fields || {})) {
      obj[k] = extractValue(v);
    }
    return obj;
  }
  return null;
};

async function run() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.warn('[SEO/Meta] dist/index.html not found.');
    return;
  }

  const baseHtml = fs.readFileSync(INDEX_FILE, 'utf8');

  try {
    console.log('[SEO/Meta] Fetching products from Firestore...');
    const res = await fetch(FIRESTORE_URL);
    const data = await res.json();
    const docs = data.documents || [];
    console.log(`[SEO/Meta] Found ${docs.length} products to generate previews for.`);

    let count = 0;
    for (const doc of docs) {
      const docId = (doc.name || '').split('/').pop();
      const f = doc.fields || {};

      const name = extractValue(f.name) || 'Sello Personalizado';
      const price = extractValue(f.price) || '';
      const rawDim = extractValue(f.dimensions) || '';
      const dim = formatDimensions(rawDim);
      const shortDesc = extractValue(f.shortDescription) || '';
      const desc = extractValue(f.description) || '';
      const variants = extractValue(f.variants) || [];

      // Seleccionar imagen de la variante
      let img = 'https://sellos-chacaito.web.app/logo.png';
      if (Array.isArray(variants) && variants.length > 0) {
        const v0 = variants.find(v => v.imageUrl || (v.imageUrls && v.imageUrls.length > 0)) || variants[0];
        if (v0) {
          img = v0.imageUrl || (v0.imageUrls && v0.imageUrls[0]) || img;
        }
      }

      const title = price ? `${name} - $${price} | Sellos Chacaíto` : `${name} | Sellos Chacaíto`;
      
      let fullDesc = dim ? `Medida: ${dim}. ` : '';
      if (shortDesc) {
        fullDesc += shortDesc;
      } else if (desc) {
        fullDesc += desc.length > 140 ? `${desc.slice(0, 137)}...` : desc;
      } else {
        fullDesc += 'Sello personalizado con máxima nitidez. Elaboración en tiempo récord.';
      }

      const prodUrl = `https://sellos-chacaito.web.app/productos/${docId}`;

      let html = baseHtml
        .replace(/<title>.*?<\/title>/gi, `<title>${name} | Sellos Chacaíto</title>`)
        .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${fullDesc}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${img}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${prodUrl}" />`)
        .replace(/<meta property="twitter:title" content=".*?" \/>/gi, `<meta property="twitter:title" content="${title}" />`)
        .replace(/<meta property="twitter:description" content=".*?" \/>/gi, `<meta property="twitter:description" content="${fullDesc}" />`)
        .replace(/<meta property="twitter:image" content=".*?" \/>/gi, `<meta property="twitter:image" content="${img}" />`)
        .replace(/<meta property="twitter:url" content=".*?" \/>/gi, `<meta property="twitter:url" content="${prodUrl}" />`)
        .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${fullDesc}" />`);

      const targetDir = path.join(DIST_DIR, 'productos', docId);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
      count++;
    }

    console.log(`[SEO/Meta] Successfully pre-rendered ${count} product preview pages in dist/productos/!`);
  } catch (err) {
    console.error('[SEO/Meta] Error:', err);
  }
}

run();

