import React, { useEffect, useState } from 'react';
import { getWholesaleUsers, updateWholesaleStatus, deleteWholesaleUser } from '../../services/db';

const WholesaleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'suspended'
  const [editingDiscount, setEditingDiscount] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [savingDiscount, setSavingDiscount] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const loadWholesalers = async () => {
    setLoading(true);
    try {
      const list = await getWholesaleUsers();
      setUsers(list);
      // Inicializar descuentos editables
      const initialDiscounts = {};
      list.forEach(u => {
        initialDiscounts[u.id] = u.discount || 20;
      });
      setEditingDiscount(initialDiscounts);
    } catch (error) {
      console.error("Error al cargar mayoristas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWholesalers();
  }, []);

  const handleStatusChange = async (uid, newStatus) => {
    const discount = editingDiscount[uid] || 20;
    setActionLoading(prev => ({ ...prev, [uid]: true }));
    try {
      await updateWholesaleStatus(uid, newStatus, discount);
      await loadWholesalers();
    } catch (error) {
      alert("Error al actualizar estado del mayorista");
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleSaveDiscount = async (uid) => {
    const discount = editingDiscount[uid] || 20;
    setSavingDiscount(prev => ({ ...prev, [uid]: true }));
    try {
      const user = users.find(u => u.id === uid);
      await updateWholesaleStatus(uid, user.status, discount);
      await loadWholesalers();
    } catch (error) {
      alert("Error al guardar descuento");
    } finally {
      setSavingDiscount(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleDeleteWholesaler = async (user) => {
    const nombre = user.razonSocial || user.nombre || 'este mayorista';
    if (window.confirm(`¿Eliminar permanentemente a "${nombre}"?\n\nSe borrará todo registro.`)) {
      setActionLoading(prev => ({ ...prev, [user.id]: true }));
      try {
        await deleteWholesaleUser(user.id);
        await loadWholesalers();
      } catch (error) {
        console.error(error);
        alert("Error al eliminar el mayorista.");
      } finally {
        setActionLoading(prev => ({ ...prev, [user.id]: false }));
      }
    }
  };

  const handleSendApprovalWhatsApp = (user) => {
    const nombre = user.razonSocial || user.nombre || 'Mayorista';
    const discount = user.discount || 20;
    const text = `¡Hola ${nombre}! 👋 Te informamos que tu solicitud de cuenta mayorista en Sellos Chacaíto ha sido *APROBADA* con un *${discount}% de descuento*.\n\nYa puedes entrar y consultar tu catálogo mayorista aquí:\nhttps://sellos-chacaito.web.app/mayoristas`;
    const cleanPhone = (user.whatsappPrincipal || user.telefono || '').replace(/\D/g, '');
    const phoneParam = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    window.open(`https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Search and filter
  let filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    return u.status === filter;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      (u.razonSocial || '').toLowerCase().includes(q) ||
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.rif || '').toLowerCase().includes(q) ||
      (u.whatsappPrincipal || '').includes(q) ||
      (u.telefono || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div>
      
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.25rem 0', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          👑 Mayoristas
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
          {users.length} mayorista{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div style={{
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E' }}>
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <strong style={{ fontSize: '0.85rem' }}>
              {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''}
            </strong>
          </div>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '0.4rem 0.75rem', backgroundColor: '#D97706', color: '#FFF',
              border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.78rem',
              cursor: 'pointer', minHeight: '36px'
            }}
          >
            Ver Pendientes
          </button>
        </div>
      )}

      {/* Search */}
      <div className="admin-search-wrapper">
        <span className="search-icon">🔍</span>
        <input 
          type="text"
          className="admin-search"
          placeholder="Buscar por nombre, RIF, teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="admin-chips">
        <button
          className={`admin-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({users.length})
        </button>
        <button
          className={`admin-chip ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
          style={filter === 'pending' ? { backgroundColor: '#FFB800', borderColor: '#FFB800' } : {}}
        >
          🟡 Pendientes {pendingCount > 0 && <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '10px', marginLeft: '0.3rem' }}>{pendingCount}</span>}
        </button>
        <button
          className={`admin-chip ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
          style={filter === 'approved' ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFF' } : {}}
        >
          🟢 Aprobados ({users.filter(u => u.status === 'approved').length})
        </button>
        <button
          className={`admin-chip ${filter === 'suspended' ? 'active' : ''}`}
          onClick={() => setFilter('suspended')}
          style={filter === 'suspended' ? { backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#FFF' } : {}}
        >
          ⏸️ Suspendidos ({users.filter(u => u.status === 'suspended').length})
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
          Cargando mayoristas...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', backgroundColor: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay cuentas en esta categoría.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {filteredUsers.map((user) => {
            const isUserPending = user.status === 'pending';
            const isUserApproved = user.status === 'approved';
            const isBusy = actionLoading[user.id];
            const currentDiscount = editingDiscount[user.id] || 20;
            const originalDiscount = user.discount || 20;
            const discountChanged = Number(currentDiscount) !== Number(originalDiscount);

            return (
              <div 
                key={user.id}
                className="admin-card"
                style={{
                  borderColor: isUserPending ? '#FFB800' : 'var(--color-border)',
                  boxShadow: isUserPending ? '0 2px 12px rgba(255, 184, 0, 0.1)' : 'none'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.razonSocial || user.nombre || 'Sin nombre'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                      RIF: {user.rif || 'N/A'}
                    </span>
                  </div>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '800', flexShrink: 0,
                    backgroundColor: isUserApproved ? 'rgba(16, 185, 129, 0.15)' : isUserPending ? 'rgba(255, 184, 0, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isUserApproved ? '#10B981' : isUserPending ? '#FFB800' : '#EF4444',
                    border: `1px solid ${isUserApproved ? 'rgba(16, 185, 129, 0.3)' : isUserPending ? 'rgba(255, 184, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    {isUserApproved ? '✓ APROBADO' : isUserPending ? '🟡 PENDIENTE' : '⏸️ SUSPENDIDO'}
                  </span>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-text-main)' }}>WA:</strong>{' '}
                    <a 
                      href={`https://wa.me/${(user.whatsappPrincipal || user.telefono || '').replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--color-whatsapp)', fontWeight: '700', textDecoration: 'none' }}
                    >
                      {user.whatsappPrincipal || user.telefono || 'N/A'} ↗
                    </a>
                  </div>
                  {user.email && <div><strong style={{ color: 'var(--color-text-main)' }}>Email:</strong> {user.email}</div>}
                  {user.contacto && <div><strong style={{ color: 'var(--color-text-main)' }}>Contacto:</strong> {user.contacto}</div>}
                </div>

                {/* Discount + Actions */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-main)' }}>Descuento:</label>
                    <input 
                      type="number"
                      min="5"
                      max="50"
                      value={currentDiscount}
                      onChange={(e) => setEditingDiscount(prev => ({ ...prev, [user.id]: e.target.value }))}
                      style={{
                        width: '55px', padding: '0.25rem 0.4rem', borderRadius: '6px',
                        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                        color: 'var(--color-text-main)', fontWeight: '800', fontSize: '0.82rem', textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>%</span>
                    {discountChanged && (
                      <button
                        onClick={() => handleSaveDiscount(user.id)}
                        disabled={savingDiscount[user.id]}
                        style={{
                          padding: '0.25rem 0.6rem', backgroundColor: 'var(--color-primary)', color: '#000',
                          border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.72rem',
                          cursor: 'pointer', minHeight: '30px'
                        }}
                      >
                        {savingDiscount[user.id] ? '...' : '💾 Guardar'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {!isUserApproved ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'approved')}
                        disabled={isBusy}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: '800', minHeight: '44px' }}
                      >
                        {isBusy ? '...' : '✅ Aprobar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        disabled={isBusy}
                        style={{
                          flex: 1, padding: '0.5rem', fontSize: '0.8rem', fontWeight: '700',
                          backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#EF4444', borderRadius: '8px', cursor: 'pointer', minHeight: '44px'
                        }}
                      >
                        {isBusy ? '...' : '⏸️ Suspender'}
                      </button>
                    )}

                    {isUserApproved && (
                      <button
                        onClick={() => handleSendApprovalWhatsApp(user)}
                        className="btn btn-whatsapp"
                        style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem', fontWeight: '700', minHeight: '44px' }}
                        title="Enviar mensaje por WhatsApp"
                      >
                        💬
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteWholesaler(user)}
                      disabled={isBusy}
                      style={{
                        padding: '0.5rem 0.55rem', fontSize: '0.8rem', fontWeight: '700',
                        backgroundColor: 'transparent', border: '1px solid #fee2e2',
                        color: '#b91c1c', borderRadius: '8px', cursor: isBusy ? 'not-allowed' : 'pointer',
                        minHeight: '44px'
                      }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WholesaleManagement;
