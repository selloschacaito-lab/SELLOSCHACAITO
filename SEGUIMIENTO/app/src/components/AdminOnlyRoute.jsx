import React from 'react';
import { Navigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';

// Bloquea la ruta completa (no solo oculta el ítem del menú) para cualquiera
// que no sea Álvaro. Si alguien más entra directo por la URL, se redirige a "/".
function AdminOnlyRoute({ children }) {
  const { activeProfile } = useProfile();
  const isAlvaro = Boolean(activeProfile?.name?.toLowerCase().includes('alvaro'));

  if (!isAlvaro) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminOnlyRoute;
