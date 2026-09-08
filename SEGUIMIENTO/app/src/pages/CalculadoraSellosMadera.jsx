import React, { useState, useMemo } from 'react';
import { Stamp, Ruler, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import { calculateWoodStampPrice, woodStampPricingConfig } from '../utils/woodStampPricing';
import '../styles/whitestamp.css';
import './CalculadoraSellosMadera.css';

// Solo permite dígitos (sin decimales, sin signos) — según el pedido, las
// medidas se trabajan únicamente en centímetros enteros.
function sanitizeIntegerInput(value) {
  return value.replace(/[^\d]/g, '').slice(0, 3);
}

function fmtPrice(n) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Pestañas internas de la página. Hoy solo existe "Calculadora" (Etapa 3);
// la Etapa 4 agrega "Tabla de precios" y "Simulador" (esta última solo para
// Álvaro) a este mismo arreglo, sin tener que rehacer la estructura.
function useTabs(_isAlvaro) {
  // La Etapa 4 agregará aquí "Tabla de precios" (para todos) y "Simulador"
  // (condicionado a _isAlvaro), reutilizando este mismo arreglo.
  return useMemo(() => [
    { id: 'calculadora', label: 'Calculadora', icon: Ruler, color: '#10b981' }
  ], []);
}

export default function CalculadoraSellosMadera() {
  const { activeProfile } = useProfile();
  const isAlvaro = Boolean(activeProfile?.name?.toLowerCase().includes('alvaro'));
  const TABS = useTabs(isAlvaro);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const [widthInput, setWidthInput] = useState('15');
  const [heightInput, setHeightInput] = useState('12');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const hasBothValues = widthInput.trim() !== '' && heightInput.trim() !== '';
  const widthNum = widthInput === '' ? NaN : parseInt(widthInput, 10);
  const heightNum = heightInput === '' ? NaN : parseInt(heightInput, 10);

  const result = useMemo(
    () => calculateWoodStampPrice(widthNum, heightNum),
    [widthNum, heightNum]
  );

  const wholesalePercent = Math.round(woodStampPricingConfig.wholesaleDiscount * 100);

  return (
    <div className="wsm-wrapper animate-fade-in">
      <div className="wsm-container">

        {/* Header */}
        <header className="wsm-header">
          <div className="wsm-title-box">
            <div className="wsm-icon-badge">
              <Stamp size={24} />
            </div>
            <div>
              <h1>Calculadora de Sellos de Madera</h1>
              <p>Ingresa el ancho y el alto en centímetros para calcular el precio</p>
            </div>
          </div>
        </header>

        {/* Selector de pestañas (solo se muestra cuando hay más de una) */}
        {TABS.length > 1 && (
          <div className="wsm-tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`wsm-tab-btn ${isActive ? 'active' : ''}`}
                  style={isActive ? { '--wsm-tab-color': tab.color } : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'calculadora' && (
          <div className="wsm-card">
            <h3 className="wsm-card-title">
              <span><Ruler size={18} color="var(--ws-accent-primary)" /> Medida del sello</span>
            </h3>

            <div className="wsm-inputs-row">
              <div className="wsm-field-group">
                <label className="wsm-label">Ancho</label>
                <div className="wsm-input-shell">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="wsm-input"
                    value={widthInput}
                    onChange={(e) => setWidthInput(sanitizeIntegerInput(e.target.value))}
                    placeholder="0"
                  />
                  <span className="wsm-input-suffix">cm</span>
                </div>
              </div>

              <div className="wsm-x-separator">×</div>

              <div className="wsm-field-group">
                <label className="wsm-label">Alto</label>
                <div className="wsm-input-shell">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="wsm-input"
                    value={heightInput}
                    onChange={(e) => setHeightInput(sanitizeIntegerInput(e.target.value))}
                    placeholder="0"
                  />
                  <span className="wsm-input-suffix">cm</span>
                </div>
              </div>
            </div>

            {/* Estado vacío */}
            {!hasBothValues && (
              <div className="wsm-empty-state">
                Ingresa el ancho y el alto para ver el precio.
              </div>
            )}

            {/* Medida inválida */}
            {hasBothValues && !result.valid && (
              <div className="wsm-error-box">
                <AlertTriangle size={18} />
                <span>{result.validationMessage}</span>
              </div>
            )}

            {/* Resultado */}
            {hasBothValues && result.valid && (
              <>
                <div className="wsm-result-grid">
                  <div className="wsm-result-item">
                    <span>Medida</span>
                    <strong>{result.width} × {result.height} cm</strong>
                  </div>
                  <div className="wsm-result-item">
                    <span>Área</span>
                    <strong>{result.area} cm²</strong>
                  </div>
                  <div className="wsm-price-box pvp">
                    <span>PVP</span>
                    <strong>${fmtPrice(result.retailPrice)}</strong>
                  </div>
                  <div className="wsm-price-box wholesale">
                    <span>Mayorista -{wholesalePercent}%</span>
                    <strong>${fmtPrice(result.wholesalePrice)}</strong>
                  </div>
                </div>

                <div className="wsm-breakdown">
                  <button
                    type="button"
                    className="wsm-breakdown-toggle"
                    onClick={() => setShowBreakdown(v => !v)}
                  >
                    <span>{showBreakdown ? 'Ocultar cálculo' : 'Ver cálculo'}</span>
                    {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showBreakdown && (
                    <div className="wsm-breakdown-detail">
                      <div className="wsm-breakdown-row">
                        <span>Área</span>
                        <strong>{result.area} cm²</strong>
                      </div>
                      <div className="wsm-breakdown-row">
                        <span>Fórmula</span>
                        <strong>
                          {woodStampPricingConfig.referencePrice} × ({result.area} / {woodStampPricingConfig.referenceArea})^{woodStampPricingConfig.exponent}
                        </strong>
                      </div>
                      <div className="wsm-breakdown-row">
                        <span>Precio antes del redondeo</span>
                        <strong>${fmtPrice(result.rawPrice)}</strong>
                      </div>
                      <div className="wsm-breakdown-row">
                        <span>PVP redondeado</span>
                        <strong>${fmtPrice(result.retailPrice)}</strong>
                      </div>
                      <div className="wsm-breakdown-row">
                        <span>Mayorista</span>
                        <strong>
                          ${fmtPrice(result.retailPrice)} × {(1 - woodStampPricingConfig.wholesaleDiscount).toFixed(2)} = ${fmtPrice(result.wholesalePrice)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
