import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

// Persistent marks each skill leaves on the cave: scorch ovals, ice crystals,
// rock piles, shadow stains, glowing crystals, lightning scars. Capped at 8;
// oldest evicts FIFO so the cave is always somewhat marked but never cluttered.

// ============================================================
// EMBER — scorch oval with glowing embers and rising smoke
// ============================================================
function ScorchMark({ colors }) {
  const embers = [
    { x: '25%', y: '40%', d: 0 },
    { x: '50%', y: '55%', d: 0.4 },
    { x: '70%', y: '38%', d: 0.8 },
    { x: '40%', y: '65%', d: 1.2 },
  ];
  return (
    <div style={{ position: 'relative', width: 130, height: 70 }}>
      {/* Charred outer ring */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, #0a0000 0%, #1a0a05 35%, ${colors.primary}66 65%, transparent 88%)`,
        borderRadius: '50%',
        filter: 'blur(3px)',
      }} />
      {/* Inner orange heat glow */}
      <div style={{
        position: 'absolute', left: '15%', top: '20%', width: '70%', height: '60%',
        background: `radial-gradient(circle, ${colors.accent}88 0%, ${colors.glow}55 40%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(8px)',
        mixBlendMode: 'screen',
      }} />
      {embers.map((e, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: e.x, top: e.y,
            width: 5, height: 5,
            background: i % 2 === 0 ? '#ffeb3b' : colors.accent,
            boxShadow: `0 0 10px ${colors.glow}, 0 0 20px ${colors.accent}80`,
            borderRadius: '50%',
          }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: e.d }}
        />
      ))}
      {/* Smoke wisp slowly rising */}
      <motion.div style={{
        position: 'absolute', left: '45%', top: 0,
        width: 10, height: 40,
        background: `linear-gradient(to top, #555 0%, #333 50%, transparent 100%)`,
        borderRadius: '50%',
        filter: 'blur(4px)',
        opacity: 0.5,
      }}
        animate={{ y: [-2, -28, -2], opacity: [0.4, 0.15, 0.4], scaleX: [1, 1.4, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ============================================================
// FROST — cluster of ice crystal spikes with cyan halo + shimmer
// ============================================================
function FrostMark({ colors }) {
  const spikes = [
    { x: '12%', h: 55, rot: -18, w: 11 },
    { x: '32%', h: 78, rot: -4, w: 14 },
    { x: '55%', h: 92, rot: 6, w: 16 },
    { x: '75%', h: 62, rot: 16, w: 12 },
    { x: '88%', h: 38, rot: 22, w: 8 },
  ];
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      {/* Halo glow */}
      <div style={{
        position: 'absolute', inset: -16,
        background: `radial-gradient(circle, ${colors.glow}55 0%, ${colors.accent}22 50%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(10px)',
      }} />
      {/* Frost patch on ground */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '-8%',
        height: 22,
        background: `radial-gradient(ellipse at center, #ffffffaa 0%, ${colors.glow}55 40%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(4px)',
      }} />
      {spikes.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.x, bottom: 0,
          width: c.w, height: c.h,
          background: `linear-gradient(to top, ${colors.accent}aa 0%, #ffffffee 70%, #fff 100%)`,
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          transform: `rotate(${c.rot}deg)`,
          transformOrigin: 'center bottom',
          boxShadow: `0 0 10px ${colors.glow}`,
          filter: 'drop-shadow(0 0 4px #ffffff80)',
        }} />
      ))}
      {/* Shimmer sweep across crystals */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(110deg, transparent 30%, ${colors.glow}88 50%, transparent 70%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
        animate={{ x: ['-110%', '110%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ============================================================
// STONE — pile of overlapping rocks with dust still settling
// ============================================================
function RockPileMark({ colors }) {
  const rocks = [
    { x: 0, y: 35, w: 38, h: 32, rot: -8, shape: '40% 60% 50% 45% / 55% 45% 50% 50%', tone: 'dark' },
    { x: 28, y: 18, w: 44, h: 40, rot: 6, shape: '50% 45% 55% 50% / 48% 52% 50% 50%', tone: 'mid' },
    { x: 60, y: 30, w: 36, h: 30, rot: -4, shape: '45% 55% 48% 52% / 50% 50% 55% 45%', tone: 'dark' },
    { x: 18, y: 52, w: 26, h: 22, rot: 12, shape: '50% 50% 50% 50% / 55% 45% 45% 55%', tone: 'mid' },
    { x: 52, y: 56, w: 30, h: 24, rot: -10, shape: '50% 50% 55% 45% / 45% 55% 50% 50%', tone: 'light' },
  ];
  const tones = {
    dark: `linear-gradient(140deg, ${colors.primary}, #1a0a05)`,
    mid: `linear-gradient(140deg, ${colors.accent}, ${colors.primary})`,
    light: `linear-gradient(140deg, ${colors.glow}66, ${colors.accent})`,
  };
  return (
    <div style={{ position: 'relative', width: 100, height: 90 }}>
      {/* Ground shadow under pile */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 14,
        background: `radial-gradient(ellipse at center, #000000aa 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(4px)',
      }} />
      {rocks.map((r, i) => (
        <div key={i} style={{
          position: 'absolute', left: r.x, top: r.y,
          width: r.w, height: r.h,
          borderRadius: r.shape,
          background: tones[r.tone],
          transform: `rotate(${r.rot}deg)`,
          boxShadow: `inset -3px -4px 8px rgba(0,0,0,0.5), inset 2px 2px 4px ${colors.glow}30, 0 2px 4px rgba(0,0,0,0.4)`,
        }} />
      ))}
      {/* Lingering dust */}
      <motion.div style={{
        position: 'absolute', left: 10, right: 10, top: -8,
        height: 20,
        background: `radial-gradient(ellipse at center, ${colors.accent}44 0%, transparent 70%)`,
        filter: 'blur(6px)',
      }}
        animate={{ opacity: [0, 0.5, 0], y: [0, -8, -16] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeOut' }}
      />
    </div>
  );
}

// ============================================================
// SHADOW — irregular dark stain with drifting wisps
// ============================================================
function ShadowStainMark({ colors }) {
  return (
    <div style={{ position: 'relative', width: 130, height: 110 }}>
      {/* Outer purple haze */}
      <motion.div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 45% 55%, ${colors.primary}cc 0%, ${colors.accent}88 30%, ${colors.primary}55 55%, transparent 80%)`,
        borderRadius: '60% 40% 55% 45% / 50% 50% 50% 50%',
        filter: 'blur(6px)',
        mixBlendMode: 'multiply',
      }}
        animate={{ scale: [1, 1.04, 0.98, 1], rotate: [0, 4, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Dark inner core */}
      <div style={{
        position: 'absolute', left: '25%', top: '30%', width: '50%', height: '40%',
        background: `radial-gradient(circle, #06000f 0%, ${colors.primary}66 60%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(5px)',
      }} />
      {/* Glowing eye */}
      <motion.div style={{
        position: 'absolute', left: '46%', top: '46%',
        width: 8, height: 8,
        background: colors.glow,
        boxShadow: `0 0 12px ${colors.accent}, 0 0 24px ${colors.glow}`,
        borderRadius: '50%',
      }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.3, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      {/* Drifting wisps */}
      {[0, 0.7, 1.4, 2.1].map((delay, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: `${30 + i * 12}%`, top: '20%',
            width: 4, height: 18,
            background: `linear-gradient(to top, ${colors.primary}aa, transparent)`,
            borderRadius: '50%',
            filter: 'blur(2px)',
          }}
          animate={{ y: [0, -25, -45], opacity: [0, 0.6, 0], scaleY: [0.5, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ============================================================
// GLIMMER — bright glowing crystal cluster with sparkle particles
// ============================================================
function GlowCrystalMark({ colors }) {
  const crystals = [
    { x: 18, y: 28, w: 14, h: 50, rot: -8 },
    { x: 38, y: 14, w: 18, h: 70, rot: 2 },
    { x: 60, y: 22, w: 16, h: 60, rot: 12 },
  ];
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      {/* Pulsing aura */}
      <motion.div style={{
        position: 'absolute', inset: -22,
        background: `radial-gradient(circle, #ffeb3b88 0%, ${colors.accent}55 35%, ${colors.glow}33 60%, transparent 85%)`,
        borderRadius: '50%',
        filter: 'blur(12px)',
      }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Crystals */}
      {crystals.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.x, top: c.y,
          width: c.w, height: c.h,
          background: `linear-gradient(135deg, #ffffffee 0%, ${colors.accent} 50%, ${colors.glow} 100%)`,
          clipPath: 'polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)',
          transform: `rotate(${c.rot}deg)`,
          boxShadow: `0 0 14px #ffeb3b, 0 0 28px ${colors.glow}aa`,
        }} />
      ))}
      {/* Sparkle particles orbiting */}
      {[0, 0.5, 1.0, 1.5, 2.0].map((delay, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <motion.div key={i}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 4, height: 4,
              background: '#fff',
              boxShadow: `0 0 8px ${colors.accent}, 0 0 16px #ffeb3b`,
              borderRadius: '50%',
            }}
            animate={{
              x: [Math.cos(angle) * 35, Math.cos(angle + Math.PI * 2) * 35],
              y: [Math.sin(angle) * 35, Math.sin(angle + Math.PI * 2) * 35],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{ duration: 4, repeat: Infinity, delay, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// STORM — jagged lightning scar + reflective puddle + sparks
// ============================================================
function LightningScarMark({ colors }) {
  return (
    <div style={{ position: 'relative', width: 110, height: 130 }}>
      {/* Lightning scar — jagged dark scorch on rock */}
      <div style={{
        position: 'absolute', left: '40%', top: 0,
        width: 14, height: 70,
        background: `linear-gradient(to bottom, transparent 0%, #1a1a1a 20%, #0a0a0a 50%, ${colors.primary} 100%)`,
        clipPath: `polygon(50% 0%, 70% 15%, 40% 30%, 75% 45%, 30% 55%, 65% 70%, 35% 85%, 50% 100%, 60% 100%, 45% 85%, 75% 70%, 40% 55%, 80% 45%, 50% 30%, 75% 15%, 60% 0%)`,
        filter: `drop-shadow(0 0 6px ${colors.accent})`,
      }} />
      {/* Bright leading edge of scar */}
      <motion.div style={{
        position: 'absolute', left: '42%', top: 4,
        width: 10, height: 64,
        background: `linear-gradient(to bottom, ${colors.accent}, #fff, ${colors.accent}aa, transparent)`,
        clipPath: `polygon(50% 0%, 70% 15%, 40% 30%, 75% 45%, 30% 55%, 65% 70%, 35% 85%, 50% 100%, 60% 100%, 45% 85%, 75% 70%, 40% 55%, 80% 45%, 50% 30%, 75% 15%, 60% 0%)`,
        boxShadow: `0 0 14px ${colors.accent}, 0 0 28px ${colors.glow}`,
      }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      {/* Puddle below */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 30,
        background: `radial-gradient(ellipse at center, ${colors.primary}cc 0%, ${colors.accent}66 40%, transparent 80%)`,
        borderRadius: '50%',
        filter: 'blur(2px)',
        mixBlendMode: 'screen',
      }} />
      {/* Puddle highlight */}
      <div style={{
        position: 'absolute', left: '20%', right: '20%', bottom: 8,
        height: 8,
        background: `linear-gradient(to bottom, ${colors.glow}88, transparent)`,
        borderRadius: '50%',
        filter: 'blur(2px)',
      }} />
      {/* Static sparks (occasional) */}
      {[0, 1.8, 3.2].map((delay, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: `${25 + i * 25}%`, top: `${30 + i * 12}%`,
            width: 3, height: 3,
            background: '#fff',
            boxShadow: `0 0 6px ${colors.accent}, 0 0 12px ${colors.glow}`,
            borderRadius: '50%',
          }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, delay, repeatDelay: 4 }}
        />
      ))}
    </div>
  );
}

const MARK_RENDERERS = {
  ember: ScorchMark,
  frost: FrostMark,
  stone: RockPileMark,
  shadow: ShadowStainMark,
  glimmer: GlowCrystalMark,
  storm: LightningScarMark,
};

// Each element has a "natural" zone where its mark belongs:
// fire/storm/stone go on the floor; frost spans floor + walls;
// shadow clings to walls; glimmer hangs off the ceiling/upper walls.
const ZONES = {
  ember:   { yMin: 70, yMax: 88 },
  frost:   { yMin: 55, yMax: 85 },
  stone:   { yMin: 72, yMax: 88 },
  shadow:  { yMin: 35, yMax: 70 },
  glimmer: { yMin: 18, yMax: 55 },
  storm:   { yMin: 60, yMax: 85 },
};

export default function WorldMarks() {
  const { worldMarks, dragon } = useGame();
  const colors = dragon?.colors || { primary: '#888', accent: '#ccc', glow: '#fff' };

  if (!worldMarks || worldMarks.length === 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      <AnimatePresence>
        {worldMarks.map((m) => {
          const Renderer = MARK_RENDERERS[m.element] || ScorchMark;
          return (
            <motion.div
              key={m.id}
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                transform: `translate(-50%, -50%) scale(${m.scale}) rotate(${m.rot}deg)`,
                opacity: 0.85,
              }}
              initial={{ opacity: 0, scale: m.scale * 0.4 }}
              animate={{ opacity: 0.85, scale: m.scale }}
              exit={{ opacity: 0, scale: m.scale * 0.6 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Renderer colors={colors} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Helper used by GameContext when adding a new mark — picks a zone-aware
// position for the given element so marks don't pile up in the same spot.
export function pickMarkPosition(element, existing = []) {
  const zone = ZONES[element] || { yMin: 60, yMax: 85 };
  // Try a few candidates and pick the one farthest from existing marks
  let best = null;
  let bestDist = -1;
  for (let attempt = 0; attempt < 8; attempt++) {
    // Avoid dead-center horizontally (where dragon + question UI sit)
    const x = Math.random() < 0.5
      ? 4 + Math.random() * 28        // left band
      : 68 + Math.random() * 28;      // right band
    const y = zone.yMin + Math.random() * (zone.yMax - zone.yMin);
    const minDist = existing.reduce((min, m) => {
      const dx = m.x - x, dy = m.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      return d < min ? d : min;
    }, Infinity);
    if (minDist > bestDist) {
      bestDist = minDist;
      best = { x, y };
    }
  }
  return best;
}
