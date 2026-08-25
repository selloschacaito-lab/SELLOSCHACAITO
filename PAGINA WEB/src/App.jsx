import React from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Contexts
import { WholesaleProvider } from './context/WholesaleContext';

// Páginas Públicas
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import HowToBuyPage from './pages/HowToBuyPage';
import ServicesPage from './pages/ServicesPage';
import FAQPage from './pages/FAQPage';
import PoliciesPage from './pages/PoliciesPage';
import ContactPage from './pages/ContactPage';
import ComparePage from './pages/ComparePage';
import WholesalePortal from './pages/WholesalePortal';
import ScrollToTop from './components/ScrollToTop';
import FloatingOrderBar from './components/FloatingOrderBar';

// Páginas Admin
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProductForm from './pages/admin/ProductForm';
import CategoryDashboard from './pages/admin/CategoryDashboard';
import CategoryForm from './pages/admin/CategoryForm';
import WholesaleManagement from './pages/admin/WholesaleManagement';

// Componente de Botón Flotante de WhatsApp
const WhatsAppFAB = () => (
  <a 
    href="https://wa.me/584241345488" 
    target="_blank" 
    rel="noopener noreferrer"
    id="global-whatsapp-fab"
    style={{
      position: 'fixed', bottom: '20px', right: '16px',
      backgroundColor: 'var(--color-whatsapp)', color: 'white',
      width: '48px', height: '48px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
      zIndex: 999, transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 211, 102, 0.5)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.35)'; }}
    title="Contáctanos por WhatsApp"
  >
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
  </a>
);

// Layout público para que Header y Footer envuelvan todas las páginas con transición suave
const PublicLayout = () => {
  const location = useLocation();
  return (
    <>
      <Header />
      <div key={location.pathname} className="page-transition-wrapper">
        <Outlet />
      </div>
      <Footer />
    </>
  );
};

function App() {
  return (
    <WholesaleProvider>
      <ScrollToTop />
      <FloatingOrderBar />
      <WhatsAppFAB />
      <Routes>
        {/* Rutas Privadas del Administrador */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={<Login />} />
          <Route index element={<Dashboard />} />
          <Route path="nuevo-producto" element={<ProductForm />} />
          <Route path="editar/:id" element={<ProductForm />} />
          
          <Route path="categorias" element={<CategoryDashboard />} />
          <Route path="categorias/nueva" element={<CategoryForm />} />
          <Route path="categorias/editar/:id" element={<CategoryForm />} />
          
          <Route path="mayoristas" element={<WholesaleManagement />} />
        </Route>

        {/* Rutas Públicas de la Tienda */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Catalog />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/mayoristas" element={<WholesalePortal />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/comparar" element={<ComparePage />} />
          
          <Route path="/como-comprar" element={<HowToBuyPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/politicas" element={<PoliciesPage />} />
          <Route path="/contacto" element={<ContactPage />} />

          {/* Cualquier otra ruta redirige al catálogo */}
          <Route path="*" element={<Catalog />} />
        </Route>
      </Routes>
    </WholesaleProvider>
  );
}

export default App;

