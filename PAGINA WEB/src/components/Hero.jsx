import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSliderImages } from '../services/db';

const Hero = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      const data = await getSliderImages();
      setImages(data);
    };
    fetchImages();
  }, []);

  return (
    <section className="hero">
      <div className="container hero-content">
        <h1 className="hero-title">
          Sellos personalizados <span className="text-primary">hechos en Caracas</span>
        </h1>
        <p className="hero-description">
          Sellos automáticos, de bolsillo, madera y sellos secos. Diseñamos tu sello antes de fabricar para verificar que toda la información quede correctamente.
        </p>
        <div className="hero-actions">
          <Link to="/" className="btn btn-primary">Ver catálogo</Link>
          <a href="https://wa.me/584241345488" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">Pedir por WhatsApp</a>
        </div>
        
        {/* Slider de Trabajos Recientes */}
        {images.length > 0 ? (
          <div className="hero-slider" style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            width: '100%', 
            gap: '1rem', 
            padding: '1rem 0',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* IE */
          }}>
            {images.map((img) => (
              <img 
                key={img.id} 
                src={img.imageUrl} 
                alt="Trabajo de Sellos Chacaito" 
                style={{ 
                  scrollSnapAlign: 'center', 
                  flex: '0 0 80%', 
                  maxWidth: '500px', 
                  height: '300px', 
                  objectFit: 'cover', 
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="hero-image-placeholder">
            <span className="placeholder-text">Fotografía Profesional de Productos</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
