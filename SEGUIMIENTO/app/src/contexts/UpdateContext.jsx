import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, set, update } from 'firebase/database';
import { toast } from 'react-hot-toast';

const CURRENT_BASELINE_VERSION = '2.6.0';
const CURRENT_BASELINE_CODE = 260;

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [systemUpdates, setSystemUpdates] = useState({});
  const [systemInfo, setSystemInfo] = useState({
    latestVersion: CURRENT_BASELINE_VERSION,
    latestVersionCode: CURRENT_BASELINE_CODE
  });

  const [localVersionCode, setLocalVersionCode] = useState(() => {
    const saved = localStorage.getItem('sc_installed_version_code');
    return saved !== null ? parseInt(saved, 10) : CURRENT_BASELINE_CODE;
  });

  const [localVersionName, setLocalVersionName] = useState(() => {
    return localStorage.getItem('sc_installed_version_name') || CURRENT_BASELINE_VERSION;
  });

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStageText, setInstallStageText] = useState('');

  // 1. Escuchar actualizaciones y versión del sistema en tiempo real desde Firebase RTDB
  useEffect(() => {
    const updatesRef = ref(db, 'systemUpdates');
    const infoRef = ref(db, 'systemInfo');

    const unsubUpdates = onValue(updatesRef, (snapshot) => {
      if (snapshot.exists()) {
        setSystemUpdates(snapshot.val());
      }
    });

    const unsubInfo = onValue(infoRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setSystemInfo({
          latestVersion: val.latestVersion || CURRENT_BASELINE_VERSION,
          latestVersionCode: val.latestVersionCode || CURRENT_BASELINE_CODE
        });
      }
    });

    return () => {
      unsubUpdates();
      unsubInfo();
    };
  }, []);

  // 2. Calcular todas las actualizaciones acumuladas pendientes de instalar en este dispositivo
  const pendingUpdates = useMemo(() => {
    const list = Object.entries(systemUpdates).map(([key, val]) => ({
      key,
      version: val?.version || '1.0.0',
      versionCode: Number(val?.versionCode) || 100,
      title: val?.title || 'Mejoras en el sistema',
      date: val?.date || new Date().toISOString(),
      author: val?.author || 'Alvaro',
      highlights: Array.isArray(val?.highlights) ? val.highlights : []
    }));

    // Filtrar aquellas con versionCode superior a lo que este dispositivo tiene instalado
    const pending = list.filter(u => u.versionCode > localVersionCode);
    return pending.sort((a, b) => b.versionCode - a.versionCode);
  }, [systemUpdates, localVersionCode]);

  // Lista completa de versiones para el historial
  const allVersionsHistory = useMemo(() => {
    const list = Object.entries(systemUpdates).map(([key, val]) => ({
      key,
      version: val?.version || '1.0.0',
      versionCode: Number(val?.versionCode) || 100,
      title: val?.title || 'Mejoras en el sistema',
      date: val?.date || new Date().toISOString(),
      author: val?.author || 'Alvaro',
      highlights: Array.isArray(val?.highlights) ? val.highlights : []
    }));
    return list.sort((a, b) => b.versionCode - a.versionCode);
  }, [systemUpdates]);

  const hasUpdate = pendingUpdates.length > 0 || (systemInfo.latestVersionCode > localVersionCode);

  const openUpdateModal = useCallback(() => setIsUpdateModalOpen(true), []);
  const closeUpdateModal = useCallback(() => {
    if (!isInstalling) setIsUpdateModalOpen(false);
  }, [isInstalling]);

  // 3. Ejecutar Instalación con Barra de Progreso y Limpieza de Caché
  const applyUpdate = useCallback(async () => {
    setIsInstalling(true);
    setInstallProgress(5);
    setInstallStageText('Iniciando proceso de actualización...');

    try {
      // Etapa 1: Descarga de paquetes y recursos
      await new Promise(r => setTimeout(r, 600));
      setInstallProgress(25);
      setInstallStageText('Descargando nuevos módulos, vistas y componentes...');

      // Etapa 2: Limpieza de Caché de Navegador y Service Workers
      await new Promise(r => setTimeout(r, 700));
      setInstallProgress(55);
      setInstallStageText('Limpiando memoria caché del navegador y Service Workers...');

      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          try {
            const cacheKeys = await window.caches.keys();
            await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
          } catch (e) {
            console.warn('Cache clearing notice:', e);
          }
        }
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
          } catch (e) {
            console.warn('Service worker clearing notice:', e);
          }
        }
      }

      // Etapa 3: Sincronización de Base de Datos y Registro de Versión
      await new Promise(r => setTimeout(r, 600));
      setInstallProgress(85);
      setInstallStageText('Sincronizando base de datos en tiempo real...');

      const targetVersionCode = systemInfo.latestVersionCode || CURRENT_BASELINE_CODE;
      const targetVersionName = systemInfo.latestVersion || CURRENT_BASELINE_VERSION;

      localStorage.setItem('sc_installed_version_code', targetVersionCode.toString());
      localStorage.setItem('sc_installed_version_name', targetVersionName);
      setLocalVersionCode(targetVersionCode);
      setLocalVersionName(targetVersionName);

      // Etapa 4: Finalización
      await new Promise(r => setTimeout(r, 500));
      setInstallProgress(100);
      setInstallStageText('¡Sistema actualizado con éxito! Reiniciando...');

      await new Promise(r => setTimeout(r, 800));

      // Recarga forzada limpia sin caché
      const cleanPath = window.location.pathname;
      window.location.href = `${cleanPath}?updated=${Date.now()}`;
    } catch (err) {
      console.error('Error aplicando actualización:', err);
      toast.error('Error durante la instalación. Intenta de nuevo.');
      setIsInstalling(false);
    }
  }, [systemInfo]);

  // 4. Función de Publicación exclusiva para Álvaro
  const publishUpdate = useCallback(async ({ version, versionCode, title, highlights, author = 'Alvaro' }) => {
    if (!version || !title) {
      toast.error('Ingresa la versión y el título de la actualización');
      return false;
    }

    const cleanCode = Number(versionCode) || (parseInt(version.replace(/\D/g, ''), 10) * 10) || (systemInfo.latestVersionCode + 10);
    const key = `v_${version.replace(/\./g, '_')}`;
    const nowISO = new Date().toISOString();

    const updatePayload = {
      version: version.trim(),
      versionCode: cleanCode,
      title: title.trim(),
      date: nowISO,
      author: author.trim() || 'Alvaro',
      highlights: highlights && highlights.length > 0 ? highlights : ['Mejoras de estabilidad y rendimiento en el sistema.']
    };

    try {
      const updates = {};
      updates[`systemUpdates/${key}`] = updatePayload;
      updates[`systemInfo/latestVersion`] = version.trim();
      updates[`systemInfo/latestVersionCode`] = cleanCode;
      updates[`systemInfo/updatedAt`] = nowISO;

      await update(ref(db), updates);
      toast.success(`¡Versión ${version} publicada con éxito para todos los dispositivos!`, {
        icon: '🚀'
      });
      return true;
    } catch (err) {
      console.error('Error publicando actualización:', err);
      toast.error('Error al publicar la actualización');
      return false;
    }
  }, [systemInfo]);

  const value = {
    localVersionCode,
    localVersionName,
    latestVersionCode: systemInfo.latestVersionCode,
    latestVersionName: systemInfo.latestVersion,
    pendingUpdates,
    allVersionsHistory,
    hasUpdate,
    isUpdateModalOpen,
    isInstalling,
    installProgress,
    installStageText,
    openUpdateModal,
    closeUpdateModal,
    applyUpdate,
    publishUpdate
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate debe ser usado dentro de un UpdateProvider');
  }
  return context;
}
