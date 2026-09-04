import { getAnalyticsSettings } from './db';

let isMetaInitialized = false;
let isGoogleInitialized = false;
let cachedSettings = null;

/**
 * Inicializar Meta Pixel dinámicamente
 */
const initMetaPixel = (pixelId) => {
  if (isMetaInitialized || !pixelId) return;

  try {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', pixelId.trim());
    window.fbq('track', 'PageView');
    isMetaInitialized = true;
    console.log('[Analytics] Meta Pixel inicializado con ID:', pixelId);
  } catch (error) {
    console.warn('[Analytics] No se pudo inicializar Meta Pixel:', error);
  }
};

/**
 * Inicializar Google Analytics 4 (gtag.js) dinámicamente
 */
const initGoogleAnalytics = (measurementId) => {
  if (isGoogleInitialized || !measurementId) return;

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId.trim()}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId.trim(), {
      send_page_view: false // Gestionamos pageviews manualmente para SPAs
    });

    isGoogleInitialized = true;
    console.log('[Analytics] Google Analytics inicializado con ID:', measurementId);
  } catch (error) {
    console.warn('[Analytics] No se pudo inicializar Google Analytics:', error);
  }
};

/**
 * Carga e inicializa los píxels configurados en Firestore
 */
export const initAnalytics = async () => {
  try {
    const settings = await getAnalyticsSettings();
    cachedSettings = settings;

    if (settings.metaPixelEnabled && settings.metaPixelId && settings.metaPixelId.trim()) {
      initMetaPixel(settings.metaPixelId);
    }

    if (settings.googleAnalyticsEnabled && settings.googleAnalyticsId && settings.googleAnalyticsId.trim()) {
      initGoogleAnalytics(settings.googleAnalyticsId);
    }

    return settings;
  } catch (error) {
    console.warn('[Analytics] Error cargando configuración:', error);
    return null;
  }
};

/**
 * Rastrear Vista de Página (PageView)
 */
export const trackPageView = (path = window.location.pathname, title = document.title) => {
  try {
    if (window.fbq && isMetaInitialized) {
      window.fbq('track', 'PageView');
    }
    if (window.gtag && isGoogleInitialized && cachedSettings?.googleAnalyticsId) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title
      });
    }
  } catch (e) {
    console.debug('[Analytics] PageView error:', e);
  }
};

/**
 * Rastrear cuando un cliente mira un producto (ViewContent)
 */
export const trackViewContent = (product) => {
  if (!product) return;
  try {
    const payload = {
      content_name: product.name,
      content_category: product.category,
      content_ids: [product.id],
      content_type: 'product',
      value: Number(product.price) || 0,
      currency: 'USD'
    };

    if (window.fbq && isMetaInitialized) {
      window.fbq('track', 'ViewContent', payload);
    }
    if (window.gtag && isGoogleInitialized) {
      window.gtag('event', 'view_item', {
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: Number(product.price) || 0
        }],
        currency: 'USD',
        value: Number(product.price) || 0
      });
    }
    console.log('[Analytics] Evento ViewContent enviado:', product.name);
  } catch (e) {
    console.debug('[Analytics] ViewContent error:', e);
  }
};

/**
 * Rastrear cuando un cliente hace clic en pedir por WhatsApp (Contact / InitiateCheckout)
 */
export const trackContact = (product, isWholesale = false) => {
  try {
    const price = product ? (isWholesale ? (product.resellerPrice || Math.round(product.price * 0.8)) : product.price) : 0;
    const payload = {
      content_name: product ? product.name : 'WhatsApp Contact',
      content_category: product ? product.category : 'General',
      content_ids: product ? [product.id] : [],
      value: Number(price) || 0,
      currency: 'USD',
      lead_type: isWholesale ? 'Mayorista' : 'Retail'
    };

    if (window.fbq && isMetaInitialized) {
      window.fbq('track', 'Contact', payload);
      window.fbq('track', 'InitiateCheckout', payload);
    }
    if (window.gtag && isGoogleInitialized) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: Number(price) || 0,
        items: product ? [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: Number(price) || 0
        }] : []
      });
      window.gtag('event', 'generate_lead', {
        currency: 'USD',
        value: Number(price) || 0
      });
    }
    console.log('[Analytics] Evento Contact / WhatsAppClick enviado:', payload);
  } catch (e) {
    console.debug('[Analytics] Contact error:', e);
  }
};

/**
 * Rastrear registro o solicitud de mayorista (Lead / CompleteRegistration)
 */
export const trackWholesaleLead = (wholesaleData) => {
  try {
    const payload = {
      content_name: 'Registro Mayorista',
      status: 'pending',
      currency: 'USD'
    };

    if (window.fbq && isMetaInitialized) {
      window.fbq('track', 'Lead', payload);
      window.fbq('track', 'CompleteRegistration', payload);
    }
    if (window.gtag && isGoogleInitialized) {
      window.gtag('event', 'sign_up', {
        method: wholesaleData?.email ? 'Email' : 'Form'
      });
      window.gtag('event', 'generate_lead', payload);
    }
    console.log('[Analytics] Evento Lead Mayorista enviado:', wholesaleData);
  } catch (e) {
    console.debug('[Analytics] WholesaleLead error:', e);
  }
};
