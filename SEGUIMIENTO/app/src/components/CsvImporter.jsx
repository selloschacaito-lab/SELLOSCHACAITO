import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Users, Tag, Receipt } from 'lucide-react';
import { firestoreDB, db } from '../firebase/config';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { ref, update, set } from 'firebase/database';
import { normalizeWhatsApp } from '../utils/formatters';
import { toast } from 'react-hot-toast';

function parseCSV(text) {
  const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  
  // Find real header line (skips summary tables if any)
  let headerLineIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const l = lines[i].toLowerCase();
    if ((l.includes('pedido') && l.includes('cliente')) || 
        (l.includes('nombre') && (l.includes('rif') || l.includes('whatsapp') || l.includes('telefono') || l.includes('precio') || l.includes('costo')))) {
      headerLineIndex = i;
      break;
    }
  }

  const headerLine = lines[headerLineIndex];
  const separator = headerLine.includes(';') ? ';' : ',';
  
  const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  
  const rows = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const rawCols = lines[i].split(separator);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = rawCols[idx] ? rawCols[idx].trim().replace(/^["']|["']$/g, '') : '';
    });
    rows.push(row);
  }
  return rows;
}

export default function CsvImporter() {
  const [importingType, setImportingType] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importProgress, setImportProgress] = useState(0);

  // 1. IMPORT CLIENTS
  const handleImportClients = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportingType('clients');
    setImportStats(null);
    setImportProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(arrayBuffer);
      } catch (e) {
        const ansiDecoder = new TextDecoder('windows-1252');
        text = ansiDecoder.decode(arrayBuffer);
      }
      
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('El archivo CSV está vacío');

      let added = 0;
      const nowISO = new Date().toISOString();
      const BATCH_SIZE = 450;
      let batch = writeBatch(firestoreDB);
      let opCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nombre = (row.nombre || row.name || row.cliente || '').toUpperCase();
        if (!nombre) continue;

        const rif = (row.rif || row.cedula || row.ci || '').toUpperCase();
        const rawPhone = row.whatsapp || row.telefono || row.phone || '';
        const whatsapp = normalizeWhatsApp(rawPhone);
        const direccion = row.direccion || row.address || '';
        const correo = row.correo || row.email || '';

        // Columnas de analisis e historial
        const productoMasComprado = row['producto mas comprado'] || row.producto || '';
        const ultimaOrden = row['ultima orden'] || row.fecha || '';
        const ordenesTotales = parseInt(row['ordenes totales'] || row.pedidos || '0') || 0;
        const totalGastado = parseFloat(row['total gastado'] || row.monto || '0') || 0;
        const ticketPromedio = parseFloat(row['ticket promedio'] || row.promedio || '0') || 0;
        const numeroCliente = row['cliente'] || row['numero de cliente'] || row.id || '';

        const newDocRef = doc(collection(firestoreDB, 'clients'));
        batch.set(newDocRef, {
          nombre,
          rif,
          whatsapp,
          direccion,
          correo,
          tipo: 'normal',
          productoMasComprado,
          ultimaOrden,
          ordenesTotales,
          totalGastado,
          ticketPromedio,
          numeroCliente,
          createdAt: nowISO,
          updatedAt: nowISO
        });
        
        added++;
        opCount++;

        if (opCount >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(firestoreDB);
          opCount = 0;
          setImportProgress(Math.round((i / rows.length) * 100));
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }
      
      setImportProgress(100);
      setImportStats({ type: 'Clientes', count: added });
      toast.success(`¡${added} clientes importados con éxito!`);
    } catch (err) {
      console.error(err);
      toast.error(`Error al importar clientes: ${err.message}`);
    } finally {
      setImportingType(null);
      setImportProgress(0);
      e.target.value = '';
    }
  };

  // 2. IMPORT PRODUCTS
  const handleImportProducts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingType('products');
    setImportStats(null);
    setImportProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(arrayBuffer);
      } catch (e) {
        const ansiDecoder = new TextDecoder('windows-1252');
        text = ansiDecoder.decode(arrayBuffer);
      }
      
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('El archivo CSV está vacío');

      let added = 0;
      const nowISO = new Date().toISOString();
      const BATCH_SIZE = 450;
      let batch = writeBatch(firestoreDB);
      let opCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nombre = row.nombre || row.name || row.producto || row.descripcion || '';
        if (!nombre) continue;

        const categoria = row.categoria || row.category || 'Sellos';
        const tipo = (row.tipo || 'Producto').toLowerCase().includes('serv') ? 'Servicio' : 'Producto';
        const rawCosto = row.costo || row.cost || row['costo interno'] || row.costo_interno || '0';
        const cleanCosto = typeof rawCosto === 'string' ? rawCosto.replace(/[^0-9.,]/g, '').replace(',', '.') : rawCosto;
        const costo = parseFloat(cleanCosto) || 0;

        const rawPrecio = row.precio || row.price || row.precio_venta || row['precio de venta'] || row['precio venta'] || row['precio publico'] || row['precio público'] || row.pvp || row['p. venta'] || row.monto || '0';
        const cleanPrecio = typeof rawPrecio === 'string' ? rawPrecio.replace(/[^0-9.,]/g, '').replace(',', '.') : rawPrecio;
        const precio = parseFloat(cleanPrecio) || 0;

        const cantidad = parseInt(row.cantidad || row.stock || row.qty || '10') || 10;

        const newDocRef = doc(collection(firestoreDB, 'products'));
        batch.set(newDocRef, {
          nombre,
          categoria,
          tipo,
          costo,
          precio,
          cantidad,
          createdAt: nowISO,
          updatedAt: nowISO
        });
        
        added++;
        opCount++;

        if (opCount >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(firestoreDB);
          opCount = 0;
          setImportProgress(Math.round((i / rows.length) * 100));
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }
      
      setImportProgress(100);

      setImportStats({ type: 'Productos', count: added });
      toast.success(`¡${added} productos importados al catálogo!`);
    } catch (err) {
      console.error(err);
      toast.error(`Error al importar productos: ${err.message}`);
    } finally {
      setImportingType(null);
      setImportProgress(0);
      e.target.value = '';
    }
  };

  // 3. IMPORT HISTORICAL SALES
  const handleImportSales = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingType('sales');
    setImportStats(null);
    setImportProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        text = utf8Decoder.decode(arrayBuffer);
      } catch (e) {
        const ansiDecoder = new TextDecoder('windows-1252');
        text = ansiDecoder.decode(arrayBuffer);
      }
      
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('El archivo CSV está vacío');

      let added = 0;
      const CHUNK_SIZE = 200;
      let currentBatch = {};
      let currentBatchCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const clientName = (row.clientname || row.cliente || row.nombre || row['nombre del cliente'] || row['razon social'] || 'Cliente Histórico').toUpperCase();
        
        const rawOrderNumber = row.ordernumber || row['n° orden'] || row['nro orden'] || row['numero de orden'] || row['nro'] || row['n°'] || row.numero || row.orden || '';
        const orderNumber = rawOrderNumber ? rawOrderNumber.toString().replace(/[^0-9a-zA-Z\-_]/g, '').trim() : `${i + 1000}`;

        const rawUsd = row.totalamount || row.total_usd || row['total usd'] || row['monto usd'] || row.monto_usd || row.total || row.monto || '0';
        const cleanUsd = typeof rawUsd === 'string' ? rawUsd.replace(/[^0-9.,]/g, '').replace(',', '.') : rawUsd;
        const totalAmount = parseFloat(cleanUsd) || 0;

        const rawBs = row.totalamountbs || row.total_bs || row['total bs'] || row['monto bs'] || row.monto_bs || '0';
        const cleanBs = typeof rawBs === 'string' ? rawBs.replace(/[^0-9.,]/g, '').replace(',', '.') : rawBs;
        const totalAmountBs = parseFloat(cleanBs) || 0;

        const rawDate = row.createdat || row.fecha || row.date || '';
        let createdAt = new Date().toISOString();
        if (rawDate) {
          const trimmedDate = rawDate.toString().trim();
          const dmyMatch = trimmedDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(.*)$/);
          if (dmyMatch) {
            let [_, day, month, year, rest] = dmyMatch;
            if (year.length === 2) year = '20' + year;
            day = day.padStart(2, '0');
            month = month.padStart(2, '0');
            const timeStr = rest.trim();
            if (timeStr && timeStr.includes(':')) {
              const parts = timeStr.split(':');
              const h = (parts[0] || '12').padStart(2, '0');
              const m = (parts[1] || '00').padStart(2, '0');
              createdAt = `${year}-${month}-${day}T${h}:${m}:00Z`;
            } else {
              createdAt = `${year}-${month}-${day}T12:00:00Z`;
            }
          } else {
            const parsed = new Date(trimmedDate);
            if (!isNaN(parsed.getTime())) createdAt = parsed.toISOString();
          }
        }

        const orderId = `hist_${Date.now()}_${i}`;
        currentBatch[`orders/${orderId}`] = {
          id: orderId,
          orderNumber,
          clientName,
          totalAmount,
          totalAmountBs,
          status: 'delivered',
          statusId: 'delivered',
          hasFinaReceipt: true,
          requiresDesign: false,
          isHistorical: true,
          createdAt,
          updatedAt: createdAt
        };
        
        added++;
        currentBatchCount++;

        if (currentBatchCount >= CHUNK_SIZE) {
          await update(ref(db), currentBatch);
          currentBatch = {};
          currentBatchCount = 0;
          setImportProgress(Math.round((i / rows.length) * 100));
        }
      }

      if (currentBatchCount > 0) {
        await update(ref(db), currentBatch);
      }

      setImportProgress(100);
      setImportStats({ type: 'Ventas Históricas', count: added });
      toast.success(`¡${added} ventas históricas añadidas al sistema!`);
    } catch (err) {
      console.error(err);
      toast.error(`Error al importar ventas: ${err.message}`);
    } finally {
      setImportingType(null);
      setImportProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>
          📥 Importador Masivo de Datos (Desde Excel / CSV)
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Exporta tus listas de Excel como archivo <strong>.CSV (delimitado por comas)</strong> y súbelas aquí para sincronizar todo tu negocio en un instante.
        </p>
      </div>

      {importStats && (
        <div style={{
          background: 'rgba(71, 255, 0, 0.1)',
          border: '1px solid var(--primary)',
          borderRadius: '0.75rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} color="#16a34a" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            Última importación exitosa: {importStats.count} registros en <strong>{importStats.type}</strong>.
          </span>
        </div>
      )}

      {/* Grid of Importers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. Clientes */}
        <div className="glass-card" style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: '#dbeafe', color: '#2563eb', padding: '6px', borderRadius: '8px' }}>
                <Users size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Importar Clientes</h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Columnas recomendadas en Excel: <br />
              <code>nombre, rif, whatsapp, direccion</code>
            </p>
          </div>

          <label style={{
            background: importingType === 'clients' ? '#e2e8f0' : importStats?.type === 'Clientes' ? '#dcfce7' : 'var(--surface-hover)',
            border: '1.5px dashed var(--border-strong)',
            borderColor: importStats?.type === 'Clientes' ? '#16a34a' : 'var(--border-strong)',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
            cursor: importingType ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}>
            {importingType === 'clients' ? (
              <RefreshCw size={20} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            ) : importStats?.type === 'Clientes' ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <Upload size={20} color="var(--primary)" />
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: importStats?.type === 'Clientes' ? '#16a34a' : 'inherit' }}>
              {importingType === 'clients' 
                ? `Importando... ${importProgress}%` 
                : importStats?.type === 'Clientes' 
                  ? 'Subida finalizada correctamente' 
                  : 'Subir CSV de Clientes'}
            </span>
            {importingType === 'clients' && (
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#16a34a', width: `${importProgress}%`, transition: 'width 0.3s' }} />
              </div>
            )}
            <input 
              type="file" 
              accept=".csv" 
              disabled={Boolean(importingType)}
              onChange={handleImportClients} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* 2. Productos */}
        <div className="glass-card" style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px' }}>
                <Tag size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Importar Catálogo</h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Columnas recomendadas en Excel: <br />
              <code>nombre, categoria, precio, costo, cantidad</code>
            </p>
          </div>

          <label style={{
            background: importingType === 'products' ? '#e2e8f0' : importStats?.type === 'Productos' ? '#fef3c7' : 'var(--surface-hover)',
            border: '1.5px dashed var(--border-strong)',
            borderColor: importStats?.type === 'Productos' ? '#d97706' : 'var(--border-strong)',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
            cursor: importingType ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}>
            {importingType === 'products' ? (
              <RefreshCw size={20} color="#d97706" style={{ animation: 'spin 1s linear infinite' }} />
            ) : importStats?.type === 'Productos' ? (
              <CheckCircle size={20} color="#d97706" />
            ) : (
              <Upload size={20} color="#d97706" />
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: importStats?.type === 'Productos' ? '#d97706' : 'inherit' }}>
              {importingType === 'products' 
                ? `Importando... ${importProgress}%` 
                : importStats?.type === 'Productos' 
                  ? 'Subida finalizada correctamente' 
                  : 'Subir CSV de Productos'}
            </span>
            {importingType === 'products' && (
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#d97706', width: `${importProgress}%`, transition: 'width 0.3s' }} />
              </div>
            )}
            <input 
              type="file" 
              accept=".csv" 
              disabled={Boolean(importingType)}
              onChange={handleImportProducts} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        {/* 3. Ventas Históricas */}
        <div className="glass-card" style={{
          padding: '1.25rem',
          borderRadius: '1rem',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
                <Receipt size={18} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Importar Ventas Previas</h4>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Columnas recomendadas en Excel: <br />
              <code>cliente, total_usd, total_bs, fecha</code>
            </p>
          </div>

          <label style={{
            background: importingType === 'sales' ? '#e2e8f0' : importStats?.type === 'Ventas Históricas' ? '#dcfce7' : 'var(--surface-hover)',
            border: '1.5px dashed var(--border-strong)',
            borderColor: importStats?.type === 'Ventas Históricas' ? '#16a34a' : 'var(--border-strong)',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center',
            cursor: importingType ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}>
            {importingType === 'sales' ? (
              <RefreshCw size={20} color="#16a34a" style={{ animation: 'spin 1s linear infinite' }} />
            ) : importStats?.type === 'Ventas Históricas' ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <Upload size={20} color="#16a34a" />
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: importStats?.type === 'Ventas Históricas' ? '#16a34a' : 'inherit' }}>
              {importingType === 'sales' 
                ? `Importando... ${importProgress}%` 
                : importStats?.type === 'Ventas Históricas' 
                  ? 'Subida finalizada correctamente' 
                  : 'Subir CSV de Ventas'}
            </span>
            {importingType === 'sales' && (
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#16a34a', width: `${importProgress}%`, transition: 'width 0.3s' }} />
              </div>
            )}
            <input 
              type="file" 
              accept=".csv" 
              disabled={Boolean(importingType)}
              onChange={handleImportSales} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

      </div>
    </div>
  );
}
