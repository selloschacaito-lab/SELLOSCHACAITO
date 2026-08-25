import React, { useState, useRef, useEffect } from 'react';

const CategoryCard = ({ category, onClick }) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?categoria=${category.id}`;
    const text = `¡Mira la categoría ${category.name || category.label} en Sellos Chacaíto!\n\nVer catálogo completo aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setIsShareOpen(false);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?categoria=${category.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("¡Enlace copiado!");
    });
    setIsShareOpen(false);
  };

  return (
    <div 
      className="product-card" 
      onClick={onClick}
      style={{
        border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden',
        backgroundColor: 'var(--color-bg-card)', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s',
        height: '100%'
      }}
    >
      <div style={{ height: 'clamp(115px, 32vw, 160px)', backgroundColor: 'var(--color-bg-secondary)', overflow: 'hidden', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name || category.label} style={{ maxHeight: '90%', width: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', fontSize: '2rem' }}>📁</div>
        )}
      </div>

      <div style={{ padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontSize: 'clamp(0.85rem, 2.8vw, 1.05rem)', fontWeight: '700', marginBottom: '0.2rem', color: 'var(--color-text-main)', lineHeight: '1.2' }}>{category.name || category.label}</h3>
          
          {/* Share Dropdown */}
          <div ref={shareRef} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="btn"
              style={{ padding: '0.2rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              title="Compartir Categoría"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>

            {isShareOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '0.35rem',
                backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', minWidth: '140px', zIndex: 20
              }}>
                <button onClick={handleWhatsApp} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-main)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontWeight: '600', fontSize: '0.8rem' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--color-whatsapp)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </button>
                <button onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-main)', textAlign: 'left', fontWeight: '600', fontSize: '0.8rem' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {category.description && (
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '0.75rem', 
            marginBottom: '0.6rem', 
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {category.description}
          </p>
        )}
        
        <button className="btn" style={{ width: '100%', padding: '0.45rem', fontSize: '0.78rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', borderRadius: '6px', fontWeight: '600' }}>
          Ver Modelos →
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;
