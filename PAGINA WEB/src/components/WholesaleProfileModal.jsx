import React, { useState } from 'react';
import { useWholesale } from '../context/WholesaleContext';

const WholesaleProfileModal = ({ isOpen, onClose }) => {
  const { profile, updateProfile, logout } = useWholesale();

  const [formData, setFormData] = useState({
    contacto: profile?.contacto || profile?.nombreContacto || '',
    whatsappPrincipal: profile?.whatsappPrincipal || profile?.telefono || '',
    whatsappSecundario: profile?.whatsappSecundario || '',
    direccionFiscal: profile?.direccionFiscal || '',
    metodoEntrega: profile?.metodoEntrega || 'retiro_chacaito'
  });

  const [saving, setSaving] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !profile) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const transformed = name === 'email' ? value : value.toUpperCase();
    setFormData((prev) => ({ ...prev, [name]: transformed }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.whatsappPrincipal) {
      setErrorMsg('El número de WhatsApp principal es obligatorio.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      await updateProfile({
        contacto: formData.contacto,
        whatsappPrincipal: formData.whatsappPrincipal,
        whatsappSecundario: formData.whatsappSecundario,
        direccionFiscal: formData.direccionFiscal,
        metodoEntrega: formData.metodoEntrega,
        perfilActualizadoEl: new Date().toISOString()
      });
      setShowSuccessNotification(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un error al guardar los cambios. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifyWhatsApp = () => {
    const nombre = profile.razonSocial || profile.nombre || 'Mayorista';
    const rif = profile.rif || 'Sin RIF';
    const text = `Hola Sellos Chacaíto, soy ${nombre} (RIF: ${rif}). Acabo de actualizar mis datos de contacto/fiscales en el portal mayorista:\n\n📱 WhatsApp: ${formData.whatsappPrincipal}\n👤 Contacto: ${formData.contacto || 'N/A'}\n📍 Dirección: ${formData.direccionFiscal || 'N/A'}`;
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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        color: '#F5F7FA',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        padding: '1.5rem',
        position: 'relative',
        marginTop: '0.5rem',
        marginBottom: '2.5rem'
      }}>
        
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 184, 0, 0.2)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👑</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#FFB800' }}>
                Perfil Mayorista
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#9DA6B5' }}>
                Tarifa Especial {profile.discount || 20}% Activa
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9DA6B5', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* Modal de Éxito con botón de notificación a WhatsApp */}
        {showSuccessNotification ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFB800', marginBottom: '0.35rem' }}>
              ¡Datos Actualizados con Éxito!
            </h3>
            <p style={{ color: '#9DA6B5', fontSize: '0.88rem', lineHeight: '1.4', marginBottom: '1.25rem' }}>
              Tus datos se han guardado en el sistema. Notifícanos por WhatsApp para que nuestro equipo lo tenga en cuenta en tus próximos pedidos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={handleNotifyWhatsApp}
                className="btn btn-whatsapp"
                style={{
                  padding: '0.85rem', fontSize: '0.95rem', fontWeight: '700', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  border: 'none', cursor: 'pointer', width: '100%'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                💬 Notificar a Sellos Chacaíto por WhatsApp
              </button>
              <button
                onClick={() => { setShowSuccessNotification(false); onClose(); }}
                style={{
                  padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F5F7FA', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            
            {/* Tarjeta de Aviso Informativo */}
            <div style={{
              backgroundColor: 'rgba(255, 184, 0, 0.08)',
              border: '1px solid rgba(255, 184, 0, 0.25)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              color: '#F5F7FA',
              lineHeight: '1.4'
            }}>
              💡 <strong>Información:</strong> Puedes editar tu teléfono y dirección cuando lo desees. Recuerda notificarnos para mantener tus entregas y facturas siempre al día.
            </div>

            {/* Datos Comerciales No Editables Directamente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>
                  Razón Social / Nombre
                </label>
                <div style={{ padding: '0.55rem 0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85rem', color: '#FFF' }}>
                  {profile.razonSocial || profile.nombre || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.2rem' }}>
                  RIF / Cédula
                </label>
                <div style={{ padding: '0.55rem 0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85rem', color: '#FFB800', fontWeight: '700' }}>
                  {profile.rif || 'N/A'}
                </div>
              </div>
            </div>

            {/* Persona de contacto */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Persona de Contacto / Encargado
              </label>
              <input 
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Ej. Carlos Pérez"
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                  color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* WhatsApp Principal */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                WhatsApp Principal (Para pedidos) *
              </label>
              <input 
                type="tel"
                name="whatsappPrincipal"
                value={formData.whatsappPrincipal}
                onChange={handleChange}
                placeholder="Ej. 04141234567"
                required
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                  color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* WhatsApp Secundario */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                WhatsApp Secundario / Oficina (Opcional)
              </label>
              <input 
                type="tel"
                name="whatsappSecundario"
                value={formData.whatsappSecundario}
                onChange={handleChange}
                placeholder="Ej. 04247654321"
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dirección Fiscal / Entrega */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Dirección Fiscal / Entrega
              </label>
              <textarea 
                name="direccionFiscal"
                value={formData.direccionFiscal}
                onChange={handleChange}
                rows={2}
                placeholder="Calle, edificio, local o punto de referencia..."
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 184, 0, 0.25)',
                  color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
            </div>

            {/* Método de entrega preferido */}
            <div>
              <label style={{ fontSize: '0.78rem', color: '#9DA6B5', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                Método de Entrega Habitual
              </label>
              <select
                name="metodoEntrega"
                value={formData.metodoEntrega}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  backgroundColor: '#1B202C', border: '1px solid rgba(255, 184, 0, 0.25)',
                  color: '#FFF', fontSize: '0.88rem', boxSizing: 'border-box'
                }}
              >
                <option value="retiro_chacaito">Retiro en Fábrica / Chacaíto</option>
                <option value="delivery_caracas">Delivery en Caracas (Moto)</option>
                <option value="mrw_zoom">Envío Nacional (MRW / Zoom)</option>
              </select>
            </div>

            {errorMsg && (
              <div style={{ color: '#FF6B6B', fontSize: '0.8rem', fontWeight: '600' }}>
                {errorMsg}
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1, padding: '0.75rem', backgroundColor: '#FFB800', color: '#000',
                  fontWeight: '800', fontSize: '0.9rem', borderRadius: '10px',
                  border: 'none', cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>

              <button
                type="button"
                onClick={async () => { await logout(); onClose(); }}
                style={{
                  padding: '0.75rem 1rem', backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 107, 107, 0.4)', color: '#FF6B6B',
                  fontWeight: '700', fontSize: '0.85rem', borderRadius: '10px',
                  cursor: 'pointer'
                }}
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default WholesaleProfileModal;
