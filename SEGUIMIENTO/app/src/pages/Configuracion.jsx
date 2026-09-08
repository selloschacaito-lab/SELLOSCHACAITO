import React from 'react';
import { Settings, UserCircle } from 'lucide-react';
import TabbedPageShell from '../components/TabbedPageShell';

const TABS = [
  { path: 'general', label: 'Configuración', icon: Settings, color: '#10b981' },
  // Solo Álvaro ve esta pestaña (la ruta en sí también está protegida en App.jsx)
  { path: 'usuarios', label: 'Usuarios', icon: UserCircle, color: '#3b82f6', adminOnly: true }
];

export default function Configuracion() {
  return <TabbedPageShell basePath="/configuracion" tabs={TABS} />;
}
