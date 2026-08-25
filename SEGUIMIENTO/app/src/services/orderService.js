import { db, firestoreDB as firestore } from '../firebase/config';
import { ref, set, update } from 'firebase/database';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function saveOrder({ orderId, orderData, clientData, isNewOrder, locationPhotoBase64 }) {
  // 1. Guardar cliente en Firestore en segundo plano (sin await para no bloquear la UI)
  if (clientData && clientData.name) {
    const clientRef = doc(collection(firestore, 'clients'), clientData.id || `client_${Date.now()}`);
    setDoc(clientRef, {
      name: clientData.name,
      whatsapp: clientData.whatsapp || '',
      isWholesale: clientData.isWholesale || false,
      updatedAt: serverTimestamp(),
      ...(clientData.id ? {} : { createdAt: serverTimestamp() })
    }, { merge: true }).catch(e => console.error(e));
  }

  // 2. Guardar pedido en Realtime Database
  const id = orderId || `order_${Date.now()}`;
  const finalOrderData = {
    ...orderData,
    updatedAt: new Date().toISOString()
  };

  if (isNewOrder) {
    finalOrderData.createdAt = new Date().toISOString();
    await set(ref(db, `orders/${id}`), finalOrderData);
  } else {
    await update(ref(db, `orders/${id}`), finalOrderData);
  }

  // 3. Guardar foto de ubicación si se incluyó
  if (locationPhotoBase64) {
    const dbPath = `orderAssets/locationPhoto/${id}`;
    await update(ref(db), {
      [`${dbPath}/fullDataUrl`]: locationPhotoBase64,
      [`${dbPath}/contentType`]: 'image/jpeg',
      [`${dbPath}/updatedAt`]: new Date().toISOString(),
      [`orders/${id}/hasLocationPhoto`]: true
    });
  }

  return id;
}
