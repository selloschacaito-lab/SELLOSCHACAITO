import React, { useState, useEffect } from 'react';
import { db, firestoreDB } from '../firebase/config';
import { doc, onSnapshot, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Config() {
  const [tasa, setTasa] = useState('');
  const [mayorista, setMayorista] = useState('0.80');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestoreDB, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTasa(data.tasa_actual?.toString() || '');
        setMayorista(data.multiplicador_mayorista?.toString() || '0.80');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading config:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(firestoreDB, 'config', 'general'), {
        tasa_actual: parseFloat(tasa),
        multiplicador_mayorista: parseFloat(mayorista),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  }

  async function handleMigrateSchema() {
    if (!window.confirm("¿Seguro que quieres migrar el esquema? Esto unificará name->nombre y rif->cedula en todos los clientes y productos.")) return;
    try {
      toast.loading("Migrando clientes...", { id: "mig" });
      const clientsSnap = await getDocs(collection(firestoreDB, 'clients'));
      let cCount = 0;
      for (const d of clientsSnap.docs) {
        const data = d.data();
        let needsUpdate = false;
        let updateData = {};
        
        if (data.name && !data.nombre) {
          updateData.nombre = data.name.toUpperCase();
          needsUpdate = true;
        }
        if (data.rif && !data.cedula) {
          updateData.cedula = data.rif.toUpperCase();
          needsUpdate = true;
        }
        if (data.idDoc && !data.cedula && !data.rif) {
          updateData.cedula = data.idDoc.toUpperCase();
          needsUpdate = true;
        }
        if (needsUpdate) {
          await updateDoc(doc(firestoreDB, 'clients', d.id), updateData);
          cCount++;
        }
      }

      toast.loading(`Migrando productos... (Clientes actualizados: ${cCount})`, { id: "mig" });
      const prodSnap = await getDocs(collection(firestoreDB, 'products'));
      let pCount = 0;
      for (const d of prodSnap.docs) {
        const data = d.data();
        if (data.name && !data.nombre) {
          await updateDoc(doc(firestoreDB, 'products', d.id), {
            nombre: data.name.toUpperCase()
          });
          pCount++;
        }
      }

      toast.success(`Migración completada. Clientes: ${cCount}, Productos: ${pCount}`, { id: "mig" });
    } catch (e) {
      console.error(e);
      toast.error("Error en migración", { id: "mig" });
    }
  }

  // Remover el loader bloqueante
  // if (loading) {
  //   return <div style={{ padding: '2rem' }}>Cargando configuración...</div>;
  // }

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Configuración del Sistema</h2>
        <p style={{ color: 'var(--text-muted)' }}>Ajusta las variables globales como la tasa de cambio y márgenes.</p>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="input-label" style={{ fontSize: '1rem' }}>Tasa BCV del día (Bs.) *</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="number" 
              step="0.0001"
              min="0"
              className="input-field" 
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              placeholder="Ej. 36.4521"
              required 
              style={{ maxWidth: '200px' }}
            />
            <button type="button" className="btn-secondary">
              <RefreshCw size={16} /> Consultar BCV
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esta tasa se guardará en los nuevos pedidos al momento de crearlos.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="input-label" style={{ fontSize: '1rem' }}>Multiplicador Mayorista *</label>
          <input 
            type="number" 
            step="0.01"
            min="0"
            max="1"
            className="input-field" 
            value={mayorista}
            onChange={(e) => setMayorista(e.target.value)}
            placeholder="Ej. 0.80"
            required 
            style={{ maxWidth: '200px' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0.80 significa que los mayoristas pagan el 80% del precio normal (20% descuento implícito).</p>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 2rem' }}>
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button type="button" onClick={handleMigrateSchema} style={{ padding: '0.75rem 2rem', background: '#ef4444', color: 'white', borderRadius: '0.5rem', fontWeight: 'bold' }}>
            [ADMIN] Migrar Base de Datos
          </button>
        </div>

      </form>
    </div>
  );
}

export default Config;
