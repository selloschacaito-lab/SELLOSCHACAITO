import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, firestoreDB } from '../firebase/config';
import { doc, onSnapshot, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { ref as rtdbRef, get as rtdbGet } from 'firebase/database';
import { Save, RefreshCw, PanelLeft, Sparkles, Download, Layers, ShieldCheck, Plus, Trash2, Send, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useProfile } from '../contexts/ProfileContext';
import { useUpdate } from '../contexts/UpdateContext';

function Config() {
  const { toggleSidebar } = useOutletContext() || {};
  const { activeProfile } = useProfile();
  const { 
    localVersionName, 
    latestVersionName, 
    hasUpdate, 
    pendingUpdates, 
    openUpdateModal, 
    publishUpdate 
  } = useUpdate();

  // Estados para publicar nueva actualización (Álvaro)
  const [newVersionInput, setNewVersionInput] = useState('');
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newHighlightsInput, setNewHighlightsInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [tasa, setTasa] = useState('');
  const [mayorista, setMayorista] = useState('0.80');
  const [googleReviewLink, setGoogleReviewLink] = useState('https://maps.app.goo.gl/selloschacaito');
  const [reviewIncentive, setReviewIncentive] = useState('5% de descuento en tu próxima compra o recarga de tinta');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestoreDB, 'config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTasa(data.tasa_actual?.toString() || '');
        setMayorista(data.multiplicador_mayorista?.toString() || '0.80');
        if (data.google_reviews_link) setGoogleReviewLink(data.google_reviews_link);
        if (data.review_incentive) setReviewIncentive(data.review_incentive);
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
        google_reviews_link: googleReviewLink.trim(),
        review_incentive: reviewIncentive.trim(),
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

  const [isExporting, setIsExporting] = useState(false);

  // 💾 EXPORTACIÓN TOTAL Y RESPALDO EN 1 CLIC (EXCEL .XLSX)
  const handleDownloadBackupExcel = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Extrayendo datos de la base de datos y preparando archivo Excel...');
    try {
      // 1. Obtener todas las órdenes de Firebase RTDB
      const ordersSnap = await rtdbGet(rtdbRef(db, 'orders'));
      const ordersRaw = ordersSnap.val() || {};
      const ordersList = Object.entries(ordersRaw).map(([id, o]) => ({ id, ...(o || {}) }));

      // Formatear Hoja 1: Ventas y Pedidos
      const ordersData = ordersList.map(o => {
        const itemsSummary = (o.cart || o.items || []).map(it => `${it.cantidad || 1}x ${it.nombre || it.name || 'Sello'}`).join('; ');
        return {
          'Nro Orden': o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(-5)}`,
          'Fecha': o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-VE') : '',
          'Hora': o.createdAt ? new Date(o.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '',
          'Cliente': (o.clientName || 'Sin Nombre').toUpperCase(),
          'RIF / Cédula': (o.clientRif || o.rif || o.cedula || '').toUpperCase(),
          'Teléfono WhatsApp': o.whatsapp || o.phone || '',
          'Asesor / Vendedor': (o.vendedor || o.createdBy || o.designer || '').toUpperCase(),
          'Total USD ($)': Number(o.totalAmount || 0),
          'Total Bs (Bs.)': Number(o.totalAmountBs || o.subtotalBs || 0),
          'Tasa BCV': Number(o.tasaBCV || o.rate || 0),
          'Método de Pago': o.paymentMethod || 'No especificado',
          'Referencia Pago': o.paymentRef || '',
          'Estado': o.status || 'desconocido',
          'Facturado Fiscal': o.isInvoiced ? 'SÍ' : 'NO',
          'Nro Factura Fiscal': o.invoiceNumber || '',
          'Detalle de Productos': itemsSummary || o.description || ''
        };
      });

      // 2. Obtener todos los clientes de Firestore
      const clientsSnap = await getDocs(collection(firestoreDB, 'clients'));
      const clientsData = clientsSnap.docs.map(d => {
        const c = d.data();
        return {
          'Nombre / Razón Social': (c.nombre || c.name || '').toUpperCase(),
          'RIF / Cédula': (c.rif || c.cedula || '').toUpperCase(),
          'Teléfono WhatsApp': c.whatsapp || c.telefono || '',
          'Dirección': (c.direccion || '').toUpperCase(),
          'Tipo de Cliente': (c.tipo || (c.isWholesale ? 'Mayorista' : 'Detal')).toUpperCase(),
          'Fecha Registro': c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-VE') : ''
        };
      });

      // 3. Obtener catálogo / inventario de Firestore
      const prodsSnap = await getDocs(collection(firestoreDB, 'products'));
      const prodsData = prodsSnap.docs.map(d => {
        const p = d.data();
        return {
          'Código': p.codigo || '',
          'Producto': (p.nombre || p.name || '').toUpperCase(),
          'Categoría': (p.categoria || 'GENERAL').toUpperCase(),
          'Costo USD ($)': Number(p.costo || 0),
          'Precio Detal USD ($)': Number(p.precio || p.price || 0),
          'Precio Mayorista USD ($)': Number(p.precioMayorista || 0),
          'Stock Actual': Number(p.cantidad || 0),
          'Stock Mínimo': Number(p.minStock || 5),
          'Activo en Mostrador': p.activo !== false ? 'SÍ' : 'NO'
        };
      });

      // 4. Crear Libro de Trabajo Excel Multi-Hojas
      const wb = XLSX.utils.book_new();
      
      const wsOrders = XLSX.utils.json_to_sheet(ordersData);
      const wsClients = XLSX.utils.json_to_sheet(clientsData);
      const wsProds = XLSX.utils.json_to_sheet(prodsData);

      XLSX.utils.book_append_sheet(wb, wsOrders, "Ventas y Pedidos");
      XLSX.utils.book_append_sheet(wb, wsClients, "Directorio Clientes");
      XLSX.utils.book_append_sheet(wb, wsProds, "Inventario y Precios");

      const todayStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Respaldo_Sellos_Chacaito_${todayStr}.xlsx`);

      toast.success('¡Respaldo completo descargado exitosamente en Excel (.xlsx)!', { id: toastId });
    } catch (err) {
      console.error('Error al exportar respaldo en Excel:', err);
      toast.error('Error al generar archivo Excel', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Remover el loader bloqueante
  // if (loading) {
  //   return <div style={{ padding: '2rem' }}>Cargando configuración...</div>;
  const isAlvaro = !activeProfile || activeProfile?.name?.toLowerCase().includes('alvaro');

  const handlePublishUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!newVersionInput.trim() || !newTitleInput.trim()) {
      toast.error('Ingresa el número de versión (ej. 2.6.0) y el título de la actualización');
      return;
    }

    setIsPublishing(true);
    const bullets = newHighlightsInput
      .split('\n')
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const success = await publishUpdate({
      version: newVersionInput.trim(),
      title: newTitleInput.trim(),
      highlights: bullets.length > 0 ? bullets : [newTitleInput.trim()],
      author: activeProfile?.name || 'Alvaro'
    });

    if (success) {
      setNewVersionInput('');
      setNewTitleInput('');
      setNewHighlightsInput('');
    }
    setIsPublishing(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 20px 80px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 28px',
        marginBottom: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar} 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            title="Abrir menú lateral"
            type="button"
          >
            <PanelLeft size={18} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Configuración del Sistema
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>
            Control de versiones en tiempo real, tasa de cambio oficial, márgenes de mayorista y herramientas.
          </p>
        </div>
      </div>

      {/* 🚀 SECCIÓN 1: CENTRO DE ACTUALIZACIONES INTELIGENTE */}
      <div style={{
        background: hasUpdate ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : '#ffffff',
        border: hasUpdate ? '2px solid #60a5fa' : '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: hasUpdate ? '0 8px 24px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: hasUpdate ? '#2563eb' : '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hasUpdate ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}>
              {hasUpdate ? <Sparkles size={24} /> : <ShieldCheck size={24} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Estado de Actualizaciones del Sistema
                </h3>
                <span style={{
                  background: hasUpdate ? '#2563eb' : '#10b981',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {hasUpdate ? `⚡ ${pendingUpdates.length} actualización${pendingUpdates.length === 1 ? '' : 'es'} acumulada${pendingUpdates.length === 1 ? '' : 's'}` : '✓ Sistema al día'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                Versión instalada en este equipo: <strong style={{ color: '#0f172a' }}>v{localVersionName}</strong> · Última versión disponible: <strong style={{ color: hasUpdate ? '#2563eb' : '#10b981' }}>v{latestVersionName}</strong>
              </p>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <button
            type="button"
            onClick={openUpdateModal}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: hasUpdate ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#0f172a',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: hasUpdate ? '0 4px 14px rgba(37, 99, 235, 0.35)' : '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={16} />
            <span>{hasUpdate ? '🚀 Ver Novedades & Actualizar Ahora' : '🔄 Centro de Actualizaciones'}</span>
          </button>
        </div>

        {hasUpdate && (
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ fontSize: '12.5px', color: '#1e40af', lineHeight: 1.4 }}>
              <strong>Hay mejoras y funciones acumuladas listas para instalar.</strong> Al presionar Actualizar, el sistema descargará los nuevos módulos y limpiará automáticamente la caché sin necesidad de usar <code>Ctrl + F5</code>.
            </div>
            <button
              type="button"
              onClick={openUpdateModal}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Instalar v{latestVersionName}
            </button>
          </div>
        )}
      </div>

      {/* 📢 SECCIÓN 2: PANEL DE PUBLICACIÓN DE VERSIONES (EXCLUSIVO PARA ÁLVARO) */}
      {isAlvaro && (
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fef3c7', color: '#d97706', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                  📢 Publicar Nueva Actualización (Panel de Álvaro)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Redacta una nueva nota de versión para que le aparezca automáticamente a todos los dispositivos en tiempo real.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
              Exclusivo Administrador
            </span>
          </div>

          <form onSubmit={handlePublishUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  Número de Versión *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: 2.6.0" 
                  value={newVersionInput} 
                  onChange={e => setNewVersionInput(e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  Título de la Actualización *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Cuentas Acumuladas & Selector de Diseñador" 
                  value={newTitleInput} 
                  onChange={e => setNewTitleInput(e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                Lista de Novedades y Mejoras (1 por línea)
              </label>
              <textarea 
                rows={3}
                placeholder="• Módulo de Cuentas Acumuladas en Facturación&#10;• Selector de Diseñador en Nueva Venta&#10;• Sincronización de fotos terminadas"
                value={newHighlightsInput}
                onChange={e => setNewHighlightsInput(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isPublishing}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isPublishing ? '#94a3b8' : '#d97706',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isPublishing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)'
                }}
              >
                <Send size={15} />
                <span>{isPublishing ? 'Publicando...' : 'Publicar Actualización a Todos'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSave} style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        
        {/* Tasa BCV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
            Tasa BCV del día (Bs.) *
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="number" 
              step="0.0001"
              min="0"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              placeholder="Ej. 36.4521"
              required 
              style={{
                maxWidth: '220px',
                height: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Esta tasa se guardará en los nuevos pedidos al momento de crearlos.</p>
        </div>

        {/* Multiplicador Mayorista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
            Multiplicador Mayorista *
          </label>
          <input 
            type="number" 
            step="0.01"
            min="0"
            max="1"
            value={mayorista}
            onChange={(e) => setMayorista(e.target.value)}
            placeholder="Ej. 0.80"
            required 
            style={{
              maxWidth: '220px',
              height: '44px',
              padding: '0 14px',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none'
            }}
          />
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>0.80 significa que los mayoristas pagan el 80% del precio normal (20% descuento implícito).</p>
        </div>

        {/* ⭐ Automatización de Reseñas de Google Maps */}
        <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⭐ Automatización de Reseñas en Google Maps
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
            Configura el enlace y el incentivo para que el Bot de WhatsApp invite al cliente a dejar una reseña cuando su pedido sea marcado como <b>Entregado</b>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Enlace a Google Maps / Reseñas de tu negocio
            </label>
            <input 
              type="url" 
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              style={{
                maxWidth: '520px',
                height: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Texto del Incentivo ofrecido al cliente
            </label>
            <input 
              type="text" 
              value={reviewIncentive}
              onChange={(e) => setReviewIncentive(e.target.value)}
              placeholder="Ej. 5% de descuento en tu próxima compra o recarga de tinta"
              style={{
                maxWidth: '520px',
                height: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            type="submit" 
            disabled={saving} 
            style={{
              padding: '12px 28px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button 
            type="button" 
            onClick={handleMigrateSchema} 
            style={{
              padding: '12px 20px',
              background: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            [ADMIN] Migrar Base de Datos
          </button>
        </div>

      </form>

      {/* 💾 CENTRO DE RESPALDOS Y EXPORTACIÓN TOTAL EN 1 CLIC */}
      <div style={{
        marginTop: '24px',
        padding: '24px 28px',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#ecfdf5', color: '#10b981', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                💾 Centro de Respaldos & Exportación en Excel (1 Clic)
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Descarga una copia de seguridad física a tu computadora con todas las ventas, directorio de clientes e inventario.
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            Formato Universal .XLSX
          </span>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          <div>
            <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
              📑 Hoja 1: Ventas y Pedidos
            </strong>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Nro orden, fechas, cliente, total $, total Bs, método de pago, estatus y facturas fiscales.
            </span>
          </div>

          <div>
            <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
              👥 Hoja 2: Directorio de Clientes
            </strong>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Nombres, RIF, números de WhatsApp, direcciones y clasificación mayorista.
            </span>
          </div>

          <div>
            <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
              📦 Hoja 3: Inventario y Precios
            </strong>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Modelos de sellos, categorías, costos, precios al detal y mayor, y existencias.
            </span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleDownloadBackupExcel}
            disabled={isExporting}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            <Download size={18} />
            <span>{isExporting ? 'Generando archivo Excel...' : '📥 Descargar Respaldo Completo en Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Web 1-Click Integration Panel */}
      <div style={{
        marginTop: '24px',
        padding: '24px 28px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#25D366', color: '#fff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>⚡ Botón 1-Clic para WhatsApp Web</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Crea tarjetas en "Diseño Enviado" al instante mientras chateas en web.whatsapp.com
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(37, 211, 102, 0.08)', border: '1px solid #25D366', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#15803d' }}>
            📌 ¿Cómo instalar el botón en tu navegador (Chrome / Edge / Firefox)?
          </div>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
            <li>Asegúrate de tener visible la <b>Barra de Marcadores/Favoritos</b> en tu navegador (Ctrl + Mayús + B).</li>
            <li>Arrastra el botón verde de abajo directamente a tu <b>Barra de Marcadores</b> (o hazle clic derecho ➔ Añadir a marcadores).</li>
            <li>¡Listo! En <b>WhatsApp Web</b>, cuando hables con un cliente, presiona ese marcador y creará la orden en 1 segundo en <b>Diseño Enviado</b>.</li>
          </ol>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Draggable Bookmarklet Button */}
            <a 
              href={`javascript:(function(){try{var h=document.querySelector('header');if(!h){alert('Abre WhatsApp Web (web.whatsapp.com) y selecciona el chat del cliente antes de presionar este botón.');return;}var n='';var t=h.querySelector('span[title]')||h.querySelector('[role="button"] span')||h.querySelector('h2');if(t)n=t.getAttribute('title')||t.innerText||'';var p=(n||'').replace(/[^\\d]/g,'');var m='';var msgs=document.querySelectorAll('div.message-in span.selectable-text, div.message-out span.selectable-text');if(msgs.length>0)m=msgs[msgs.length-1].innerText||'';var u='https://seguimiento-sellos-chacaito.web.app/?autoAdd=1&name='+encodeURIComponent(n||'Cliente WhatsApp')+'&phone='+encodeURIComponent(p)+'&msg='+encodeURIComponent(m);var w=window.open(u,'sc_auto','width=450,height=300,top=100,left=100');if(!w)alert('Por favor permite las ventanas emergentes (popups) para WhatsApp Web en tu navegador.');}catch(e){alert('Error al leer el chat.');}})();`}
              onClick={(e) => e.preventDefault()}
              style={{
                background: '#25D366',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.9rem',
                padding: '10px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                cursor: 'grab',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
              title="Arrastra este botón a tu barra de marcadores"
            >
              ➕ Crear Pedido SC (Arrastrar a Marcadores)
            </a>

            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                const code = `javascript:(function(){try{var h=document.querySelector('header');if(!h){alert('Abre WhatsApp Web (web.whatsapp.com) y selecciona el chat del cliente antes de presionar este botón.');return;}var n='';var t=h.querySelector('span[title]')||h.querySelector('[role="button"] span')||h.querySelector('h2');if(t)n=t.getAttribute('title')||t.innerText||'';var p=(n||'').replace(/[^\\d]/g,'');var m='';var msgs=document.querySelectorAll('div.message-in span.selectable-text, div.message-out span.selectable-text');if(msgs.length>0)m=msgs[msgs.length-1].innerText||'';var u='https://seguimiento-sellos-chacaito.web.app/?autoAdd=1&name='+encodeURIComponent(n||'Cliente WhatsApp')+'&phone='+encodeURIComponent(p)+'&msg='+encodeURIComponent(m);var w=window.open(u,'sc_auto','width=450,height=300,top=100,left=100');if(!w)alert('Por favor permite las ventanas emergentes (popups) para WhatsApp Web en tu navegador.');}catch(e){alert('Error al leer el chat.');}})();`;
                navigator.clipboard.writeText(code);
                toast.success('Código del Marcador copiado al portapapeles');
              }}
            >
              Copiar Código del Marcador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Config;
