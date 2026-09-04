import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Check, 
  Sparkles, 
  DollarSign, 
  Receipt,
  ShoppingCart,
  Percent,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Banknote,
  Package,
  Layers,
  Split,
  ShoppingBag,
  Camera,
  Image as ImageIcon,
  Bike,
  Truck,
  ExternalLink,
  Clock
} from 'lucide-react';
import { firestoreDB, db } from '../firebase/config';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, update, get, query, limitToLast, orderByKey, child, runTransaction } from 'firebase/database';
import { normalizeWhatsApp, formatDisplayPhone } from '../utils/formatters';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import PrintNotaModal from './PrintNotaModal';
import { syncClientStatsToFirestore } from '../utils/crmUtils';
import { compressImageToBase64 } from '../utils/imageUtils';

function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

import { useProfile } from '../contexts/ProfileContext';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default function POSModal({ order = null, onClose, onSuccess }) {
  const { activeProfile } = useProfile();
  // Responsive mobile detector
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Step state: 1 = CLIENTE, 2 = PRODUCTOS, 3 = COBRAR
  const [step, setStep] = useState(order?.items?.length > 0 ? 2 : 1);

  // Global BCV rate state
  const [globalBcvRate, setGlobalBcvRate] = useState(order?.tasaBCV || 787.5196);
  const [loadingRate, setLoadingRate] = useState(false);

  // Client Data
  const [client, setClient] = useState({
    id: '',
    nombre: order?.clientName || '',
    rif: order?.clientRif || order?.rif || '',
    whatsapp: formatDisplayPhone(order?.whatsapp || ''),
    direccion: order?.clientAddress || order?.address || '',
    tipo: order?.clientType || order?.tipo || 'normal'
  });

  // Client Search Autocomplete & Keyboard Navigation
  const [clientSearch, setClientSearch] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);

  // Wholesale multiplier from system configuration
  const [wholesaleMultiplier, setWholesaleMultiplier] = useState(0.80);

  // Products & Categories
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  // Sale Items in Cart
  const [items, setItems] = useState(() => {
    if (order?.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map(it => ({
        ...it,
        nombre: (it.nombre || '').toUpperCase(),
        cantidad: it.cantidad || 1,
        precioUSD: it.precioUSD || 0,
        tasaBCV: it.tasaBCV || globalBcvRate
      }));
    }
    return [];
  });

  // Payment & Settings
  const [isMixedPayment, setIsMixedPayment] = useState(() => {
    return Boolean(order?.paymentBreakdown && order.paymentBreakdown.length > 1) || order?.paymentMethod === 'Pago Mixto';
  });
  const [paymentMethod, setPaymentMethod] = useState(order?.paymentMethod || 'Pago Móvil');
  const [paymentRef, setPaymentRef] = useState(order?.paymentRef || '');
  
  // Mixed Payment entries
  const [paymentEntries, setPaymentEntries] = useState(() => {
    if (order?.paymentBreakdown && Array.isArray(order.paymentBreakdown) && order.paymentBreakdown.length > 0) {
      return order.paymentBreakdown.map((p, idx) => ({
        id: p.id || `entry_${idx}_${Date.now()}`,
        method: p.method || 'Pago Móvil',
        amountUSD: p.amountUSD !== undefined ? p.amountUSD : '',
        amountBs: p.amountBs !== undefined ? p.amountBs : '',
        ref: p.ref || ''
      }));
    }
    return [
      { id: 'entry_1', method: 'Pago Móvil', amountUSD: '', amountBs: '', ref: '' },
      { id: 'entry_2', method: 'Efectivo USD', amountUSD: '', amountBs: '', ref: '' }
    ];
  });

  const [incluyeIVA, setIncluyeIVA] = useState(order?.incluyeIVA || false);
  const [orderNumber, setOrderNumber] = useState(order?.orderNumber || '');
  const [designer, setDesigner] = useState(() => {
    if (order?.designer) return order.designer.toUpperCase();
    if (activeProfile?.name) return activeProfile.name.toUpperCase();
    return 'ALVARO';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery & Shipping state (Punto 1)
  const [hasDelivery, setHasDelivery] = useState(() => {
    if (order?.hasDelivery !== undefined) return Boolean(order.hasDelivery);
    if (order?.deliveryType && order.deliveryType !== 'pickup') return true;
    return false;
  });
  const [deliveryType, setDeliveryType] = useState(() => {
    if (order?.deliveryType && order.deliveryType !== 'pickup') return order.deliveryType;
    return 'motorizado'; // 'motorizado' | 'mrw' | 'zoom'
  });
  const [deliveryAddress, setDeliveryAddress] = useState(order?.deliveryAddress || order?.clientAddress || '');
  const [deliveryMapsLink, setDeliveryMapsLink] = useState(order?.mapsLink || '');
  const [shippingAgency, setShippingAgency] = useState(order?.shippingAgency || '');
  const [shippingCity, setShippingCity] = useState(order?.shippingCity || '');

  useEffect(() => {
    if (client?.direccion && !deliveryAddress) {
      setDeliveryAddress(client.direccion);
    }
    if (client?.mapsLink && !deliveryMapsLink) {
      setDeliveryMapsLink(client.mapsLink);
    }
  }, [client?.direccion, client?.mapsLink]);

  // Optional payment photo state
  const [paymentPhoto, setPaymentPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // After-sale printable modal
  const [savedOrderForPrint, setSavedOrderForPrint] = useState(null);

  // Handle optional payment proof photo upload
  const [isDragOver, setIsDragOver] = useState(false);

  const processPaymentFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Por favor adjunta una imagen válida");
      return;
    }
    setUploadingPhoto(true);
    try {
      const base64 = await compressImageToBase64(file);
      setPaymentPhoto(base64);
      toast.success("Foto del pago cargada correctamente");
    } catch (err) {
      console.error("Error procesando foto de pago:", err);
      toast.error("Error al procesar la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePaymentPhotoChange = (e) => {
    processPaymentFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPaymentFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 3) return; // Solo escuchar pegar en el paso 3 (pago)
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processPaymentFile(file);
            break;
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [step]);


  // Fetch Global BCV Rate
  const fetchGlobalRate = async (force = false) => {
    setLoadingRate(true);
    try {
      const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        const rate = Number(d.promedio);
        if (Number.isFinite(rate) && rate > 0) {
          if (force || !order?.tasaBCV) {
            setGlobalBcvRate(rate);
            setItems(prev => prev.map(it => ({ ...it, tasaBCV: rate })));
          }
        }
      }
    } catch (e) {
      console.warn("Using fallback rate", e);
    } finally {
      setLoadingRate(false);
    }
  };

  // Initial Data Fetching
  useEffect(() => {
    fetchGlobalRate();

    // Fetch Wholesale config multiplier
    getDoc(doc(firestoreDB, 'config', 'general')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.multiplicador_mayorista) {
          setWholesaleMultiplier(Number(data.multiplicador_mayorista) || 0.80);
        }
      }
    }).catch(err => console.warn("Error loading general config:", err));

    // Fetch Clients
    getDocs(collection(firestoreDB, 'clients')).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllClients(list);
    }).catch(err => console.error("Error loading clients:", err));

    // Fetch Products (Filter based on stock availability)
    getDocs(collection(firestoreDB, 'products')).then(snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.tipo !== 'Producto' || (p.cantidad !== undefined && p.cantidad > 0));
      setAllProducts(list);
    }).catch(err => console.error("Error loading products:", err));

    // Load existing payment photo if editing an existing order
    if (order?.id) {
      get(child(ref(db), `orderAssets/fina_receipt/${order.id}/fullDataUrl`)).then(snap => {
        if (snap.exists()) {
          setPaymentPhoto(snap.val());
        }
      }).catch(err => console.warn("Error loading receipt photo:", err));
    }
  }, []);

  // Filter clients on search
  useEffect(() => {
    if (!clientSearch.trim()) {
      setFilteredClients([]);
      setSelectedClientIndex(-1);
      return;
    }
    const q = clientSearch.toLowerCase();
    const matches = allClients.filter(c => 
      c.nombre?.toLowerCase().includes(q) ||
      c.rif?.toLowerCase().includes(q) ||
      c.whatsapp?.includes(q)
    ).slice(0, 8);
    setFilteredClients(matches);
    setSelectedClientIndex(matches.length > 0 ? 0 : -1);
  }, [clientSearch, allClients]);

  // Keyboard navigation for client search (Tab, ArrowDown, ArrowUp, Enter)
  const handleClientSearchKeyDown = (e) => {
    if (!showClientDropdown || filteredClients.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowClientDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedClientIndex(prev => (prev + 1) % filteredClients.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedClientIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      const targetIdx = selectedClientIndex >= 0 ? selectedClientIndex : 0;
      if (filteredClients[targetIdx]) {
        e.preventDefault();
        handleSelectClient(filteredClients[targetIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowClientDropdown(false);
    }
  };

  // Extract Categories
  const categories = useMemo(() => {
    const setCats = new Set(['TODOS']);
    allProducts.forEach(p => {
      if (p.categoria) setCats.add(p.categoria.toUpperCase().trim());
    });
    return Array.from(setCats);
  }, [allProducts]);

  // Filter Products by search & category
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter(p => {
      const matchCat = selectedCategory === 'TODOS' || (p.categoria && p.categoria.toUpperCase().trim() === selectedCategory);
      if (!matchCat) return false;
      if (!q) return true;
      return (
        p.nombre?.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      );
    });
  }, [allProducts, productSearch, selectedCategory]);

  // Select client from autocomplete
  const handleSelectClient = (c) => {
    const isMayorista = c.tipo === 'mayorista' || c.isWholesale === true;
    setClient({
      id: c.id || '',
      nombre: (c.nombre || '').toUpperCase(),
      rif: (c.rif || c.cedula || '').toUpperCase(),
      whatsapp: formatDisplayPhone(c.whatsapp || c.telefono || ''),
      direccion: (c.direccion || '').toUpperCase(),
      tipo: isMayorista ? 'mayorista' : 'normal'
    });
    setClientSearch('');
    setShowClientDropdown(false);
    setSelectedClientIndex(-1);
    toast.success(`Cliente "${(c.nombre || '').toUpperCase()}" seleccionado ${isMayorista ? '(⭐ Mayorista 0.8x)' : ''}`);
  };

  // RIF parser & selector handlers
  const parseRif = (rifStr = '') => {
    const clean = (rifStr || '').trim().toUpperCase();
    const match = clean.match(/^([VEJGCP])[- ]*(.*)$/);
    if (match) {
      return { prefix: match[1], number: match[2] };
    }
    return { prefix: 'V', number: clean };
  };

  const rifData = parseRif(client.rif);

  const handleRifPrefixChange = (newPrefix) => {
    const currentNum = rifData.number;
    const updated = currentNum ? `${newPrefix}${currentNum}` : newPrefix;
    setClient(prev => ({ ...prev, rif: updated }));
  };

  const handleRifNumberChange = (val) => {
    const upper = val.toUpperCase().trim();
    const match = upper.match(/^([VEJGCP])[- ]*(.*)$/);
    if (match) {
      setClient(prev => ({ ...prev, rif: `${match[1]}${match[2]}` }));
    } else {
      const updated = upper ? `${rifData.prefix}${upper}` : '';
      setClient(prev => ({ ...prev, rif: updated }));
    }
  };

  const isWholesale = client?.tipo === 'mayorista';
  const effectiveMultiplier = isWholesale ? (Number(wholesaleMultiplier) || 0.80) : 1;

  // Add Product to Cart
  const handleAddProduct = (prod) => {
    const existingIndex = items.findIndex(it => it.productId === prod.id);
    if (existingIndex >= 0) {
      // Increase qty
      setItems(prev => {
        const updated = [...prev];
        updated[existingIndex].cantidad = (updated[existingIndex].cantidad || 1) + 1;
        return updated;
      });
      toast.success(`+1 ${prod.nombre}`);
    } else {
      const baseRawPrice = parseNum(prod.precio || prod.precioVenta || 0);
      let priceUSD = baseRawPrice;
      if (isWholesale) {
        if (prod.precioMayorista && Number(prod.precioMayorista) > 0) {
          priceUSD = Number(prod.precioMayorista);
        } else {
          priceUSD = Number((baseRawPrice * effectiveMultiplier).toFixed(2));
        }
      }
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: prod.id || '',
        nombre: (prod.nombre || 'PRODUCTO').toUpperCase(),
        cantidad: 1,
        precioUSD: priceUSD,
        tasaBCV: globalBcvRate,
        stockAvailable: prod.cantidad !== undefined ? prod.cantidad : null
      };
      setItems(prev => [...prev, newItem]);
      toast.success(`"${prod.nombre}" agregado ${isWholesale ? '(⭐ Mayorista $' + priceUSD.toFixed(2) + ')' : ''}`);
    }
  };

  // Add Custom / Free Item
  const handleAddCustomItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      productId: 'custom',
      nombre: 'SELLO PERSONALIZADO',
      cantidad: 1,
      precioUSD: 16.0,
      tasaBCV: globalBcvRate
    };
    setItems(prev => [...prev, newItem]);
    toast.success('Ítem personalizado agregado');
  };

  // Update item field (permite escribir libremente precios con punto o coma sin 0 atascado)
  const handleUpdateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'cantidad') {
        updated[index].cantidad = Math.max(1, parseInt(value) || 1);
      } else if (field === 'precioUSD') {
        updated[index].precioUSD = value;
      } else if (field === 'tasaBCV') {
        updated[index].tasaBCV = parseNum(value);
      } else if (field === 'nombre') {
        updated[index].nombre = value;
      } else if (field === 'nota') {
        updated[index].nota = value;
      }
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Totals calculations (Precios ya tienen IVA incluido al 16%)
  const totalUSD = items.reduce((acc, it) => acc + ((Number(it.cantidad) || 1) * (Number(it.precioUSD) || 0)), 0);
  const baseImponibleUSD = totalUSD > 0 ? (totalUSD / 1.16) : 0;
  const ivaUSD = totalUSD - baseImponibleUSD;

  const currentRate = Number(globalBcvRate) || 1;
  const totalBs = totalUSD * currentRate;
  const baseImponibleBs = totalBs > 0 ? (totalBs / 1.16) : 0;
  const ivaBs = totalBs - baseImponibleBs;

  // Mixed Payment Handlers & Calculations
  const totalPaidUSD = paymentEntries.reduce((acc, p) => acc + (parseFloat(p.amountUSD) || 0), 0);
  const totalPaidBs = paymentEntries.reduce((acc, p) => acc + (parseFloat(p.amountBs) || 0), 0);
  const diffUSD = Number((totalUSD - totalPaidUSD).toFixed(2));
  const diffBs = Number((totalBs - totalPaidBs).toFixed(2));
  const isExactCovered = Math.abs(diffUSD) <= 0.01;
  const isShortage = diffUSD > 0.01;
  const isOverpaid = diffUSD < -0.01;

  const handleAddPaymentEntry = () => {
    const leftUSD = Math.max(0, diffUSD);
    const leftBs = Number((leftUSD * currentRate).toFixed(2));
    const existing = paymentEntries.map(p => p.method);
    const candidateMethods = ['Efectivo USD', 'Pago Móvil', 'Efectivo Bs', 'Débito', 'Zelle'];
    const nextMethod = candidateMethods.find(m => !existing.includes(m)) || 'Efectivo USD';

    setPaymentEntries(prev => [
      ...prev,
      {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        method: nextMethod,
        amountUSD: leftUSD > 0 ? leftUSD : '',
        amountBs: leftUSD > 0 ? leftBs : '',
        ref: ''
      }
    ]);
  };

  const handleRemovePaymentEntry = (index) => {
    if (paymentEntries.length <= 1) return;
    setPaymentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEntryMethod = (index, newMethod) => {
    setPaymentEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], method: newMethod };
      return next;
    });
  };

  const handleUpdateEntryUSD = (index, value) => {
    setPaymentEntries(prev => {
      const next = [...prev];
      const parsedUSD = parseFloat(value);
      const computedBs = (!isNaN(parsedUSD) && parsedUSD > 0) 
        ? Number((parsedUSD * currentRate).toFixed(2)) 
        : '';
      next[index] = {
        ...next[index],
        amountUSD: value,
        amountBs: computedBs
      };
      return next;
    });
  };

  const handleUpdateEntryBs = (index, value) => {
    setPaymentEntries(prev => {
      const next = [...prev];
      const parsedBs = parseFloat(value);
      const computedUSD = (!isNaN(parsedBs) && parsedBs > 0)
        ? Number((parsedBs / currentRate).toFixed(2))
        : '';
      next[index] = {
        ...next[index],
        amountBs: value,
        amountUSD: computedUSD
      };
      return next;
    });
  };

  const handleUpdateEntryRef = (index, value) => {
    setPaymentEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ref: value };
      return next;
    });
  };

  // Finalize Sale
  const handleSaveSale = async () => {
    if (!client.nombre.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      setStep(1);
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la venta');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanWhatsapp = formatDisplayPhone(client.whatsapp);
      const targetOrderId = order?.id || `order_${Date.now()}`;
      const nowISO = new Date().toISOString();

      // 1. Save or update client in Firestore
      let targetClientId = client.id;
      if (client.nombre.trim()) {
        try {
          if (client.id) {
            await updateDoc(doc(firestoreDB, 'clients', client.id), {
              nombre: client.nombre.toUpperCase(),
              rif: client.rif.toUpperCase(),
              whatsapp: cleanWhatsapp,
              direccion: (client.direccion || '').toUpperCase(),
              updatedAt: nowISO
            });
          } else {
            const newClientRef = await addDoc(collection(firestoreDB, 'clients'), {
              nombre: client.nombre.toUpperCase(),
              rif: client.rif.toUpperCase(),
              whatsapp: cleanWhatsapp,
              direccion: (client.direccion || '').toUpperCase(),
              tipo: client.tipo || 'normal',
              createdAt: nowISO,
              updatedAt: nowISO
            });
            targetClientId = newClientRef.id;
            client.id = targetClientId;
          }
        } catch (clientErr) {
          console.warn("Client sync non-blocking error:", clientErr);
        }
      }

      // Validation and preparation for payment method
      const isMixed = isMixedPayment;
      const validMixedEntries = isMixed
        ? paymentEntries
            .filter(p => (parseFloat(p.amountUSD) > 0 || parseFloat(p.amountBs) > 0))
            .map(p => {
              const u = parseFloat(p.amountUSD) || 0;
              const b = parseFloat(p.amountBs) || (u * currentRate);
              return {
                method: p.method || 'Pago Móvil',
                amountUSD: Number(u.toFixed(2)),
                amountBs: Number(b.toFixed(2)),
                ref: (p.ref || '').trim()
              };
            })
        : [];

      if (isMixed) {
        if (validMixedEntries.length === 0) {
          toast.error('Ingresa al menos un monto en los métodos de pago');
          setIsSubmitting(false);
          return;
        }
        if (diffUSD > 0.10) {
          if (!window.confirm(`Aún faltan $${fmt(diffUSD)} por cubrir del total de la venta ($${fmt(totalUSD)}). ¿Deseas registrar la venta de todas formas?`)) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      const finalPaymentMethod = isMixed && validMixedEntries.length > 0
        ? 'Pago Mixto'
        : paymentMethod;

      const finalMethodSummary = isMixed && validMixedEntries.length > 0
        ? validMixedEntries.map(p => `${p.method}: $${fmt(p.amountUSD)}`).join(' + ')
        : paymentMethod;

      const finalPaymentRef = isMixed && validMixedEntries.length > 0
        ? validMixedEntries.map(p => p.ref ? `${p.method}: ${p.ref}` : null).filter(Boolean).join(' | ')
        : (paymentRef || '').trim();

      const finalBreakdown = isMixed && validMixedEntries.length > 0
        ? validMixedEntries
        : [
            {
              method: paymentMethod,
              amountUSD: Number(totalUSD.toFixed(2)),
              amountBs: Number(totalBs.toFixed(2)),
              ref: (paymentRef || '').trim()
            }
          ];

      // 2. Resolve final sequential order number (recibo) using ATOMIC transaction
      let finalOrderNumber = (order?.orderNumber || '').trim();
      if (!finalOrderNumber) {
        try {
          const counterRef = ref(db, 'counters/orderNumber');
          const txResult = await runTransaction(counterRef, (currentVal) => {
            // If counter doesn't exist yet, initialize from current max
            return (currentVal || 0) + 1;
          });
          if (txResult.committed && txResult.snapshot.val()) {
            finalOrderNumber = txResult.snapshot.val().toString();
          } else {
            throw new Error('Transaction not committed');
          }
        } catch (numErr) {
          console.error("Error in atomic orderNumber transaction:", numErr);
          toast.error('Error al generar número de recibo. Intenta de nuevo.');
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Prepare payload for Realtime Database
      const designerName = (designer || 'ALVARO').toUpperCase();
      const vendedorName = designerName === 'KRIZ' ? 'Kriz' : 'Alvaro';

      const orderPayload = {
        id: targetOrderId,
        vendedor: order?.vendedor || vendedorName,
        createdBy: order?.createdBy || vendedorName,
        clientId: targetClientId || null,
        clientType: client.tipo || 'normal',
        orderNumber: finalOrderNumber,
        clientName: client.nombre.toUpperCase(),
        clientRif: client.rif.toUpperCase(),
        whatsapp: cleanWhatsapp,
        clientAddress: (client.direccion || '').toUpperCase(),
        designer: designerName,
        items: items.map(it => ({
          ...it,
          nota: (it.nota || '').trim(),
          tasaBCV: currentRate
        })),
        totalAmount: Number(totalUSD.toFixed(2)),
        totalAmountBs: Number(totalBs.toFixed(2)),
        baseImponible: Number(baseImponibleUSD.toFixed(2)),
        baseImponibleBs: Number(baseImponibleBs.toFixed(2)),
        ivaUSD: Number(ivaUSD.toFixed(2)),
        ivaBs: Number(ivaBs.toFixed(2)),
        subtotalBs: Number(baseImponibleBs.toFixed(2)),
        tasaBCV: currentRate,
        incluyeIVA: true,
        status: (!order?.status || order.status === 'design_sent') ? 'fina' : order.status,
        statusId: (!order?.status || order.status === 'design_sent') ? 'fina' : (order.statusId || order.status),
        hasFinaReceipt: true,
        hasPaymentPhoto: Boolean(paymentPhoto || order?.hasPaymentPhoto),
        requiresDesign: order?.requiresDesign !== undefined ? order.requiresDesign : true,
        hasDelivery: Boolean(hasDelivery),
        deliveryType: hasDelivery ? deliveryType : 'pickup',
        deliveryAddress: hasDelivery && deliveryType === 'motorizado' ? (deliveryAddress || '').toUpperCase() : (deliveryType === 'pickup' ? '' : (deliveryAddress || '').toUpperCase()),
        mapsLink: hasDelivery && deliveryType === 'motorizado' ? (deliveryMapsLink || '').trim() : (client.mapsLink || ''),
        shippingAgency: hasDelivery && (deliveryType === 'mrw' || deliveryType === 'zoom') ? (shippingAgency || '').toUpperCase() : '',
        shippingCity: hasDelivery && (deliveryType === 'mrw' || deliveryType === 'zoom') ? (shippingCity || '').toUpperCase() : '',
        shippingCompany: hasDelivery && (deliveryType === 'mrw' || deliveryType === 'zoom') ? (deliveryType === 'mrw' ? 'MRW' : 'ZOOM') : null,
        paymentMethod: finalPaymentMethod,
        paymentMethodSummary: finalMethodSummary,
        paymentBreakdown: finalBreakdown,
        paymentRef: finalPaymentRef,
        isPaid: finalPaymentMethod !== 'Por Pagar',
        paidAt: finalPaymentMethod === 'Por Pagar' ? null : (order?.paidAt || nowISO),
        updatedAt: nowISO,
        ...(order ? {} : { createdAt: nowISO })
      };

      // Save order in RTDB
      await update(ref(db, `orders/${targetOrderId}`), orderPayload);

      // Sync delivery address to client if provided
      if (targetClientId && hasDelivery) {
        try {
          const clientRef = doc(firestoreDB, 'clients', targetClientId);
          const cUpdates = {};
          if (deliveryAddress) cUpdates.direccion = (deliveryAddress || '').toUpperCase();
          if (deliveryMapsLink) cUpdates.mapsLink = (deliveryMapsLink || '').trim();
          if (Object.keys(cUpdates).length > 0) {
            await updateDoc(clientRef, cUpdates);
          }
        } catch (cErr) {
          console.warn("Could not update client delivery details in Firestore:", cErr);
        }
      }

      // Save optional payment photo in orderAssets if provided
      if (paymentPhoto) {
        try {
          const assetUpdates = {};
          assetUpdates[`orderAssets/fina_receipt/${targetOrderId}/fullDataUrl`] = paymentPhoto;
          assetUpdates[`orderAssets/fina_receipt/${targetOrderId}/contentType`] = 'image/jpeg';
          assetUpdates[`orderAssets/fina_receipt/${targetOrderId}/updatedAt`] = nowISO;
          await update(ref(db), assetUpdates);
        } catch (photoErr) {
          console.warn("Could not save payment photo asset:", photoErr);
        }
      }

      // 3. Automatically deduct inventory in Firestore for new sales or newly transitioned sales
      const isFirstSale = !order || !order.hasFinaReceipt;
      if (isFirstSale) {
        for (const item of items) {
          if (item.productId && item.productId !== 'custom') {
            try {
              const prodRef = doc(firestoreDB, 'products', item.productId);
              await updateDoc(prodRef, {
                cantidad: increment(-Number(item.cantidad || 1))
              });
            } catch (invErr) {
              console.warn(`Could not deduct stock for ${item.nombre}:`, invErr);
            }
          }
        }
      }

      // 4. Update Client Stats in Firestore (CRM sync)
      try {
        const snapOrders = await get(ref(db, 'orders'));
        if (snapOrders.exists()) {
          const allOrdersList = Object.values(snapOrders.val());
          await syncClientStatsToFirestore(client, allOrdersList, firestoreDB);
        }
      } catch (crmErr) {
        console.warn("CRM stats sync error:", crmErr);
      }

      // Confetti celebration
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#47FF00', '#1F2329', '#2563EB', '#FFD700']
      });

      toast.success('¡Venta realizada con éxito! Stock descontado.');
      
      // Open Printable receipt modal immediately on screen
      setSavedOrderForPrint(orderPayload);

    } catch (error) {
      console.error("Error al guardar venta:", error);
      toast.error('Error al registrar la venta');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem'
    }}>
      
      {savedOrderForPrint ? (
        <PrintNotaModal 
          order={savedOrderForPrint} 
          onClose={() => {
            const completed = savedOrderForPrint;
            setSavedOrderForPrint(null);
            if (onSuccess) onSuccess(completed);
            onClose();
          }} 
        />
      ) : (
        <div 
          className="glass-card animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '1080px',
            height: isMobile ? '100dvh' : '92vh',
            maxHeight: isMobile ? '100dvh' : '850px',
            background: 'var(--surface-solid, #ffffff)',
            borderRadius: isMobile ? '0' : '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
            color: 'var(--text-main, #1F2329)'
          }}
        >
          <style>{`
            .pos-product-card {
              transition: all 0.15s ease-in-out !important;
            }
            .pos-product-card:hover {
              border-color: #10b981 !important;
              transform: translateY(-2px) scale(1.01) !important;
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15) !important;
            }
          `}</style>

          {/* Header with Step Indicator & BCV rate */}
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.75rem',
            borderBottom: '1px solid var(--border-strong, #e2e8f0)',
            background: 'var(--surface-hover, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobile ? '8px' : '1rem',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {/* Logo / Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: '#10b981',
                color: '#ffffff',
                borderRadius: '0.65rem',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
              }}>
                <Receipt size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                  Nueva venta
                </h2>
              </div>
            </div>

            {/* 3 Steps Visual Progress Bar */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              order: isMobile ? 3 : 2,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'center',
              marginTop: isMobile ? '4px' : '0'
            }}>
              {[
                { s: 1, label: 'CLIENTE' },
                { s: 2, label: 'PRODUCTOS' },
                { s: 3, label: 'COBRAR' }
              ].map(({ s, label }) => {
                const isActive = step === s;
                const isPassed = step > s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s === 2 && !client.nombre.trim()) {
                        toast.error('Ingresa el nombre del cliente primero');
                        return;
                      }
                      if (s === 3 && items.length === 0) {
                        toast.error('Agrega productos al carrito primero');
                        return;
                      }
                      setStep(s);
                    }}
                    style={{
                      border: 'none',
                      background: isActive 
                        ? '#10b981' 
                        : isPassed 
                        ? '#dcfce7' 
                        : 'var(--surface, #f1f5f9)',
                      color: isActive ? '#ffffff' : isPassed ? '#15803d' : 'var(--text-muted, #64748b)',
                      fontWeight: isActive ? 800 : 700,
                      fontSize: isMobile ? '0.72rem' : '0.78rem',
                      padding: isMobile ? '5px 10px' : '6px 14px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      flex: isMobile ? 1 : 'initial',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                  >
                    {isPassed ? <Check size={12} /> : null}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* BCV Rate & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', order: isMobile ? 2 : 3 }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1.5px solid rgba(37, 99, 235, 0.3)',
                color: '#1d4ed8',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.78rem' }}>BCV:</span>
                <input 
                  type="number"
                  step="0.01"
                  value={globalBcvRate}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const val = parseFloat(raw);
                    if (!isNaN(val) && val > 0) {
                      setGlobalBcvRate(val);
                      setItems(prev => prev.map(it => ({ ...it, tasaBCV: val })));
                    } else if (raw === '') {
                      setGlobalBcvRate('');
                    }
                  }}
                  onBlur={() => {
                    if (!globalBcvRate || globalBcvRate <= 0) {
                      fetchGlobalRate(true);
                    }
                  }}
                  style={{
                    width: '82px',
                    padding: '3px 4px',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    color: '#1e40af',
                    background: '#ffffff',
                    border: '1px solid #93c5fd',
                    borderRadius: '5px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                  title="Haz clic para modificar la tasa para esta venta"
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Bs/$</span>
                <button 
                  type="button"
                  onClick={() => fetchGlobalRate(true)} 
                  title="Restablecer tasa oficial del BCV"
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <RefreshCw size={13} className={loadingRate ? 'animate-spin' : ''} />
                </button>
              </div>

              <button 
                onClick={onClose} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Modal Body Container */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* ===================== PASO 1: DATOS DEL CLIENTE ===================== */}
            {step === 1 && (
              <div style={{
                padding: isMobile ? '1rem 0.75rem' : '2rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'center'
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: '720px',
                  background: 'var(--surface-hover, #f8fafc)',
                  borderRadius: '1.25rem',
                  border: '1px solid var(--border-strong, #e2e8f0)',
                  padding: isMobile ? '1.25rem' : '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center', 
                    justifyContent: 'space-between',
                    gap: isMobile ? '12px' : '1rem'
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 800 }}>
                        Información del Cliente
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Selecciona un cliente frecuente o ingresa sus datos para la factura y recibo.
                      </p>
                    </div>

                    {/* Autocomplete Search Bar */}
                    <div style={{ position: 'relative', width: isMobile ? '100%' : '280px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                      <input 
                        type="text"
                        placeholder="Buscar cliente registrado... (↓ flecha para navegar)"
                        value={clientSearch}
                        onChange={e => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        onKeyDown={handleClientSearchKeyDown}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 34px',
                          fontSize: '0.85rem',
                          borderRadius: '0.65rem',
                          border: '1px solid var(--border-strong, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text-main)',
                          outline: 'none'
                        }}
                      />
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%', left: 0, right: 0,
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.65rem',
                          boxShadow: '0 10px 20px -3px rgba(0,0,0,0.15)',
                          zIndex: 1000,
                          maxHeight: '220px',
                          overflowY: 'auto',
                          marginTop: '6px'
                        }}>
                          {filteredClients.map((c, idx) => {
                            const isSelected = idx === selectedClientIndex;
                            const isMayor = c.tipo === 'mayorista' || c.isWholesale === true;

                            return (
                              <div 
                                key={c.id}
                                onClick={() => handleSelectClient(c)}
                                onMouseEnter={() => setSelectedClientIndex(idx)}
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  fontSize: '0.82rem',
                                  borderBottom: '1px solid #f1f5f9',
                                  background: isSelected ? 'rgba(71, 255, 0, 0.15)' : '#ffffff',
                                  borderLeft: isSelected ? '4px solid #16a34a' : '4px solid transparent',
                                  transition: 'all 0.1s ease'
                                }}
                              >
                                <div style={{ fontWeight: 800, color: isSelected ? '#15803d' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span>{c.nombre}</span>
                                  {isMayor && (
                                    <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                      ⭐ Mayorista
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                  {c.rif ? `RIF: ${c.rif}` : ''} {c.whatsapp ? `· WA: ${c.whatsapp}` : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        NOMBRE / RAZÓN SOCIAL *
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej. INVERSIONES SANTA PAULA C.A."
                        value={client.nombre}
                        onChange={e => setClient(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '0.9rem',
                          borderRadius: '0.65rem',
                          border: '1px solid var(--border-strong, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text-main)',
                          outline: 'none',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        RIF / CÉDULA
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          value={rifData.prefix}
                          onChange={e => handleRifPrefixChange(e.target.value)}
                          style={{
                            width: '60px',
                            padding: '10px 6px',
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            borderRadius: '0.65rem',
                            border: '1px solid var(--border-strong, #cbd5e1)',
                            background: 'var(--surface, #f8fafc)',
                            color: 'var(--text-main)',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="V">V</option>
                          <option value="E">E</option>
                          <option value="J">J</option>
                          <option value="G">G</option>
                          <option value="C">C</option>
                          <option value="P">P</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder="20026915"
                          value={rifData.number}
                          onChange={e => handleRifNumberChange(e.target.value)}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: '10px 14px',
                            fontSize: '0.9rem',
                            borderRadius: '0.65rem',
                            border: '1px solid var(--border-strong, #cbd5e1)',
                            background: 'var(--surface, #ffffff)',
                            color: 'var(--text-main)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        WHATSAPP / TELÉFONO
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej. 04121234567"
                        value={client.whatsapp}
                        onChange={e => setClient(prev => ({ ...prev, whatsapp: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '0.9rem',
                          borderRadius: '0.65rem',
                          border: '1px solid var(--border-strong, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text-main)',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                        DIRECCIÓN FISCAL
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej. AV. FRANCISCO DE MIRANDA, CHACAÍTO"
                        value={client.direccion}
                        onChange={e => setClient(prev => ({ ...prev, direccion: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '0.9rem',
                          borderRadius: '0.65rem',
                          border: '1px solid var(--border-strong, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text-main)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Client Category / Mayorista Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: '0.75rem',
                    background: client.tipo === 'mayorista' ? '#fef3c7' : '#f8fafc',
                    border: client.tipo === 'mayorista' ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>{client.tipo === 'mayorista' ? '⭐' : '👤'}</span>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: client.tipo === 'mayorista' ? '#92400e' : '#1e293b' }}>
                          {client.tipo === 'mayorista' ? 'Cliente Mayorista Activo (-20% en todo el catálogo)' : 'Cliente Normal (Precios Estándar)'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {client.tipo === 'mayorista' 
                            ? 'Los productos se agregarán automáticamente con el precio mayorista (0.8x).' 
                            : 'Puedes marcarlo como mayorista para aplicar precios con descuento a esta venta.'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newTipo = client.tipo === 'mayorista' ? 'normal' : 'mayorista';
                        setClient(prev => ({ ...prev, tipo: newTipo }));
                        toast(newTipo === 'mayorista' ? '⭐ Modo Mayorista activado' : 'Modo Normal activado', { icon: newTipo === 'mayorista' ? '⭐' : '👤' });
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: client.tipo === 'mayorista' ? '#f59e0b' : '#ffffff',
                        color: client.tipo === 'mayorista' ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      {client.tipo === 'mayorista' ? 'Quitar Mayorista' : '+ Marcar Mayorista'}
                    </button>
                  </div>

                  {/* Selector de Diseñador / Vendedor Asignado */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '0.75rem',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0'
                  }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#10b981" /> Vendedor / Diseñador de esta Venta *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { id: 'ALVARO', label: '👤 Alvaro Acevedo', short: 'Alvaro' },
                        { id: 'KRIZ', label: '🎨 Kriz (Diseño/Venta)', short: 'Kriz' }
                      ].map(d => {
                        const isSel = (designer || 'ALVARO').toUpperCase() === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDesigner(d.id)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              border: isSel ? '2px solid #10b981' : '1.5px solid #cbd5e1',
                              background: isSel ? '#ecfdf5' : '#ffffff',
                              color: isSel ? '#065f46' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              boxShadow: isSel ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{d.label}</span>
                            {isSel && <Check size={16} color="#10b981" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Button Next */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!client.nombre.trim()) {
                          toast.error('Ingresa el nombre del cliente');
                          return;
                        }
                        setStep(2);
                      }}
                      style={{
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Siguiente: Catálogo de Productos <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== PASO 2: CATÁLOGO & CARRITO ===================== */}
            {step === 2 && (
              <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
                {/* 2.1 Columna Izquierda: Catálogo de Productos */}
                <div style={{
                  flex: isMobile ? '1 1 100%' : '65',
                  width: isMobile ? '100%' : 'auto',
                  padding: isMobile ? '0.75rem 0.75rem 5rem 0.75rem' : '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  overflowY: 'hidden',
                  borderRight: isMobile ? 'none' : '1px solid var(--border-strong, #e2e8f0)'
                }}>
                  {/* Search Bar & Custom Item Button */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                      <input 
                        type="text"
                        placeholder="Buscar producto o modelo..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 38px',
                          fontSize: '0.88rem',
                          borderRadius: '0.75rem',
                          border: '1px solid var(--border-strong, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text-main)',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.75rem',
                        padding: isMobile ? '0 10px' : '0 16px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Plus size={16} /> <span className={isMobile ? 'hide-on-mobile' : ''}>+ Personalizado</span>
                    </button>
                  </div>

                  {/* Wholesale Mode Notification Banner */}
                  {isWholesale && (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '0.65rem',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: '#92400e',
                      fontWeight: 800
                    }}>
                      <span>⭐ Mayorista (-20% catálogo)</span>
                      <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                        0.8x
                      </span>
                    </div>
                  )}

                  {/* Horizontal Category Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    paddingBottom: '4px'
                  }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: 'none',
                          background: selectedCategory === cat ? '#1F2329' : 'var(--surface-hover, #f1f5f9)',
                          color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted, #475569)',
                          fontWeight: selectedCategory === cat ? 800 : 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Products Grid */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(135px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
                    alignContent: 'start',
                    gap: isMobile ? '8px' : '12px',
                    paddingRight: '4px'
                  }}>
                    {filteredProducts.length === 0 ? (
                      <div style={{
                        gridColumn: '1 / -1',
                        padding: '3rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                      }}>
                        No se encontraron productos activos con ese criterio.
                      </div>
                    ) : (
                      filteredProducts.map(prod => {
                        const stock = prod.cantidad !== undefined ? prod.cantidad : null;
                        const isOutOfStock = stock !== null && stock <= 0;
                        const inCartQty = items
                          .filter(it => it.productId === prod.id)
                          .reduce((sum, it) => sum + (Number(it.cantidad) || 0), 0);
                        const baseRawPrice = parseNum(prod.precio || prod.precioVenta || 0);
                        const effectiveCardPrice = Number((baseRawPrice * effectiveMultiplier).toFixed(2));

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleAddProduct(prod)}
                            className="pos-product-card"
                            style={{
                              position: 'relative',
                              background: isOutOfStock ? 'rgba(241, 245, 249, 0.6)' : 'var(--surface, #ffffff)',
                              border: inCartQty > 0 
                                ? '2px solid var(--primary, #47FF00)' 
                                : isOutOfStock 
                                ? '1px dashed #cbd5e1' 
                                : '1.5px solid var(--border-strong, #e2e8f0)',
                              borderRadius: '0.85rem',
                              padding: isMobile ? '10px' : '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '6px',
                              opacity: isOutOfStock ? 0.7 : 1,
                              transition: 'all 0.18s ease',
                              boxShadow: inCartQty > 0 ? '0 4px 14px rgba(71, 255, 0, 0.2)' : 'none'
                            }}
                          >
                            {/* Quantity badge in top-right corner */}
                            {inCartQty > 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'var(--primary, #47FF00)',
                                color: '#1F2329',
                                fontWeight: 900,
                                borderRadius: '999px',
                                minWidth: '20px',
                                height: '20px',
                                padding: '0 4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.72rem',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                                border: '1.5px solid #1F2329',
                                zIndex: 2
                              }}>
                                {inCartQty}
                              </div>
                            )}

                            <div>
                              <div style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                color: '#64748b',
                                textTransform: 'uppercase',
                                paddingRight: inCartQty > 0 ? '20px' : '0'
                              }}>
                                {prod.categoria || 'General'}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '0.8rem' : '0.85rem',
                                fontWeight: 800,
                                color: 'var(--text-main, #0f172a)',
                                marginTop: '3px',
                                lineHeight: '1.2'
                              }}>
                                {prod.nombre}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 900, color: 'var(--primary, #16a34a)' }}>
                                  ${fmt(effectiveCardPrice)}
                                </span>
                              </div>

                              {stock !== null && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '999px',
                                  background: isOutOfStock ? '#fee2e2' : '#f0fdf4',
                                  color: isOutOfStock ? '#dc2626' : '#16a34a'
                                }}>
                                  {isOutOfStock ? '0' : `${stock}`}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2.2 Mobile Sticky Bottom Floating Cart Button */}
                {isMobile && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '10px 14px',
                    background: 'linear-gradient(to top, rgba(255,255,255,1) 80%, rgba(255,255,255,0))',
                    zIndex: 10,
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowMobileCart(true)}
                      style={{
                        flex: 1,
                        background: '#111827',
                        color: '#ffffff',
                        border: '2px solid var(--primary, #47FF00)',
                        borderRadius: '0.85rem',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          background: 'var(--primary, #47FF00)',
                          color: '#111827',
                          borderRadius: '999px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 900
                        }}>
                          {items.reduce((s, it) => s + (Number(it.cantidad) || 1), 0)}
                        </div>
                        <span>Ver Carrito</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--primary, #47FF00)', fontSize: '1.05rem', fontWeight: 900 }}>
                          ${fmt(totalUSD)}
                        </span>
                        <ArrowRight size={16} />
                      </div>
                    </button>
                  </div>
                )}

                {/* 2.3 Columna Derecha / Drawer Carrito */}
                {(!isMobile || showMobileCart) && (
                  <div style={{
                    flex: isMobile ? 'none' : '35',
                    position: isMobile ? 'absolute' : 'relative',
                    inset: isMobile ? 0 : 'auto',
                    zIndex: isMobile ? 50 : 'auto',
                    background: 'var(--surface-hover, #f8fafc)',
                    padding: isMobile ? '1rem' : '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    animation: isMobile ? 'slideUp 0.22s ease-out' : 'none'
                  }}>
                    {/* Cart Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong, #e2e8f0)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart size={18} color="var(--primary, #16a34a)" />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                          Carrito ({items.reduce((s, it) => s + (Number(it.cantidad) || 1), 0)})
                        </h4>
                      </div>

                      {isMobile ? (
                        <button
                          type="button"
                          onClick={() => setShowMobileCart(false)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          ✕ Volver
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => setStep(1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Cliente: {client.nombre.slice(0, 12)}... ✏️
                        </button>
                      )}
                    </div>

                    {/* Cart Items List */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      paddingRight: '2px'
                    }}>
                      {items.length === 0 ? (
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          padding: '2rem'
                        }}>
                          <ShoppingBag size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <span style={{ fontSize: '0.85rem' }}>El carrito está vacío. Haz clic en un producto para agregarlo.</span>
                        </div>
                      ) : (
                        items.map((it, idx) => {
                          const itemSubBs = (Number(it.cantidad || 1) * Number(it.precioUSD || 0) * currentRate);

                          return (
                            <div
                              key={it.id || idx}
                              style={{
                                background: '#ffffff',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--border-strong, #cbd5e1)',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', flex: 1 }}>
                                  {it.nombre}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '2px'
                                  }}
                                  title="Eliminar ítem"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {/* Qty & Editable Price Row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                {/* Quantity Counter */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(idx, 'cantidad', Math.max(1, (it.cantidad || 1) - 1))}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#f8fafc',
                                      fontWeight: 900,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                                    {it.cantidad}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItem(idx, 'cantidad', (it.cantidad || 1) + 1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      background: '#f8fafc',
                                      fontWeight: 900,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Editable Price in USD */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>$</span>
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={it.precioUSD === 0 || it.precioUSD === '0' ? '' : it.precioUSD}
                                    placeholder="0.00"
                                    onFocus={(e) => {
                                      if (e.target.value === '0' || e.target.value === '0.00') {
                                        e.target.select();
                                      }
                                    }}
                                    onChange={e => {
                                      const val = e.target.value.replace(',', '.');
                                      handleUpdateItem(idx, 'precioUSD', val);
                                    }}
                                    onBlur={e => {
                                      const parsed = parseNum(e.target.value);
                                      handleUpdateItem(idx, 'precioUSD', parsed);
                                    }}
                                    style={{
                                      width: '68px',
                                      padding: '4px 6px',
                                      fontSize: '0.85rem',
                                      fontWeight: 800,
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      textAlign: 'right',
                                      background: '#ffffff',
                                      color: '#0f172a'
                                    }}
                                    title="Precio unitario en USD"
                                  />
                                </div>

                                {/* Subtotal in Bs */}
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>
                                  Bs. {fmt(itemSubBs)}
                                </div>
                              </div>

                              {/* Nota / Indicación Técnica para la Técnica/Taller */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px'
                              }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                                  📝 Nota:
                                </span>
                                <input 
                                  type="text"
                                  placeholder="Ej: Tinta azul, cuerpo rojo, sin tinta..."
                                  value={it.nota || ''}
                                  onChange={e => handleUpdateItem(idx, 'nota', e.target.value)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    color: '#0f172a',
                                    width: '100%'
                                  }}
                                  title="Indicaciones técnicas para producción / taller"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Cart Footer & Totals */}
                    <div style={{
                      borderTop: '1px solid var(--border-strong, #e2e8f0)',
                      paddingTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span style={{ color: '#64748b' }}>Total USD:</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>${fmt(totalUSD)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900 }}>
                        <span>Total Bs:</span>
                        <span style={{ color: 'var(--primary, #16a34a)' }}>Bs. {fmt(totalBs)}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isMobile && showMobileCart) {
                              setShowMobileCart(false);
                            } else {
                              setStep(1);
                            }
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '0.75rem',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <ArrowLeft size={16} /> Atrás
                        </button>

                        <button
                          type="button"
                          disabled={items.length === 0}
                          onClick={() => {
                            setShowMobileCart(false);
                            setStep(3);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '0.75rem',
                            background: items.length === 0 ? '#cbd5e1' : '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: items.length === 0 ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Proceder al Cobro <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===================== PASO 3: COBRO Y PAGO ===================== */}
            {step === 3 && (
              <div style={{
                flex: 1,
                padding: isMobile ? '1rem 0.75rem 2rem 0.75rem' : '1.75rem 2rem',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
                gap: isMobile ? '16px' : '24px'
              }}>
                {/* 3.1 Columna Izquierda: Métodos de Pago & Opciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800 }}>
                      Método de Pago & Facturación
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Selecciona cómo cancela el cliente y ajusta impuestos si aplica.
                    </p>
                  </div>

                  {/* Selector Rápido de Diseñador en Paso 3 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={14} color="#10b981" /> Venta registrada a nombre de:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'ALVARO', label: '👤 Alvaro' },
                        { id: 'KRIZ', label: '🎨 Kriz' }
                      ].map(d => {
                        const isSel = (designer || 'ALVARO').toUpperCase() === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDesigner(d.id)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: isSel ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                              background: isSel ? '#10b981' : '#ffffff',
                              color: isSel ? '#ffffff' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSel ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{d.label}</span>
                            {isSel && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Method Section with Toggle for Pago Único / Pago Mixto */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 850, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>
                        MÉTODO DE PAGO
                      </label>
                      
                      {/* Tab Switcher */}
                      <div style={{
                        display: 'flex',
                        background: 'var(--surface-hover, #f1f5f9)',
                        padding: '3px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-strong, #cbd5e1)',
                        gap: '3px'
                      }}>
                        <button
                          type="button"
                          onClick={() => setIsMixedPayment(false)}
                          style={{
                            background: !isMixedPayment ? '#ffffff' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: !isMixedPayment ? '#0f172a' : '#64748b',
                            boxShadow: !isMixedPayment ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <CreditCard size={13} /> Pago Único
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMixedPayment(true);
                            if (paymentEntries.length === 0 || (!paymentEntries[0].amountUSD && !paymentEntries[0].amountBs)) {
                              setPaymentEntries([
                                { id: 'entry_1', method: paymentMethod || 'Pago Móvil', amountUSD: '', amountBs: '', ref: paymentRef || '' },
                                { id: 'entry_2', method: 'Efectivo USD', amountUSD: '', amountBs: '', ref: '' }
                              ]);
                            }
                          }}
                          style={{
                            background: isMixedPayment ? 'var(--primary, #47FF00)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 850,
                            color: isMixedPayment ? '#1F2329' : '#64748b',
                            boxShadow: isMixedPayment ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Layers size={13} /> Pago Mixto (Dividir)
                        </button>
                      </div>
                    </div>

                    {!isMixedPayment ? (
                      /* 1. MODO PAGO ÚNICO */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { id: 'Pago Móvil', label: 'Pago Móvil', icon: Smartphone, color: '#3b82f6' },
                            { id: 'Efectivo Bs', label: 'Efectivo Bs', icon: Banknote, color: '#10b981' },
                            { id: 'Efectivo USD', label: 'Efectivo USD', icon: DollarSign, color: '#f59e0b' },
                            { id: 'Débito', label: 'Débito / Punto', icon: CreditCard, color: '#8b5cf6' },
                            { id: 'Por Pagar', label: '⏳ Por Pagar / Facturar Primero', icon: Clock, color: '#d97706', fullWidth: true }
                          ].map(m => {
                            const isSelected = paymentMethod === m.id;
                            const Icon = m.icon;

                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setPaymentMethod(m.id)}
                                style={{
                                  padding: '14px 12px',
                                  borderRadius: '0.85rem',
                                  border: isSelected ? '2px solid var(--primary, #47FF00)' : '1px solid var(--border-strong, #cbd5e1)',
                                  background: isSelected ? 'rgba(71, 255, 0, 0.1)' : 'var(--surface-hover, #f8fafc)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  textAlign: 'left',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: isSelected ? 'var(--primary, #47FF00)' : '#ffffff',
                                  color: isSelected ? '#1F2329' : m.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Icon size={20} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                    {m.label}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    {isSelected ? '✓ Seleccionado' : 'Hacer clic'}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Campo Referencia para Pago Único si aplica */}
                        {(paymentMethod === 'Pago Móvil' || paymentMethod === 'Débito') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                              NÚMERO DE REFERENCIA BANCARIA (OPCIONAL)
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Últimos 6 dígitos de la referencia"
                              value={paymentRef}
                              onChange={e => setPaymentRef(e.target.value)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                borderRadius: '0.65rem',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 2. MODO PAGO MIXTO / MÚLTIPLE */
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: '#ffffff',
                        border: '1.5px solid #86efac',
                        borderRadius: '0.85rem',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 850, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={15} /> Pagos Divididos ({paymentEntries.length} métodos)
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Total a cubrir: <b>${fmt(totalUSD)}</b> (Bs. {fmt(totalBs)})
                          </span>
                        </div>

                        {/* List of entries */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {paymentEntries.map((entry, eIdx) => {
                            return (
                              <div key={entry.id || eIdx} style={{
                                background: 'var(--surface-hover, #f8fafc)',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <select
                                    value={entry.method}
                                    onChange={e => handleUpdateEntryMethod(eIdx, e.target.value)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #94a3b8',
                                      background: '#ffffff',
                                      fontSize: '0.82rem',
                                      fontWeight: 800,
                                      color: '#0f172a',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="Pago Móvil">📱 Pago Móvil</option>
                                    <option value="Efectivo USD">💵 Efectivo USD ($)</option>
                                    <option value="Efectivo Bs">💶 Efectivo Bs</option>
                                    <option value="Débito">💳 Débito / Punto</option>
                                    <option value="Zelle">🌐 Zelle</option>
                                    <option value="Transferencia">🏦 Transferencia</option>
                                  </select>

                                  {diffUSD > 0.01 && (!entry.amountUSD || entry.amountUSD === '0') && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateEntryUSD(eIdx, diffUSD.toString())}
                                      style={{
                                        background: '#f0fdf4',
                                        border: '1px solid #86efac',
                                        borderRadius: '5px',
                                        padding: '3px 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        color: '#16a34a',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Asignar restante (${fmt(diffUSD)})
                                    </button>
                                  )}

                                  {paymentEntries.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePaymentEntry(eIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '3px',
                                        display: 'flex'
                                      }}
                                      title="Eliminar este método"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '6px', alignItems: 'center' }}>
                                  <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                                      MONTO USD ($)
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 6px' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginRight: '3px' }}>$</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={entry.amountUSD}
                                        onChange={e => handleUpdateEntryUSD(eIdx, e.target.value.replace(',', '.'))}
                                        style={{
                                          border: 'none',
                                          outline: 'none',
                                          width: '100%',
                                          fontSize: '0.85rem',
                                          fontWeight: 800,
                                          color: '#0f172a'
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                                      MONTO BS
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 6px' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', marginRight: '3px' }}>Bs.</span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={entry.amountBs}
                                        onChange={e => handleUpdateEntryBs(eIdx, e.target.value.replace(',', '.'))}
                                        style={{
                                          border: 'none',
                                          outline: 'none',
                                          width: '100%',
                                          fontSize: '0.85rem',
                                          fontWeight: 800,
                                          color: '#16a34a'
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '2px' }}>
                                      REFERENCIA (OPCIONAL)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ej. 849201"
                                      value={entry.ref}
                                      onChange={e => handleUpdateEntryRef(eIdx, e.target.value)}
                                      style={{
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        padding: '5px 8px',
                                        width: '100%',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add another method button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button
                            type="button"
                            onClick={handleAddPaymentEntry}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 12px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Plus size={14} /> Agregar otro método de pago
                          </button>
                        </div>

                        {/* Status bar */}
                        <div style={{
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isExactCovered ? '#dcfce7' : isShortage ? '#fef3c7' : '#dbeafe',
                          border: `1px solid ${isExactCovered ? '#86efac' : isShortage ? '#fcd34d' : '#bfdbfe'}`,
                          color: isExactCovered ? '#166534' : isShortage ? '#92400e' : '#1e40af'
                        }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isExactCovered ? (
                              <>
                                <Check size={16} color="#16a34a" />
                                <span>¡Monto total cubierto al 100%! (${fmt(totalPaidUSD)})</span>
                              </>
                            ) : isShortage ? (
                              <>
                                <AlertCircle size={16} color="#d97706" />
                                <span>Faltan: <b>${fmt(diffUSD)}</b> (Bs. {fmt(diffBs)})</span>
                              </>
                            ) : (
                              <>
                                <DollarSign size={16} color="#2563eb" />
                                <span>Vuelto al cliente: <b>${fmt(Math.abs(diffUSD))}</b> (Bs. {fmt(Math.abs(diffBs))})</span>
                              </>
                            )}
                          </div>
                          
                          <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                            Abonado: ${fmt(totalPaidUSD)} / ${fmt(totalUSD)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Receipt Number Row */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                      NÚMERO DE RECIBO
                    </label>
                    <div 
                      style={{
                        width: '100%',
                        maxWidth: '260px',
                        padding: '10px 14px',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        borderRadius: '0.65rem',
                        border: '1px solid var(--border-strong, #cbd5e1)',
                        background: order?.orderNumber ? 'var(--surface, #ffffff)' : '#f0fdf4',
                        color: order?.orderNumber ? 'var(--text-main)' : '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {order?.orderNumber ? (
                        <>#{order.orderNumber}</>
                      ) : (
                        <><Sparkles size={14} /> Se asignará automáticamente</>
                      )}
                    </div>
                  </div>

                  {/* Optional Payment Photo Attachment */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                    background: isDragOver ? '#f0fdf4' : 'var(--surface-hover, #f8fafc)',
                    border: isDragOver ? '1.5px dashed #16a34a' : (paymentPhoto ? '1.5px solid #16a34a' : '1px dashed #cbd5e1'),
                    borderRadius: '0.85rem',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={14} color="#64748b" /> COMPROBANTE / FOTO DEL PAGO (OPCIONAL)
                      </label>
                      {paymentPhoto && (
                        <button
                          type="button"
                          onClick={() => setPaymentPhoto(null)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          ✕ Quitar
                        </button>
                      )}
                    </div>

                    {paymentPhoto ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={paymentPhoto} 
                          alt="Comprobante" 
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #86efac' }} 
                        />
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={14} /> Foto adjunta
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            Se guardará vinculada a la venta
                          </span>
                        </div>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '0.65rem',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'center'
                      }}>
                        <Camera size={16} />
                        <span>{uploadingPhoto ? 'Comprimiendo foto...' : isDragOver ? 'Suelta la imagen aquí' : '📷 Click, Pegar (Ctrl+V) o Arrastrar'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePaymentPhotoChange}
                          style={{ display: 'none' }}
                          disabled={uploadingPhoto}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 3.2 Columna Derecha: Resumen Visual del Ticket & Botón Final */}
                <div style={{
                  background: 'var(--surface-hover, #f8fafc)',
                  borderRadius: '1.25rem',
                  border: '1px solid var(--border-strong, #cbd5e1)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    {/* Header Summary */}
                    <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        RESUMEN DE VENTA
                      </span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '2px', textTransform: 'uppercase' }}>
                        {(client.nombre || 'CLIENTE').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {client.rif ? `RIF: ${client.rif.toUpperCase()}` : ''} {client.whatsapp ? `· WA: ${client.whatsapp}` : ''}
                      </div>
                    </div>

                    {/* Items List in Summary */}
                    <div style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '14px',
                      paddingRight: '4px'
                    }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.8rem', gap: '8px' }}>
                          <span style={{ color: '#334155', flex: 1 }}>
                            <strong>{it.cantidad}x</strong> {it.nombre}
                            {it.nota && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, marginTop: '1px' }}>
                                📝 Nota: {it.nota}
                              </span>
                            )}
                          </span>
                          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ${fmt((it.cantidad || 1) * (it.precioUSD || 0))}{' '}
                            <span style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                              (Bs. {fmt((it.cantidad || 1) * (it.precioUSD || 0) * currentRate)})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totals Box con IVA ya incluido desglosado */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '0.85rem',
                      border: '1px solid #cbd5e1',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                        <span>Base Imponible (Sin IVA):</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          ${fmt(baseImponibleUSD)} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Bs. {fmt(baseImponibleBs)})</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a' }}>
                        <span>IVA (16% Ya Incluido):</span>
                        <span style={{ fontWeight: 800 }}>
                          ${fmt(ivaUSD)} <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>(Bs. {fmt(ivaBs)})</span>
                        </span>
                      </div>

                      <div style={{
                        borderTop: '1.5px dashed #cbd5e1',
                        paddingTop: '10px',
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline'
                      }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>TOTAL A PAGAR:</span>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary, #16a34a)' }}>
                            Bs. {fmt(totalBs)}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#64748b' }}>
                            (${fmt(totalUSD)})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3.3 Sección de Delivery / Envío (Punto 1) */}
                    <div style={{
                      marginTop: '12px',
                      background: hasDelivery ? '#f0fdf4' : '#ffffff',
                      border: hasDelivery ? '1.5px solid #86efac' : '1px solid #cbd5e1',
                      borderRadius: '0.85rem',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      {/* Switch Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            background: hasDelivery ? '#dcfce7' : '#f1f5f9',
                            color: hasDelivery ? '#16a34a' : '#64748b',
                            borderRadius: '8px',
                            padding: '6px',
                            display: 'flex'
                          }}>
                            {hasDelivery ? <Bike size={16} /> : <Package size={16} />}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                              ¿Desea Delivery / Envío?
                            </span>
                            <span style={{ fontSize: '0.72rem', color: hasDelivery ? '#15803d' : '#64748b' }}>
                              {hasDelivery ? 'Envío coordinado activado' : 'Retiro en Tienda (Chacaíto CC ARTA)'}
                            </span>
                          </div>
                        </div>

                        {/* Switch button */}
                        <button
                          type="button"
                          onClick={() => setHasDelivery(!hasDelivery)}
                          style={{
                            width: '46px',
                            height: '24px',
                            borderRadius: '12px',
                            background: hasDelivery ? 'var(--primary, #47FF00)' : '#cbd5e1',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s ease',
                            padding: 0
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: '3px',
                            left: hasDelivery ? '24px' : '4px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>

                      {/* Opciones cuando tiene delivery activado */}
                      {hasDelivery && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                          {/* Tipo de envío: Motorizado / MRW / ZOOM */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                              { id: 'motorizado', label: '🛵 Motorizado', sub: 'Caracas' },
                              { id: 'mrw', label: '📦 MRW', sub: 'Nacional' },
                              { id: 'zoom', label: '⚡ ZOOM', sub: 'Nacional' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setDeliveryType(opt.id)}
                                style={{
                                  flex: 1,
                                  padding: '6px 4px',
                                  borderRadius: '6px',
                                  border: deliveryType === opt.id ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                  background: deliveryType === opt.id ? '#dcfce7' : '#ffffff',
                                  color: deliveryType === opt.id ? '#166534' : '#475569',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {opt.label}
                                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
                                  {opt.sub}
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Campos según tipo */}
                          {deliveryType === 'motorizado' ? (
                            <>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                                  Dirección de Entrega en Caracas *
                                </label>
                                <input 
                                  type="text"
                                  placeholder="Ej. Urb. Las Mercedes, Calle París, Edif..."
                                  value={deliveryAddress}
                                  onChange={e => setDeliveryAddress(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.78rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                                  Link de Ubicación (Google Maps)
                                </label>
                                <input 
                                  type="url"
                                  placeholder="Ej. https://maps.app.goo.gl/..."
                                  value={deliveryMapsLink}
                                  onChange={e => setDeliveryMapsLink(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.78rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                                  Agencia / Código {deliveryType === 'mrw' ? 'MRW' : 'ZOOM'} Destino *
                                </label>
                                <input 
                                  type="text"
                                  placeholder="Ej. Agencia Chacao / Código 0102"
                                  value={shippingAgency}
                                  onChange={e => setShippingAgency(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.78rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                                  Ciudad y Estado de Destino *
                                </label>
                                <input 
                                  type="text"
                                  placeholder="Ej. Valencia, Edo. Carabobo"
                                  value={shippingCity}
                                  onChange={e => setShippingCity(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.78rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ArrowLeft size={16} /> Volver
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSaveSale}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '0.75rem',
                        background: isSubmitting ? '#cbd5e1' : '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSubmitting ? (
                        <>Guardando venta...</>
                      ) : (
                        <>
                          <Check size={20} /> Completar Venta y Recibo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
