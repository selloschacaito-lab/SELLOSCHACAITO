import React from 'react';

const ProductSkeletonCard = ({ isResellerMode = false }) => {
  return (
    <div className="skeleton-card">
      {/* Product Image placeholder */}
      <div className="skeleton-box skeleton-card-img" />

      {/* Category line */}
      <div className="skeleton-box skeleton-card-line short" style={{ height: '11px' }} />

      {/* Product title */}
      <div className="skeleton-box skeleton-card-line long" style={{ height: '18px' }} />

      {/* Product short description / dimensions */}
      <div className="skeleton-box skeleton-card-line medium" style={{ height: '12px' }} />

      {/* Price and color dots container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
        <div className="skeleton-box" style={{ width: '60px', height: '22px' }} />
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <div className="skeleton-box" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
          <div className="skeleton-box" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
          <div className="skeleton-box" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Action button */}
      <div className="skeleton-box skeleton-card-button" />
    </div>
  );
};

const ProductSkeletonGrid = ({ count = 8, isResellerMode = false, showHeader = true }) => {
  return (
    <div className={`catalog-fluid-container ${isResellerMode ? 'skeleton-wholesale-theme' : ''}`} style={{ minHeight: '80vh', padding: '1.5rem 1rem 3rem 1rem' }}>
      
      {/* Central pulsating logo badge */}
      {showHeader && (
        <div className="skeleton-logo-badge">
          <img 
            src="/logo.png" 
            alt="Sellos Chacaíto" 
            className={isResellerMode ? "skeleton-logo-img-gold" : "skeleton-logo-img"} 
          />
          <span className="skeleton-logo-text" style={{ color: isResellerMode ? '#FFB800' : 'var(--color-text-secondary)' }}>
            {isResellerMode ? 'Cargando Catálogo Mayorista VIP...' : 'Cargando Catálogo de Sellos...'}
          </span>
        </div>
      )}

      {/* Chips placeholder bar */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'hidden', marginBottom: '1.5rem', opacity: 0.7 }}>
        <div className="skeleton-box" style={{ width: '80px', height: '36px', borderRadius: '20px', flexShrink: 0 }} />
        <div className="skeleton-box" style={{ width: '140px', height: '36px', borderRadius: '20px', flexShrink: 0 }} />
        <div className="skeleton-box" style={{ width: '120px', height: '36px', borderRadius: '20px', flexShrink: 0 }} />
        <div className="skeleton-box" style={{ width: '130px', height: '36px', borderRadius: '20px', flexShrink: 0 }} />
        <div className="skeleton-box" style={{ width: '110px', height: '36px', borderRadius: '20px', flexShrink: 0 }} />
      </div>

      {/* Cards Grid matching actual products-grid */}
      <div className="products-grid">
        {Array.from({ length: count }).map((_, index) => (
          <ProductSkeletonCard key={index} isResellerMode={isResellerMode} />
        ))}
      </div>
    </div>
  );
};

export default ProductSkeletonGrid;
