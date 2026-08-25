import React from 'react';

const ProductDetailSkeleton = ({ isResellerMode = false }) => {
  return (
    <main 
      className={`product-detail ${isResellerMode ? 'skeleton-wholesale-theme' : ''}`} 
      style={{ padding: '2rem 1rem 4rem 1rem', minHeight: '80vh', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="container">
        
        {/* Pulsating logo header */}
        <div className="skeleton-logo-badge" style={{ marginBottom: '1.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Sellos Chacaíto" 
            className={isResellerMode ? "skeleton-logo-img-gold" : "skeleton-logo-img"} 
            style={{ width: '44px', height: '44px' }}
          />
          <span className="skeleton-logo-text" style={{ color: isResellerMode ? '#FFB800' : 'var(--color-text-secondary)' }}>
            Cargando detalles del modelo...
          </span>
        </div>

        {/* Two-column layout matching ProductDetail */}
        <div className="skeleton-detail-grid">
          
          {/* Left Column: Image viewer placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '16px' }} />
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <div className="skeleton-box" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
              <div className="skeleton-box" style={{ width: '60px', height: '60px', borderRadius: '8px' }} />
            </div>
          </div>

          {/* Right Column: Details & Customizer placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category tag */}
            <div className="skeleton-box skeleton-card-line short" style={{ height: '14px', width: '30%' }} />

            {/* Product Title */}
            <div className="skeleton-box skeleton-card-line long" style={{ height: '32px' }} />

            {/* Dimensions */}
            <div className="skeleton-box skeleton-card-line medium" style={{ height: '18px' }} />

            {/* Price Box */}
            <div className="skeleton-box" style={{ width: '140px', height: '38px', borderRadius: '10px' }} />

            {/* Description lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div className="skeleton-box skeleton-card-line long" style={{ height: '12px' }} />
              <div className="skeleton-box skeleton-card-line long" style={{ height: '12px' }} />
              <div className="skeleton-box skeleton-card-line medium" style={{ height: '12px' }} />
            </div>

            {/* Variants swatches placeholder */}
            <div style={{ marginTop: '0.75rem' }}>
              <div className="skeleton-box skeleton-card-line short" style={{ height: '14px', marginBottom: '0.6rem' }} />
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              </div>
            </div>

            {/* CTA Button placeholder */}
            <div className="skeleton-box" style={{ width: '100%', height: '52px', borderRadius: '12px', marginTop: '1rem' }} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailSkeleton;
