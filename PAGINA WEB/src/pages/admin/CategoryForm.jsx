import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCategoryById, addCategory, updateCategory } from '../../services/db';
import { uploadImage } from '../../services/storage';

const CategoryForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    const fetchCategory = async () => {
      if (isEditing) {
        const cat = await getCategoryById(id);
        if (cat) {
          setFormData({
            id: cat.id,
            name: cat.name || cat.label || '',
            description: cat.description || '',
            imageUrl: cat.imageUrl || ''
          });
        }
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Si edita el nombre y no es edición, autogenerar ID
    if (name === 'name' && !isEditing) {
      const generatedId = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, name: value, id: generatedId }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'categories');
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      alert('Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      alert('El ID es obligatorio');
      return;
    }
    
    setSaving(true);
    try {
      const { id: categoryId, ...dataToSave } = formData;
      if (isEditing) {
        await updateCategory(categoryId, dataToSave);
      } else {
        await addCategory(dataToSave, categoryId); // Usar el ID como document ID
      }
      navigate('/admin/categorias');
    } catch (error) {
      console.error(error);
      alert('Error al guardar categoría');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/admin/categorias" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: '1.25rem' }}>←</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Nombre de Categoría</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="Ej: Sellos Automáticos" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>ID (URL Amigable)</label>
          <input type="text" name="id" value={formData.id} onChange={(e) => setFormData(prev => ({...prev, id: e.target.value}))} required disabled={isEditing} style={{...inputStyle, backgroundColor: isEditing ? '#f3f4f6' : 'white', color: isEditing ? '#9ca3af' : 'inherit'}} placeholder="ej: automaticos" />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Este será el enlace en el catálogo (ej: ?categoria=automaticos).</p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Descripción Breve</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required style={inputStyle} placeholder="Ej: Prácticos y de uso continuo" maxLength="60" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Imagen Principal</label>
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              padding: '1.5rem', 
              border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--color-border)'}`, 
              borderRadius: '8px', textAlign: 'center', 
              backgroundColor: dragActive ? '#f0fdf4' : 'var(--color-bg-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {formData.imageUrl ? (
              <div>
                <img src={formData.imageUrl} alt="Preview" style={{ height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
                <div>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))} className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)' }}>Quitar Imagen</button>
                </div>
              </div>
            ) : uploadingImage ? (
              <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Subiendo imagen...</p>
            ) : (
              <label style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '600', display: 'block', padding: '1rem 0' }}>
                Haz clic o arrastra una foto aquí
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving || uploadingImage} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.125rem' }}>
          {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Categoría')}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  fontSize: '1rem',
  fontFamily: 'inherit'
};

export default CategoryForm;
