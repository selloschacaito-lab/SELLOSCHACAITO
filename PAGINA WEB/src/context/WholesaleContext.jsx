import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getWholesaleProfile, saveWholesaleRequest, updateWholesaleProfile } from '../services/db';

const WholesaleContext = createContext();

export const WholesaleProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Escuchar estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userProfile = await getWholesaleProfile(user.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error al cargar perfil mayorista:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Recargar perfil
  const reloadProfile = async () => {
    if (currentUser) {
      const userProfile = await getWholesaleProfile(currentUser.uid);
      setProfile(userProfile);
      return userProfile;
    }
    return null;
  };

  // Iniciar sesión con Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    let userProfile = await getWholesaleProfile(result.user.uid);
    if (!userProfile) {
      // Si es la primera vez que ingresa con Google, inicializamos su registro
      userProfile = await saveWholesaleRequest(result.user.uid, {
        razonSocial: result.user.displayName || 'Comercio / Mayorista',
        contacto: result.user.displayName || '',
        email: result.user.email,
        tipoCliente: 'empresa',
        role: 'wholesale',
        discount: 20
      });
    }
    setProfile(userProfile);
    return { user: result.user, profile: userProfile };
  };

  // Iniciar sesión con Correo y Contraseña
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getWholesaleProfile(result.user.uid);
    setProfile(userProfile);
    return { user: result.user, profile: userProfile };
  };

  // Registro con Correo y datos de solicitud
  const registerWithEmail = async (email, password, profileData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const savedProfile = await saveWholesaleRequest(result.user.uid, {
      ...profileData,
      email: result.user.email
    });
    setProfile(savedProfile);
    return { user: result.user, profile: savedProfile };
  };

  // Registro con Google y datos de solicitud
  const registerWithGoogle = async (profileData) => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const savedProfile = await saveWholesaleRequest(result.user.uid, {
      ...profileData,
      email: result.user.email,
      googleDisplayName: result.user.displayName || ''
    });
    setProfile(savedProfile);
    return { user: result.user, profile: savedProfile };
  };

  // Actualizar perfil del mayorista
  const handleUpdateProfile = async (updatedData) => {
    if (!currentUser) throw new Error("No hay usuario autenticado");
    const updated = await updateWholesaleProfile(currentUser.uid, updatedData);
    setProfile((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  // Cerrar sesión
  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    setCurrentUser(null);
  };

  const isApprovedWholesaler = profile?.status === 'approved';
  const isPending = profile?.status === 'pending';
  const isSuspended = profile?.status === 'suspended';

  return (
    <WholesaleContext.Provider value={{
      currentUser,
      profile,
      loading,
      isApprovedWholesaler,
      isPending,
      isSuspended,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      registerWithGoogle,
      updateProfile: handleUpdateProfile,
      reloadProfile,
      logout: handleLogout
    }}>
      {children}
    </WholesaleContext.Provider>
  );
};

export const useWholesale = () => {
  const context = useContext(WholesaleContext);
  if (!context) {
    throw new Error('useWholesale debe ser usado dentro de un WholesaleProvider');
  }
  return context;
};
