import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { firestoreDB, db } from '../firebase/config';
import { collection, onSnapshot, doc, writeBatch, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { 
  Search, AlertTriangle, Plus, Edit2, Trash2, Tag, 
  DollarSign, Package, Check, X, TrendingUp, Sparkles,
  Layers, RefreshCw, PanelLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

function Inventory({ isModal = false }) {
  const { toggleSidebar } = useOutletContext() || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [bcvRate, setBcvRate] = useState(36.5);

  // Arrastrar y Desplazar Categorías
  const categoryScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e) => {
    if (!categoryScrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
    setScrollLeftPos(categoryScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) setHasMoved(true);
    categoryScrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!categoryScrollRef.current) return;
    if (e.deltaY !== 0) {
      categoryScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };
  const [wholesaleMultiplier, setWholesaleMultiplier] = useState(0.80);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Instant Product Modal State (New / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    costo: '',
    precio: '',
    precioMayorista: '',
    cantidad: 0,
    minStock: 5,
    activo: true,
    tipo: 'Producto'
  });

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch BCV Rate & Config from Firestore config/general
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(firestoreDB, 'config', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const rate = Number(data.tasa_actual) || Number(data.tasa) || 0;
        if (rate > 0) setBcvRate(rate);
        if (data.multiplicador_mayorista) setWholesaleMultiplier(Number(data.multiplicador_mayorista));
      }
    });
    return () => unsubConfig();
  }, []);

  // Subscribe to Products collection in Firestore
  useEffect(() => {
    const unsubProd = onSnapshot(collection(firestoreDB, 'products'), (snapshot) => {
      const prodData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.tipo === 'Producto' || !p.tipo);
      
      prodData.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading products:", error);
      toast.error('Error al cargar inventario');
      setLoading(false);
    });

    return () => unsubProd();
  }, []);

  // Products matching current search term (regardless of category filter)
  const searchMatchedProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

  // Compute Categories with dynamic matching product count based on current search
  const categories = useMemo(() => {
    const allCatsSet = new Set();
    products.forEach(p => {
      allCatsSet.add((p.categoria || 'SIN CATEGORÍA').trim().toUpperCase());
    });

    const countMap = {};
    searchMatchedProducts.forEach(p => {
      const cat = (p.categoria || 'SIN CATEGORÍA').trim().toUpperCase();
      countMap[cat] = (countMap[cat] || 0) + 1;
    });

    return Array.from(allCatsSet).sort().map(name => ({
      name,
      count: countMap[name] || 0
    }));
  }, [products, searchMatchedProducts]);

  // Final Filtered Products (matching search AND selected category)
  const filteredProducts = useMemo(() => {
    return searchMatchedProducts.filter(p => {
      const pCat = (p.categoria || 'SIN CATEGORÍA').trim().toUpperCase();
      return selectedCategory === 'ALL' || pCat === selectedCategory;
    });
  }, [searchMatchedProducts, selectedCategory]);

  // Quick Direct Stock Update (+ / -)
  const handleDirectUpdate = async (product, newQty) => {
    if (isNaN(newQty) || newQty < 0) {
      toast.error('Cantidad inválida');
      return;
    }
    const currentQty = product.cantidad ?? 0;
    if (newQty === currentQty) return;

    const diff = newQty - currentQty;
    const action = diff > 0 ? 'add' : 'subtract';
    const absDiff = Math.abs(diff);

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, cantidad: newQty } : p));

    try {
      const batch = writeBatch(firestoreDB);
      const prodRef = doc(firestoreDB, 'products', product.id);
      batch.update(prodRef, { cantidad: newQty });

      const movRef = doc(collection(firestoreDB, 'inventory_movements'));
      batch.set(movRef, {
        producto_id: product.id,
        producto_nombre: product.nombre,
        tipo: action,
        cantidad: absDiff,
        stock_anterior: currentQty,
        stock_nuevo: newQty,
        motivo: 'Ajuste rápido desde inventario',
        fecha: new Date().toISOString()
      });

      await batch.commit();
      toast.success(`${product.nombre}: ${newQty} unid.`);
    } catch (error) {
      console.error(error);
      toast.error('Error actualizando stock');
    }
  };

  // Open Modal Instantly
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre || '',
        categoria: (product.categoria || 'SELLOS AUTOMÁTICOS').toUpperCase(),
        costo: product.costo !== undefined && product.costo !== null ? String(product.costo) : '',
        precio: product.precio !== undefined && product.precio !== null ? String(product.precio) : '',
        precioMayorista: product.precioMayorista !== undefined && product.precioMayorista !== null ? String(product.precioMayorista) : '',
        cantidad: product.cantidad !== undefined ? product.cantidad : 0,
        minStock: product.minStock !== undefined ? product.minStock : 5,
        activo: product.activo !== false,
        tipo: 'Producto'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        categoria: categories.length > 0 ? categories[0].name : 'SELLOS AUTOMÁTICOS',
        costo: '',
        precio: '',
        precioMayorista: '',
        cantidad: 0,
        minStock: 5,
        activo: true,
        tipo: 'Producto'
      });
    }
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setIsProductModalOpen(true);
  };

  // Live Profit & Margin Calculations
  const costNum = parseFloat(formData.costo) || 0;
  const priceNum = parseFloat(formData.precio) || 0;
  const profitUSD = Math.max(0, priceNum - costNum);
  const marginPercent = priceNum > 0 ? ((profitUSD / priceNum) * 100).toFixed(1) : 0;
  const autoWholesalePrice = priceNum > 0 ? Number((priceNum * wholesaleMultiplier).toFixed(2)) : 0;

  // Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('Ingresa el nombre del producto');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    const finalCategory = isCreatingCategory && newCategoryName.trim()
      ? newCategoryName.trim().toUpperCase()
      : (formData.categoria || 'GENERAL').trim().toUpperCase();

    const dataToSave = {
      nombre: formData.nombre.trim().toUpperCase(),
      categoria: finalCategory,
      costo: costNum,
      precio: priceNum,
      precioVenta: priceNum, // Compatibility
      precioMayorista: formData.precioMayorista !== '' ? parseFloat(formData.precioMayorista) : autoWholesalePrice,
      cantidad: parseInt(formData.cantidad, 10) || 0,
      minStock: parseInt(formData.minStock, 10) || 5,
      activo: formData.activo,
      tipo: 'Producto',
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    try {
      if (editingProduct) {
        await setDoc(doc(firestoreDB, 'products', editingProduct.id), dataToSave, { merge: true });
        toast.success('Producto actualizado correctamente');
      } else {
        const newRef = doc(collection(firestoreDB, 'products'));
        await setDoc(newRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
        toast.success('Producto creado exitosamente');
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar producto');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) {
      try {
        await deleteDoc(doc(firestoreDB, 'products', id));
        toast.success('Producto eliminado');
        setIsProductModalOpen(false);
      } catch (err) {
        console.error(err);
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: isModal ? '0' : '20px 24px 80px', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      {!isModal && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '22px 28px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {toggleSidebar && !isModal && (
              <button 
                onClick={toggleSidebar} 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Abrir menú"
                type="button"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Inventario & Catálogo
                </h1>
                <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                  BCV: {bcvRate.toFixed(2)} Bs/$
                </span>
              </div>
              <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px', fontWeight: 500 }}>
                {products.length} productos registrados · Control rápido de existencias, precios y categorías
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => handleOpenProductModal(null)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '8px 12px 8px 16px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <Search size={18} color="#64748b" style={{ flexShrink: 0 }} />
        <input 
          type="search" 
          placeholder={`Buscar en ${products.length} productos por nombre o categoría...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            fontWeight: 600,
            color: '#0f172a',
            background: 'transparent'
          }}
        />
        {searchTerm && (
          <button 
            type="button" 
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, padding: '4px' }}
          >
            ✕
          </button>
        )}

        <button 
          type="button"
          onClick={() => handleOpenProductModal(null)}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: 'none',
            background: '#10b981',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Crear un nuevo producto en el catálogo"
        >
          <Plus size={16} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Nuevo Producto</span><span style={{ display: isMobile ? 'inline' : 'none' }}>Nuevo</span>
        </button>
      </div>

      {/* Horizontal Category Filter Pills with Drag & Scroll Controls */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
        <button
          type="button"
          onClick={() => scrollCategories('left')}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Desplazar a la izquierda"
        >
          <ChevronLeft size={18} />
        </button>

        <div 
          ref={categoryScrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            flex: 1,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (hasMoved) return;
              setSelectedCategory('ALL');
            }}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              border: selectedCategory === 'ALL' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
              background: selectedCategory === 'ALL' ? '#ecfdf5' : '#ffffff',
              color: selectedCategory === 'ALL' ? '#065f46' : '#64748b',
              fontSize: '12px',
              fontWeight: 800,
              cursor: isDragging ? 'grabbing' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={13} /> Todas ({searchMatchedProducts.length})
          </button>

          {categories.map(({ name, count }) => {
            const isSelected = selectedCategory === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  if (hasMoved) return;
                  setSelectedCategory(name);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  background: isSelected ? '#ecfdf5' : '#ffffff',
                  color: isSelected ? '#065f46' : '#64748b',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <Tag size={12} /> {name} <span style={{ opacity: 0.7, fontSize: '11px' }}>({count})</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollCategories('right')}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Desplazar a la derecha"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Product List */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: isMobile ? '10px' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1.5rem' }}>⏳</span>
            <p style={{ marginTop: '8px', fontWeight: 700 }}>Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, margin: 0 }}>No se encontraron productos con los filtros actuales</p>
          </div>
        ) : (
          filteredProducts.map(item => {
            const qty = item.cantidad ?? 0;
            const isCritical = qty <= 5;
            const isWarning = qty > 5 && qty <= 10;
            const priceUSD = parseFloat(item.precio || item.precioVenta || 0);
            const priceBs = priceUSD * bcvRate;
            const wholesaleUSD = item.precioMayorista ? parseFloat(item.precioMayorista) : priceUSD * wholesaleMultiplier;

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '12px' : '14px 18px',
                  borderRadius: '14px',
                  border: isCritical ? '1.5px solid #fecaca' : isWarning ? '1.5px solid #fed7aa' : '1px solid #f1f5f9',
                  background: isCritical ? '#fff5f5' : isWarning ? '#fffbeb' : '#ffffff',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                {/* Left: Product Info & Pricing */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: isMobile ? '0.92rem' : '1.02rem',
                      color: '#0f172a',
                      lineHeight: 1.3
                    }}>
                      {item.nombre}
                    </span>

                    {item.categoria && (
                      <span style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {item.categoria}
                      </span>
                    )}

                    {item.activo === false && (
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Pricing & Stock Status Badges Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {/* Standard Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#10b981' }}>
                        ${priceUSD.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                        (Bs. {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    </div>

                    {/* Wholesale Indicator */}
                    <span style={{ fontSize: '0.74rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                      Mayor: ${wholesaleUSD.toFixed(2)}
                    </span>

                    {/* Stock Alert Badge */}
                    {isCritical ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 850
                      }}>
                        <AlertTriangle size={11} /> Crítico (≤5)
                      </span>
                    ) : isWarning ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 850
                      }}>
                        🟡 Por Agotar
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.74rem', fontWeight: 700 }}>
                        ✓ En stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Quantity Adjuster + Edit Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Stock Counter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleDirectUpdate(item, Math.max(0, qty - 1))}
                      title="Restar 1"
                      style={{
                        width: '30px',
                        height: '34px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>

                    <input 
                      type="number"
                      inputMode="numeric"
                      defaultValue={qty}
                      key={item.id + '_' + qty}
                      onFocus={(e) => e.target.select()}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val !== qty) {
                          handleDirectUpdate(item, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      title="Escribe la cantidad para actualizar"
                      style={{
                        width: '54px',
                        height: '34px',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: isCritical ? '#dc2626' : isWarning ? '#b45309' : '#0f172a',
                        borderRadius: '6px',
                        border: isCritical ? '2px solid #fca5a5' : isWarning ? '2px solid #fde68a' : '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleDirectUpdate(item, qty + 1)}
                      title="Sumar 1"
                      style={{
                        width: '30px',
                        height: '34px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* ✏️ Direct Edit Button (Instant 0ms) */}
                  <button
                    type="button"
                    onClick={() => handleOpenProductModal(item)}
                    title="Editar producto completo"
                    style={{
                      width: '36px',
                      height: '34px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ecfdf5';
                      e.currentTarget.style.color = '#065f46';
                      e.currentTarget.style.borderColor = '#a7f3d0';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================== INSTANT PRODUCT MODAL ===================== */}
      {isProductModalOpen && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setIsProductModalOpen(false)}
          style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              maxWidth: '540px',
              width: '95%',
              padding: '0',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: '#f8fafc',
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#10b981', color: '#fff', borderRadius: '8px', padding: '6px', display: 'grid', placeItems: 'center' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Ajusta nombre, categoría, precios y existencia
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsProductModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProduct} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Nombre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  Nombre del Producto *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. ALMOHADILLA COLOP E-20"
                  value={formData.nombre}
                  onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Categoría (Select + Crear al vuelo) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    Categoría *
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    {isCreatingCategory ? '✕ Usar existentes' : '+ Nueva Categoría'}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <input 
                    type="text"
                    placeholder="Escribe el nombre de la nueva categoría..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
                    autoFocus
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #10b981',
                      background: '#f0fdf4',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#065f46',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <select 
                    value={formData.categoria}
                    onChange={e => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  >
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    {categories.length === 0 && <option value="SELLOS AUTOMÁTICOS">SELLOS AUTOMÁTICOS</option>}
                  </select>
                )}
              </div>

              {/* Precios: Costo & Precio Detal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    Costo Proveedor ($ USD)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.costo}
                    onChange={e => setFormData(prev => ({ ...prev, costo: e.target.value }))}
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    ≈ Bs. {(costNum * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    Precio de Venta ($ USD) *
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.precio}
                    onChange={e => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #10b981',
                      background: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 900,
                      color: '#10b981',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                    ≈ Bs. {(priceNum * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Margen de Ganancia & Precio Mayorista */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} color="#10b981" /> Margen de Ganancia:
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: profitUSD > 0 ? '#10b981' : '#64748b' }}>
                    +${profitUSD.toFixed(2)} ({marginPercent}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                      ⭐ Precio Mayorista ($ USD):
                    </span>
                    <span style={{ fontSize: '11px', color: '#92400e' }}>
                      Sugerido 20% desc: ${autoWholesalePrice.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#92400e', fontSize: '13px' }}>$</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={autoWholesalePrice.toFixed(2)}
                      value={formData.precioMayorista}
                      onChange={e => setFormData(prev => ({ ...prev, precioMayorista: e.target.value }))}
                      style={{
                        width: '80px',
                        height: '32px',
                        padding: '0 8px',
                        borderRadius: '6px',
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#92400e',
                        textAlign: 'right',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stock / Cantidad, Stock Mínimo & Estado Activo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    Stock / Cantidad *
                  </label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={formData.cantidad}
                    onChange={e => setFormData(prev => ({ ...prev, cantidad: parseInt(e.target.value, 10) || 0 }))}
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                    Alerta Stock Mínimo
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={e => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value, 10) || 1 }))}
                    placeholder="5"
                    style={{
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none'
                    }}
                    title="Cantidad por debajo de la cual se marcará en amarillo como 'Por Agotar'"
                  />
                </div>
              </div>

              {/* Estado del Producto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  Estado del Producto
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    border: formData.activo ? '1.5px solid #a7f3d0' : '1.5px solid #fecaca',
                    background: formData.activo ? '#ecfdf5' : '#fef2f2',
                    color: formData.activo ? '#065f46' : '#dc2626',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {formData.activo ? '✓ Activo para Venta en POS y Catálogo' : '✕ Oculto / Inactivo'}
                </button>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.nombre)}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={15} /> Eliminar
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      background: isSaving ? '#94a3b8' : '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 22px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <Check size={16} /> {isSaving ? 'Guardando...' : 'Guardar Producto'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default Inventory;
