import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Config from './pages/Config';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Receipts from './pages/Receipts';
import Marketing from './pages/Marketing';
import Calculator from './pages/Calculator';
import Texto from './pages/Texto';
import Retenciones from './pages/Retenciones';
import Presupuestos from './pages/Presupuestos';
import Costos from './pages/Costos';
import VerGuia from './pages/VerGuia';
import VerOrden from './pages/VerOrden';
import DeliveryView from './pages/DeliveryView';
import PaymentView from './pages/PaymentView';
import VerRecibo from './pages/VerRecibo';
import { db } from './firebase/config';
import { ref, set } from 'firebase/database';

function AutoAddHandler() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('autoAdd') === '1') {
      const name = searchParams.get('name') || 'Cliente WhatsApp';
      const phone = searchParams.get('phone') || '';
      const msg = searchParams.get('msg') || 'Pedido creado desde WhatsApp Web';

      const orderId = `order_${Date.now()}`;
      const payload = {
        clientName: name.toUpperCase(),
        whatsapp: phone,
        details: msg,
        status: 'design_sent',
        statusId: 'design_sent',
        requiresDesign: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      set(ref(db, `orders/${orderId}`), payload)
        .then(() => {
          toast.success(`¡Pedido de ${name} registrado en Diseño Enviado!`, { duration: 3000 });
          setTimeout(() => {
            if (window.opener || window.history.length > 1) {
              window.close();
            }
          }, 1500);
        })
        .catch(err => {
          console.error(err);
          toast.error('Error al registrar pedido');
        });
    }
  }, [searchParams]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AutoAddHandler />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/guia/:orderId" element={<VerGuia />} />
          <Route path="/orden/:orderId" element={<VerOrden />} />
          <Route path="/delivery/:orderId" element={<DeliveryView />} />
          <Route path="/pagar" element={<PaymentView />} />
          <Route path="/ver-recibo" element={<VerRecibo />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            {/* The main Kanban is the dashboard index for now */}
            <Route index element={<Dashboard />} />
            
            <Route path="recibos" element={<Receipts />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="productos" element={<Products />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="cambio" element={<Calculator />} />
            <Route path="costos" element={<Costos />} />
            <Route path="texto" element={<Texto />} />
            <Route path="retenciones" element={<Retenciones />} />
            <Route path="presupuestos" element={<Presupuestos />} />
            <Route path="configuracion" element={<Config />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
