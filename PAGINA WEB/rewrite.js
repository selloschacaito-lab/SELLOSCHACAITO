const fs = require('fs');

const content = 
import { getProducts, getBotSettings } from './db';

export const DEFAULT_SUGGESTIONS = [
  { id: 'req_medico', label: '?? Sello para Médico / Salud', query: '¿Qué información y datos necesito para un sello de médico o del área de salud?' },
  { id: 'req_abogado', label: '?? Sello para Abogado', query: '¿Qué datos debe llevar el sello de un abogado?' },
  { id: 'req_empresa', label: '?? Sello para Empresa / RIF', query: '¿Qué información se necesita para un sello de empresa o comercio?' },
  { id: 'bolsillo', label: '?? Sellos de Bolsillo / Portátiles', query: '¿Qué modelos de sellos de bolsillo tienen y qué precio tienen?' },
  { id: 'mas_vendidos', label: '? Modelos más recomendados', query: '¿Cuáles son los sellos automáticos más vendidos y recomendados?' },
  { id: 'entrega_pago', label: '?? Tiempos de entrega y pagos', query: '¿Cuánto tardan en hacer el sello y cuáles son las formas de pago?' }
];

export const KNOWLEDGE_BASE = {
  medicos: {
    title: '?? Requisitos para Sellos Médicos / Salud',
    text: "Para elaborar un **Sello Médico o del área de la Salud**, la información reglamentaria habitual es:\\n1. **Nombre y Apellido** (con título, ej: *Dr. Carlos Pérez* o *Dra. María González*).\\n2. **Especialidad o Profesión** (ej: *Médico Cirujano*, *Pediatra*, *Odontólogo*, *Enfermero/a*).\\n3. **N° de M.P.P.S.** (Ministerio de Salud).\\n4. **N° de Colegio de Médicos / Odontólogos** (y estado, ej: *C.M.D.F. N° 12345*).\\n5. *(Opcional)* RIF personal o número de teléfono.\\n\\n?? **Modelos más recomendados:** \\n- **Trodat 4911 / 4912:** Tamaño ideal para 3 o 4 líneas de texto nítido.\\n- **Trodat 9511 / Pocket:** Perfecto si necesitas llevarlo en la bata o bolsillo.",
    recommendedKeywords: ['4911', '4912', '9511', 'pocket']
  },
  abogados: {
    title: '?? Requisitos para Sellos de Abogado',
    text: "Para un **Sello de Abogado / Profesional del Derecho**, los datos reglamentarios son:\\n1. **Nombre y Apellido** (ej: *Abg. Luis Ramírez*).\\n2. **Inpreabogado N°** (indispensable para validar documentos jurídicos).\\n3. *(Opcional)* Cédula de Identidad / RIF personal.\\n4. *(Opcional)* Teléfono de contacto o correo.\\n\\n?? **Modelo más recomendado:** **Trodat 4911 o 4912** (proporciona un sellado limpio y oficial para expedientes y contratos).",
    recommendedKeywords: ['4911', '4912']
  },
  ingenieros: {
    title: '?? Requisitos para Sellos de Ingeniero / Arquitecto',
    text: "Para **Ingenieros, Arquitectos y Afines**:\\n1. **Nombre y Apellido** (ej: *Ing. Roberto Mendoza*).\\n2. **Especialidad** (ej: *Ingeniero Civil*, *Ingeniero Mecánico*, *Arquitecto*).\\n3. **N° de C.I.V.** (Colegio de Ingenieros de Venezuela).\\n4. *(Opcional)* RIF o teléfono.\\n\\n?? **Modelo ideal:** **Trodat 4912 o 4913** para planos, memorias descriptivas y firmas técnicas.",
    recommendedKeywords: ['4912', '4913']
  },
  empresas: {
    title: '?? Requisitos para Sellos de Empresas y Comercios',
    text: "Para un **Sello Corporativo o Comercial (RIF)**:\\n1. **Razón Social de la Empresa** (Nombre registrado exacto).\\n2. **Número de RIF** (ej: *J-12345678-9*).\\n3. *(Opcional)* Frase de función (ej: *Firma Autorizada*, *Recibido*, *Despachado*, *Administración*).\\n4. *(Opcional)* Logo corporativo vectorizado.\\n\\n?? **Modelos ideales:** \\n- **Trodat 4913 / 4915:** Si lleva logo + razón social + RIF.\\n- **Sellos Fechadores:** Para recepción de facturas y documentos de almacén.",
    recommendedKeywords: ['4913', '4915', 'fechador']
  },
  docentes: {
    title: '?? Sellos para Docentes y Maestros',
    text: "Para **Docentes, Maestros y Profesores**:\\n1. **Nombre y Apellido** (ej: *Prof. Elena Castillo*).\\n2. **Cédula de Identidad o Cargo** (ej: *Docente de Aula*, *Educación Inicial*).\\n3. *(Opcional)* Nombre del colegio o institución educativa.\\n4. *(Opcional)* Frases motivacionales para calificar tareas (ej: *¡Excelente trabajo! ??*, *Revisado*, *Felicitaciones*).\\n\\n?? **Modelos recomendados:** **Trodat 4911** o sellos redondos coloridos con tapa para la cartuchera.",
    recommendedKeywords: ['4911', '46025', 'redondo']
  },
  entrega_pago: {
    title: '?? Tiempos de Entrega, Ubicación y Pagos',
    text: "? **Elaboración en Tiempo Récord:** \\nTus sellos están listos con la mayor rapidez de Caracas (mismo día o 24 horas hábiles según el tipo de sello).\\n\\n?? **Ubicación:** Chacaíto, Caracas, Venezuela. Realizamos entregas en tienda y envíos nacionales por MRW / Domesa / Tealca / Zoom.\\n\\n?? **Formas de Pago:**\\n- Pago Móvil (a tasa oficial BCV del día).\\n- Transferencias bancarias nacionales.\\n- Zelle / Efectivo en divisas.",
    recommendedKeywords: []
  }
};

const findSuggestedProducts = (text, allProducts = []) => {
  if (!allProducts || allProducts.length === 0) return [];
  const lower = text.toLowerCase();
  
  return allProducts.filter(p => {
    if (p.isVisible === false) return false;
    const nameMatch = p.name.toLowerCase().split(' ').some(word => word.length > 2 && lower.includes(word));
    const dimMatch = p.dimensions && lower.includes(p.dimensions.toLowerCase());
    const catMatch = p.category && lower.includes(p.category.toLowerCase());
    return nameMatch || dimMatch || catMatch;
  }).slice(0, 2);
};

export const getOfflineSmartResponse = async (userMessage, allProducts = []) => {
  const q = userMessage.toLowerCase();

  if (q.includes('médic') || q.includes('medic') || q.includes('doctor') || q.includes('salud') || q.includes('odontolog') || q.includes('enferm') || q.includes('mpps')) {
    const prods = allProducts.filter(p => p.name.includes('4911') || p.name.includes('4912') || p.name.includes('9511') || p.category === 'bolsillo').slice(0, 2);
    return {
      text: KNOWLEDGE_BASE.medicos.text,
      suggestedProducts: prods,
      actionPrompt: '¿Te gustaría cotizar tu sello médico ahora por WhatsApp?'
    };
  }

  if (q.includes('abogad') || q.includes('derecho') || q.includes('inpre') || q.includes('ley')) {
    const prods = allProducts.filter(p => p.name.includes('4911') || p.name.includes('4912')).slice(0, 2);
    return {
      text: KNOWLEDGE_BASE.abogados.text,
      suggestedProducts: prods,
      actionPrompt: '¿Deseas encargar tu sello de abogado vía WhatsApp?'
    };
  }

  if (q.includes('ingenier') || q.includes('arquitect') || q.includes('civ') || q.includes('plano')) {
    const prods = allProducts.filter(p => p.name.includes('4912') || p.name.includes('4913')).slice(0, 2);
    return {
      text: KNOWLEDGE_BASE.ingenieros.text,
      suggestedProducts: prods,
      actionPrompt: '¿Deseas personalizar tu sello de ingeniero?'
    };
  }

  if (q.includes('empresa') || q.includes('rif') || q.includes('razon social') || q.includes('razón social') || q.includes('comercio') || q.includes('negocio') || q.includes('factura') || q.includes('logo')) {
    const prods = allProducts.filter(p => p.name.includes('4913') || p.name.includes('4915') || p.category === 'automaticos').slice(0, 2);
    return {
      text: KNOWLEDGE_BASE.empresas.text,
      suggestedProducts: prods,
      actionPrompt: '¿Deseas que preparemos una muestra digital con el logo de tu empresa?'
    };
  }

  if (q.includes('docente') || q.includes('maestr') || q.includes('profesor') || q.includes('colegio') || q.includes('tarea') || q.includes('calificar')) {
    const prods = allProducts.filter(p => p.name.includes('4911') || p.name.includes('46025')).slice(0, 2);
    return {
      text: KNOWLEDGE_BASE.docentes.text,
      suggestedProducts: prods,
      actionPrompt: '¿Quieres encargar tu sello para calificar tareas por WhatsApp?'
    };
  }

  if (q.includes('bolsillo') || q.includes('portatil') || q.includes('portátil') || q.includes('pequeñ') || q.includes('bata')) {
    const prods = allProducts.filter(p => p.category === 'bolsillo' || p.name.toLowerCase().includes('pocket') || p.name.includes('9511')).slice(0, 2);
    return {
      text: "? **Sellos de Bolsillo y Portátiles:**\\nSon compactos, no manchan la ropa y cuentan con mecanismo retráctil para llevar a cualquier parte.\\n\\nIdeales para médicos de guardia, visitadores médicos, ingenieros en obra y supervisores.",
      suggestedProducts: prods.length > 0 ? prods : allProducts.slice(0, 2),
      actionPrompt: '¿Te gustaría pedir un sello de bolsillo?'
    };
  }

  if (q.includes('fechad') || q.includes('fecha')) {
    const prods = allProducts.filter(p => p.name.toLowerCase().includes('fechad') || p.category === 'automaticos').slice(0, 2);
    return {
      text: "?? **Sellos Fechadores:**\\nPermiten ajustar el día, mes y año con bandas rotatorias de alta durabilidad. Disponibles con texto personalizado (*Recibido, Despachado, Pagado, Entregado*) o solo fecha.",
      suggestedProducts: prods,
      actionPrompt: '¿Deseas pedir un fechador por WhatsApp?'
    };
  }

  if (q.includes('seco') || q.includes('relieve') || q.includes('notari') || q.includes('diploma')) {
    const prods = allProducts.filter(p => p.category === 'secos').slice(0, 2);
    return {
      text: "?? **Sellos Secos (En Relieve):**\\nDejan una marca en bajo relieve elegante e infalsificable sobre papel, cartulina, diplomas, certificados y documentos legales sin necesidad de tinta.",
      suggestedProducts: prods,
      actionPrompt: '¿Deseas cotizar un sello seco en relieve?'
    };
  }

  if (q.includes('tiempo') || q.includes('tardan') || q.includes('entrega') || q.includes('donde') || q.includes('dónde') || q.includes('ubicacion') || q.includes('ubicación') || q.includes('pago') || q.includes('bcv') || q.includes('precio')) {
    return {
      text: KNOWLEDGE_BASE.entrega_pago.text,
      suggestedProducts: allProducts.slice(0, 2),
      actionPrompt: '¿Tienes alguna duda sobre tu pedido?'
    };
  }

  const suggested = findSuggestedProducts(userMessage, allProducts);
  const bestSellers = suggested.length > 0 ? suggested : allProducts.slice(0, 2);

  return {
    text: "¡Con gusto te asesoro! En **Sellos Chacaíto** elaboramos sellos personalizados de la más alta calidad y nitidez para profesionales, empresas y comercios en tiempo récord.\\n\\nDime qué profesión o uso tendrá tu sello (ej. *médico, abogado, empresa, firmas, recibido*) y te indicaré de inmediato los requisitos exactos y el tamaño perfecto.",
    suggestedProducts: bestSellers,
    actionPrompt: '¿En qué tipo de sello estás interesado?'
  };
};

export const queryGeminiAI = async (userMessage, chatHistory = [], botSettings = {}, allProducts = []) => {
  const apiKey = botSettings.geminiApiKey?.trim();

  if (!apiKey) {
    return await getOfflineSmartResponse(userMessage, allProducts);
  }

  try {
    const botName = botSettings.botName || 'Gravy';
    
    const catalogSummary = allProducts
      .filter(p => p.isVisible !== false)
      .map(p => \- \ | Cat: \ | Medida: \ | Precio: $\\)
      .join('\\n');

    const systemInstruction = \Eres \, la mascota y asesor virtual inteligente oficial de "Sellos Chacaíto" (Caracas, Venezuela).
Tu objetivo es responder de forma amable, empática, clara, entusiasta y concisa a clientes que buscan sellos de goma personalizados.

CONOCIMIENTO CLAVE:
1. Requisitos por profesión:
   - Médicos/Salud: Nombre, Especialidad, MPPS, Colegio de Médicos. Modelos ideales: Trodat 4911, 4912, 9511 bolsillo.
   - Abogados: Nombre, Inpreabogado, Cédula opcional. Modelos: Trodat 4911, 4912.
   - Ingenieros/Arquitectos: Nombre, Especialidad, CIV. Modelos: Trodat 4912, 4913.
   - Empresas: Razón Social, RIF, opcional Logo y función (Firma autorizada, Recibido). Modelos: Trodat 4913, 4915.
   - Docentes: Nombre, cargo o frases motivacionales de tareas.
   - Sellos Secos: En relieve para diplomas y documentos sin tinta.
2. Tiempos de entrega: Récord (mismo día o 24h hábiles).
3. Ubicación: Chacaíto, Caracas. Envíos a toda Venezuela (MRW, Domesa, Tealca, Zoom).
4. Pagos: Pago Móvil a tasa BCV, Transferencias, Zelle, Efectivo en divisas.
5. Catálogo real disponible en tienda:
\

REGLAS DE RESPUESTA:
- Responde siempre en español con emojis oportunos y formato Markdown bien estructurado (viñetas, negritas).
- Mantén respuestas directas y concisas (no más de 3 párrafos cortos).
- Si el usuario pregunta por un tipo de sello, menciona 1 o 2 modelos del catálogo con su medida y precio en dólares.
- Invita siempre cordialmente a concretar el pedido por WhatsApp (+58 424 134 5488).\;

    const contents = [];
    let lastRole = null;
    const recentHistory = chatHistory.slice(-4);
    
    for (const msg of recentHistory) {
      const role = msg.sender === 'user' ? 'user' : 'model';
      if (role === lastRole && contents.length > 0) {
         contents[contents.length - 1].parts[0].text += '\\n\\n' + msg.text;
      } else {
         contents.push({ role: role, parts: [{ text: msg.text }] });
         lastRole = role;
      }
    }

    if (lastRole === 'user' && contents.length > 0) {
        contents[contents.length - 1].parts[0].text += '\\n\\n' + userMessage;
    } else {
        contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    const endpoint = \https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=\\;
    
    let res = null;
    let retries = 2;
    let delay = 1500;
    
    while (retries >= 0) {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });

      if (res.ok || res.status !== 503 || retries === 0) {
        break;
      }
      
      await new Promise(r => setTimeout(r, delay));
      retries--;
    }

    if (!res.ok) {
      let errorBody = '';
      try {
        const errorJson = await res.json();
        errorBody = errorJson.error?.message || JSON.stringify(errorJson);
      } catch(e) {
        errorBody = res.statusText;
      }
      throw new Error(\[\] \\);
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!replyText) {
      throw new Error('Respuesta vacía de Gemini');
    }

    const suggested = findSuggestedProducts(userMessage + ' ' + replyText, allProducts);

    return {
      text: replyText,
      suggestedProducts: suggested
    };

  } catch (error) {
    console.warn('[GravyService] Fallback a motor offline por error en Gemini:', error);
    return await getOfflineSmartResponse(userMessage, allProducts);
  }
};
;

fs.writeFileSync('src/services/gravyService.js', content, 'utf8');
