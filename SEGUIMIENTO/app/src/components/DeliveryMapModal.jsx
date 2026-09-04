import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../firebase/config';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { Trash2, MapPin, DollarSign, Save, X, Search, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapController({ centerPos }) {
  const map = useMap();
  useEffect(() => {
    if (centerPos) {
      map.flyTo(centerPos, 15, { duration: 1.5 });
    }
  }, [centerPos, map]);
  return null;
}

function DeliveryMapModal({ onClose }) {
  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState(null); // { lat, lng, name, price }
  const [isLoading, setIsLoading] = useState(true);
  const [addressQuery, setAddressQuery] = useState('');
  const [savedQuery, setSavedQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(null);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  // Center on Caracas
  const defaultCenter = [10.4806, -66.9036];

  useEffect(() => {
    const zonesRef = ref(db, 'deliveryZones');
    const unsubscribe = onValue(zonesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const zonesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setZones(zonesList);
      } else {
        setZones([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMapClick = (latlng) => {
    if (newZone) return; // Don't allow multiple unsaved pins
    setNewZone({
      lat: latlng.lat,
      lng: latlng.lng,
      name: '',
      price: ''
    });
  };

  const handleSaveNewZone = async () => {
    if (!newZone.name || !newZone.price) {
      toast.error("Por favor ingresa nombre y precio.");
      return;
    }
    
    try {
      const zonesRef = ref(db, 'deliveryZones');
      await push(zonesRef, {
        lat: newZone.lat,
        lng: newZone.lng,
        name: newZone.name,
        price: Number(newZone.price),
        createdAt: new Date().toISOString()
      });
      setNewZone(null);
      toast.success("Zona guardada correctamente");
    } catch (error) {
      console.error("Error saving zone:", error);
      toast.error("Error al guardar la zona.");
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta zona de delivery?")) return;
    try {
      await remove(ref(db, `deliveryZones/${zoneId}`));
      toast.success("Zona eliminada correctamente");
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error("Error al eliminar la zona.");
    }
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!addressQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery + ', Caracas, Venezuela')}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        toast.error("Lugar no encontrado. Intenta con un nombre más general.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al buscar el lugar.");
    }
  };

  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(savedQuery.toLowerCase()));

  const handleSavedSelect = (zone) => {
    setMapCenter([zone.lat, zone.lng]);
    setSavedQuery('');
    setShowSavedDropdown(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content glass-card" 
        onClick={e => e.stopPropagation()}
        style={{ width: '90%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
      >
        <div className="modal-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin color="#3b82f6" /> Mapa de Tarifas de Delivery
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Busca lugares, encuentra tus zonas guardadas o haz clic en el mapa.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Buscadores */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexDirection: 'row' }}>
          
          {/* Buscador de Direcciones */}
          <form onSubmit={handleAddressSearch} style={{ flex: 1, position: 'relative', display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar lugar (Ej: Hospital JM de los Ríos)..."
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto', marginTop: 0 }}>
              Buscar
            </button>
          </form>

          {/* Buscador de Zonas Guardadas */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Navigation size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar zona guardada..."
              value={savedQuery}
              onChange={(e) => { setSavedQuery(e.target.value); setShowSavedDropdown(true); }}
              onFocus={() => setShowSavedDropdown(true)}
              onBlur={() => setTimeout(() => setShowSavedDropdown(false), 200)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            />
            {showSavedDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 1000, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                {filteredZones.length > 0 ? (
                  filteredZones.map(zone => (
                    <div 
                      key={zone.id} 
                      onClick={() => handleSavedSelect(zone)}
                      style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{zone.name}</span>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>${zone.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem', textAlign: 'center' }}>No se encontraron zonas</div>
                )}
              </div>
            )}
          </div>

        </div>

        <div style={{ flex: 1, borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '2px solid #e2e8f0' }}>
        <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController centerPos={mapCenter} />
          <MapEvents onMapClick={handleMapClick} />

          {/* Render existing zones */}
          {zones.map((zone) => (
            <Marker key={zone.id} position={[zone.lat, zone.lng]}>
              <Popup>
                <div style={{ minWidth: '150px' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1e293b' }}>{zone.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                    <DollarSign size={16} /> {zone.price.toFixed(2)}
                  </div>
                  <button 
                    onClick={() => handleDeleteZone(zone.id)}
                    style={{ width: '100%', padding: '0.25rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render new zone form marker */}
          {newZone && (
            <Marker position={[newZone.lat, newZone.lng]}>
              <Popup autoPan={false}>
                <div style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 'bold', color: '#3b82f6' }}>Nueva Zona</h4>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Nombre del Sector</label>
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Ej: Altamira, Las Mercedes..."
                      value={newZone.name}
                      onChange={(e) => setNewZone({...newZone, name: e.target.value.toUpperCase()})}
                      style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Precio de Delivery ($)</label>
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.5rem', color: '#94a3b8' }}>$</span>
                      <input 
                        type="number" 
                        placeholder="3.00"
                        value={newZone.price}
                        onChange={(e) => setNewZone({...newZone, price: e.target.value})}
                        style={{ width: '100%', padding: '0.4rem 0.4rem 0.4rem 1.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => setNewZone(null)}
                      style={{ flex: 1, padding: '0.4rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveNewZone}
                      style={{ flex: 1, padding: '0.4rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Save size={14} /> Guardar
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        </MapContainer>
      </div>
    </div>
    </div>
  );
}

export default DeliveryMapModal;
