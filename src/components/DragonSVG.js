import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dragon art with egg hatching → baby → full dragon growth
// progress: 0 = egg, ~0.05 = hatching, 0.05+ = baby growing to adult

export default function DragonSVG({ dragon, progress, size = 400, chomping = false }) {
  if (!dragon) return null;

  // Fixed-size wrapper — prevents ANY layout shift between phases
  let content;

  if (progress <= 0) {
    content = <Egg dragon={dragon} size={size} wobble={false} />;
  } else if (progress <= 0.15) {
    const crackStage = Math.min(3, Math.ceil(progress / 0.05));
    content = <HatchingEgg dragon={dragon} size={size} crackStage={crackStage} />;
  } else {
    const growthT = (progress - 0.15) / 0.85;
    content = <GrowingDragon dragon={dragon} t={growthT} size={size} chomping={chomping} />;
  }

  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', overflow: 'visible' }}>
      {content}
    </div>
  );
}

// === EGG (pre-game, wobbles gently) ===
function Egg({ dragon, size, wobble = true }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const s = Math.min(size * 0.55, 250);

  return (
    <motion.div
      style={{ width: s, height: s }}
      animate={wobble ? { rotate: [0, 2, -2, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 220">
        <defs>
          <radialGradient id={`egg-g-${dragon.id}`} cx="38%" cy="32%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="45%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </radialGradient>
          <radialGradient id={`egg-shine-${dragon.id}`} cx="30%" cy="25%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id={`egg-glow-${dragon.id}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Main egg — centered, bottom at ~185 */}
        <ellipse
          cx="100" cy="110" rx="55" ry="75"
          fill={`url(#egg-g-${dragon.id})`}
          filter={`url(#egg-glow-${dragon.id})`}
        />

        {/* Egg markings (unique per dragon type) */}
        <EggMarkings dragon={dragon} />

        {/* Shine highlight */}
        <ellipse cx="80" cy="80" rx="20" ry="30"
          fill={`url(#egg-shine-${dragon.id})`}
        />

        {/* Subtle pulse glow */}
        <motion.ellipse
          cx="100" cy="110" rx="58" ry="78"
          fill="none"
          stroke={glow}
          strokeWidth="2"
          opacity="0"
          animate={{ opacity: [0, 0.3, 0], scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}

function EggMarkings({ dragon }) {
  const { accent } = dragon.colors;
  const markings = {
    ember: (
      <g opacity="0.4">
        <path d="M 80 110 Q 90 100 85 85 Q 95 95 100 80 Q 105 95 115 85 Q 110 100 120 110" stroke={accent} strokeWidth="2" fill="none" />
        <path d="M 75 150 Q 85 140 80 130" stroke={accent} strokeWidth="1.5" fill="none" />
        <path d="M 120 145 Q 115 135 120 125" stroke={accent} strokeWidth="1.5" fill="none" />
      </g>
    ),
    frost: (
      <g opacity="0.5">
        <path d="M 100 90 L 100 75 M 93 85 L 85 78 M 107 85 L 115 78" stroke="#e1f5fe" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 80 140 L 80 130 M 76 136 L 70 132 M 84 136 L 90 132" stroke="#e1f5fe" strokeWidth="1" strokeLinecap="round" />
        <circle cx="115" cy="120" r="6" fill="none" stroke="#e1f5fe" strokeWidth="1" />
      </g>
    ),
    stone: (
      <g opacity="0.35">
        <path d="M 70 130 L 90 125 L 85 145 Z" fill={accent} />
        <path d="M 110 100 L 125 110 L 115 120 Z" fill={accent} />
        <path d="M 95 160 L 108 155 L 105 170 Z" fill={accent} />
      </g>
    ),
    shadow: (
      <g opacity="0.4">
        <path d="M 75 120 Q 100 105 125 120" stroke="#e1bee7" strokeWidth="2" fill="none" />
        <path d="M 80 145 Q 100 135 120 145" stroke="#e1bee7" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="110" r="4" fill="#e040fb" opacity="0.3" />
      </g>
    ),
    glimmer: (
      <g opacity="0.5">
        {[{x:85,y:100}, {x:115,y:120}, {x:90,y:150}, {x:110,y:95}].map((p, i) => (
          <g key={i} transform={`translate(${p.x},${p.y})`}>
            <line x1="-4" y1="0" x2="4" y2="0" stroke="#fff" strokeWidth="1.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
      </g>
    ),
    storm: (
      <g opacity="0.4">
        <path d="M 90 95 L 95 110 L 88 110 L 95 130" stroke="#ffee58" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 110 110 L 115 125 L 108 125 L 115 140" stroke="#ffee58" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  };
  return markings[dragon.id] || null;
}

// === HATCHING ANIMATION ===
// crackStage 1: first cracks + wobble (answer 1)
// crackStage 2: heavy cracks + glow shining through (answer 2)
// crackStage 3: burst open → baby emerges (answer 3)
function HatchingEgg({ dragon, size, crackStage }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const [hatched, setHatched] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const eggSize = Math.min(size * 0.55, 250); // same as Egg component
  const s = Math.min(size * 0.85, 400);      // baby dragon container (larger)

  // Stage 3: burst sequence — flash, shake hard, then hatch
  useEffect(() => {
    if (crackStage >= 3 && !hatched) {
      // Brief intense shaking, then flash, then hatch
      const t1 = setTimeout(() => setShowFlash(true), 400);
      const t2 = setTimeout(() => setHatched(true), 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [crackStage, hatched]);

  return (
    <div style={{ width: s, height: s, position: 'relative' }}>
      <AnimatePresence>
        {!hatched && (
          <motion.svg
            key="egg"
            width={eggSize} height={eggSize} viewBox="0 0 200 220"
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}
          >
            <defs>
              <radialGradient id={`hatch-g-${dragon.id}`} cx="38%" cy="32%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
                <stop offset="45%" stopColor={primary} />
                <stop offset="100%" stopColor={secondary} />
              </radialGradient>
              <radialGradient id={`hatch-glow-${dragon.id}`} cx="50%" cy="45%">
                <stop offset="0%" stopColor={glow} />
                <stop offset="60%" stopColor={accent} stopOpacity="0.5" />
                <stop offset="100%" stopColor={primary} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Egg with shake intensity based on crack stage */}
            <motion.g
              animate={
                crackStage === 1
                  ? { rotate: [0, 5, -5, 4, -4, 0] }
                  : crackStage === 2
                  ? { x: [0, -4, 4, -3, 3, -2, 2, 0] }
                  : { x: [0, -7, 7, -6, 6, -5, 5, 0], y: [0, -3, 3, -2, 2, 0] }
              }
              transition={
                crackStage === 1
                  ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.6 }
                  : crackStage === 2
                  ? { duration: 0.3, repeat: Infinity, repeatDelay: 0.2 }
                  : { duration: 0.2, repeat: Infinity }
              }
            >
              <ellipse cx="100" cy="110" rx="55" ry="75" fill={`url(#hatch-g-${dragon.id})`} />
              <EggMarkings dragon={dragon} />

              {/* === Stage 1+: First crack — single zigzag line === */}
              <motion.path
                d="M 85 135 L 90 115 L 82 95 L 95 80 L 88 65 L 100 50"
                stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />

              {/* === Stage 2+: Branching cracks + glowing light through gaps === */}
              {crackStage >= 2 && (
                <>
                  <motion.path
                    d="M 90 115 L 110 113 L 125 100 L 138 105"
                    stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <motion.path
                    d="M 82 95 L 65 90 L 55 100"
                    stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                  />
                  <motion.path
                    d="M 95 80 L 115 73 L 130 80"
                    stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                  />
                  <motion.path
                    d="M 100 50 L 112 37 M 100 50 L 88 35"
                    stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                  <motion.path
                    d="M 85 135 L 95 153 L 82 165 L 100 177"
                    stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />

                  {/* Glow through cracks */}
                  <motion.ellipse cx="95" cy="95" rx="20" ry="25"
                    fill={`url(#hatch-glow-${dragon.id})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0.25, 0.7, 0.4] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <motion.circle cx="112" cy="113" r="8"
                    fill={glow} initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0.15, 0.45] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.circle cx="68" cy="93" r="6"
                    fill={glow} initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0.1, 0.35] }}
                    transition={{ duration: 0.55, repeat: Infinity, delay: 0.25 }}
                  />
                  <motion.circle cx="100" cy="43" r="10"
                    fill={glow} initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.45, 0.2, 0.55] }}
                    transition={{ duration: 0.45, repeat: Infinity, delay: 0.1 }}
                  />

                  {/* Egg separating at equator */}
                  <motion.path
                    d="M 52 110 Q 50 103 53 97"
                    stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.3 }}
                  />
                  <motion.path
                    d="M 148 110 Q 150 103 147 97"
                    stroke={accent} strokeWidth="2" fill="none" strokeLinecap="round"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                    transition={{ delay: 0.3 }}
                  />
                </>
              )}

              {/* === Stage 3: Even more cracks + top separating === */}
              {crackStage >= 3 && (
                <>
                  <motion.path
                    d="M 125 100 L 140 85 L 148 90"
                    stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.path
                    d="M 55 100 L 48 85 L 52 73"
                    stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                  />
                  {/* Full equator crack */}
                  <motion.path
                    d="M 48 110 Q 100 120 152 110"
                    stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                  />
                  {/* Intense glow burst from center */}
                  <motion.ellipse cx="100" cy="100" rx="35" ry="40"
                    fill={glow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0.4, 0.9] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                </>
              )}
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Flash burst on stage 3 */}
      {showFlash && !hatched && (
        <motion.div
          style={{
            position: 'absolute', inset: '-20%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow}, ${accent}80, transparent 70%)`,
          }} />
        </motion.div>
      )}

      {/* Shell pieces + sparkles */}
      {hatched && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const angle = (i / 14) * Math.PI * 2 + (i % 2 ? 0.15 : -0.15);
            const dist = 70 + (i % 3) * 25;
            const w = 10 + (i % 4) * 4;
            const h = 8 + (i % 3) * 4;
            return (
              <motion.div
                key={`shell${i}`}
                style={{
                  position: 'absolute', left: '50%', top: '45%',
                  width: w, height: h,
                  borderRadius: `${20 + (i % 3) * 15}%`,
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  border: `1px solid ${accent}60`,
                  boxShadow: `inset 0 -2px 4px ${secondary}, 0 0 6px ${glow}40`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist * 0.8 + 20,
                  opacity: 0, scale: 0.2,
                  rotate: (i % 2 ? 1 : -1) * 270,
                }}
                transition={{ duration: 0.7 + (i % 3) * 0.15, ease: 'easeOut' }}
              />
            );
          })}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const dist = 40 + (i % 3) * 20;
            return (
              <motion.div
                key={`spark${i}`}
                style={{
                  position: 'absolute', left: '50%', top: '45%',
                  width: 4, height: 4, borderRadius: '50%',
                  background: glow, boxShadow: `0 0 6px ${glow}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * dist * 1.3,
                  y: Math.sin(angle) * dist - 10,
                  opacity: 0, scale: 0,
                }}
                transition={{ duration: 0.5 + (i % 3) * 0.1, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      )}

      {/* Baby dragon — gentle rise with glow */}
      {hatched && (
        <>
          {/* Glow aura behind baby */}
          <motion.div
            style={{
              position: 'absolute', left: '50%', top: '45%',
              width: s * 0.6, height: s * 0.6,
              marginLeft: -s * 0.3, marginTop: -s * 0.3,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glow}60, ${accent}30, transparent 70%)`,
              pointerEvents: 'none',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.2], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.div
            style={{ position: 'absolute', inset: 0 }}
            initial={{ scale: 0.2, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: 'spring', stiffness: 120, damping: 14,
              opacity: { duration: 0.4 },
            }}
          >
            <GrowingDragon dragon={dragon} t={0} size={s} chomping={false} />
          </motion.div>
        </>
      )}
    </div>
  );
}

// === GROWING DRAGON (baby → adult) ===
// t: 0 = just hatched baby, 1 = full adult
// PROPORTIONAL MATURITY — baby ≠ small adult
// Baby: big head, huge eyes, round body, stubby legs, tiny wings, short snout
// Adult: small head ratio, narrow eyes, long neck, angular jaw, massive wings, muscular legs
// Physiology modifiers — adjust base proportions per dragon type
function getPhysiologyMods(phys) {
  if (!phys) return {};
  const mods = {};
  // Body shape multipliers
  switch (phys.bodyShape) {
    case 'bulky':     mods.bodyW = 1.25; mods.bodyH = 1.1; mods.neckMul = 0.8; break;
    case 'serpentine': mods.bodyW = 0.8; mods.bodyH = 1.15; mods.neckMul = 1.3; break;
    case 'sleek':     mods.bodyW = 0.9; mods.bodyH = 0.95; mods.neckMul = 1.1; break;
    case 'graceful':  mods.bodyW = 0.85; mods.bodyH = 0.9; mods.neckMul = 1.15; break;
    case 'athletic':  mods.bodyW = 1.05; mods.bodyH = 1.0; mods.neckMul = 1.0; break;
    default:          mods.bodyW = 1.0; mods.bodyH = 1.0; mods.neckMul = 1.0;
  }
  // Leg thickness multiplier
  switch (phys.legStyle) {
    case 'thick': mods.legMul = 1.4; break;
    case 'slim':  mods.legMul = 0.75; break;
    default:      mods.legMul = 1.0;
  }
  // Wing size multiplier
  switch (phys.wingStyle) {
    case 'stubby':    mods.wingMul = 0.55; break;
    case 'broad':     mods.wingMul = 1.15; break;
    case 'feathered': mods.wingMul = 1.1; break;
    case 'bat':       mods.wingMul = 1.2; break;
    case 'jagged':    mods.wingMul = 1.05; break;
    default:          mods.wingMul = 1.0;
  }
  // Tail length multiplier
  switch (phys.tailStyle) {
    case 'club':    mods.tailMul = 0.8; break;
    case 'long':    mods.tailMul = 1.3; break;
    case 'flowing': mods.tailMul = 1.2; break;
    case 'forked':  mods.tailMul = 1.1; break;
    default:        mods.tailMul = 1.0;
  }
  return mods;
}

function GrowingDragon({ dragon, t, size, chomping }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const phys = dragon.physiology || {};
  const mods = getPhysiologyMods(phys);

  // === PROPORTIONAL GROWTH CURVES ===
  // Each part grows at its own rate to create real maturity
  const headRatio = 1.4 - t * 0.3;          // baby=1.4, adult=1.1 (bigger heads overall)
  const eyeRatio = 1.5 - t * 0.7;
  const bodyRound = 1.1 - t * 0.25;          // less round overall
  const neckLen = (0.5 + t * 0.35) * (mods.neckMul || 1);
  const legLen = 0.55 + t * 0.45;
  const legThick = (1.0 + t * 0.5) * (mods.legMul || 1);  // thicker legs
  const wingSpan = (0.25 + t * 0.75) * (mods.wingMul || 1);
  const tailLen = (0.3 + t * 0.7) * (mods.tailMul || 1);
  const snoutLen = 0.5 + t * 0.5;
  const hornLen = 0.1 + t * 0.9;
  const jawAngularity = t;
  const spineCount = Math.floor(2 + t * 6);
  const bellyPlates = Math.floor(2 + t * 5);
  const breathIntensity = Math.max(0, (t - 0.35) / 0.65);
  const clawSize = 0.25 + t * 0.75;
  const browRidge = t * 0.8;
  const scaleDetail = t;
  const overallSize = 0.55 + t * 0.45;

  // Body anchor points — horizontally wider, vertically shorter (not egg-shaped)
  const bodyCx = 250;
  const bodyCy = 320;
  const bodyRx = 55 * bodyRound * (0.8 + t * 0.2) * (mods.bodyW || 1);  // wider
  const bodyRy = 45 * bodyRound * (0.85 + t * 0.15) * (mods.bodyH || 1); // shorter (horizontal body)

  // Neck endpoint — wider neck, head closer to body
  const neckTopX = bodyCx - 70 - neckLen * 20;
  const neckTopY = bodyCy - 75 - neckLen * 50;

  // Head size — MUCH bigger, proportional to a real dragon
  // Dragon head should be ~50-60% of body width
  const headRx = (38 + (1 - t) * 14) * headRatio;  // baby=72, adult=42
  const headRy = (30 + (1 - t) * 12) * headRatio;   // baby=59, adult=33
  const headCx = neckTopX - 12;
  const headCy = neckTopY - 10;

  const displaySize = size * overallSize;

  return (
    <div style={{ width: displaySize, height: displaySize, transform: 'scaleX(-1)' }}>
    <motion.div
      style={{ width: '100%', height: '100%' }}
      animate={chomping
        ? { scale: [1, 1.15, 0.92, 1.1, 1], y: [0, -8, 5, -3, 0] }
        : { y: [0, -5, 0] }
      }
      transition={chomping
        ? { duration: 0.7, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }
        : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg width="100%" height="100%" viewBox="0 0 500 520" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={`bg-${dragon.id}`} cx="35%" cy="30%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
            <stop offset="40%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </radialGradient>
          {/* 3D body highlight — top-left light source */}
          <radialGradient id={`body-hi-${dragon.id}`} cx="30%" cy="25%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          {/* 3D body shadow — bottom */}
          <radialGradient id={`body-sh-${dragon.id}`} cx="50%" cy="85%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          {/* Rim light — edge glow from ambient */}
          <radialGradient id={`rim-${dragon.id}`} cx="75%" cy="20%">
            <stop offset="0%" stopColor={glow} stopOpacity="0" />
            <stop offset="70%" stopColor={glow} stopOpacity="0" />
            <stop offset="95%" stopColor={glow} stopOpacity="0.2" />
            <stop offset="100%" stopColor={glow} stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id={`belly-${dragon.id}`} cx="50%" cy="20%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id={`wg-${dragon.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.75" />
            <stop offset="40%" stopColor={secondary} stopOpacity="0.55" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.35" />
          </linearGradient>
          {/* Wing vein glow */}
          <linearGradient id={`wv-${dragon.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id={`eg-${dragon.id}`}>
            <stop offset="0%" stopColor="#fff" />
            <stop offset="35%" stopColor={accent} />
            <stop offset="100%" stopColor={glow} />
          </radialGradient>
          {/* Ambient aura glow */}
          <radialGradient id={`aura-${dragon.id}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={glow} stopOpacity="0" />
            <stop offset="60%" stopColor={glow} stopOpacity="0" />
            <stop offset="85%" stopColor={glow} stopOpacity={0.04 + t * 0.04} />
            <stop offset="100%" stopColor={primary} stopOpacity={0.02 + t * 0.03} />
          </radialGradient>
          {/* Head 3D gradient */}
          <radialGradient id={`head-g-${dragon.id}`} cx="35%" cy="30%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="40%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </radialGradient>
          <filter id={`gl-${dragon.id}`}>
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`bgl-${dragon.id}`}>
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Ambient aura behind dragon */}
        <ellipse cx={bodyCx} cy={bodyCy - 10} rx={bodyRx * 2.5 + t * 40} ry={bodyRy * 2 + t * 35}
          fill={`url(#aura-${dragon.id})`} />

        <g filter={`url(#gl-${dragon.id})`}>

          {/* === TAIL (thick base tapering to tip) === */}
          {/* Tail underside highlight */}
          <motion.path
            d={tailPath(tailLen)}
            stroke={accent}
            strokeWidth={7 + tailLen * 11}
            fill="none"
            strokeLinecap="round"
            opacity="0.08"
            animate={{ d: [tailPath(tailLen), tailPath2(tailLen), tailPath(tailLen)] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Main tail */}
          <motion.path
            d={tailPath(tailLen)}
            stroke={primary}
            strokeWidth={6 + tailLen * 10}
            fill="none"
            strokeLinecap="round"
            animate={{ d: [tailPath(tailLen), tailPath2(tailLen), tailPath(tailLen)] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Tail ridges (segmentation marks) */}
          {t > 0.25 && Array.from({ length: Math.floor(2 + t * 4) }, (_, i) => {
            const frac = 0.2 + i * (0.6 / Math.floor(2 + t * 4));
            const rx = 290 + frac * (tailLen * 132 + 60);
            const ry = 315 + frac * (tailLen * -72 - 70) + Math.sin(frac * Math.PI) * 30;
            return (
              <circle key={`tr${i}`} cx={rx} cy={ry} r={1.2 + (1 - frac) * t * 2}
                fill={accent} opacity={0.12 + t * 0.1} />
            );
          })}
          <TailSpade tailLen={tailLen} accent={accent} t={t} dragon={dragon} />

          {/* === BACK LEGS (far side) === */}
          <Leg x={bodyCx + 25} y={bodyCy + 35} hipDx={12} hipDy={legLen * 55}
            legLen={legLen} legThick={legThick} claw={clawSize}
            color={secondary} accent={accent} t={t} side="far" />

          {/* Arms removed — traditional dragons have 4 legs + 2 wings, no separate arms */}

          {/* === WINGS === */}
          <AnimatedWings dragon={dragon} ws={wingSpan} t={t} chomping={chomping}
            anchorX={bodyCx - 10} anchorY={bodyCy - 30} />

          {/* === UNIFIED BODY + NECK SILHOUETTE === */}
          {/* One continuous path: tail base → dorsal → neck → head junction → throat → belly → tail base */}
          {(() => {
            // Neck dimensions — much thicker for dragon proportions
            const nW_base = 16 + (1 - t) * 6 + t * 10;
            const nW_top = 10 + (1 - t) * 5 + t * 4;
            const nMidX = bodyCx - 45 - neckLen * 12;
            const nMidY = bodyCy - 55 - neckLen * 25;

            // Key anchor points on the body perimeter
            const tailTopX = bodyCx + bodyRx * 0.85;
            const tailTopY = bodyCy - bodyRy * 0.25;
            const dorsalX = bodyCx - bodyRx * 0.1;
            const dorsalY = bodyCy - bodyRy * 1.02;
            const shoulderX = bodyCx - bodyRx * 0.75;
            const shoulderY = bodyCy - bodyRy * 0.7;
            const chestX = bodyCx - bodyRx * 0.6;
            const chestY = bodyCy + bodyRy * 0.4;
            const bellyX = bodyCx + bodyRx * 0.1;
            const bellyY = bodyCy + bodyRy * 1.02;
            const hipX = bodyCx + bodyRx * 0.8;
            const hipY = bodyCy + bodyRy * 0.35;

            const d = `
              M ${tailTopX} ${tailTopY}
              Q ${bodyCx + bodyRx * 0.5} ${bodyCy - bodyRy * 0.85}
                ${dorsalX} ${dorsalY}
              Q ${bodyCx - bodyRx * 0.5} ${bodyCy - bodyRy * 0.95}
                ${shoulderX} ${shoulderY}
              Q ${bodyCx - bodyRx * 0.85 - nW_base * 0.1} ${bodyCy - bodyRy * 0.55}
                ${bodyCx - 25 - nW_base * 0.3} ${bodyCy - 35 - nW_base * 0.8}
              Q ${nMidX - nW_base * 0.2} ${nMidY - nW_base * 0.6}
                ${neckTopX - nW_top * 0.3} ${neckTopY - nW_top * 0.6}
              L ${neckTopX + nW_top * 0.5} ${neckTopY + nW_top * 0.8}
              Q ${nMidX + nW_base * 0.5} ${nMidY + nW_base * 0.8}
                ${bodyCx - 25 + nW_base * 0.5} ${bodyCy - 35 + nW_base * 0.6}
              Q ${bodyCx - bodyRx * 0.65} ${bodyCy + bodyRy * 0.15}
                ${chestX} ${chestY}
              Q ${bodyCx - bodyRx * 0.3} ${bodyCy + bodyRy * 0.9}
                ${bellyX} ${bellyY}
              Q ${bodyCx + bodyRx * 0.5} ${bodyCy + bodyRy * 0.95}
                ${hipX} ${hipY}
              Q ${bodyCx + bodyRx * 1.0} ${bodyCy}
                ${tailTopX} ${tailTopY}
              Z`;

            return (
              <g>
                {/* Shadow under body */}
                <path d={d} fill="#000" opacity="0.1" transform="translate(3, 4)" />
                {/* Main fill */}
                <path d={d} fill={`url(#bg-${dragon.id})`} stroke={primary} strokeWidth="1.5" strokeOpacity="0.25" />
                {/* 3D highlight (top-left light) */}
                <path d={d} fill={`url(#body-hi-${dragon.id})`} />
                {/* 3D shadow (bottom) */}
                <path d={d} fill={`url(#body-sh-${dragon.id})`} />
                {/* Rim light */}
                <path d={d} fill={`url(#rim-${dragon.id})`} />
                {/* Neck dorsal highlight */}
                <path d={`M ${shoulderX} ${shoulderY}
                  Q ${bodyCx - bodyRx * 0.85 - nW_base * 0.1} ${bodyCy - bodyRy * 0.55}
                    ${bodyCx - 25 - nW_base * 0.3} ${bodyCy - 35 - nW_base * 0.8}
                  Q ${nMidX - nW_base * 0.2} ${nMidY - nW_base * 0.6}
                    ${neckTopX - nW_top * 0.3} ${neckTopY - nW_top * 0.6}`}
                  stroke="#fff" strokeWidth={1.5 + t * 0.5}
                  fill="none" strokeLinecap="round" opacity={0.05 + t * 0.05} />
                {/* Neck underside (ventral) lighter tint */}
                <path d={`M ${neckTopX + nW_top * 0.3} ${neckTopY + nW_top * 0.5}
                  Q ${nMidX + nW_base * 0.3} ${nMidY + nW_base * 0.5}
                    ${bodyCx - 25 + nW_base * 0.3} ${bodyCy - 35 + nW_base * 0.3}`}
                  stroke={accent} strokeWidth={2 + t}
                  fill="none" strokeLinecap="round" opacity="0.1" />
              </g>
            );
          })()}

          {/* Shoulder muscle contour (grows with maturity) */}
          {t > 0.15 && (
            <path d={`M ${bodyCx - bodyRx * 0.6} ${bodyCy - bodyRy * 0.5}
                       Q ${bodyCx - bodyRx * 0.9} ${bodyCy - bodyRy * 0.1} ${bodyCx - bodyRx * 0.7} ${bodyCy + bodyRy * 0.3}`}
              stroke={primary} strokeWidth={1.2 + t * 2} fill="none" opacity={0.12 + t * 0.18} />
          )}
          {/* Secondary shoulder highlight */}
          {t > 0.3 && (
            <path d={`M ${bodyCx - bodyRx * 0.55} ${bodyCy - bodyRy * 0.45}
                       Q ${bodyCx - bodyRx * 0.75} ${bodyCy - bodyRy * 0.15} ${bodyCx - bodyRx * 0.65} ${bodyCy + bodyRy * 0.15}`}
              stroke={accent} strokeWidth={0.6 + t} fill="none" opacity={0.06 + t * 0.08} />
          )}
          {/* Hip muscle contour */}
          {t > 0.15 && (
            <path d={`M ${bodyCx + bodyRx * 0.5} ${bodyCy - bodyRy * 0.4}
                       Q ${bodyCx + bodyRx * 0.85} ${bodyCy} ${bodyCx + bodyRx * 0.6} ${bodyCy + bodyRy * 0.5}`}
              stroke={primary} strokeWidth={1.2 + t * 2} fill="none" opacity={0.12 + t * 0.18} />
          )}
          {/* Hip highlight */}
          {t > 0.3 && (
            <path d={`M ${bodyCx + bodyRx * 0.45} ${bodyCy - bodyRy * 0.3}
                       Q ${bodyCx + bodyRx * 0.7} ${bodyCy + bodyRy * 0.05} ${bodyCx + bodyRx * 0.55} ${bodyCy + bodyRy * 0.35}`}
              stroke={accent} strokeWidth={0.6 + t} fill="none" opacity={0.06 + t * 0.08} />
          )}
          {/* Chest ridge (adult only) */}
          {t > 0.35 && (
            <path d={`M ${bodyCx - bodyRx * 0.3} ${bodyCy - bodyRy * 0.85}
                       Q ${bodyCx - bodyRx * 0.12} ${bodyCy - bodyRy * 0.5} ${bodyCx - bodyRx * 0.22} ${bodyCy + bodyRy * 0.1}`}
              stroke={accent} strokeWidth={0.8 + t * 1.2} fill="none" opacity={0.08 + t * 0.12} />
          )}
          {/* Ribcage suggestion (adult) */}
          {t > 0.5 && [0.3, 0.5, 0.7].map((f, i) => (
            <path key={`rib${i}`}
              d={`M ${bodyCx - bodyRx * 0.15} ${bodyCy - bodyRy * (0.3 - i * 0.22)}
                   Q ${bodyCx + bodyRx * (0.3 + i * 0.05)} ${bodyCy - bodyRy * (0.15 - i * 0.18)}
                     ${bodyCx + bodyRx * 0.4} ${bodyCy + bodyRy * (i * 0.15)}`}
              stroke={primary} strokeWidth={0.6 + t * 0.6} fill="none" opacity={0.04 + t * 0.06} />
          ))}

          {/* Overlapping scale pattern (more dimensional than old arcs) */}
          <g opacity={0.06 + scaleDetail * 0.22}>
            {Array.from({ length: Math.floor(4 + scaleDetail * 12) }, (_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const offset = row % 2 === 0 ? 0 : 7;
              const cx = bodyCx - 22 + col * 14 + offset - row * 3;
              const cy = bodyCy - 30 + row * 12;
              const s = 4 + scaleDetail * 2;
              return (
                <g key={`sc${i}`}>
                  <path
                    d={`M ${cx - s} ${cy + s * 0.3} Q ${cx - s * 0.3} ${cy - s * 0.6} ${cx} ${cy - s * 0.8}
                        Q ${cx + s * 0.3} ${cy - s * 0.6} ${cx + s} ${cy + s * 0.3}`}
                    stroke={accent} strokeWidth="0.8" fill="none" />
                  {/* Scale highlight */}
                  <path
                    d={`M ${cx - s * 0.5} ${cy} Q ${cx} ${cy - s * 0.4} ${cx + s * 0.5} ${cy}`}
                    stroke="#fff" strokeWidth="0.3" fill="none" opacity="0.3" />
                </g>
              );
            })}
          </g>

          {/* Belly plates (more 3D) */}
          <g opacity={0.45 + t * 0.25}>
            {Array.from({ length: bellyPlates }, (_, i) => {
              const cy = bodyCy - 28 + i * (bodyRy * 1.4 / bellyPlates);
              const rx = (bodyRx * 0.45) - i * 1.5;
              return rx > 3 ? (
                <g key={`bp${i}`}>
                  <ellipse cx={bodyCx} cy={cy} rx={rx} ry={5}
                    fill={`url(#belly-${dragon.id})`} stroke={accent} strokeWidth="0.5" strokeOpacity="0.25" />
                  {/* Plate highlight */}
                  <ellipse cx={bodyCx - rx * 0.15} cy={cy - 1.5} rx={rx * 0.6} ry={2}
                    fill="#fff" opacity="0.06" />
                  {/* Plate shadow */}
                  <ellipse cx={bodyCx} cy={cy + 2.5} rx={rx * 0.8} ry={1.5}
                    fill="#000" opacity="0.06" />
                </g>
              ) : null;
            })}
          </g>

          {/* === FRONT LEGS (far side) === */}
          <Leg x={bodyCx - 30} y={bodyCy + 30} hipDx={-10} hipDy={legLen * 50}
            legLen={legLen} legThick={legThick * 0.9} claw={clawSize * 0.9}
            color={secondary} accent={accent} t={t} side="far" />

          {/* === FRONT LEGS (near side) === */}
          <Leg x={bodyCx - 5} y={bodyCy + 35} hipDx={-5} hipDy={legLen * 52}
            legLen={legLen} legThick={legThick} claw={clawSize}
            color={primary} accent={accent} t={t} side="near" />

          {/* === BACK LEGS (near side) === */}
          <Leg x={bodyCx + 18} y={bodyCy + 38} hipDx={10} hipDy={legLen * 56}
            legLen={legLen} legThick={legThick * 1.1} claw={clawSize * 1.1}
            color={primary} accent={accent} t={t} side="near" />

          {/* Arms removed — front legs serve as forelegs */}

          {/* === SPINES along dorsal ridge (back → neck → head) === */}
          <Spines dragon={dragon} t={t} bodyCx={bodyCx} bodyCy={bodyCy}
            bodyRx={bodyRx} bodyRy={bodyRy} spineCount={spineCount}
            neckTopX={neckTopX} neckTopY={neckTopY} neckLen={neckLen}
            headCx={headCx} headCy={headCy} headRy={headRy} />

          {/* Neck is now part of unified body silhouette above */}
          {/* Neck scale marks (horizontal bands along the neck portion) */}
          {t > 0.2 && Array.from({ length: Math.floor(3 + t * 5) }, (_, i) => {
            const frac = 0.1 + (i / Math.floor(3 + t * 5)) * 0.75;
            const midX = bodyCx - 25 + frac * (neckTopX - (bodyCx - 25));
            const midY = bodyCy - 35 + frac * (neckTopY - (bodyCy - 35));
            const curveY = midY + Math.sin(frac * Math.PI) * (neckLen * -12);
            const neckW_here = (10 + (1 - t) * 4 + t * 6) * (1 - frac * 0.4);
            return (
              <ellipse key={`ns${i}`} cx={midX} cy={curveY}
                rx={neckW_here * 0.45} ry={0.8 + t * 0.8}
                fill={accent} opacity={0.05 + t * 0.07}
                transform={`rotate(${-25 - frac * 20}, ${midX}, ${curveY})`} />
            );
          })}

          {/* === HEAD (proportions change with maturity) === */}
          <Head dragon={dragon} t={t} chomping={chomping}
            headCx={headCx} headCy={headCy} headRx={headRx} headRy={headRy}
            snoutLen={snoutLen} hornLen={hornLen} eyeRatio={eyeRatio}
            jawAngularity={jawAngularity} browRidge={browRidge}
            breathIntensity={breathIntensity} />
        </g>

        {/* === TYPE-SPECIFIC FEATURES === */}
        <DragonExtras dragon={dragon} t={t} bodyCx={bodyCx} bodyCy={bodyCy}
          bodyRx={bodyRx} bodyRy={bodyRy} />

        {/* Ground glow (element color under dragon) */}
        <ellipse cx={bodyCx} cy={bodyCy + bodyRy + legLen * 56 + 18}
          rx={45 + t * 35} ry={6 + t * 5}
          fill={glow} opacity={0.04 + t * 0.06} />
        {/* Ground shadow (layered for softness) */}
        <ellipse cx={bodyCx} cy={bodyCy + bodyRy + legLen * 56 + 22}
          rx={55 + t * 35} ry={6 + t * 6}
          fill="black" opacity={0.08 + t * 0.08} />
        <ellipse cx={bodyCx} cy={bodyCy + bodyRy + legLen * 56 + 22}
          rx={40 + t * 25} ry={4 + t * 3}
          fill="black" opacity={0.15 + t * 0.18} />
      </svg>
    </motion.div>
    </div>
  );
}

// === SUB-COMPONENTS ===

function Head({ dragon, t, chomping, headCx, headCy, headRx, headRy, snoutLen, hornLen, eyeRatio, jawAngularity, browRidge, breathIntensity }) {
  const { primary, secondary, accent, glow } = dragon.colors;

  // Eye blink state
  const [blinking, setBlinking] = React.useState(false);
  React.useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 120);
    };
    // Random blink every 2-5 seconds
    const schedule = () => {
      const delay = 2000 + Math.random() * 3000;
      return setTimeout(() => {
        blink();
        timerId = schedule();
      }, delay);
    };
    let timerId = schedule();
    return () => clearTimeout(timerId);
  }, []);

  // Eye size decreases with maturity (baby=big cute, adult=narrow fierce)
  const eyeW = 7 * eyeRatio;
  const eyeH = 6 * eyeRatio;
  const pupilW = 2 + (1 - t) * 1.5;   // Baby: round pupil, Adult: narrow slit
  const pupilH = eyeH * 0.85;

  // Snout extends forward with age — wider, more crocodilian
  const snoutTipX = headCx - headRx * 0.9 - snoutLen * 20;
  const snoutTipY = headCy + headRy * 0.1;

  // Pac-Man chomp: head splits open WIDE
  // Even baby dragon gets a huge mouth opening
  const baseJawDrop = 6 + jawAngularity * 10;
  const chompGap = 30 + headRy * 0.8 + t * 15; // massive opening regardless of maturity
  // Upper skull tilts up when chomping
  const skullTilt = chomping ? -(12 + (1 - t) * 8) : 0; // babies tilt MORE (cuter)
  // Lower jaw tilts down
  const jawTilt = chomping ? (15 + (1 - t) * 10) : 0;
  // Pivot point at back of head
  const pivotX = headCx + headRx * 0.3;
  const pivotY = headCy;

  return (
    <g>
      {/* === UPPER HEAD (tilts up when chomping) === */}
      <motion.g
        animate={{ rotate: chomping ? skullTilt : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{ transformOrigin: `${pivotX}px ${pivotY}px` }}
      >
        {/* Skull — rounder for baby, more angular for adult */}
        <path d={`
          M ${headCx + headRx * 0.85} ${headCy + headRy * 0.15}
          Q ${headCx + headRx * 1.05} ${headCy - headRy * 0.3} ${headCx + headRx * 0.75} ${headCy - headRy * 0.85}
          Q ${headCx + headRx * 0.3} ${headCy - headRy * (1.05 + (1 - t) * 0.15)} ${headCx - headRx * 0.2} ${headCy - headRy * 0.95}
          Q ${headCx - headRx * 0.65} ${headCy - headRy * 0.85} ${headCx - headRx * 0.8} ${headCy - headRy * 0.4}
          Q ${headCx - headRx * 0.85} ${headCy} ${headCx - headRx * 0.6} ${headCy + headRy * 0.15}
          Q ${headCx} ${headCy + headRy * 0.25} ${headCx + headRx * 0.85} ${headCy + headRy * 0.15}
          Z`}
          fill={`url(#head-g-${dragon.id})`} stroke={primary} strokeWidth="1.2" strokeOpacity="0.3" />
        {/* Skull 3D highlight (top-front) */}
        <path d={`
          M ${headCx + headRx * 0.5} ${headCy - headRy * 0.6}
          Q ${headCx} ${headCy - headRy * 0.8} ${headCx - headRx * 0.4} ${headCy - headRy * 0.65}
          Q ${headCx - headRx * 0.1} ${headCy - headRy * 0.5} ${headCx + headRx * 0.5} ${headCy - headRy * 0.6}
          Z`}
          fill="#fff" opacity="0.07" />
        {/* Skull underside shadow */}
        <ellipse cx={headCx} cy={headCy + headRy * 0.05} rx={headRx * 0.65} ry={headRy * 0.2}
          fill="#000" opacity="0.1" />
        {/* Head scale texture */}
        {t > 0.3 && [0, 1, 2].map(i => (
          <path key={`hs${i}`}
            d={`M ${headCx - headRx * 0.3 + i * headRx * 0.25} ${headCy - headRy * 0.3 + i * 3}
                Q ${headCx - headRx * 0.15 + i * headRx * 0.25} ${headCy - headRy * 0.45 + i * 3}
                  ${headCx + i * headRx * 0.25} ${headCy - headRy * 0.3 + i * 3}`}
            stroke={accent} strokeWidth="0.5" fill="none" opacity={0.06 + t * 0.06} />
        ))}

        {/* Brow ridge — more defined overhang above eye */}
        {browRidge > 0.05 && (
          <>
            <path d={`M ${headCx - headRx * 0.75} ${headCy - headRy * 0.4}
                       Q ${headCx - headRx * 0.2} ${headCy - headRy * 0.4 - browRidge * 10}
                         ${headCx + headRx * 0.6} ${headCy - headRy * 0.35}`}
              stroke={primary} strokeWidth={2 + browRidge * 4} fill="none" strokeLinecap="round" opacity={0.25 + browRidge * 0.35} />
            {/* Brow ridge highlight */}
            <path d={`M ${headCx - headRx * 0.65} ${headCy - headRy * 0.45}
                       Q ${headCx - headRx * 0.15} ${headCy - headRy * 0.45 - browRidge * 8}
                         ${headCx + headRx * 0.5} ${headCy - headRy * 0.4}`}
              stroke="#fff" strokeWidth={0.5 + browRidge * 0.8} fill="none" strokeLinecap="round" opacity={0.04 + browRidge * 0.06} />
          </>
        )}

        {/* Upper snout — wide, solid, reptilian */}
        <path d={`
          M ${headCx - headRx * 0.65} ${headCy - headRy * 0.3}
          Q ${headCx - headRx * 0.85} ${headCy - headRy * 0.2}
            ${snoutTipX + 10} ${snoutTipY - 6 - jawAngularity * 5}
          L ${snoutTipX} ${snoutTipY}
          Q ${snoutTipX + 5} ${snoutTipY + 4}
            ${headCx - headRx * 0.45} ${headCy + headRy * 0.15}
          Z`}
          fill={`url(#head-g-${dragon.id})`} stroke={primary} strokeWidth="1" strokeOpacity="0.3" />
        {/* Snout top ridge (nasal bone) */}
        <path d={`M ${headCx - headRx * 0.45} ${headCy - headRy * 0.3}
                   Q ${snoutTipX + 15} ${snoutTipY - 8 - jawAngularity * 4}
                     ${snoutTipX + 2} ${snoutTipY - 2}`}
          stroke={primary} strokeWidth={1.5 + t * 2} fill="none" opacity={0.2 + t * 0.15} />
        {/* Snout highlight */}
        <path d={`M ${headCx - headRx * 0.5} ${headCy - headRy * 0.25}
                   Q ${snoutTipX + 14} ${snoutTipY - 7 - jawAngularity * 3}
                     ${snoutTipX + 4} ${snoutTipY - 3}`}
          stroke="#fff" strokeWidth="1" fill="none" opacity="0.07" />
        {/* Nostrils — larger, spaced wider on broad snout */}
        <ellipse cx={snoutTipX + 4} cy={snoutTipY - 3} rx={3 + snoutLen * 1.5} ry={2 + snoutLen * 0.8}
          fill="#050005" stroke={glow} strokeWidth="0.6" strokeOpacity="0.4" />
        <ellipse cx={snoutTipX + 4} cy={snoutTipY + 1} rx={2.5 + snoutLen * 1.2} ry={1.5 + snoutLen * 0.6}
          fill="#050005" stroke={glow} strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Upper teeth row when chomping */}
        {chomping && (() => {
          const teethCount = Math.floor(3 + t * 4);
          const toothH = 4 + t * 5 + (1 - t) * 3; // babies get visible teeth too
          const teethStartX = snoutTipX + 2;
          const teethEndX = headCx - headRx * 0.2;
          return Array.from({ length: teethCount }, (_, i) => {
            const tx = teethStartX + (i / (teethCount - 1)) * (teethEndX - teethStartX);
            const ty = snoutTipY + 1;
            return (
              <polygon key={`ut${i}`}
                points={`${tx - 2},${ty} ${tx + 2},${ty} ${tx},${ty + toothH}`}
                fill="#f0f0e0" stroke="#ccc" strokeWidth="0.4" />
            );
          });
        })()}

        {/* Front fang (upper) — always visible, bigger when chomping */}
        <polygon
          points={`${snoutTipX + 1},${snoutTipY - 1} ${snoutTipX + 5},${snoutTipY - 1} ${snoutTipX + 3},${snoutTipY + (chomping ? 6 + t * 5 : 3 + t * 3)}`}
          fill="#fffff0" stroke="#ddd" strokeWidth="0.5" opacity={chomping ? 1 : 0.85} />
        {/* Second fang further back */}
        {t > 0.15 && (
          <polygon
            points={`${snoutTipX + 9 + t * 3},${snoutTipY} ${snoutTipX + 13 + t * 3},${snoutTipY} ${snoutTipX + 11 + t * 3},${snoutTipY + (chomping ? 5 + t * 4 : 2 + t * 2.5)}`}
            fill="#f0f0e0" stroke="#ccc" strokeWidth="0.4" opacity={chomping ? 1 : 0.7} />
        )}
      </motion.g>

      {/* === LOWER JAW / MANDIBLE (tilts down when chomping) === */}
      <motion.g
        animate={{ rotate: chomping ? jawTilt : 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 12 }}
        style={{ transformOrigin: `${pivotX}px ${pivotY}px` }}
      >
        {/* Mandible shape — defined jawbone with chin point */}
        {chomping ? (
          <g>
            {/* Open jaw — wider mandible */}
            <path d={`
              M ${headCx + headRx * 0.15} ${headCy + headRy * 0.35}
              Q ${headCx - headRx * 0.3} ${headCy + headRy * 0.5 + baseJawDrop * 0.3}
                ${snoutTipX + 15} ${snoutTipY + baseJawDrop * 0.6}
              L ${snoutTipX + 3} ${snoutTipY + baseJawDrop * 0.35}
              Q ${snoutTipX + 10} ${snoutTipY + baseJawDrop * 0.15}
                ${headCx - headRx * 0.15} ${headCy + headRy * 0.2}
              Z`}
              fill={secondary} stroke={primary} strokeWidth="1" strokeOpacity="0.3" />
            {/* Jaw underside shadow */}
            <path d={`
              M ${headCx - headRx * 0.1} ${headCy + headRy * 0.4 + baseJawDrop * 0.2}
              Q ${snoutTipX + 18} ${snoutTipY + baseJawDrop * 0.5}
                ${snoutTipX + 8} ${snoutTipY + baseJawDrop * 0.3}`}
              stroke="#000" strokeWidth={1.5 + t} fill="none" opacity="0.08" />
          </g>
        ) : (
          <g>
            {/* Closed jaw — wide mandible matching snout width */}
            <path d={`
              M ${headCx - headRx * 0.4} ${headCy + headRy * 0.2}
              Q ${headCx - headRx * 0.6} ${headCy + headRy * 0.45}
                ${snoutTipX + 8} ${snoutTipY + baseJawDrop * 0.6}
              L ${snoutTipX + 1} ${snoutTipY + baseJawDrop * 0.35}
              Q ${snoutTipX + 4} ${snoutTipY + 2}
                ${headCx - headRx * 0.4} ${headCy + headRy * 0.1}
              Z`}
              fill={secondary} stroke={primary} strokeWidth="1" strokeOpacity="0.3" />
            {/* Visible mouth line when closed */}
            <path d={`M ${snoutTipX + 1} ${snoutTipY + 1}
                       Q ${snoutTipX + 10} ${snoutTipY + baseJawDrop * 0.15}
                         ${headCx - headRx * 0.5} ${headCy + headRy * 0.1}`}
              stroke={primary} strokeWidth={1.5 + jawAngularity * 1.5} fill="none" opacity={0.35 + jawAngularity * 0.25} />
            {/* Jawline ridge */}
            <path d={`M ${snoutTipX + 10} ${snoutTipY + baseJawDrop * 0.4}
                       Q ${headCx - headRx * 0.3} ${headCy + headRy * 0.4}
                         ${headCx + headRx * 0.1} ${headCy + headRy * 0.3}`}
              stroke={primary} strokeWidth={0.8 + t * 1.2} fill="none" opacity={0.1 + t * 0.12} />
          </g>
        )}

        {/* Lower teeth when chomping */}
        {chomping && (() => {
          const teethCount = Math.floor(2 + t * 3);
          const toothH = 3 + t * 5 + (1 - t) * 2;
          const teethStartX = snoutTipX + 5;
          const teethEndX = headCx - headRx * 0.15;
          const jawLineY = snoutTipY + baseJawDrop * 0.25;
          return Array.from({ length: teethCount }, (_, i) => {
            const tx = teethStartX + (i / Math.max(1, teethCount - 1)) * (teethEndX - teethStartX);
            return (
              <polygon key={`lt${i}`}
                points={`${tx - 1.5},${jawLineY + 1} ${tx + 1.5},${jawLineY + 1} ${tx},${jawLineY - toothH}`}
                fill="#e8e8d8" stroke="#bbb" strokeWidth="0.3" />
            );
          });
        })()}
        {/* Lower fang (always visible — pokes up from jaw) */}
        {!chomping && t > 0.1 && (
          <polygon
            points={`${snoutTipX + 4},${snoutTipY + baseJawDrop * 0.2} ${snoutTipX + 7},${snoutTipY + baseJawDrop * 0.2} ${snoutTipX + 5.5},${snoutTipY - 1 - t * 2}`}
            fill="#e8e8d8" stroke="#ccc" strokeWidth="0.3" opacity="0.7" />
        )}
      </motion.g>

      {/* === MOUTH INTERIOR (rendered between upper and lower jaw) === */}
      {chomping && (() => {
        const mouthX = snoutTipX + 3;
        const mouthTopY = snoutTipY + 2;
        const mouthW = headRx * 1.4 + t * 10;
        const mouthH = chompGap * 0.6;
        return (
          <g>
            {/* Deep dark mouth cavity */}
            <ellipse cx={mouthX + mouthW * 0.4} cy={mouthTopY + mouthH * 0.35}
              rx={mouthW * 0.55} ry={mouthH * 0.5}
              fill="#0a0008" />

            {/* Throat darkness (deeper) */}
            <ellipse cx={mouthX + mouthW * 0.55} cy={mouthTopY + mouthH * 0.3}
              rx={mouthW * 0.2} ry={mouthH * 0.25}
              fill="#050004" />

            {/* Tongue */}
            <motion.path
              d={`M ${mouthX + mouthW * 0.15} ${mouthTopY + mouthH * 0.5}
                  Q ${mouthX + mouthW * 0.3} ${mouthTopY + mouthH * 0.85}
                    ${mouthX + mouthW * 0.5} ${mouthTopY + mouthH * 0.55}
                  Q ${mouthX + mouthW * 0.65} ${mouthTopY + mouthH * 0.3}
                    ${mouthX + mouthW * 0.75} ${mouthTopY + mouthH * 0.5}`}
              fill="#cc2244" stroke="#991133" strokeWidth="1"
              animate={{ d: [
                `M ${mouthX + mouthW * 0.15} ${mouthTopY + mouthH * 0.55}
                 Q ${mouthX + mouthW * 0.3} ${mouthTopY + mouthH * 0.9}
                   ${mouthX + mouthW * 0.5} ${mouthTopY + mouthH * 0.6}
                 Q ${mouthX + mouthW * 0.65} ${mouthTopY + mouthH * 0.35}
                   ${mouthX + mouthW * 0.75} ${mouthTopY + mouthH * 0.55}`,
                `M ${mouthX + mouthW * 0.15} ${mouthTopY + mouthH * 0.45}
                 Q ${mouthX + mouthW * 0.3} ${mouthTopY + mouthH * 0.8}
                   ${mouthX + mouthW * 0.5} ${mouthTopY + mouthH * 0.5}
                 Q ${mouthX + mouthW * 0.65} ${mouthTopY + mouthH * 0.25}
                   ${mouthX + mouthW * 0.75} ${mouthTopY + mouthH * 0.45}`,
              ]}}
              transition={{ duration: 0.35, repeat: Infinity, repeatType: 'reverse' }}
            />
          </g>
        );
      })()}

      {/* Nostril glow (subtle element-colored light from within) */}
      <circle cx={snoutTipX + 5} cy={snoutTipY - 1} r={3 + snoutLen * 0.8} fill={glow} opacity={0.15 + breathIntensity * 0.2} />

      {/* Nostril wisps / breath steam */}
      <motion.circle cx={snoutTipX} cy={snoutTipY - 3}
        r={1.5 + breathIntensity * 3} fill={primary}
        opacity={0.12 + breathIntensity * 0.3}
        animate={{
          cx: [snoutTipX, snoutTipX - 12, snoutTipX - 24],
          cy: [snoutTipY - 3, snoutTipY - 8, snoutTipY - 12],
          r: [1.5 + breathIntensity * 3, 3 + breathIntensity * 4, 0.5],
          opacity: [0.12 + breathIntensity * 0.3, 0.08, 0],
        }}
        transition={{ duration: 2.2, repeat: Infinity }} />

      {/* Eye (proportional — baby=big round, adult=narrow fierce) */}
      <ellipse cx={headCx + 2} cy={headCy - headRy * 0.15}
        rx={eyeW + 3} ry={eyeH + 2} fill="#080818" />
      {blinking ? (
        /* Eyelid closed — simple line */
        <line
          x1={headCx - eyeW} y1={headCy - headRy * 0.15}
          x2={headCx + eyeW} y2={headCy - headRy * 0.15}
          stroke={primary} strokeWidth={2 + t} strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse cx={headCx} cy={headCy - headRy * 0.15}
            rx={eyeW} ry={eyeH}
            fill={`url(#eg-${dragon.id})`} opacity={0.5 + t * 0.5} />
          {/* Pupil — rounder when baby, slitted when adult */}
          <ellipse cx={headCx} cy={headCy - headRy * 0.15}
            rx={pupilW} ry={pupilH} fill="#080818" />
          {/* Eye highlights */}
          <circle cx={headCx + eyeW * 0.3} cy={headCy - headRy * 0.15 - eyeH * 0.25}
            r={1.5 + (1 - t) * 1} fill="white" opacity="0.9" />
          <circle cx={headCx - eyeW * 0.2} cy={headCy - headRy * 0.15 + eyeH * 0.2}
            r={0.8 + (1 - t) * 0.5} fill="white" opacity="0.35" />
        </>
      )}

      {/* Ear / frill (grows with maturity) */}
      <path d={`M ${headCx + headRx * 0.6} ${headCy - headRy * 0.2}
                 Q ${headCx + headRx + t * 12} ${headCy - headRy - t * 10}
                   ${headCx + headRx * 0.7 + t * 5} ${headCy - headRy - 10 - t * 15}`}
        stroke={secondary} strokeWidth={2 + t * 2} fill="none" strokeLinecap="round" opacity="0.5" />
      {t > 0.4 && (
        <path d={`M ${headCx + headRx * 0.5} ${headCy - headRy * 0.3}
                   Q ${headCx + headRx + t * 8} ${headCy - headRy - t * 6}
                     ${headCx + headRx * 0.6 + t * 4} ${headCy - headRy - 5 - t * 12}`}
          stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.2" />
      )}

      {/* Horns (tiny nubs → massive curved horns) */}
      <path d={`M ${headCx - headRx * 0.3} ${headCy - headRy * 0.6}
                 Q ${headCx - headRx * 0.5 - hornLen * 12} ${headCy - headRy - hornLen * 18}
                   ${headCx - headRx * 0.4 - hornLen * 16} ${headCy - headRy - 8 - hornLen * 30}`}
        stroke={accent} strokeWidth={2.5 + hornLen * 3} fill="none" strokeLinecap="round" />
      <path d={`M ${headCx + headRx * 0.3} ${headCy - headRy * 0.5}
                 Q ${headCx + headRx * 0.4 + hornLen * 8} ${headCy - headRy - hornLen * 16}
                   ${headCx + headRx * 0.35 + hornLen * 12} ${headCy - headRy - 6 - hornLen * 26}`}
        stroke={accent} strokeWidth={2.5 + hornLen * 3} fill="none" strokeLinecap="round" />

      {/* Horn ridges (adult only) */}
      {t > 0.3 && [0.3, 0.55, 0.8].map((f, i) => {
        const lhx = headCx - headRx * 0.3 - f * (headRx * 0.2 + hornLen * 16);
        const lhy = headCy - headRy * 0.6 - f * (headRy + hornLen * 30);
        const rhx = headCx + headRx * 0.3 + f * (headRx * 0.1 + hornLen * 12);
        const rhy = headCy - headRy * 0.5 - f * (headRy + hornLen * 26);
        return (
          <React.Fragment key={`hr${i}`}>
            <circle cx={lhx} cy={lhy} r={1 + t} fill={accent} opacity="0.25" />
            <circle cx={rhx} cy={rhy} r={1 + t} fill={accent} opacity="0.25" />
          </React.Fragment>
        );
      })}

      {/* Horn tip glow (powerful adult) */}
      {t > 0.5 && (
        <>
          <circle cx={headCx - headRx * 0.4 - hornLen * 16} cy={headCy - headRy - 8 - hornLen * 30}
            r={2 + t * 2.5} fill={accent} opacity={t * 0.45} />
          <circle cx={headCx + headRx * 0.35 + hornLen * 12} cy={headCy - headRy - 6 - hornLen * 26}
            r={2 + t * 2.5} fill={accent} opacity={t * 0.45} />
        </>
      )}

      {/* Cheek/jaw scales (more visible on adults) */}
      <g opacity={0.15 + t * 0.35}>
        {[0, 1, 2].map(i => (
          <ellipse key={`ch${i}`}
            cx={headCx - headRx * 0.2 + i * (headRx * 0.25)}
            cy={headCy + headRy * 0.55 + i * 2}
            rx={3} ry={1.8} fill={accent} opacity="0.5" />
        ))}
      </g>

      {/* Breath effect */}
      {breathIntensity > 0 && (
        <BreathFX dragon={dragon} intensity={breathIntensity}
          x={snoutTipX} y={snoutTipY} />
      )}
    </g>
  );
}

function Leg({ x, y, hipDx, hipDy, legLen, legThick, claw, color, accent, t, side }) {
  const w = side === 'near' ? (6 + legThick * 8) : (5 + legThick * 6);
  const kneeX = x + hipDx * 0.4;
  const kneeY = y + hipDy * 0.55;
  const footX = x + hipDx * 0.8;
  const footY = y + hipDy + 8;

  return (
    <g>
      {/* Thigh — muscular curve */}
      <path d={`M ${x} ${y} Q ${kneeX + legThick * 5} ${kneeY - 8} ${kneeX} ${kneeY}`}
        stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      {/* Knee joint */}
      <circle cx={kneeX} cy={kneeY} r={w * 0.35} fill={color} opacity="0.6" />
      {/* Shin — tapers toward foot */}
      <path d={`M ${kneeX} ${kneeY} Q ${footX - 2} ${footY - hipDy * 0.18} ${footX} ${footY}`}
        stroke={color} strokeWidth={w * 0.7} fill="none" strokeLinecap="round" />
      {/* Foot pad */}
      <ellipse cx={footX} cy={footY + 2} rx={8 + claw * 7} ry={3.5 + claw * 2.5} fill={color} />
      {/* Claws */}
      {[0,1,2].map(c => (
        <path key={`c${c}`}
          d={`M ${footX - 6 - claw * 2 + c * (5 + claw * 3)} ${footY + 2}
              Q ${footX - 7 - claw * 2 + c * (4.5 + claw * 2.8)} ${footY + 4 + claw * 3}
                ${footX - 9 - claw * 2 + c * (4 + claw * 2.5)} ${footY + 5 + claw * 6}`}
          stroke={accent} strokeWidth={1.4 + claw * 0.8} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Arm({ x, y, legThick, clawSize, t, color, accent, side }) {
  const w = side === 'near' ? (4 + legThick * 5) : (3.5 + legThick * 4);
  // Upper arm curves down and forward
  const elbowX = x - 18 - t * 6;
  const elbowY = y + 20 + t * 10;
  // Forearm reaches down to hand
  const handX = elbowX - 8 - t * 4;
  const handY = elbowY + 14 + t * 6;

  return (
    <g>
      {/* Upper arm — muscular bulge */}
      <path d={`M ${x} ${y} Q ${x - 8 + legThick * 3} ${elbowY - 8} ${elbowX} ${elbowY}`}
        stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      {/* Elbow joint */}
      <circle cx={elbowX} cy={elbowY} r={w * 0.32} fill={color} opacity="0.55" />
      {/* Forearm — tapers */}
      <path d={`M ${elbowX} ${elbowY} Q ${handX + 3} ${handY - 5} ${handX} ${handY}`}
        stroke={color} strokeWidth={w * 0.65} fill="none" strokeLinecap="round" />
      {/* Hand pad */}
      <ellipse cx={handX} cy={handY + 1} rx={4 + clawSize * 4} ry={2.5 + clawSize * 1.5} fill={color} />
      {/* Claws — curved like legs */}
      {[0,1,2].map(c => (
        <path key={`ac${c}`}
          d={`M ${handX - 4 - clawSize * 1.5 + c * (3.5 + clawSize * 2)} ${handY + 1}
              Q ${handX - 5 - clawSize * 1.5 + c * (3 + clawSize * 1.8)} ${handY + 3 + clawSize * 2}
                ${handX - 6 - clawSize * 1.5 + c * (2.5 + clawSize * 1.5)} ${handY + 4 + clawSize * 4.5}`}
          stroke={accent} strokeWidth={1.2 + clawSize * 0.5} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

// Spines along dorsal ridge: tail-base → back → neck → head
function Spines({ dragon, t, bodyCx, bodyCy, bodyRx, bodyRy, spineCount, neckTopX, neckTopY, neckLen, headCx, headCy, headRy }) {
  const { primary, accent } = dragon.colors;
  const style = dragon.physiology?.spineStyle || 'flame';

  // Build dorsal path points from tail-base through back, up neck, to head
  const totalSpines = spineCount + Math.floor(2 + t * 3); // extra for neck
  const dorsalPoints = [];
  for (let i = 0; i < totalSpines; i++) {
    const frac = i / Math.max(1, totalSpines - 1);
    let sx, sy;
    if (frac < 0.55) {
      // Back portion — along top of body
      const backFrac = frac / 0.55;
      sx = bodyCx + bodyRx * 0.3 - backFrac * (bodyRx * 0.3 + 25);
      sy = bodyCy - bodyRy * (0.85 + Math.sin(backFrac * Math.PI) * 0.15);
    } else {
      // Neck portion — follows dorsal edge up to head
      const neckFrac = (frac - 0.55) / 0.45;
      const neckMidX = bodyCx - 50 - neckLen * 15;
      const neckMidY = bodyCy - 60 - neckLen * 30;
      const neckW = 10 + (1 - t) * 4 + t * 6;
      // Quadratic interpolation along neck dorsal
      const oneMinusFrac = 1 - neckFrac;
      sx = oneMinusFrac * oneMinusFrac * (bodyCx - 25 - neckW * 0.3) +
           2 * oneMinusFrac * neckFrac * (neckMidX - neckW * 0.2) +
           neckFrac * neckFrac * (headCx);
      sy = oneMinusFrac * oneMinusFrac * (bodyCy - 35 - neckW * 0.8) +
           2 * oneMinusFrac * neckFrac * (neckMidY - neckW * 0.6) +
           neckFrac * neckFrac * (headCy - headRy * 0.7);
    }
    dorsalPoints.push({ sx, sy, frac });
  }

  return (
    <g opacity={0.45 + t * 0.55}>
      {dorsalPoints.map(({ sx, sy, frac }, i) => {
        // Spines are tallest at mid-back, shorter on neck and tail
        const heightMod = frac < 0.55
          ? 0.5 + Math.sin((frac / 0.55) * Math.PI * 0.8) * 0.5
          : 0.35 + (1 - (frac - 0.55) / 0.45) * 0.4;
        const baseH = (4 + t * 16) * heightMod;
        // Lean backward slightly
        const lean = frac < 0.55 ? (frac / 0.55 - 0.5) * 4 : -2 - ((frac - 0.55) / 0.45) * 3;
        const w = 2 + t * 1.5;

        switch (style) {
          case 'crystal': {
            // Angular ice shards
            const h = baseH * 1.1;
            return (
              <g key={`sp${i}`}>
                <path d={`M ${sx} ${sy} L ${sx - w * 0.5 + lean} ${sy - h * 0.7} L ${sx + lean} ${sy - h} L ${sx + w * 0.5 + lean} ${sy - h * 0.6} Z`}
                  fill={accent} stroke={primary} strokeWidth="0.5" opacity="0.7" />
                <line x1={sx + lean * 0.5} y1={sy - h * 0.3} x2={sx + lean} y2={sy - h * 0.9}
                  stroke="#fff" strokeWidth="0.5" opacity="0.3" />
              </g>
            );
          }
          case 'rocky': {
            // Jagged rock plates
            const h = baseH * 0.8;
            return (
              <path key={`sp${i}`}
                d={`M ${sx - w * 1.2} ${sy} L ${sx - w * 0.6} ${sy - h * 0.5} L ${sx} ${sy - h}
                    L ${sx + w * 0.4} ${sy - h * 0.6} L ${sx + w * 1.2} ${sy}`}
                fill={accent} stroke={primary} strokeWidth="0.8" />
            );
          }
          case 'wispy': {
            // Smoke-like wisps
            const h = baseH * 1.2;
            return (
              <path key={`sp${i}`}
                d={`M ${sx} ${sy} Q ${sx + lean * 1.5} ${sy - h * 0.5} ${sx + lean * 2} ${sy - h}`}
                stroke={accent} strokeWidth={1.5 + t} fill="none" strokeLinecap="round" opacity={0.3 + t * 0.3} />
            );
          }
          case 'feathered': {
            // Soft feather crests
            const h = baseH * 0.9;
            return (
              <g key={`sp${i}`}>
                <path d={`M ${sx} ${sy} Q ${sx + lean - w * 0.3} ${sy - h * 0.6} ${sx + lean * 1.5} ${sy - h}`}
                  stroke={accent} strokeWidth={2 + t} fill="none" strokeLinecap="round" opacity="0.6" />
                <path d={`M ${sx} ${sy} Q ${sx + lean + w * 0.3} ${sy - h * 0.5} ${sx + lean * 1.2} ${sy - h * 0.85}`}
                  stroke={primary} strokeWidth={1.5 + t * 0.5} fill="none" strokeLinecap="round" opacity="0.3" />
              </g>
            );
          }
          case 'bolt': {
            // Lightning bolt spines
            const h = baseH * 1.0;
            return (
              <path key={`sp${i}`}
                d={`M ${sx} ${sy} L ${sx - w * 0.6 + lean} ${sy - h * 0.35}
                    L ${sx + w * 0.4 + lean} ${sy - h * 0.5}
                    L ${sx + lean * 0.8} ${sy - h}`}
                stroke={accent} strokeWidth={1.5 + t} fill="none" strokeLinecap="round" />
            );
          }
          default: {
            // Flame ridges (ember default)
            const h = baseH;
            return (
              <path key={`sp${i}`}
                d={`M ${sx - w} ${sy} Q ${sx - w * 0.3 + lean} ${sy - h * 0.6} ${sx + lean * 0.8} ${sy - h}
                    Q ${sx + w * 0.3 + lean} ${sy - h * 0.6} ${sx + w} ${sy}`}
                fill={accent} stroke={primary} strokeWidth="0.5" />
            );
          }
        }
      })}
    </g>
  );
}

// Type-specific extra visual features (particles, textures, unique elements)
function DragonExtras({ dragon, t, bodyCx, bodyCy, bodyRx, bodyRy }) {
  const { primary, accent } = dragon.colors;
  const extra = dragon.physiology?.extraFeature;
  if (!extra || t < 0.15) return null;

  const intensity = Math.min(1, (t - 0.15) / 0.6);

  switch (extra) {
    case 'embers':
      // Floating ember particles around body
      return (
        <g>
          {Array.from({ length: Math.floor(3 + intensity * 5) }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = bodyRx * 1.2 + i * 5;
            const px = bodyCx + Math.cos(angle + t * 2) * dist;
            const py = bodyCy - 20 + Math.sin(angle) * bodyRy * 0.6;
            return (
              <motion.circle key={`em${i}`} cx={px} cy={py} r={1.5 + intensity * 1.5}
                fill={accent}
                animate={{ cy: [py, py - 15 - i * 3, py - 30], opacity: [0.6, 0.8, 0] }}
                transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }} />
            );
          })}
        </g>
      );

    case 'frost':
      // Frost mist around feet/body
      return (
        <g>
          <motion.ellipse cx={bodyCx} cy={bodyCy + bodyRy * 0.8} rx={bodyRx * 1.5} ry={8 + intensity * 6}
            fill={accent} opacity={0.06 + intensity * 0.06}
            animate={{ rx: [bodyRx * 1.3, bodyRx * 1.6, bodyRx * 1.3], opacity: [0.04, 0.1, 0.04] }}
            transition={{ duration: 3, repeat: Infinity }} />
          {intensity > 0.3 && Array.from({ length: 4 }, (_, i) => (
            <motion.circle key={`fr${i}`}
              cx={bodyCx - bodyRx + i * bodyRx * 0.7} cy={bodyCy + bodyRy * 0.5 + i * 3}
              r={2 + intensity * 2} fill="#e1f5fe"
              animate={{ opacity: [0, 0.3, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.6 }} />
          ))}
        </g>
      );

    case 'moss':
      // Moss/vine patches on body
      return (
        <g opacity={0.3 + intensity * 0.4}>
          <ellipse cx={bodyCx - bodyRx * 0.3} cy={bodyCy - bodyRy * 0.2} rx={6 + intensity * 4} ry={4 + intensity * 3}
            fill="#4caf50" opacity="0.4" />
          <ellipse cx={bodyCx + bodyRx * 0.2} cy={bodyCy + bodyRy * 0.1} rx={5 + intensity * 3} ry={3 + intensity * 2}
            fill="#66bb6a" opacity="0.35" />
          {intensity > 0.4 && (
            <path d={`M ${bodyCx - bodyRx * 0.5} ${bodyCy}
                       Q ${bodyCx - bodyRx * 0.6} ${bodyCy - 12} ${bodyCx - bodyRx * 0.4} ${bodyCy - 18}`}
              stroke="#4caf50" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity="0.4" />
          )}
        </g>
      );

    case 'smoke':
      // Shadow smoke wisps at edges
      return (
        <g>
          {Array.from({ length: Math.floor(2 + intensity * 4) }, (_, i) => {
            const side = i % 2 === 0 ? -1 : 1;
            const px = bodyCx + side * (bodyRx * 0.8 + i * 4);
            const py = bodyCy + bodyRy * 0.3 - i * 8;
            return (
              <motion.ellipse key={`sm${i}`} cx={px} cy={py}
                rx={4 + intensity * 6} ry={3 + intensity * 4}
                fill={primary} opacity={0.08 + intensity * 0.06}
                animate={{ cx: [px, px + side * 10], cy: [py, py - 12], opacity: [0.08, 0] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.5 }} />
            );
          })}
        </g>
      );

    case 'sparkle':
      // Glitter/sparkle particles
      return (
        <g>
          {Array.from({ length: Math.floor(4 + intensity * 6) }, (_, i) => {
            const angle = (i / 10) * Math.PI * 2 + i;
            const dist = bodyRx * 0.6 + (i % 3) * 12;
            const px = bodyCx + Math.cos(angle) * dist;
            const py = bodyCy - bodyRy * 0.3 + Math.sin(angle) * dist * 0.5;
            return (
              <motion.g key={`sp${i}`} transform={`translate(${px},${py})`}
                animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 1.2 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.3 }}>
                <line x1="-3" y1="0" x2="3" y2="0" stroke="#fff" strokeWidth="1.2" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="#fff" strokeWidth="1.2" />
              </motion.g>
            );
          })}
        </g>
      );

    case 'sparks':
      // Electric sparks crackling around body
      return (
        <g>
          {Array.from({ length: Math.floor(2 + intensity * 4) }, (_, i) => {
            const px1 = bodyCx - bodyRx * 0.5 + i * bodyRx * 0.4;
            const py1 = bodyCy - bodyRy * 0.3 - i * 5;
            const px2 = px1 + (i % 2 === 0 ? 8 : -8) + intensity * 4;
            const py2 = py1 - 6 - intensity * 4;
            return (
              <motion.line key={`zap${i}`} x1={px1} y1={py1} x2={px2} y2={py2}
                stroke={accent} strokeWidth={1 + intensity}
                animate={{ opacity: [0, 0.8, 0], x2: [px2, px2 + 3, px2] }}
                transition={{ duration: 0.3 + (i % 3) * 0.15, repeat: Infinity, delay: i * 0.25 }} />
            );
          })}
        </g>
      );

    default:
      return null;
  }
}

function AnimatedWings({ dragon, ws, t, chomping = false, anchorX = 235, anchorY = 280 }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const ax = anchorX;
  const ay = anchorY;

  // Wing tip and elbow positions scale with wingspan
  const lTipX = ax - 110 - ws * 85;
  const lTipY = ay - 65 - ws * 55;
  const lElbowX = ax - 70 - ws * 50;
  const lElbowY = ay - 50 - ws * 40;
  const lBottomX = ax - 120 - ws * 65;
  const lBottomY = ay - 5 - ws * 12;

  const rTipX = ax + 120 + ws * 85;
  const rTipY = ay - 65 - ws * 55;
  const rElbowX = ax + 80 + ws * 50;
  const rElbowY = ay - 50 - ws * 40;
  const rBottomX = ax + 130 + ws * 65;
  const rBottomY = ay - 5 - ws * 12;

  return (
    <motion.g
      animate={chomping
        ? { rotate: [0, -15, 12, -10, 8, -5, 0], scale: [1, 1.12, 0.95, 1.08, 1] }
        : { rotate: [0, 2, -2, 0] }
      }
      transition={chomping
        ? { duration: 0.8, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }
        : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ transformOrigin: `${ax}px ${ay}px` }}
    >
      {/* Left wing — membrane */}
      <path d={`M ${ax - 20} ${ay}
          Q ${lElbowX} ${lElbowY} ${lTipX} ${lTipY}
          Q ${lTipX - 18 - ws * 10} ${lTipY + 25 + ws * 15} ${lBottomX} ${lBottomY}
          Q ${ax - 90 - ws * 42} ${ay + 15} ${ax - 30} ${ay + 15}`}
        fill={`url(#wg-${dragon.id})`} stroke={primary} strokeWidth={2 + ws * 1.5} strokeOpacity="0.5" />
      {/* Leading edge bone (thick — the arm of the wing) */}
      <path d={`M ${ax - 20} ${ay} Q ${lElbowX + 5} ${lElbowY + 5} ${lTipX} ${lTipY}`}
        stroke={primary} strokeWidth={4 + ws * 5} fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Bone highlight */}
      <path d={`M ${ax - 18} ${ay - 2} Q ${lElbowX + 6} ${lElbowY + 3} ${lTipX + 1} ${lTipY - 1}`}
        stroke="#fff" strokeWidth={1 + ws * 0.8} fill="none" strokeLinecap="round" opacity="0.08" />
      {/* Elbow joint */}
      <circle cx={lElbowX} cy={lElbowY} r={2.5 + ws * 2.5} fill={secondary} opacity="0.5" />
      {/* Wing talon at elbow (bat-like thumb claw) */}
      <path d={`M ${lElbowX + 2} ${lElbowY - 1}
                Q ${lElbowX - 4 - ws * 5} ${lElbowY - 8 - ws * 6}
                  ${lElbowX - 6 - ws * 8} ${lElbowY - 14 - ws * 10}`}
        stroke={accent} strokeWidth={1.5 + ws * 1.5} fill="none" strokeLinecap="round" opacity={0.5 + t * 0.3} />
      {/* Talon tip */}
      <circle cx={lElbowX - 6 - ws * 8} cy={lElbowY - 14 - ws * 10}
        r={1 + ws * 1.2} fill={accent} opacity={0.6 + t * 0.3} />
      {/* Trailing edge bone */}
      <path d={`M ${ax - 30} ${ay + 8} Q ${ax - 75 - ws * 35} ${ay + 5 - ws * 8} ${lBottomX} ${lBottomY}`}
        stroke={primary} strokeWidth={3 + ws * 3} fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Wing finger bones (veins across membrane) — with glow */}
      {[0.25, 0.5, 0.75].map((f, i) => {
        const bx1 = ax - 20 - f * (ax - 20 - lElbowX) - f * (lElbowX - lTipX) * 0.3;
        const by1 = ay - f * (ay - lElbowY) - f * (lElbowY - lTipY) * 0.3;
        const bx2 = ax - 30 - f * (ax - 30 - lBottomX);
        const by2 = ay + 8 - f * (ay + 8 - lBottomY);
        return (
          <g key={`lv${i}`}>
            {/* Vein glow */}
            <line x1={bx1} y1={by1} x2={bx2} y2={by2}
              stroke={glow} strokeWidth={2 + t * 1.5} opacity={0.03 + t * 0.04} />
            {/* Vein line */}
            <line x1={bx1} y1={by1} x2={bx2} y2={by2}
              stroke={primary} strokeWidth={1.5 + ws * 2 + t * 1} opacity={0.25 + t * 0.2} />
          </g>
        );
      })}
      {/* Wing membrane texture (subtle cross-hatching on mature wings) */}
      {t > 0.4 && [0.3, 0.6].map((f, i) => {
        const bx1 = ax - 20 - f * (ax - 20 - lElbowX) - f * (lElbowX - lTipX) * 0.15;
        const by1 = ay - f * (ay - lElbowY) + 5;
        const bx2 = ax - 30 - f * 0.8 * (ax - 30 - lBottomX);
        const by2 = ay + 8 - f * 0.8 * (ay + 8 - lBottomY);
        return (
          <line key={`lm${i}`} x1={bx1} y1={by1} x2={bx2} y2={by2}
            stroke={primary} strokeWidth="0.4" opacity={0.04 + t * 0.04} strokeDasharray="3 5" />
        );
      })}
      {/* Wing tip claw */}
      {ws > 0.45 && (
        <g>
          <circle cx={lTipX} cy={lTipY} r={2 + ws * 2.5} fill={accent} opacity="0.6" />
          <circle cx={lTipX} cy={lTipY} r={1 + ws * 1.5} fill="#fff" opacity="0.15" />
        </g>
      )}

      {/* Right wing — membrane */}
      <path d={`M ${ax + 30} ${ay}
          Q ${rElbowX} ${rElbowY} ${rTipX} ${rTipY}
          Q ${rTipX + 18 + ws * 10} ${rTipY + 25 + ws * 15} ${rBottomX} ${rBottomY}
          Q ${ax + 100 + ws * 42} ${ay + 15} ${ax + 40} ${ay + 15}`}
        fill={`url(#wg-${dragon.id})`} stroke={primary} strokeWidth={2 + ws * 1.5} strokeOpacity="0.5" />
      {/* Leading edge bone (the arm) */}
      <path d={`M ${ax + 30} ${ay} Q ${rElbowX - 5} ${rElbowY + 5} ${rTipX} ${rTipY}`}
        stroke={primary} strokeWidth={4 + ws * 5} fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Bone highlight */}
      <path d={`M ${ax + 32} ${ay - 2} Q ${rElbowX - 6} ${rElbowY + 3} ${rTipX - 1} ${rTipY - 1}`}
        stroke="#fff" strokeWidth={1 + ws * 0.8} fill="none" strokeLinecap="round" opacity="0.08" />
      {/* Elbow joint */}
      <circle cx={rElbowX} cy={rElbowY} r={2.5 + ws * 2.5} fill={secondary} opacity="0.5" />
      {/* Wing talon at elbow (bat-like thumb claw) */}
      <path d={`M ${rElbowX - 2} ${rElbowY - 1}
                Q ${rElbowX + 4 + ws * 5} ${rElbowY - 8 - ws * 6}
                  ${rElbowX + 6 + ws * 8} ${rElbowY - 14 - ws * 10}`}
        stroke={accent} strokeWidth={1.5 + ws * 1.5} fill="none" strokeLinecap="round" opacity={0.5 + t * 0.3} />
      {/* Talon tip */}
      <circle cx={rElbowX + 6 + ws * 8} cy={rElbowY - 14 - ws * 10}
        r={1 + ws * 1.2} fill={accent} opacity={0.6 + t * 0.3} />
      {/* Trailing edge bone */}
      <path d={`M ${ax + 40} ${ay + 8} Q ${ax + 85 + ws * 35} ${ay + 5 - ws * 8} ${rBottomX} ${rBottomY}`}
        stroke={primary} strokeWidth={3 + ws * 3} fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Wing finger bones — with glow */}
      {[0.25, 0.5, 0.75].map((f, i) => {
        const bx1 = ax + 30 + f * (rElbowX - (ax + 30)) + f * (rTipX - rElbowX) * 0.3;
        const by1 = ay - f * (ay - rElbowY) - f * (rElbowY - rTipY) * 0.3;
        const bx2 = ax + 40 + f * (rBottomX - (ax + 40));
        const by2 = ay + 8 - f * (ay + 8 - rBottomY);
        return (
          <g key={`rv${i}`}>
            <line x1={bx1} y1={by1} x2={bx2} y2={by2}
              stroke={glow} strokeWidth={2 + t * 1.5} opacity={0.03 + t * 0.04} />
            <line x1={bx1} y1={by1} x2={bx2} y2={by2}
              stroke={primary} strokeWidth={1.5 + ws * 2 + t * 1} opacity={0.25 + t * 0.2} />
          </g>
        );
      })}
      {/* Wing tip claw */}
      {ws > 0.45 && (
        <g>
          <circle cx={rTipX} cy={rTipY} r={2 + ws * 2.5} fill={accent} opacity="0.6" />
          <circle cx={rTipX} cy={rTipY} r={1 + ws * 1.5} fill="#fff" opacity="0.15" />
        </g>
      )}
    </motion.g>
  );
}

function TailSpade({ tailLen, accent, t, dragon }) {
  const tx = 355 + tailLen * 70;
  const ty = 255 - tailLen * 40;
  const s = 1 + t * 0.6;
  const style = dragon?.physiology?.tailStyle || 'flame';
  const primary = dragon?.colors?.primary || accent;

  let tipContent;
  switch (style) {
    case 'club':
      // Boulder club tip
      tipContent = (
        <>
          <ellipse cx={tx} cy={ty - 6 * s} rx={10 * s} ry={8 * s} fill={accent} opacity={0.8 + t * 0.2} />
          <ellipse cx={tx - 3 * s} cy={ty - 8 * s} rx={4 * s} ry={3 * s} fill={primary} opacity="0.3" />
        </>
      );
      break;
    case 'whip':
      // Ice shard tip
      tipContent = (
        <>
          <path d={`M ${tx} ${ty} L ${tx + 6 * s} ${ty - 18 * s} L ${tx} ${ty - 10 * s} L ${tx - 6 * s} ${ty - 18 * s} Z`}
            fill={accent} opacity={0.7 + t * 0.3} />
          <line x1={tx} y1={ty} x2={tx} y2={ty - 14 * s} stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        </>
      );
      break;
    case 'long':
      // Thin wispy tip
      tipContent = (
        <path d={`M ${tx - 3 * s} ${ty} Q ${tx} ${ty - 14 * s} ${tx + 5 * s} ${ty - 20 * s}`}
          stroke={accent} strokeWidth={2 * s} fill="none" strokeLinecap="round" opacity={0.6 + t * 0.3} />
      );
      break;
    case 'flowing':
      // Feathered plume
      tipContent = (
        <>
          {[-1, 0, 1].map(d => (
            <path key={`pl${d}`}
              d={`M ${tx} ${ty} Q ${tx + d * 8 * s} ${ty - 12 * s} ${tx + d * 12 * s} ${ty - 22 * s}`}
              stroke={accent} strokeWidth={1.5 + t} fill="none" strokeLinecap="round" opacity={0.5 + t * 0.2} />
          ))}
        </>
      );
      break;
    case 'forked':
      // Lightning fork tip
      tipContent = (
        <>
          <path d={`M ${tx} ${ty} L ${tx + 8 * s} ${ty - 16 * s}`}
            stroke={accent} strokeWidth={2 * s} strokeLinecap="round" />
          <path d={`M ${tx} ${ty} L ${tx - 6 * s} ${ty - 18 * s}`}
            stroke={accent} strokeWidth={2 * s} strokeLinecap="round" />
          <circle cx={tx} cy={ty - 2 * s} r={2 * s} fill={accent} opacity="0.5" />
        </>
      );
      break;
    default:
      // Flame spade (ember default)
      tipContent = (
        <>
          <path d={`M ${tx} ${ty + 4 * s}
              Q ${tx + 12 * s} ${ty - 4 * s} ${tx + 18 * s} ${ty - 22 * s}
              Q ${tx + 6 * s} ${ty - 16 * s} ${tx} ${ty - 8 * s}
              Q ${tx - 6 * s} ${ty - 16 * s} ${tx - 18 * s} ${ty - 22 * s}
              Q ${tx - 12 * s} ${ty - 4 * s} ${tx} ${ty + 4 * s} Z`}
            fill={accent} opacity={0.8 + t * 0.2} />
          <line x1={tx} y1={ty + 2 * s} x2={tx} y2={ty - 16 * s}
            stroke={accent} strokeWidth={1 + t * 0.5} opacity="0.3" />
        </>
      );
  }

  return (
    <motion.g
      animate={{ rotate: [0, 4, -4, 0] }}
      transition={{ duration: 3.5, repeat: Infinity }}
      style={{ transformOrigin: `${tx}px ${ty}px` }}
    >
      {tipContent}
    </motion.g>
  );
}

function BreathFX({ dragon, intensity, x = 82, y = 172 }) {
  const bc = {
    ember: ['#ff6b35', '#ff9800', '#ffeb3b'],
    frost: ['#4fc3f7', '#81d4fa', '#e1f5fe'],
    stone: ['#8bc34a', '#c6ff00', '#e8f5e9'],
    shadow: ['#9c27b0', '#e040fb', '#e1bee7'],
    glimmer: ['#ffd54f', '#fff176', '#ffffff'],
    storm: ['#29b6f6', '#4dd0e1', '#ffee58'],
  }[dragon.id] || ['#ff6b35', '#ff9800', '#ffeb3b'];

  return (
    <g filter={`url(#bgl-${dragon.id})`}>
      <motion.ellipse cx={x - 5} cy={y}
        rx={7 + intensity * 16} ry={4 + intensity * 9}
        fill={bc[0]} opacity={0.35 + intensity * 0.3}
        animate={{ cx: [x - 5, x - 20, x - 35], rx: [7 + intensity * 16, 11 + intensity * 20, 4], opacity: [0.35 + intensity * 0.3, 0.25, 0] }}
        transition={{ duration: 1.6, repeat: Infinity }} />
      <motion.ellipse cx={x - 15} cy={y - 2}
        rx={4 + intensity * 11} ry={3 + intensity * 6}
        fill={bc[1]} opacity={0.3 + intensity * 0.2}
        animate={{ cx: [x - 15, x - 30, x - 45], rx: [4 + intensity * 11, 7 + intensity * 13, 2], opacity: [0.3 + intensity * 0.2, 0.15, 0] }}
        transition={{ duration: 1.9, repeat: Infinity, delay: 0.25 }} />
      <motion.circle cx={x + 5} cy={y} r={2 + intensity * 3}
        fill={bc[2]} opacity={0.5}
        animate={{ r: [2 + intensity * 3, 4 + intensity * 5, 2 + intensity * 3], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 1.1, repeat: Infinity }} />
    </g>
  );
}

// Tail path helpers
function tailPath(tl) {
  return `M 295 325 Q ${325 + tl * 42} ${342 - tl * 12} ${347 + tl * 62} ${302 - tl * 32} Q ${367 + tl * 52} ${272 - tl * 42} ${355 + tl * 70} ${255 - tl * 40}`;
}
function tailPath2(tl) {
  return `M 295 325 Q ${337 + tl * 42} ${332 - tl * 12} ${357 + tl * 62} ${297 - tl * 32} Q ${377 + tl * 52} ${267 - tl * 42} ${361 + tl * 70} ${248 - tl * 40}`;
}
