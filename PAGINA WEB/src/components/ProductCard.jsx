import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelection } from '../context/SelectionContext';
import LikeButton from './LikeButton';

const formatDimensions = (dim) => {
  if (!dim) return '';
  return dim.replace(/(\d+)\s*[xX*×]\s*(\d+)/g, '$1 × $2').trim();
};

const getFirstAvailableVariantIndex = (vars) => {
  if (!vars || vars.length === 0) return 0;
  const idx = vars.findIndex(v => v.available !== false);
  return idx !== -1 ? idx : 0;
};

const ProductCard = ({ product, isResellerMode = false }) => {
  const { selectedItems, toggleItem } = useSelection();
  const isSelected = selectedItems.some(item => item.id === product.id);
  
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const allVariantsSoldOut = hasVariants && variants.every(v => v.available === false);
  
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(() => getFirstAvailableVariantIndex(product?.variants));
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // App-style Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pull-down-to-close modal state
  const [modalDragY, setModalDragY] = useState(0);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const modalTouchStartY = useRef(0);
  const modalScrollTop = useRef(0);
  const modalContainerRef = useRef(null);

  // Auto-slideshow state (every 1.5s)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // For touch swipes on image
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Actualizar variante seleccionada si cambia el producto
  useEffect(() => {
    if (product?.variants) {
      setSelectedVariantIndex(getFirstAvailableVariantIndex(product.variants));
    }
  }, [product]);

  // Reset auto-play and drag offset when opening modal
  useEffect(() => {
    if (isModalOpen) {
      setIsAutoPlaying(true);
      setModalDragY(0);
    }
  }, [isModalOpen]);

  // Auto-slideshow effect every 1.5s
  useEffect(() => {
    if (!isModalOpen || !isAutoPlaying || !hasVariants || variants.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedVariantIndex((prev) => (prev + 1) % variants.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isModalOpen, isAutoPlaying, hasVariants, variants.length]);

  const stopAutoPlay = () => {
    if (isAutoPlaying) setIsAutoPlaying(false);
  };

  // Pull-down modal gesture handlers
  const onModalTouchStart = (e) => {
    modalTouchStartY.current = e.targetTouches[0].clientY;
    modalScrollTop.current = modalContainerRef.current ? modalContainerRef.current.scrollTop : 0;
    setIsDraggingModal(true);
  };

  const onModalTouchMove = (e) => {
    if (!isDraggingModal) return;
    const currentY = e.targetTouches[0].clientY;
    const deltaY = currentY - modalTouchStartY.current;

    // Solo arrastrar hacia abajo si el scroll interno está en la parte superior
    if (deltaY > 0 && modalScrollTop.current <= 5) {
      setModalDragY(deltaY);
    }
  };

  const onModalTouchEnd = () => {
    setIsDraggingModal(false);
    if (modalDragY > 80) {
      setIsModalOpen(false);
      setModalDragY(0);
    } else {
      setModalDragY(0);
    }
  };

  // Ocultar botón flotante de WhatsApp global mientras el modal esté abierto
  useEffect(() => {
    const fab = document.getElementById('global-whatsapp-fab');
    if (isModalOpen) {
      if (fab) fab.style.display = 'none';
    } else {
      if (fab) fab.style.display = 'flex';
    }
    return () => {
      if (fab) fab.style.display = 'flex';
    };
  }, [isModalOpen]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedVariantIndex]);

  const currentVariant = hasVariants ? variants[selectedVariantIndex] : null;
  const currentImages = currentVariant
    ? (currentVariant.imageUrls && currentVariant.imageUrls.length > 0 ? currentVariant.imageUrls : (currentVariant.imageUrl ? [currentVariant.imageUrl] : []))
    : (product.singleImageUrls && product.singleImageUrls.length > 0 ? product.singleImageUrls : (product.singleImageUrl ? [product.singleImageUrl] : (product.imageUrls || [])));

  const price = isResellerMode ? (product.resellerPrice || Math.round(product.price * 0.8)) : product.price;

  const handleNextImage = (e) => {
    if (e) e.stopPropagation();
    stopAutoPlay();
    if (currentImages.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % currentImages.length);
    } else if (variants.length > 1) {
      const nextVariantIndex = (selectedVariantIndex + 1) % variants.length;
      setSelectedVariantIndex(nextVariantIndex);
      setSelectedImageIndex(0);
    }
  };

  const handlePrevImage = (e) => {
    if (e) e.stopPropagation();
    stopAutoPlay();
    if (currentImages.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    } else if (variants.length > 1) {
      const prevVariantIndex = (selectedVariantIndex - 1 + variants.length) % variants.length;
      setSelectedVariantIndex(prevVariantIndex);
      setSelectedImageIndex(0);
    }
  };

  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    stopAutoPlay();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNextImage(e);
    if (distance < -minSwipeDistance) handlePrevImage(e);
  };

  const handleWhatsApp = (e) => {
    if (e) e.stopPropagation();
    if (!currentVariant) return;
    const isReseller = window.location.pathname.includes('/mayoristas') || isResellerMode;
    let text = isReseller ? `*--- PEDIDO MAYORISTA ---*\n\n` : '';
    text += `Hola, estoy interesado en:\n\n${product.name}\n`;
    if (product.dimensions) text += `Medida: ${formatDimensions(product.dimensions)}\n`;
    text += `Color: ${currentVariant.colorName}\nPrecio: $${price}\n\nQuisiera realizar este pedido.`;
    const url = `https://wa.me/584241345488?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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

  const handleShareWhatsAppLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/productos/${product.id}`;
    const text = `¡Mira este sello en Sellos Chacaíto!\n\n${product.name}\nPrecio: $${product.price}\n\nVer detalles aquí: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setIsShareOpen(false);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/productos/${product.id}`;
    navigator.clipboard.writeText(url);
    setIsShareOpen(false);
  };

  // ----- MINIMALIST CARD (Grid View - Alta Densidad y 2 Columnas en Móvil) -----
  const renderMinimalCard = () => (
    <div 
      className="product-card" 
      onClick={() => setIsModalOpen(true)}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-card)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Contenedor de Imagen Responsivo */}
      <div className="product-card-img-wrap">
        {currentImages.length > 0 ? (
          <img 
            src={currentImages[0]} 
            alt={product.name} 
            style={{ 
              maxHeight: '92%', 
              width: '100%', 
              objectFit: 'contain', 
              userSelect: 'none',
              transition: 'transform 0.2s ease'
            }} 
          />
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Sin foto</span>
        )}
      </div>
      
      {/* Contenido Compacto */}
      <div style={{ padding: '0.55rem 0.65rem 0.7rem 0.65rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          {isResellerMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
              <span style={{ 
                backgroundColor: 'rgba(255, 184, 0, 0.15)', 
                color: '#FFB800', 
                border: '1px solid rgba(255, 184, 0, 0.35)', 
                fontSize: '0.58rem', 
                fontWeight: '800', 
                padding: '0.08rem 0.35rem', 
                borderRadius: '3px',
                letterSpacing: '0.2px'
              }}>
                👑 MAYORISTA
              </span>
            </div>
          )}
          
          <h3 style={{ fontSize: 'clamp(0.82rem, 2.8vw, 0.95rem)', fontWeight: '700', margin: '0 0 0.1rem 0', color: 'var(--color-text-main)', lineHeight: '1.2' }}>
            {product.name}
          </h3>

          {product.dimensions && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
              {formatDimensions(product.dimensions)}
            </span>
          )}
        </div>

        {isResellerMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', textDecoration: 'line-through', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                ${product.price}
              </span>
              <span style={{ color: '#FFB800', fontSize: '0.65rem', fontWeight: '700' }}>
                PVP
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)', fontWeight: '900', color: '#FFB800' }}>
                ${price}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>a tasa BCV</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.2rem)', fontWeight: '800', color: 'var(--color-text-main)' }}>
              ${price}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>a tasa BCV</span>
          </div>
        )}
      </div>
    </div>
  );

  // ----- APP-STYLE MODAL (Detail View) -----
  const renderModal = () => {
    if (!isModalOpen) return null;

    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 99999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0'
      }} onClick={() => setIsModalOpen(false)}>
        
        <div 
          ref={modalContainerRef}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={onModalTouchStart}
          onTouchMove={onModalTouchMove}
          onTouchEnd={onModalTouchEnd}
          style={{
            backgroundColor: 'var(--color-bg-main)',
            width: '100%', maxWidth: '500px',
            maxHeight: '90vh', overflowY: 'auto',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            position: 'relative',
            display: 'flex', flexDirection: 'column',
            transform: modalDragY > 0 ? `translateY(${modalDragY}px)` : 'none',
            transition: isDraggingModal ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: modalDragY === 0 ? 'slideUp 0.25s ease-out' : 'none',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
            touchAction: 'pan-y'
          }}
        >
          {/* Close Handle / Pull Down Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.85rem 0 0.35rem 0', cursor: 'grab' }}>
            <div style={{ width: '42px', height: '5px', backgroundColor: 'var(--color-border)', borderRadius: '10px' }} />
          </div>
          <button 
            onClick={() => setIsModalOpen(false)}
            style={{ position: 'absolute', top: '12px', right: '14px', background: 'var(--color-bg-secondary)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main)', fontSize: '1.25rem', cursor: 'pointer', zIndex: 10 }}
          >
            &times;
          </button>

          {/* Top Actions (Like & Share) */}
          <div style={{ position: 'absolute', top: '12px', left: '14px', zIndex: 10, display: 'flex', gap: '0.4rem' }}>
            <LikeButton productId={product.id} initialLikes={product.likes} />
            <div ref={shareRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsShareOpen(!isShareOpen)}
                style={{
                  backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '50%',
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--color-text-main)'
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
              {isShareOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '0.4rem',
                  backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                  borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex', flexDirection: 'column', minWidth: '150px', zIndex: 20
                }}>
                  <button onClick={handleShareWhatsAppLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-main)', textAlign: 'left', borderBottom: '1px solid var(--color-border)', fontWeight: '600', fontSize: '0.85rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-whatsapp)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-main)', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    Copiar Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Carousel */}
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ 
              height: '300px', backgroundColor: 'transparent', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', borderBottom: '1px solid var(--color-border)'
            }}
          >
            {currentImages.length > 0 ? (
              <>
                {(currentImages.length > 1 || variants.length > 1) && (
                  <button 
                    onClick={handlePrevImage}
                    style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '2rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '1rem', zIndex: 10 }}
                  >
                    ‹
                  </button>
                )}
                
                <img 
                  key={`${selectedVariantIndex}-${selectedImageIndex}`}
                  src={currentImages[selectedImageIndex] || currentImages[0]} 
                  alt={`${product.name} ${currentVariant ? `en ${currentVariant.colorName}` : ''}`} 
                  className="content-fade-in"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem', userSelect: 'none' }} 
                />
                
                {(currentImages.length > 1 || variants.length > 1) && (
                  <button 
                    onClick={handleNextImage}
                    style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '2rem', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '1rem', zIndex: 10 }}
                  >
                    ›
                  </button>
                )}
                {currentImages.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '8px', display: 'flex', gap: '0.4rem', zIndex: 5 }}>
                    {currentImages.map((_, i) => (
                      <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: i === selectedImageIndex ? 'var(--color-primary)' : 'rgba(0,0,0,0.25)' }} />
                    ))}
                  </div>
                )}
                {currentVariant && !currentVariant.available && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                  }}>
                    <span style={{ backgroundColor: 'black', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Agotado
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)' }}>Sin fotos</span>
            )}
          </div>

          {/* Fila de Miniaturas Interactivas (ej. Con tapa / Sin tapa) */}
          {currentImages.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              padding: '0.65rem 0.75rem',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              overflowX: 'auto'
            }}>
              {currentImages.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImageIndex(i)}
                  style={{
                    width: '52px',
                    height: '52px',
                    padding: '3px',
                    borderRadius: '10px',
                    border: i === selectedImageIndex ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-main)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    opacity: i === selectedImageIndex ? 1 : 0.65,
                    boxShadow: i === selectedImageIndex ? '0 2px 8px rgba(71, 255, 0, 0.25)' : 'none'
                  }}
                >
                  <img src={imgUrl} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          {/* Details Body */}
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <div>
                {isResellerMode && (
                  <span style={{ 
                    backgroundColor: 'rgba(255, 184, 0, 0.15)', 
                    color: '#FFB800', 
                    border: '1px solid rgba(255, 184, 0, 0.35)', 
                    fontSize: '0.65rem', 
                    fontWeight: '800', 
                    padding: '0.15rem 0.5rem', 
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '0.35rem',
                    letterSpacing: '0.3px'
                  }}>
                    👑 TARIFA MAYORISTA
                  </span>
                )}
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>{product.name}</h3>
              </div>

              {isResellerMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', color: 'var(--color-text-secondary)' }}>
                      ${product.price}
                    </span>
                    <span style={{ color: '#FFB800', fontSize: '0.7rem', fontWeight: '700' }}>(PVP)</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFB800' }}>
                    ${price}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>a tasa BCV</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
                    ${price}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>a tasa BCV</span>
                </div>
              )}
            </div>
            
            {product.dimensions && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
                Medida: {formatDimensions(product.dimensions)}
              </p>
            )}

            {hasVariants && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                    Color: <strong style={{ color: 'var(--color-text-main)' }}>{currentVariant?.colorName}</strong>
                  </span>
                  {currentVariant?.available === false && (
                    <span style={{ 
                      color: '#EF4444', 
                      backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '0.72rem', 
                      fontWeight: '800', 
                      marginLeft: '0.5rem', 
                      padding: '0.1rem 0.45rem', 
                      borderRadius: '4px' 
                    }}>
                      Agotado
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {variants.map((variant, index) => {
                    const isAvailable = variant.available !== false;
                    const bgStyle = variant.hex2 
                      ? `linear-gradient(135deg, ${variant.hex} 50%, ${variant.hex2} 50%)`
                      : variant.hex;
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          stopAutoPlay();
                          setSelectedVariantIndex(index);
                        }}
                        title={`${variant.colorName}${!isAvailable ? ' (Agotado)' : ''}`}
                        className={`color-circle ${selectedVariantIndex === index ? 'selected' : ''}`}
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: bgStyle,
                          opacity: isAvailable ? 1 : 0.4,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: selectedVariantIndex === index ? '0 0 0 3px var(--color-bg-card), 0 0 0 5px var(--color-primary)' : '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {!isAvailable && (
                          <span style={{
                            position: 'absolute', color: '#FFF', fontSize: '13px', fontWeight: '900',
                            textShadow: '0 0 3px #000, 0 0 2px #000'
                          }}>
                            ✕
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {product.inkColors && product.inkColors.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Tintas disponibles:
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {product.inkColors.map((ink, index) => {
                    const inkHexMap = {
                      'Negro': '#000000',
                      'Azul': '#2563eb',
                      'Rojo': '#dc2626',
                      'Morado': '#9333ea',
                      'Verde': '#16a34a'
                    };
                    const color = inkHexMap[ink] || '#000000';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: '500', color: 'var(--color-text-main)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></span>
                        {ink}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 'auto', paddingBottom: '0.5rem' }}>
              <button 
                onClick={handleWhatsApp} 
                className={isResellerMode ? "btn" : "btn btn-whatsapp"}
                style={{ 
                  width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 'bold',
                  backgroundColor: currentVariant?.available === false 
                    ? '#4B5563' 
                    : isResellerMode ? '#FFB800' : undefined,
                  color: currentVariant?.available === false 
                    ? '#FFF' 
                    : isResellerMode ? '#000' : 'white',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center',
                  borderRadius: '10px', border: 'none'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                {currentVariant?.available === false ? 'Consultar disponibilidad por WhatsApp' : 'Pedir por WhatsApp'}
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(product, currentVariant?.colorName, product.inkColors ? product.inkColors[0] : '');
                }}
                disabled={currentVariant?.available === false}
                className="btn"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.92rem',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? '#1F2329' : 'var(--color-text-secondary)',
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  opacity: currentVariant?.available === false ? 0.4 : 1,
                  cursor: currentVariant?.available === false ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center'
                }}
              >
                {isSelected ? '✓ Añadido al Carrito' : '+ Añadir a mi lista'}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .product-card:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            transform: translateY(-3px);
          }
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <>
      {renderMinimalCard()}
      {renderModal()}
    </>
  );
};

export default ProductCard;
