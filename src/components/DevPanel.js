import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DRAGONS } from '../data/dragons';

// Key progress breakpoints for quick-jump
const STAGES = [
  { label: 'Egg',      value: 0.00 },
  { label: 'Crack 1',  value: 0.05 },
  { label: 'Crack 2',  value: 0.10 },
  { label: 'Hatch',    value: 0.15 },
  { label: 'Baby',     value: 0.20 },
  { label: '30%',      value: 0.30 },
  { label: 'Whelp',    value: 0.40 },
  { label: '50%',      value: 0.50 },
  { label: 'Drake',    value: 0.60 },
  { label: '70%',      value: 0.70 },
  { label: 'Stage 4',  value: 0.80 },
  { label: '90%',      value: 0.90 },
  { label: 'Adult',    value: 1.00 },
];

const dragonIds = Object.keys(DRAGONS);

export default function DevPanel() {
  const { dragon, progress, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');

  if (!dragon) return null;

  const setProgress = (v) => {
    dispatch({ type: 'DEV_SET_PROGRESS', progress: v });
  };

  const handleInput = (e) => {
    e.preventDefault();
    const num = parseFloat(inputVal);
    if (!isNaN(num)) {
      // Allow typing 0-100 (treat >1 as percentage) or 0-1 as fraction
      setProgress(num > 1 ? num / 100 : num);
    }
    setInputVal('');
  };

  const stepBy = (delta) => {
    setProgress(Math.round((progress + delta) * 100) / 100);
  };

  // Collapsed: just a small toggle button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
          background: '#1a1a2e', color: '#888', border: '1px solid #333',
          borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
          opacity: 0.6,
        }}
      >
        DEV
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0d0d1aee', borderTop: '1px solid #333',
      padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#ccc',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color: '#ff6b35', fontWeight: 700 }}>DEV</span>
        <span style={{ color: '#666' }}>
          {dragon.name} — {(progress * 100).toFixed(0)}% ({progress.toFixed(3)})
        </span>

        {/* Dragon switcher */}
        <select
          value={dragon.id}
          onChange={(e) => dispatch({ type: 'DEV_SET_DRAGON', dragonId: e.target.value })}
          style={{
            background: '#1a1a2e', color: '#aaa', border: '1px solid #444',
            borderRadius: 4, padding: '2px 4px', fontSize: 11, marginLeft: 'auto',
          }}
        >
          {dragonIds.map(id => (
            <option key={id} value={id}>{DRAGONS[id].name}</option>
          ))}
        </select>

        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none', border: 'none', color: '#666', cursor: 'pointer',
            fontSize: 16, lineHeight: 1, padding: '0 4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <input
          type="range"
          min={0} max={100} step={1}
          value={Math.round(progress * 100)}
          onChange={(e) => setProgress(parseInt(e.target.value) / 100)}
          style={{ flex: 1, accentColor: dragon.colors.primary }}
        />
        {/* Fine step buttons */}
        <button onClick={() => stepBy(-0.01)} style={btnStyle}>−1%</button>
        <button onClick={() => stepBy(0.01)} style={btnStyle}>+1%</button>
        {/* Direct input */}
        <form onSubmit={handleInput} style={{ display: 'flex', gap: 4 }}>
          <input
            type="text"
            placeholder="0-100"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{
              width: 48, background: '#1a1a2e', color: '#fff', border: '1px solid #444',
              borderRadius: 4, padding: '2px 6px', fontSize: 11, textAlign: 'center',
            }}
          />
          <button type="submit" style={btnStyle}>Go</button>
        </form>
      </div>

      {/* Quick-jump stage buttons */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {STAGES.map(s => {
          const active = Math.abs(progress - s.value) < 0.005;
          return (
            <button
              key={s.label}
              onClick={() => setProgress(s.value)}
              style={{
                ...btnStyle,
                background: active ? dragon.colors.primary + '44' : '#1a1a2e',
                borderColor: active ? dragon.colors.primary : '#444',
                color: active ? dragon.colors.accent : '#aaa',
                fontWeight: active ? 700 : 400,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = {
  background: '#1a1a2e', color: '#aaa', border: '1px solid #444',
  borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
  whiteSpace: 'nowrap',
};
