import { db, firestoreDB as firestore } from '../firebase/config';
import { ref, set, update } from 'firebase/database';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from './activityLogger';

function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera de red agotado. Verifica tu conexin a internet.')), ms)
    )
  ]);
}

export async function saveOrder({ orderId, orderData, clientData, isNewOrder, locationPhotoBase64 }) {
  // 1. Guardar cliente en Firestore en segundo plano
  if (clientData && clientData.name) {
    const clientRef = doc(collection(firestore, 'clients'), clientData.id || `client_${Date.now()}`);
    setDoc(clientRef, {
      name: clientData.name,
      nombre: clientData.name,
      whatsapp: clientData.whatsapp || '',
      rif: clientData.rif || '',
      direccion: clientData.direccion || '',
      mapsLink: clientData.mapsLink || '',
      isWholesale: clientData.isWholesale || false,
      updatedAt: serverTimestamp(),
      ...(clientData.id ? {} : { createdAt: serverTimestamp() })
    }, { merge: true }).catch(e => console.error("Error al guardar cliente en Firestore:", e));
  }

  // 2. Guardar pedido en Realtime Database con timeout de 10s para prevenir cuelgues offline
  const id = orderId || `order_${Date.now()}`;
  const nowTime = Date.now();
  const finalOrderData = {
    ...orderData,
    currentStatusStartedAt: orderData.currentStatusStartedAt || nowTime,
    updatedAt: new Date().toISOString()
  };

  if (isNewOrder) {
    finalOrderData.createdAt = new Date().toISOString();
    await withTimeout(set(ref(db, `orders/${id}`), finalOrderData));
    logActivity('Nuevo Pedido', `Creó el pedido #${finalOrderData.orderNumber || id.slice(-5)} para ${finalOrderData.clientName || 'Cliente'}`, id);
  } else {
    await withTimeout(update(ref(db, `orders/${id}`), finalOrderData));
    logActivity('Edición de Pedido', `Actualizó el pedido #${finalOrderData.orderNumber || id.slice(-5)}`, id);
  }

  // 3. Guardar foto de ubicación si se incluyó
  if (locationPhotoBase64) {
    const dbPath = `orderAssets/locationPhoto/${id}`;
    await withTimeout(update(ref(db), {
      [`${dbPath}/fullDataUrl`]: locationPhotoBase64,
      [`${dbPath}/contentType`]: 'image/jpeg',
      [`${dbPath}/updatedAt`]: new Date().toISOString(),
      [`orders/${id}/hasLocationPhoto`]: true
    }));
  }

  return id;
}
