import React, { useState, useEffect } from 'react';
import { getSliderImages, updateSliderOrder, deleteSliderImage, addSliderImage } from '../../services/db';
import { uploadImage } from '../../services/storage';

const SliderDashboard = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const data = await getSliderImages();
    setImages(data);
    setLoading(false);
  };

  const handleMove = async (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === images.length - 1) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = temp;

    setImages(newImages);

    try {
      await updateSliderOrder(newImages);
    } catch (error) {
      alert("Error al guardar el nuevo orden");
      loadImages();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta imagen del carrusel?')) {
      try {
        await deleteSliderImage(id);
        setImages(images.filter(img => img.id !== id));
      } catch (error) {
        alert("Error al eliminar la imagen");
      }
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, 'slider');
      await addSliderImage({ imageUrl: url, order: images.length });
      loadImages(); // Recargar para obtener el ID de Firestore
    } catch (error) {
      alert('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)' }}>Slider Inicio</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Administra las fotografías que aparecen en la página principal</p>
        </div>
        <label className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', whiteSpace: 'nowrap', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? 'Subiendo...' : '+ Subir Fotografía'}
          <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-main)', borderRadius: '12px', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando imágenes...</div>
        ) : images.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Aún no hay imágenes en el slider. Sube la primera.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', width: '100px' }}>Orden</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Imagen</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {images.map((img, index) => (
                <tr key={img.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '30px' }}>
                      <button onClick={() => handleMove(index, -1)} disabled={index === 0} style={{ padding: '0.2rem', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, border: 'none', background: 'transparent' }}>🔼</button>
                      <button onClick={() => handleMove(index, 1)} disabled={index === images.length - 1} style={{ padding: '0.2rem', cursor: index === images.length - 1 ? 'default' : 'pointer', opacity: index === images.length - 1 ? 0.3 : 1, border: 'none', background: 'transparent' }}>🔽</button>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <img src={img.imageUrl} alt={`Slider ${index}`} style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(img.id)} style={{ padding: '0.5rem 1rem', border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SliderDashboard;
