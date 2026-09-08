import React from 'react';
import { DollarSign, ClipboardList, Wrench, Stamp } from 'lucide-react';
import TabbedPageShell from '../components/TabbedPageShell';

const TABS = [
  { path: 'cambio', label: 'Cambio', icon: DollarSign, color: '#10b981' },
  { path: 'presupuestos', label: 'Presupuestos', icon: ClipboardList, color: '#3b82f6' },
  { path: 'herramientas', label: 'Herramientas', icon: Wrench, color: '#f59e0b' },
  { path: 'sellos-madera', label: 'Sellos de Madera', icon: Stamp, color: '#8b5cf6' }
];

export default function Utilidades() {
  return <TabbedPageShell basePath="/utilidades" tabs={TABS} />;
}
