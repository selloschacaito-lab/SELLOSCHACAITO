import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
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
import VerGuia from './pages/VerGuia';
import VerOrden from './pages/VerOrden';
import DeliveryView from './pages/DeliveryView';
import PaymentView from './pages/PaymentView';
import VerRecibo from './pages/VerRecibo';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
