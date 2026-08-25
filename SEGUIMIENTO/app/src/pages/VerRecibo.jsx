import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, get, child } from 'firebase/database';
import { db } from '../firebase/config';
import { Image as ImageIcon } from 'lucide-react';

export default function VerRecibo() {
  const [searchParams] = useSearchParams();
  const receiptId = searchParams.get('id');
  
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReceipt() {
      if (!receiptId) {
        setError('No se proporcionó un ID de recibo.');
        setLoading(false);
        return;
      }
      try {
        const snapshot = await get(child(ref(db), `tempReceipts/${receiptId}`));
        if (snapshot.exists()) {
          setImageData(snapshot.val().fullDataUrl);
        } else {
          setError('El comprobante no existe o ha expirado.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el comprobante.');
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <p style={{ color: '#fff' }}>Cargando comprobante...</p>
      </div>
    );
  }

  if (error || !imageData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <ImageIcon size={48} color="#444" style={{ margin: '0 auto 1rem' }} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: '1rem' }}>
      <img 
        src={imageData} 
        alt="Comprobante de Pago" 
        style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem' }} 
      />
    </div>
  );
}
