import React, { useEffect, useState } from 'react';
import { db, firestoreDB } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, TrendingUp, Users, Copy, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Marketing() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    topProducts: [],
    topClients: []
  });
  const [clientsWithWa, setClientsWithWa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar pedidos
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const ordersList = Object.values(data);
      
      let revenue = 0;
      const productCounts = {};
      const clientSpends = {};

      ordersList.forEach(order => {
        revenue += (order.totalAmount || 0);
        
        // Sumar productos
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const qty = parseInt(item.quantity) || 1;
            productCounts[item.name] = (productCounts[item.name] || 0) + qty;
          });
        }

        // Sumar clientes
        if (order.clientName) {
          clientSpends[order.clientName] = (clientSpends[order.clientName] || 0) + (order.totalAmount || 0);
        }
      });

      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));

      const topClients = Object.entries(clientSpends)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, total]) => ({ name, total }));

      setStats({
        totalRevenue: revenue,
        topProducts,
        topClients
      });
    });

    // Cargar clientes con whatsapp
    const fetchClients = async () => {
      try {
        const snap = await getDocs(collection(firestoreDB, 'clients'));
        const wpClients = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (d.whatsapp && String(d.whatsapp).trim().length >= 10) {
            wpClients.push({ id: doc.id, name: d.nombre, whatsapp: d.whatsapp });
          }
        });
        setClientsWithWa(wpClients);
      } catch (err) {
        console.error("Error cargando clientes para marketing", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();

    return () => unsubscribeOrders();
  }, []);

  const copyWpNumbers = () => {
    const numbers = clientsWithWa.map(c => c.whatsapp).join(', ');
    navigator.clipboard.writeText(numbers);
    toast.success('¡Números copiados al portapapeles!');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '0.75rem' }}>
          <PieChart size={24} color="#000" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Panel de Marketing y Estadísticas</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Analiza tus ventas y contacta a tus clientes</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Total Ingresos */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> Total Ventas Acumuladas
          </span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
            ${stats.totalRevenue.toFixed(2)}
          </span>
        </div>

        {/* Campañas de Difusión */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MessageSquare size={16} /> Difusión por WhatsApp
          </span>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
            Tienes <strong>{clientsWithWa.length}</strong> clientes registrados con un número de WhatsApp válido.
          </p>
          <button 
            className="btn-primary" 
            onClick={copyWpNumbers}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Copy size={16} /> Copiar Números para Envíos
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Productos */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Top 5 Productos Más Vendidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.topProducts.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{i+1}. {p.name}</span>
                <span style={{ background: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {p.qty} uds.
                </span>
              </div>
            ))}
            {stats.topProducts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay ventas registradas aún.</p>}
          </div>
        </div>

        {/* Mejores Clientes */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Top 5 Mejores Clientes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.topClients.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '0.5rem' }}>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} color="var(--text-muted)" /> {c.name}
                </span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>
                  ${c.total.toFixed(2)}
                </span>
              </div>
            ))}
            {stats.topClients.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay ventas registradas aún.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Marketing;
