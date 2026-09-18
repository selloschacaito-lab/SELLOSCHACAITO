import { Palette, Receipt, Printer, Cog, CheckCircle2, Package, CheckCheck } from 'lucide-react';

// Pipeline de etapas de un pedido — fuente única de verdad compartida entre
// el Kanban de Pedidos y el Monitor, para que nunca queden desincronizados.
export const STATUSES = [
  { id: "design_sent", name: "Iniciando Pedido", color: "color-blue", icon: Palette },
  { id: "fina", name: "Pagado", color: "color-red", icon: Receipt },
  { id: "printing", name: "Impresión", color: "color-orange", icon: Printer },
  { id: "production", name: "En Producción", color: "color-indigo", icon: Cog },
  { id: "finished", name: "Terminado", color: "color-green", icon: CheckCircle2 },
  { id: "packed", name: "Empacado", color: "color-fuchsia", icon: Package },
  { id: "delivered", name: "Entregado", color: "color-gray", isHidden: true, icon: CheckCheck }
];
