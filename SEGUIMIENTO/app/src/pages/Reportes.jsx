import React from 'react';
import { ShoppingBag, BarChart3 } from 'lucide-react';
import TabbedPageShell from '../components/TabbedPageShell';

const TABS = [
  { path: 'ventas', label: 'Ventas', icon: ShoppingBag, color: '#10b981' },
  // Solo Álvaro ve esta pestaña (la ruta en sí también está protegida en App.jsx)
  { path: 'estadisticas', label: 'Estadísticas', icon: BarChart3, color: '#8b5cf6', adminOnly: true }
];

export default function Reportes() {
  return <TabbedPageShell basePath="/reportes" tabs={TABS} />;
}
