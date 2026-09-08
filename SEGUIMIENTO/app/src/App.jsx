import React, { useEffect, Suspense, lazy } from 'react';
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
import CalculadoraSellosMadera from './pages/CalculadoraSellosMadera';
import Reportes from './pages/Reportes';
import BaseDeDatos from './pages/BaseDeDatos';
import Utilidades from './pages/Utilidades';
import Configuracion from './pages/Configuracion';
import VerGuia from './pages/VerGuia';
import VerOrden from './pages/VerOrden';
import DeliveryView from './pages/DeliveryView';
import PaymentView from './pages/PaymentView';
import VerRecibo from './pages/VerRecibo';
import CatalogoPublico from './pages/CatalogoPublico';
import AdminOnlyRoute from './components/AdminOnlyRoute';
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
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

                <Route path="facturacion" element={<Facturacion />} />

                {/* Reportes: Ventas + Estadísticas (Estadísticas solo Álvaro) */}
                <Route path="reportes" element={<Reportes />}>
                  <Route index element={<Navigate to="ventas" replace />} />
                  <Route path="ventas" element={<Ventas />} />
                  <Route path="estadisticas" element={
                    <AdminOnlyRoute>
                      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando estadísticas...</div>}>
                        <Estadisticas />
                      </Suspense>
                    </AdminOnlyRoute>
                  } />
                </Route>

                {/* Base de Datos: Clientes + Inventario */}
                <Route path="base-de-datos" element={<BaseDeDatos />}>
                  <Route index element={<Navigate to="clientes" replace />} />
                  <Route path="clientes" element={<Clients isModal={true} />} />
                  <Route path="inventario" element={<Inventory />} />
                </Route>

                {/* Utilidades: Cambio + Presupuestos + Herramientas + Sellos de Madera */}
                <Route path="utilidades" element={<Utilidades />}>
                  <Route index element={<Navigate to="cambio" replace />} />
                  <Route path="cambio" element={<Calculator isEmbedded={true} />} />
                  <Route path="presupuestos" element={<Presupuestos />} />
                  <Route path="herramientas" element={<Herramientas />} />
                  <Route path="sellos-madera" element={<CalculadoraSellosMadera />} />
                </Route>

                {/* Configuración: Configuración general + Usuarios (Usuarios solo Álvaro) */}
                <Route path="configuracion" element={<Configuracion />}>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<Config />} />
                  <Route path="usuarios" element={<AdminOnlyRoute><ProfileAdmin /></AdminOnlyRoute>} />
                </Route>

                {/* Compatibilidad: rutas viejas redirigen a su nueva ubicación */}
                <Route path="ventas" element={<Navigate to="/reportes/ventas" replace />} />
                <Route path="estadisticas" element={<Navigate to="/reportes/estadisticas" replace />} />
                <Route path="clientes" element={<Navigate to="/base-de-datos/clientes" replace />} />
                <Route path="productos" element={<Navigate to="/base-de-datos/inventario" replace />} />
                <Route path="inventario" element={<Navigate to="/base-de-datos/inventario" replace />} />
                <Route path="cambio" element={<Navigate to="/utilidades/cambio" replace />} />
                <Route path="presupuestos" element={<Navigate to="/utilidades/presupuestos" replace />} />
                <Route path="herramientas" element={<Navigate to="/utilidades/herramientas" replace />} />
                <Route path="sellos-madera" element={<Navigate to="/utilidades/sellos-madera" replace />} />
                <Route path="costos" element={<Navigate to="/utilidades/herramientas?tab=costos" replace />} />
                <Route path="retenciones" element={<Navigate to="/utilidades/herramientas?tab=retenciones" replace />} />
                <Route path="usuarios" element={<Navigate to="/configuracion/usuarios" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
