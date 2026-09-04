import { db } from '../firebase/config';
import { ref, push, set } from 'firebase/database';

export const logActivity = async (action, details = '', orderId = '', userNameOverride = null) => {
  try {
    let userName = userNameOverride;
    if (!userName) {
      const stored = localStorage.getItem('activeProfile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userName = parsed.name;
        } catch (e) {}
      }
    }
    userName = userName || 'Sistema';

    const logsRef = ref(db, 'activity_logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      id: newLogRef.key,
      timestamp: Date.now(),
      userName,
      action,
      details,
      orderId: orderId || ''
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
