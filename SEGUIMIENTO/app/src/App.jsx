import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import ProfileRoute from './components/ProfileRoute';
import ProfileAdmin from './pages/ProfileAdmin';
import { Toaster, toast } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Config from './pages/Config';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Clients from './pages/Clients';
import Calculator from './pages/Calculator';
import Retenciones from './pages/Retenciones';
import Presupuestos from './pages/Presupuestos';
import Costos from './pages/Costos';
import Ventas from './pages/Ventas';
import Facturacion from './pages/Facturacion';
import Herramientas from './pages/Herramientas';
import VerGuia from './pages/VerGuia';
import VerOrden from './pages/VerOrden';
import DeliveryView from './pages/DeliveryView';
import PaymentView from './pages/PaymentView';
import VerRecibo from './pages/VerRecibo';
import CatalogoPublico from './pages/CatalogoPublico';
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
          toast.success(`¡Pedido de ${name} registrado en Iniciando Pedido!`, { duration: 3000 });
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
      <ProfileProvider>
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
              <Route path="/catalogo" element={<CatalogoPublico />} />
              
              <Route path="/" element={<PrivateRoute><ProfileRoute><Layout /></ProfileRoute></PrivateRoute>}>
                {/* The main Kanban is the dashboard index for now */}
                <Route index element={<Dashboard />} />
                
                <Route path="ventas" element={<Ventas />} />
                <Route path="facturacion" element={<Facturacion />} />
                <Route path="herramientas" element={<Herramientas />} />
                <Route path="clientes" element={<Clients />} />
                <Route path="productos" element={<Navigate to="/inventario" replace />} />
                <Route path="inventario" element={<Inventory />} />
                <Route path="presupuestos" element={<Presupuestos />} />
                <Route path="costos" element={<Navigate to="/herramientas?tab=costos" replace />} />
                <Route path="retenciones" element={<Navigate to="/herramientas?tab=retenciones" replace />} />
                <Route path="cambio" element={<Calculator />} />
                <Route path="configuracion" element={<Config />} />
                <Route path="usuarios" element={<ProfileAdmin />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
