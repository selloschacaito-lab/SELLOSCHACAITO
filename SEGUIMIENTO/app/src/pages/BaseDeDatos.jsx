import React from 'react';
import { Users, Package } from 'lucide-react';
import TabbedPageShell from '../components/TabbedPageShell';

const TABS = [
  { path: 'clientes', label: 'Clientes', icon: Users, color: '#10b981' },
  { path: 'inventario', label: 'Inventario', icon: Package, color: '#3b82f6' }
];

export default function BaseDeDatos() {
  return <TabbedPageShell basePath="/base-de-datos" tabs={TABS} />;
}
