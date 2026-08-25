import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProductById, addProduct, updateProduct, getCategories } from '../../services/db';
import { uploadImage } from '../../services/storage';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);
  const [uploadingSingleImage, setUploadingSingleImage] = useState(false);

  // Toggle states for optional sections
  const [hasDimensions, setHasDimensions] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [hasInkColors, setHasInkColors] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dimensions: '',
    price: '',
    category: 'automaticos',
    shortDescription: '',
    variants: [],
    inkColors: ['Negro'],
    resellerPrice: '',
    singleImageUrl: ''  // For products without color variants
  });

  const AVAILABLE_INKS = ['Negro', 'Azul', 'Rojo', 'Morado', 'Verde'];

  useEffect(() => {
    const fetchInitData = async () => {
      const cats = await getCategories();
      setCategories(cats.filter(c => c.id !== 'todos'));

      if (isEditing) {
        const prod = await getProductById(id);
        if (prod) {
          setFormData({
            ...prod,
            variants: prod.variants || [],
            inkColors: prod.inkColors || ['Negro'],
            singleImageUrl: prod.singleImageUrl || ''
          });
          // Auto-detect toggles from existing data
          if (prod.dimensions && prod.dimensions.trim()) setHasDimensions(true);
          if (prod.variants && prod.variants.length > 0) setHasVariants(true);
          if (prod.inkColors && prod.inkColors.length > 0) setHasInkColors(true);
        }
        setLoading(false);
      }
    };
    fetchInitData();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let updates = { [name]: type === 'checkbox' ? checked : value };
    
    // Si cambian el precio normal, autocalcular el precio revendedor
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updates.resellerPrice = Math.round(numValue * 0.8).toString();
      } else {
        updates.resellerPrice = '';
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Manejo de Tintas
  const handleInkChange = (inkColor) => {
    const currentInks = formData.inkColors || [];
    if (currentInks.includes(inkColor)) {
      setFormData({ ...formData, inkColors: currentInks.filter(c => c !== inkColor) });
    } else {
      setFormData({ ...formData, inkColors: [...currentInks, inkColor] });
    }
  };

  // Manejo de Variantes
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { colorName: '', hex: '#000000', hex2: '', imageUrl: '', available: true }]
    });
  };
  
  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== index) });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(formData.variants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormData({ ...formData, variants: items });
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingVariantIndex(index);
    try {
      const url = await uploadImage(file, 'products');
      const currentVariant = formData.variants[index];
      const currentImages = currentVariant.imageUrls || (currentVariant.imageUrl ? [currentVariant.imageUrl] : []);
      const newImages = [...currentImages, url];
      
      const newVariants = [...formData.variants];
      newVariants[index].imageUrls = newImages;
      if (!currentVariant.imageUrl) {
        newVariants[index].imageUrl = url;
      }
      setFormData({ ...formData, variants: newVariants });
    } catch (error) {
      alert('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploadingVariantIndex(null);
    }
  };

  // Single image upload (no variants)
  const handleSingleImageUpload = async (file) => {
    if (!file) return;
    setUploadingSingleImage(true);
    try {
      const url = await uploadImage(file, 'products');
      setFormData({ ...formData, singleImageUrl: url });
    } catch (error) {
      alert('Error al subir la imagen.');
    } finally {
      setUploadingSingleImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasVariants) {
      const missingPhotos = formData.variants.some(v => !v.imageUrl);
      if (missingPhotos) {
        alert("Asegúrate de que todas las variantes tengan una foto.");
        return;
      }
    }

    setSaving(true);
    
    const cleanedData = {
      ...formData,
      price: Number(formData.price),
      resellerPrice: Number(formData.resellerPrice),
      // If dimensions toggle is off, clear dimensions
      dimensions: hasDimensions ? formData.dimensions : '',
      // If variants toggle is off, clear variants
      variants: hasVariants ? formData.variants : [],
      // If ink colors toggle is off, clear ink colors
      inkColors: hasInkColors ? formData.inkColors : [],
    };

    // Remove capacity, featured, showOnHome — they no longer exist in the form
    delete cleanedData.capacity;
    delete cleanedData.featured;
    delete cleanedData.showOnHome;

    try {
      if (isEditing) {
        await updateProduct(id, cleanedData);
      } else {
        await addProduct(cleanedData);
      }
      navigate('/admin');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>←</Link>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* === UNIVERSAL FIELDS === */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem' }}>Nombre / Modelo *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="Ej: Trodat 4911" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem' }}>Categoría *</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name || c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem' }}>Precio ($) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required style={inputStyle} min="0" step="0.1" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-primary)' }}>Precio Mayorista ($)</label>
              <input type="number" name="resellerPrice" value={formData.resellerPrice} onChange={handleChange} style={inputStyle} min="0" step="0.1" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '700', fontSize: '0.85rem' }}>Descripción Corta *</label>
            <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} required style={inputStyle} maxLength="70" placeholder="Ej: Práctico y de uso continuo" />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{(formData.shortDescription || '').length}/70</span>
          </div>
        </div>

        {/* === OPTIONAL SECTIONS WITH TOGGLES === */}

        {/* Toggle: Dimensions */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <label className="admin-toggle">
            <input type="checkbox" checked={hasDimensions} onChange={(e) => setHasDimensions(e.target.checked)} />
            <div>
              <span className="toggle-label">📏 ¿Tiene dimensiones?</span>
              <span className="toggle-desc">Activar si el producto tiene medidas (ej: 38 × 14 mm)</span>
            </div>
          </label>
          <div className={`admin-collapsible ${hasDimensions ? 'expanded' : ''}`}>
            <input 
              type="text" 
              name="dimensions" 
              value={formData.dimensions} 
              onChange={handleChange} 
              style={inputStyle} 
              placeholder="Ej: 38 × 14 mm" 
            />
          </div>
        </div>

        {/* Toggle: Ink Colors */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <label className="admin-toggle">
            <input type="checkbox" checked={hasInkColors} onChange={(e) => setHasInkColors(e.target.checked)} />
            <div>
              <span className="toggle-label">🖌️ ¿Tiene opciones de tinta?</span>
              <span className="toggle-desc">Para sellos que usan almohadilla de tinta</span>
            </div>
          </label>
          <div className={`admin-collapsible ${hasInkColors ? 'expanded' : ''}`}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {AVAILABLE_INKS.map((ink) => (
                <label key={ink} style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', 
                  padding: '0.45rem 0.8rem', border: '1px solid var(--color-border)', borderRadius: '8px', 
                  backgroundColor: formData.inkColors?.includes(ink) ? 'var(--color-bg-secondary)' : 'transparent',
                  fontSize: '0.85rem', fontWeight: '600', minHeight: '44px'
                }}>
                  <input 
                    type="checkbox" 
                    checked={formData.inkColors?.includes(ink) || false} 
                    onChange={() => handleInkChange(ink)} 
                  />
                  {ink}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Toggle: Color Variants */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <label className="admin-toggle">
            <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />
            <div>
              <span className="toggle-label">🎨 ¿Viene en varios colores?</span>
              <span className="toggle-desc">Cada color tendrá su propia foto</span>
            </div>
          </label>
          <div className={`admin-collapsible ${hasVariants ? 'expanded' : ''}`}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="variants">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.variants.map((variant, index) => (
                      <Draggable key={index.toString()} draggableId={`variant-${index}`} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            style={{ ...provided.draggableProps.style, padding: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '10px', backgroundColor: 'var(--color-bg-secondary)' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0.15rem', color: 'var(--color-text-secondary)' }} title="Arrastrar para reordenar">
                                  ⠿
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Color {index + 1}</span>
                              </div>
                              <button type="button" onClick={() => removeVariant(index)} style={{ color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', padding: '0.25rem' }}>Quitar</button>
                            </div>
                  
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', gap: '0.6rem', marginBottom: '0.75rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: '600' }}>Nombre</label>
                                <input type="text" value={variant.colorName} onChange={(e) => updateVariant(index, 'colorName', e.target.value)} style={{...inputStyle, padding: '0.6rem'}} required placeholder="Azul" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: '600' }}>Color</label>
                                <input type="color" value={variant.hex} onChange={(e) => updateVariant(index, 'hex', e.target.value)} style={{ width: '100%', height: '38px', padding: '0.15rem', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: '600' }}>C2</label>
                                <div style={{ position: 'relative' }}>
                                  <input type="color" value={variant.hex2 || '#ffffff'} onChange={(e) => updateVariant(index, 'hex2', e.target.value)} style={{ width: '100%', height: '38px', padding: '0.15rem', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', opacity: variant.hex2 ? 1 : 0.3 }} />
                                  {!variant.hex2 && (
                                    <button type="button" onClick={() => updateVariant(index, 'hex2', '#000000')} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Añadir segundo color" />
                                  )}
                                  {variant.hex2 && (
                                    <button type="button" onClick={() => updateVariant(index, 'hex2', '')} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '9px', cursor: 'pointer' }}>X</button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Photo upload zone */}
                            <div style={{ marginBottom: '0.5rem', padding: '0.75rem', border: '2px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--color-bg-card)' }}>
                              {(() => {
                                const currentImages = variant.imageUrls || (variant.imageUrl ? [variant.imageUrl] : []);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {currentImages.length > 0 && (
                                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        {currentImages.map((imgUrl, i) => (
                                          <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={imgUrl} alt={`Preview ${i}`} style={{ height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                                            <button 
                                              type="button" 
                                              onClick={() => {
                                                const newImages = currentImages.filter((_, idx) => idx !== i);
                                                const newVariants = [...formData.variants];
                                                newVariants[index].imageUrls = newImages;
                                                newVariants[index].imageUrl = newImages[0] || '';
                                                setFormData({ ...formData, variants: newVariants });
                                              }}
                                              style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'black', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                                            >X</button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {uploadingVariantIndex === index ? (
                                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.82rem' }}>Subiendo...</span>
                                    ) : (
                                      <label style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.82rem', display: 'block', padding: '0.5rem 0' }}>
                                        {currentImages.length > 0 ? "+ Otra foto" : "📸 Subir foto"}
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          style={{ display: 'none' }} 
                                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                                        />
                                      </label>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                              <input type="checkbox" checked={variant.available} onChange={(e) => updateVariant(index, 'available', e.target.checked)} />
                              Hay stock
                            </label>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button type="button" onClick={addVariant} className="btn" style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', fontSize: '0.85rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent', borderRadius: '8px', fontWeight: '700', width: '100%', minHeight: '44px' }}>
              + Agregar Color
            </button>
          </div>
        </div>

        {/* Single Photo Upload (when no variants) */}
        {!hasVariants && (
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', fontSize: '0.85rem' }}>📸 Foto del Producto</label>
            <div style={{ padding: '1rem', border: '2px dashed var(--color-border)', borderRadius: '10px', textAlign: 'center', backgroundColor: 'var(--color-bg-secondary)' }}>
              {formData.singleImageUrl ? (
                <div>
                  <img src={formData.singleImageUrl} alt="Preview" style={{ height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }} />
                  <div>
                    <button type="button" onClick={() => setFormData({...formData, singleImageUrl: ''})} className="btn" style={{ padding: '0.4rem 0.8rem', border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)', fontSize: '0.82rem', borderRadius: '8px' }}>Quitar</button>
                  </div>
                </div>
              ) : uploadingSingleImage ? (
                <p style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.85rem' }}>Subiendo imagen...</p>
              ) : (
                <label style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '700', display: 'block', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                  📸 Toca para subir foto
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSingleImageUpload(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <button 
          type="submit" 
          disabled={saving || uploadingVariantIndex !== null || uploadingSingleImage} 
          className="btn btn-primary" 
          style={{ 
            padding: '1rem', fontSize: '1rem', fontWeight: '800', borderRadius: '12px',
            opacity: (saving || uploadingVariantIndex !== null || uploadingSingleImage) ? 0.7 : 1,
            minHeight: '52px'
          }}
        >
          {saving ? 'Guardando...' : (isEditing ? '💾 Guardar Cambios' : '✅ Crear Producto')}
        </button>

      </form>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  minHeight: '44px',
  boxSizing: 'border-box'
};

export default ProductForm;
