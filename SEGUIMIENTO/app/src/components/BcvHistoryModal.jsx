import React, { useState, useEffect } from 'react';
import { TrendingUp, X, Sparkles } from 'lucide-react';

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

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Historical Dataset (Pre-populated as requested)
const BCV_DATA = [
  { date: '25/08/2026', rate: 785.0693 },
  { date: '26/08/2026', rate: 787.5196 }
];

export default function BcvHistoryModal({ onClose, currentBcvRate }) {
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    const fullHistory = [...BCV_DATA];
    
    // Add current live rate if newer
    const todayStr = new Date().toLocaleDateString('es-VE');
    const liveRate = parseNum(currentBcvRate);
    if (liveRate > 0 && !fullHistory.some(h => h.date === todayStr)) {
      fullHistory.push({ date: todayStr, rate: liveRate });
    }

    // Compute daily diffs
    const processed = fullHistory.map((item, idx) => {
      let diffBs = 0;
      let diffPct = 0;
      if (idx > 0) {
        const prev = fullHistory[idx - 1].rate;
        diffBs = item.rate - prev;
        diffPct = prev > 0 ? (diffBs / prev) * 100 : 0;
      }
      return { ...item, diffBs, diffPct };
    });

    setHistoryList(processed);
  }, [currentBcvRate]);

  const calculateProjection = () => {
    if (historyList.length < 2) return { projectedRate: 0, pct: 0, diffBs: 0, avgPctChange: 0 };
    
    const lastItems = historyList.slice(-5);
    const avgPctChange = lastItems.reduce((acc, item) => acc + (item.diffPct || 0), 0) / (lastItems.length - 1 || 1);
    const lastRate = historyList[historyList.length - 1].rate;
    const projectedRate = lastRate * (1 + (avgPctChange / 100));

    return {
      lastRate,
      projectedRate,
      avgPctChange,
      diffBs: projectedRate - lastRate
    };
  };

  const projectionInfo = calculateProjection();

  const renderChart = () => {
    if (historyList.length === 0) return null;
    const rates = historyList.map(h => h.rate);
    const min = Math.min(...rates) * 0.998;
    const max = Math.max(...rates) * 1.002;
    const range = max - min || 1;

    const width = 500;
    const height = 140;
    const points = historyList.map((h, i) => {
      const denom = historyList.length > 1 ? historyList.length - 1 : 1;
      const x = (i / denom) * (width - 40) + 20;
      const y = height - ((h.rate - min) / range) * (height - 30) - 15;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ background: 'rgba(15, 23, 42, 0.04)', borderRadius: '14px', padding: '12px', border: '1px solid var(--border-strong)' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {historyList.map((h, i) => {
            const denom = historyList.length > 1 ? historyList.length - 1 : 1;
            const x = (i / denom) * (width - 40) + 20;
            const y = height - ((h.rate - min) / range) * (height - 30) - 15;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#15803d" stroke="#fff" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        borderRadius: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        background: 'var(--surface)'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <TrendingUp size={20} /> 
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Historial BCV</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(71, 255, 0, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1.5px solid var(--primary)',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '850', textTransform: 'uppercase', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Proyección Inteligente para Mañana
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'var(--surface)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-strong)' }}>
                Tendencia: {projectionInfo.avgPctChange >= 0 ? '+' : ''}{fmt(projectionInfo.avgPctChange, 2)}% diario
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: '950', color: 'var(--primary)' }}>
                ~{fmt(projectionInfo.projectedRate, 4)} Bs
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: projectionInfo.diffBs >= 0 ? '#16a34a' : '#ef4444' }}>
                ({projectionInfo.diffBs >= 0 ? '↑ +' : '↓ '}{fmt(projectionInfo.diffBs, 4)} Bs)
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '850', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Gráfico de Tendencia
            </h4>
            {renderChart()}
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '850', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Historial Diario Oficial BCV
            </h4>
            <div style={{ overflowX: 'auto', maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-strong)', borderRadius: '12px' }}>
              <table className="costos-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasa Oficial BCV</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Variación Diaria (Bs)</th>
                    <th style={{ padding: '10px 14px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Porcentaje (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.slice().reverse().map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '800' }}>{item.date}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '900', color: 'var(--primary)' }}>Bs. {fmt(item.rate, 4)}</td>
                      <td style={{ padding: '10px 14px', color: item.diffBs >= 0 ? '#16a34a' : '#ef4444', fontWeight: '800' }}>
                        {item.diffBs >= 0 ? `+${fmt(item.diffBs, 4)}` : fmt(item.diffBs, 4)}
                      </td>
                      <td style={{ padding: '10px 14px', color: item.diffPct >= 0 ? '#16a34a' : '#ef4444', fontWeight: '800' }}>
                        {item.diffPct >= 0 ? `+${fmt(item.diffPct, 2)}%` : `${fmt(item.diffPct, 2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
