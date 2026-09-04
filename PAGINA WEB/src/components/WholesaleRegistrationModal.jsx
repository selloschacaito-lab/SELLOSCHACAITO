import React, { useState } from 'react';
import { useWholesale } from '../context/WholesaleContext';
import { trackWholesaleLead } from '../services/analytics';

const WholesaleRegistrationModal = ({ isOpen, onClose, onRegistered }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, registerWithGoogle } = useWholesale();

  const [activeTab, setActiveTab] = useState('register'); // 'login' | 'register'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [tipoCliente, setTipoCliente] = useState('empresa'); // 'empresa' | 'personal'
  const [razonSocial, setRazonSocial] = useState('');
  const [rif, setRif] = useState('');
  const [contacto, setContacto] = useState('');
  const [whatsappPrincipal, setWhatsappPrincipal] = useState('');
  const [whatsappSecundario, setWhatsappSecundario] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  // Manejar Login Tradicional
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(loginEmail.trim(), loginPassword);
      onClose();
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setErrorMsg('Error al iniciar sesión: ' + (err.message || 'Intenta nuevamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar Login con Google
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('La ventana emergente fue bloqueada por el navegador. Por favor permite popups.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Inicio de sesión cancelado.');
      } else {
        setErrorMsg('Error al conectar con Google: ' + (err.message || 'Intenta de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Validaciones de pasos
  const handleNextStep = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (step === 1) {
      if (!razonSocial.trim()) {
        setErrorMsg('Ingresa la razón social o nombre completo.');
        return;
      }
      if (!rif.trim()) {
        setErrorMsg('Ingresa el RIF o número de cédula.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!whatsappPrincipal.trim()) {
        setErrorMsg('El número de WhatsApp principal es indispensable para coordinar tus pedidos.');
        return;
      }
      setStep(3);
    }
  };

  // Manejar Registro con Email + Password
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Ingresa un correo y contraseña válidos.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const profileData = {
        tipoCliente,
        razonSocial: razonSocial.trim(),
        rif: rif.trim().toUpperCase(),
        contacto: contacto.trim(),
        whatsappPrincipal: whatsappPrincipal.trim(),
        whatsappSecundario: whatsappSecundario.trim(),
        direccionFiscal: direccionFiscal.trim(),
        role: 'wholesale',
        discount: 20
      };
      await registerWithEmail(regEmail.trim(), regPassword, profileData);
      trackWholesaleLead(profileData);
      setSuccessInfo({
        razonSocial: razonSocial.trim(),
        rif: rif.trim().toUpperCase(),
        email: regEmail.trim(),
        whatsapp: whatsappPrincipal.trim()
      });
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya está registrado. Intenta iniciar sesión.');
      } else {
        setErrorMsg('Ocurrió un error al registrar tu cuenta: ' + (err.message || 'Intenta de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar Registro con Google
  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const profileData = {
        tipoCliente,
        razonSocial: razonSocial.trim() || 'Comercio Mayorista',
        rif: rif.trim().toUpperCase() || 'Pendiente',
        contacto: contacto.trim(),
        whatsappPrincipal: whatsappPrincipal.trim(),
        whatsappSecundario: whatsappSecundario.trim(),
        direccionFiscal: direccionFiscal.trim(),
        role: 'wholesale',
        discount: 20
      };
      const result = await registerWithGoogle(profileData);
      trackWholesaleLead(profileData);
      setSuccessInfo({
        razonSocial: profileData.razonSocial,
        rif: profileData.rif,
        email: result.user?.email || 'Google Account',
        whatsapp: profileData.whatsappPrincipal
      });
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('La ventana emergente fue bloqueada por tu navegador.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Registro cancelado.');
      } else {
        setErrorMsg('Error al registrar con Google: ' + (err.message || 'Intenta de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Notificar por WhatsApp al registrar
  const handleNotifyWhatsApp = () => {
    if (!successInfo) return;
    const text = `¡Hola Sellos Chacaíto! 👋 Acabo de registrar mi solicitud de cuenta mayorista:\n\n🏢 *Empresa/Nombre:* ${successInfo.razonSocial}\n📋 *RIF:* ${successInfo.rif}\n📧 *Correo:* ${successInfo.email}\n📱 *WhatsApp:* ${successInfo.whatsapp}\n\nPor favor revisen mi solicitud para activar mi 20% de descuento. ¡Gracias!`;
    window.open(`https://wa.me/584241345488?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10000,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#11141B',
        border: '1px solid rgba(255, 184, 0, 0.35)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '480px',
        color: '#F5F7FA',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        padding: '1.5rem',
        position: 'relative',
        marginTop: '0.5rem',
        marginBottom: '2rem'
      }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👑</span>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#FFB800' }}>
                Portal Mayoristas
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#9DA6B5', margin: 0 }}>
                Tarifa especial distribuidor · Sellos Chacaíto
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9DA6B5', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* ----------------- VISTA DE ÉXITO TRAS REGISTRO ----------------- */}
        {successInfo ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFB800', marginBottom: '0.4rem' }}>
              ¡Solicitud Registrada con Éxito!
            </h3>
            <p style={{ color: '#9DA6B5', fontSize: '0.88rem', lineHeight: '1.45', marginBottom: '1.25rem' }}>
              Hola <strong style={{ color: '#FFF' }}>{successInfo.razonSocial}</strong>, tus datos ya están registrados en nuestro sistema. Para activar tu cuenta de inmediato y aplicar el <strong>20% de descuento</strong>, notifícanos por WhatsApp:
            </p>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              borderRadius: '12px',
              padding: '0.9rem',
              textAlign: 'left',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}>
              <div><span style={{ color: '#9DA6B5' }}>Empresa:</span> <strong style={{ color: '#FFF' }}>{successInfo.razonSocial}</strong></div>
              <div><span style={{ color: '#9DA6B5' }}>RIF:</span> <strong style={{ color: '#FFB800' }}>{successInfo.rif}</strong></div>
              <div><span style={{ color: '#9DA6B5' }}>WhatsApp:</span> <strong style={{ color: '#FFF' }}>{successInfo.whatsapp}</strong></div>
              <div><span style={{ color: '#9DA6B5' }}>Correo:</span> <span style={{ color: '#FFF' }}>{successInfo.email}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleNotifyWhatsApp}
                className="btn btn-whatsapp"
                style={{
                  padding: '0.85rem', fontSize: '0.95rem', fontWeight: '800', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                💬 Notificar por WhatsApp al 0424-1345488
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem', background: 'transparent',
                  border: '1px solid rgba(255, 184, 0, 0.4)', color: '#FFB800',
                  borderRadius: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer'
                }}
              >
                Entrar al Portal
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Selector de Pestaña: Iniciar Sesión / Solicitar Acceso */}
            <div style={{
              display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '0.25rem', borderRadius: '10px', marginBottom: '1.25rem',
              border: '1px solid rgba(255, 184, 0, 0.2)'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: '8px', border: 'none',
                  backgroundColor: activeTab === 'register' ? '#FFB800' : 'transparent',
                  color: activeTab === 'register' ? '#000' : '#9DA6B5',
                  fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Solicitar Acceso
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                style={{
                  flex: 1, padding: '0.55rem', borderRadius: '8px', border: 'none',
                  backgroundColor: activeTab === 'login' ? '#FFB800' : 'transparent',
                  color: activeTab === 'login' ? '#000' : '#9DA6B5',
                  fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Ya soy Mayorista
              </button>
            </div>

            {/* ----------------- PESTAÑA: LOGIN ----------------- */}
            {activeTab === 'login' && (
              <div>
                {/* Botón de Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '10px',
                    backgroundColor: '#FFF', color: '#1F2937', border: 'none',
                    fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  {loading ? 'Conectando con Google...' : 'Continuar con Google'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <span style={{ fontSize: '0.75rem', color: '#9DA6B5' }}>o con correo</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                </div>

                <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                      Correo electrónico
                    </label>
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="empresa@ejemplo.com"
                      required
                      style={{
                        width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                        color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                      Contraseña
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input 
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                          width: '100%', padding: '0.65rem 2.4rem 0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: 'absolute', right: '0.5rem', background: 'transparent',
                          border: 'none', color: '#9DA6B5', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem'
                        }}
                        title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '600' }}>
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '0.8rem', backgroundColor: '#FFB800', color: '#000',
                      fontWeight: '800', fontSize: '0.92rem', borderRadius: '10px',
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem'
                    }}
                  >
                    {loading ? 'Verificando...' : 'Entrar al Catálogo Mayorista'}
                  </button>
                </form>
              </div>
            )}

            {/* ----------------- PESTAÑA: SOLICITAR ACCESO (3 PASOS) ----------------- */}
            {activeTab === 'register' && (
              <div>
                {/* Indicador de Pasos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0 0.5rem' }}>
                  {[1, 2, 3].map((num) => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: step === num ? '#FFB800' : step > num ? 'rgba(255, 184, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        color: step === num ? '#000' : '#FFF',
                        fontSize: '0.75rem', fontWeight: '800',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {step > num ? '✓' : num}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: step === num ? '#FFB800' : '#9DA6B5', fontWeight: '600' }}>
                        {num === 1 ? 'Fiscal' : num === 2 ? 'Contacto' : 'Cuenta'}
                      </span>
                      {num < 3 && <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginLeft: '0.2rem' }} />}
                    </div>
                  ))}
                </div>

                {/* PASO 1: Datos Fiscales */}
                {step === 1 && (
                  <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    
                    {/* Selector Empresa / Personal */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setTipoCliente('empresa')}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: '8px',
                          backgroundColor: tipoCliente === 'empresa' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${tipoCliente === 'empresa' ? '#FFB800' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: tipoCliente === 'empresa' ? '#FFB800' : '#9DA6B5',
                          fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        🏢 Empresa / Comercio
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoCliente('personal')}
                        style={{
                          flex: 1, padding: '0.5rem', borderRadius: '8px',
                          backgroundColor: tipoCliente === 'personal' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${tipoCliente === 'personal' ? '#FFB800' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: tipoCliente === 'personal' ? '#FFB800' : '#9DA6B5',
                          fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        👤 Persona Natural
                      </button>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        {tipoCliente === 'empresa' ? 'Razón Social *' : 'Nombre y Apellido *'}
                      </label>
                      <input 
                        type="text"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                        placeholder={tipoCliente === 'empresa' ? 'Ej. Distribuidora Gráfica C.A.' : 'Ej. Juan Pérez'}
                        required
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        {tipoCliente === 'empresa' ? 'RIF de la Empresa *' : 'Cédula o RIF *'}
                      </label>
                      <input 
                        type="text"
                        value={rif}
                        onChange={(e) => setRif(e.target.value.toUpperCase())}
                        placeholder="Ej. J-12345678-9 o V-12345678"
                        required
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        Persona de Contacto / Encargado
                      </label>
                      <input 
                        type="text"
                        value={contacto}
                        onChange={(e) => setContacto(e.target.value.toUpperCase())}
                        placeholder="Ej. Carlos Pérez (Administrador)"
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {errorMsg && (
                      <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '600' }}>
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      style={{
                        width: '100%', padding: '0.8rem', backgroundColor: '#FFB800', color: '#000',
                        fontWeight: '800', fontSize: '0.92rem', borderRadius: '10px',
                        border: 'none', cursor: 'pointer', marginTop: '0.5rem'
                      }}
                    >
                      Siguiente: Datos de Contacto →
                    </button>
                  </form>
                )}

                {/* PASO 2: Datos de Contacto y Entrega */}
                {step === 2 && (
                  <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        WhatsApp Principal (Para confirmación y pedidos) *
                      </label>
                      <input 
                        type="tel"
                        value={whatsappPrincipal}
                        onChange={(e) => setWhatsappPrincipal(e.target.value)}
                        placeholder="Ej. 04141234567"
                        required
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        WhatsApp Secundario / Teléfono Local (Opcional)
                      </label>
                      <input 
                        type="tel"
                        value={whatsappSecundario}
                        onChange={(e) => setWhatsappSecundario(e.target.value)}
                        placeholder="Ej. 02129876543"
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                        Dirección Fiscal / Despacho
                      </label>
                      <textarea 
                        value={direccionFiscal}
                        onChange={(e) => setDireccionFiscal(e.target.value.toUpperCase())}
                        rows={2}
                        placeholder="Zona, ciudad, edificio o agencia de retiro..."
                        style={{
                          width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                          color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box', resize: 'vertical'
                        }}
                      />
                    </div>

                    {errorMsg && (
                      <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '600' }}>
                        {errorMsg}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                          padding: '0.75rem 1rem', backgroundColor: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)', color: '#9DA6B5',
                          borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer'
                        }}
                      >
                        ← Atrás
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 1, padding: '0.8rem', backgroundColor: '#FFB800', color: '#000',
                          fontWeight: '800', fontSize: '0.92rem', borderRadius: '10px',
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        Siguiente: Crear Cuenta →
                      </button>
                    </div>
                  </form>
                )}

                {/* PASO 3: Cuenta de Acceso (Google o Correo) */}
                {step === 3 && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#9DA6B5', marginBottom: '1rem', lineHeight: '1.4' }}>
                      Elige cómo deseas iniciar sesión para consultar tus precios mayoristas:
                    </p>

                    {/* Opción 1: Google */}
                    <button
                      onClick={handleGoogleRegister}
                      disabled={loading}
                      style={{
                        width: '100%', padding: '0.85rem', borderRadius: '10px',
                        backgroundColor: '#FFF', color: '#1F2937', border: 'none',
                        fontWeight: '700', fontSize: '0.92rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                        marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                      {loading ? 'Registrando...' : 'Registrar con mi cuenta de Google'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                      <span style={{ fontSize: '0.75rem', color: '#9DA6B5' }}>o con correo y contraseña</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    </div>

                    <form onSubmit={handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                          Correo Electrónico *
                        </label>
                        <input 
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="tuempresa@ejemplo.com"
                          required
                          style={{
                            width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                            color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                          Crea una Contraseña (mínimo 6 caracteres) *
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                              width: '100%', padding: '0.65rem 2.4rem 0.65rem 0.8rem', borderRadius: '8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                              color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            style={{
                              position: 'absolute', right: '0.5rem', background: 'transparent',
                              border: 'none', color: '#9DA6B5', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem'
                            }}
                            title={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                          >
                            {showRegPassword ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </div>

                      {errorMsg && (
                        <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '600' }}>
                          {errorMsg}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          style={{
                            padding: '0.75rem 1rem', backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)', color: '#9DA6B5',
                            borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer'
                          }}
                        >
                          ← Atrás
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            flex: 1, padding: '0.8rem', backgroundColor: '#FFB800', color: '#000',
                            fontWeight: '800', fontSize: '0.92rem', borderRadius: '10px',
                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? 'Creando cuenta...' : 'Enviar Solicitud'}
                        </button>
                      </div>
                    </form>

                    <p style={{ fontSize: '0.72rem', color: '#6B7280', textAlign: 'center', marginTop: '1rem', lineHeight: '1.3' }}>
                      🔒 Tus datos fiscales y de contacto serán protegidos y utilizados exclusivamente para la verificación comercial y facturación de tus pedidos.
                    </p>
                  </div>
                )}

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default WholesaleRegistrationModal;
