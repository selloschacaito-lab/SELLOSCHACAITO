import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, limitToLast, onChildAdded, onChildChanged, update } from 'firebase/database';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';

// Firebase configuration matching the React app config.js
const firebaseConfig = {
  apiKey: "AIzaSyD7YzgDdk38Ij3bNEKISra_UWDA8i7vQNQ",
  authDomain: "seguimiento-sellos-chacaito.firebaseapp.com",
  databaseURL: "https://seguimiento-sellos-chacaito-default-rtdb.firebaseio.com",
  projectId: "seguimiento-sellos-chacaito",
  storageBucket: "seguimiento-sellos-chacaito.firebasestorage.app",
  messagingSenderId: "62441533319",
  appId: "1:62441533319:web:16cdcf3ae7ab4e39676d22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Log Helper
const logger = pino({ level: 'info' });

let sock;

// Helper to normalize phone numbers for WhatsApp format (e.g., 584121234567@s.whatsapp.net)
function formatJid(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return null;
  // If it starts with 04, replace with 584 (Venezuela standard country code injection)
  if (clean.startsWith('04')) {
    clean = '584' + clean.slice(2);
  }
  // Ensure it has Venezuela country code
  if (clean.startsWith('4') && clean.length === 10) {
    clean = '58' + clean;
  }
  return `${clean}@s.whatsapp.net`;
}

// Function to send a text message
async function sendMessage(toPhone, text) {
  const jid = formatJid(toPhone);
  if (!jid) {
    console.error(`[-] Número de teléfono inválido: ${toPhone}`);
    return false;
  }
  try {
    await sock.sendMessage(jid, { text });
    console.log(`[+] Mensaje enviado con éxito a: ${toPhone}`);
    return true;
  } catch (err) {
    console.error(`[-] Error al enviar mensaje a ${toPhone}:`, err);
    return false;
  }
}

// Order processor that evaluates status changes
async function processOrderUpdate(orderId, order) {
  if (!order || !order.whatsapp) return;

  const status = order.status || order.statusId;
  if (!status) return;

  const notified = order.notifiedStatuses || {};

  // Prevent double sending if already notified for this status
  if (notified[status]) return;

  const clientName = order.clientName || 'Cliente';
  const orderNumber = order.orderNumber || orderId.slice(-5);
  const publicLink = `https://seguimiento-sellos-chacaito.web.app/orden/${orderId}`;

  let messageText = '';

  if (status === 'design_sent') {
    // DESIGN APPROVED OR TO BE APPROVED NOTIFICATION
    messageText = `¡Hola, *${clientName}*! Te saludamos de *Sellos Chacaíto* 🎨.\n\nYa hemos generado el diseño/propuesta de tu sello (Recibo *#${orderNumber}*).\n\nPuedes ver el diseño y aprobarlo en el siguiente enlace único de tu pedido:\n🔗 ${publicLink}\n\nPor favor indícanos por aquí si todo está correcto para iniciar la producción. ¡Gracias!`;
  } else if (status === 'fina') {
    // INVOICE / RECIBO GENERATED (PAGADO)
    const formattedTotal = Number(order.totalAmountBs || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    messageText = `¡Hola, *${clientName}*! Muchas gracias por tu compra en *Sellos Chacaíto* 📄.\n\nSe ha registrado tu pago por un total de *Bs. ${formattedTotal}* (Recibo *#${orderNumber}*).\n\nPuedes hacer seguimiento a tu pedido y ver tu recibo digital aquí:\n🔗 ${publicLink}\n\nTe avisaremos de inmediato por este medio cuando esté listo para retirar.`;
  } else if (status === 'packed') {
    // READY TO PICK UP (EMPACADO)
    messageText = `¡Buenas noticias, *${clientName}*! 🎉\n\nTu pedido de *Sellos Chacaíto* (Recibo *#${orderNumber}*) ya está *listo para retirar* en nuestra oficina.\n\n📍 *Ubicación:* C.C. Arta, Piso 1, Local 1-6, Chacaíto.\n🕒 *Horario:* Lunes a Viernes de 8:30 AM a 5:30 PM.\n\nPara ver la foto del sello terminado y detalles adicionales, visita:\n🔗 ${publicLink}\n\n¡Te esperamos!`;
  } else if (status === 'delivered') {
    // GOOGLE REVIEWS INVITATION WITH INCENTIVE (Idea #7)
    messageText = `¡Hola, *${clientName}*! Esperamos que tu sello de *Sellos Chacaíto* haya quedado genial y te sea de gran utilidad ✍️.\n\n⭐ *¿Nos apoyarías con una reseña de 5 estrellas en Google?*\nComo agradecimiento por tu apoyo, te regalamos un *5% de descuento* en tu próxima compra o recarga de tinta.\n\nSolo te toma 15 segundos ingresando aquí:\n🔗 https://maps.app.goo.gl/selloschacaito\n\n¡Muchísimas gracias por confiar en nosotros!`;
  }

  if (messageText) {
    console.log(`[*] Intentando enviar notificación de estado [${status}] a ${clientName} (${order.whatsapp})...`);
    const success = await sendMessage(order.whatsapp, messageText);
    if (success) {
      // Mark as notified in Firebase Realtime Database
      try {
        await update(ref(db, `orders/${orderId}/notifiedStatuses`), {
          [status]: true
        });
        console.log(`[+] Firebase actualizado: notificado [${status}] para la orden #${orderNumber}`);
      } catch (dbErr) {
        console.error('[-] Error al actualizar notifiedStatuses en Firebase:', dbErr);
      }
    }
  }
}

// Initialize Baileys WhatsApp Connection
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Monitor connection states
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n[!] ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP PARA CONECTAR EL BOT:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('[-] Conexión cerrada debido a:', lastDisconnect?.error, '. ¿Reconectar?:', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('\n[+] ¡CONEXIÓN EXITOSA! El bot de WhatsApp de Sellos Chacaíto está activo y escuchando cambios...\n');
      startFirebaseListener();
    }
  });
}

// Listen for updates in Firebase Database (Optimized: limitToLast 100 orders to avoid OOM)
function startFirebaseListener() {
  console.log('[*] Escuchando cambios en la base de datos (últimos 100 pedidos)...');
  const recentOrdersRef = query(ref(db, 'orders'), limitToLast(100));

  onChildAdded(recentOrdersRef, (snapshot) => {
    const orderId = snapshot.key;
    const order = snapshot.val();
    processOrderUpdate(orderId, order);
  });

  onChildChanged(recentOrdersRef, (snapshot) => {
    const orderId = snapshot.key;
    const order = snapshot.val();
    processOrderUpdate(orderId, order);
  });
}

// Start connection
connectToWhatsApp();
