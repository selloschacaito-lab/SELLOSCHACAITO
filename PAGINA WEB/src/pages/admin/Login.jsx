import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.toLowerCase().trim();

    // Restricción estricta de correo de administrador
    if (cleanEmail !== 'selloschacaito@gmail.com') {
      setError('Acceso denegado. Solamente la cuenta selloschacaito@gmail.com tiene permisos de administración.');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Contraseña incorrecta. Verifica e intenta de nuevo.');
      } else {
        setError('Correo o contraseña incorrectos. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico arriba para enviarte el enlace de recuperación.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      setMessage('Te hemos enviado un correo con las instrucciones para restablecer tu contraseña. (Revisa la carpeta de Spam por si acaso)');
    } catch (err) {
      console.error(err);
      setError('Error al intentar enviar el correo de recuperación. Verifica que el correo sea correcto.');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-secondary)', padding: '1.5rem' }}>
      <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '2rem 1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px', border: '1px solid var(--color-border)' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
          >
            ← Volver a la Tienda
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img src="/logo.png" alt="Sellos Chacaíto" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>Acceso Privado</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', margin: 0 }}>Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', lineHeight: '1.4' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem', lineHeight: '1.4' }}>
              {message}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.88rem' }}>Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="selloschacaito@gmail.com"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.88rem' }}>Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.5rem', background: 'transparent',
                  border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem'
                }}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem', fontWeight: '700' }}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
          
          <button 
            type="button" 
            onClick={handleResetPassword}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.25rem', fontSize: '0.875rem' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
