import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

function ImageViewer({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50; 

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out'
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent modal behind it from closing
        onClose();
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          color: 'white', padding: '0.5rem', borderRadius: '50%',
          cursor: 'pointer', zIndex: 10000
        }}
      >
        <X size={24} />
      </button>

      {images.length > 1 && currentIndex > 0 && (
        <button 
          onClick={handlePrev}
          style={{
            position: 'absolute', left: '1rem',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'white', padding: '0.5rem', borderRadius: '50%',
            cursor: 'pointer', zIndex: 10000
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src={currentImage.url} 
          alt={currentImage.label || 'Imagen'} 
          style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
          onClick={(e) => e.stopPropagation()} 
        />
        {currentImage.label && (
          <div style={{
            position: 'absolute', bottom: '-2.5rem',
            color: 'white', fontWeight: 'bold', fontSize: '0.9rem',
            background: 'rgba(255,255,255,0.2)', padding: '0.25rem 1rem',
            borderRadius: '1rem', backdropFilter: 'blur(4px)'
          }}>
            {currentImage.label}
          </div>
        )}
      </div>

      {images.length > 1 && currentIndex < images.length - 1 && (
        <button 
          onClick={handleNext}
          style={{
            position: 'absolute', right: '1rem',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'white', padding: '0.5rem', borderRadius: '50%',
            cursor: 'pointer', zIndex: 10000
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: '1rem',
          display: 'flex', gap: '0.5rem', zIndex: 10000
        }}>
          {images.map((_, idx) => (
            <div 
              key={idx}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageViewer;
