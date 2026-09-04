import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, writeBatch, increment } from 'firebase/firestore';

export const toggleProductLike = async (productId, isLiking) => {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      likes: increment(isLiking ? 1 : -1)
    });
  } catch (error) {
    console.error("Error al actualizar likes del producto:", error);
    throw error;
  }
};

export const toggleProductVisibility = async (productId, isVisible) => {
  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      isVisible: isVisible
    });
  } catch (error) {
    console.error("Error al cambiar visibilidad del producto:", error);
    throw error;
  }
};

// Colecciones en Firestore
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

/**
 * Obtiene todas las categorías ordenadas
 */
export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    let categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    
    if (categories.length === 0) {
      return [
        { id: 'todos', name: 'Todos', order: 0 },
        { id: 'automaticos', name: 'Sellos Automáticos', description: 'Prácticos y de uso continuo', imageUrl: 'https://placehold.co/600x400/e2e8f0/64748b?text=Automáticos', order: 1 },
        { id: 'bolsillo', name: 'Sellos de Bolsillo', description: 'Portátiles y compactos', imageUrl: 'https://placehold.co/600x400/e2e8f0/64748b?text=Bolsillo', order: 2 },
        { id: 'madera', name: 'Sellos de Madera', description: 'Tradicionales y duraderos', imageUrl: 'https://placehold.co/600x400/e2e8f0/64748b?text=Madera', order: 3 },
        { id: 'secos', name: 'Sellos Secos', description: 'Relieve para documentos', imageUrl: 'https://placehold.co/600x400/e2e8f0/64748b?text=Secos', order: 4 }
      ];
    }
    
    // Asignar order por defecto si no existe y luego ordenar
    categories.forEach((cat, index) => {
      if (typeof cat.order !== 'number') cat.order = index;
    });
    
    return categories.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return [];
  }
};

export const getCategoryById = async (categoryId) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    const cats = await getCategories();
    return cats.find(c => c.id === categoryId) || null;
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    return null;
  }
};

export const addCategory = async (categoryData, customId = null) => {
  try {
    if (typeof categoryData.order !== 'number') {
      const allCats = await getCategories();
      categoryData.order = allCats.length;
    }
    
    if (customId) {
      await setDoc(doc(db, CATEGORIES_COLLECTION, customId), categoryData);
      return customId;
    } else {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
      return docRef.id;
    }
  } catch (error) {
    console.error("Error al agregar categoría:", error);
    throw error;
  }
};

export const updateCategoriesOrder = async (categoriesArray) => {
  try {
    const batch = writeBatch(db);
    categoriesArray.forEach((cat, index) => {
      // No actualizamos la categoría falsa "todos" si existe en el array local
      if (cat.id !== 'todos') {
        const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
        batch.update(docRef, { order: index });
      }
    });
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar orden de categorías:", error);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, categoryData);
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    throw error;
  }
};

/**
 * Obtiene todos los productos del catálogo ordenados
 */
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    let products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    // Fallback temporal si la base de datos está vacía
    if (products.length === 0) {
      return [
        { 
          id: '1', name: 'Trodat Printy 4911', dimensions: '38 × 14 mm', price: 12, category: 'automaticos', 
          shortDescription: 'Información corta, nombres, firmas pequeñas.',
          description: 'Uno de nuestros modelos más compactos y populares. Ideal para información muy específica.',
          capacity: ['Nombre y Apellido', 'Cargo simple', 'Firma pequeña', 'Cédula'],
          variants: [
            { colorName: 'Rojo', hex: '#e91e63', imageUrl: 'https://placehold.co/400x400/e91e63/FFFFFF?text=4911+Rojo', available: true },
            { colorName: 'Azul', hex: '#2196f3', imageUrl: 'https://placehold.co/400x400/2196f3/FFFFFF?text=4911+Azul', available: true },
            { colorName: 'Verde', hex: '#4caf50', imageUrl: 'https://placehold.co/400x400/4caf50/FFFFFF?text=4911+Verde', available: false }
          ],
          order: 0,
          showOnHome: true
        },
        { 
          id: '2', name: 'Trodat Printy 4913', dimensions: '58 × 22 mm', price: 17, category: 'automaticos', 
          shortDescription: 'Información amplia, profesionales, logos.',
          description: 'Modelo versátil para nombres, cargos, datos profesionales y diseños con logotipo.',
          capacity: ['Nombre y apellido', 'Cargo profesional', 'Número de registro', 'Teléfono', 'RIF', 'Logo sencillo'],
          variants: [
            { colorName: 'Negro', hex: '#000000', imageUrl: 'https://placehold.co/400x400/000000/FFFFFF?text=4913+Negro', available: true },
            { colorName: 'Gris', hex: '#9e9e9e', imageUrl: 'https://placehold.co/400x400/9e9e9e/FFFFFF?text=4913+Gris', available: true },
            { colorName: 'Turquesa', hex: '#00bcd4', imageUrl: 'https://placehold.co/400x400/00bcd4/FFFFFF?text=4913+Turquesa', available: false }
          ],
          featured: true,
          order: 1,
          showOnHome: true
        }
      ];
    }
    
    products.forEach((prod, index) => {
      if (typeof prod.order !== 'number') prod.order = index;
    });
    
    return products.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

export const getFeaturedHomeProducts = async () => {
  try {
    const allProducts = await getProducts();
    // Filtramos los que tienen showOnHome en true y limitamos a 6
    return allProducts.filter(p => p.showOnHome).slice(0, 6);
  } catch (error) {
    console.error("Error al obtener productos destacados para el inicio:", error);
    return [];
  }
};

export const updateProductsOrder = async (productsArray) => {
  try {
    const batch = writeBatch(db);
    productsArray.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar orden de productos:", error);
    throw error;
  }
};

/**
 * Obtiene un producto individual por su ID
 */
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      const fallbackProducts = await getProducts();
      return fallbackProducts.find(p => p.id === productId) || null;
    }
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    return null;
  }
};

/**
 * Agrega un nuevo producto a la base de datos
 */
export const addProduct = async (productData) => {
  try {
    if (typeof productData.order !== 'number') {
      const allProds = await getProducts();
      productData.order = allProds.length;
    }
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar producto:", error);
    throw error;
  }
};

/**
 * Actualiza un producto existente
 */
export const updateProduct = async (productId, productData) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, productData);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    throw error;
  }
};

/**
 * Elimina un producto
 */
export const deleteProduct = async (productId) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    throw error;
  }
};

const SLIDER_COLLECTION = 'slider';

export const getSliderImages = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SLIDER_COLLECTION));
    let images = [];
    querySnapshot.forEach((doc) => {
      images.push({ id: doc.id, ...doc.data() });
    });
    
    images.forEach((img, index) => {
      if (typeof img.order !== 'number') img.order = index;
    });
    
    return images.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error al obtener slider:", error);
    return [];
  }
};

export const addSliderImage = async (imageData) => {
  try {
    if (typeof imageData.order !== 'number') {
      const allImgs = await getSliderImages();
      imageData.order = allImgs.length;
    }
    const docRef = await addDoc(collection(db, SLIDER_COLLECTION), imageData);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar imagen al slider:", error);
    throw error;
  }
};

export const deleteSliderImage = async (imageId) => {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, imageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar imagen del slider:", error);
    throw error;
  }
};

export const updateSliderOrder = async (imagesArray) => {
  try {
    const batch = writeBatch(db);
    imagesArray.forEach((img, index) => {
      const docRef = doc(db, SLIDER_COLLECTION, img.id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error al actualizar orden del slider:", error);
    throw error;
  }
};

// ==========================================
// SERVICIOS DE MAYORISTAS (Wholesale Portal)
// ==========================================
const WHOLESALE_USERS_COLLECTION = 'wholesale_users';

/**
 * Obtener todos los usuarios mayoristas (para el panel admin)
 */
export const getWholesaleUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, WHOLESALE_USERS_COLLECTION));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar: primero pendientes, luego por fecha descendente
    return users.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });
  } catch (error) {
    console.error("Error al obtener mayoristas:", error);
    return [];
  }
};

/**
 * Obtener perfil de un mayorista por su UID de Firebase Auth
 */
export const getWholesaleProfile = async (uid) => {
  try {
    const docRef = doc(db, WHOLESALE_USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error al obtener perfil mayorista:", error);
    return null;
  }
};

/**
 * Registrar o guardar solicitud de mayorista
 */
export const saveWholesaleRequest = async (uid, data) => {
  try {
    const docRef = doc(db, WHOLESALE_USERS_COLLECTION, uid);
    const profilePayload = {
      ...data,
      status: 'pending',
      discount: data.discount || 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, profilePayload, { merge: true });
    return profilePayload;
  } catch (error) {
    console.error("Error al registrar solicitud de mayorista:", error);
    throw error;
  }
};

/**
 * Actualizar estado o descuento de un mayorista (desde el panel admin)
 */
export const updateWholesaleStatus = async (uid, status, discount = 20) => {
  try {
    const docRef = doc(db, WHOLESALE_USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      status,
      discount: Number(discount),
      statusUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al actualizar estado del mayorista:", error);
    throw error;
  }
};

/**
 * Actualizar datos de perfil (por el propio mayorista)
 */
export const updateWholesaleProfile = async (uid, updatedData) => {
  try {
    const docRef = doc(db, WHOLESALE_USERS_COLLECTION, uid);
    const payload = {
      ...updatedData,
      updatedAt: new Date().toISOString(),
      lastProfileUpdate: new Date().toISOString()
    };
    await updateDoc(docRef, payload);
    return payload;
  } catch (error) {
    console.error("Error al actualizar perfil de mayorista:", error);
    throw error;
  }
};

/**
 * Eliminar por completo el registro de un mayorista
 */
export const deleteWholesaleUser = async (uid) => {
  try {
    const docRef = doc(db, WHOLESALE_USERS_COLLECTION, uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar mayorista:", error);
    throw error;
  }
};

/**
 * Obtener configuración de Analítica y Píxels
 */
export const getAnalyticsSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'analytics');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      metaPixelId: '',
      metaPixelEnabled: false,
      googleAnalyticsId: '',
      googleAnalyticsEnabled: false,
      lookerStudioUrl: ''
    };
  } catch (error) {
    console.error("Error al obtener configuración de analítica:", error);
    return {
      metaPixelId: '',
      metaPixelEnabled: false,
      googleAnalyticsId: '',
      googleAnalyticsEnabled: false,
      lookerStudioUrl: ''
    };
  }
};

/**
 * Guardar configuración de Analítica y Píxels
 */
export const saveAnalyticsSettings = async (settings) => {
  try {
    const docRef = doc(db, 'settings', 'analytics');
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (error) {
    console.error("Error al guardar configuración de analítica:", error);
    throw error;
  }
};

/**
 * Obtener configuración del Asistente Virtual (Bot Gravy)
 */
export const getBotSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'bot');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      enabled: true,
      botName: 'Gravy',
      botTitle: 'Asesor Virtual de Sellos Chacaíto',
      welcomeMessage: '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
      geminiApiKey: ''
    };
  } catch (error) {
    console.error("Error al obtener configuración del bot:", error);
    return {
      enabled: true,
      botName: 'Gravy',
      botTitle: 'Asesor Virtual de Sellos Chacaíto',
      welcomeMessage: '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
      geminiApiKey: ''
    };
  }
};

/**
 * Guardar configuración del Asistente Virtual (Bot Gravy)
 */
export const saveBotSettings = async (settings) => {
  try {
    const docRef = doc(db, 'settings', 'bot');
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (error) {
    console.error("Error al guardar configuración del bot:", error);
    throw error;
  }
};
