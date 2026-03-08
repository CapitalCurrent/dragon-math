import React, { lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useVersion } from '../App';
import DragonSVG from '../components/DragonSVG';
import FloatingNumbers from '../components/FloatingNumbers';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';
import DevPanel from '../components/DevPanel';

const DragonPixi = lazy(() => import('../engine/DragonPixi'));

function DragonCave({ dragon, progress, caveSize, children }) {
  const { primary, accent, glow } = dragon.colors;
  const isEgg = progress <= 0.15;
  const w = caveSize || 540;
  const h = Math.round(w * (520 / 540));
  return (
    <div className="relative" style={{ width: w, height: h, overflow: 'visible' }}>
      {/* Cave background */}
      <svg
        width="100%" height="100%" viewBox="0 0 540 520"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="cave-bg" cx="50%" cy="55%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.08" />
            <stop offset="40%" stopColor="#0a0a1a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#050510" stopOpacity="0.65" />
          </radialGradient>
          <radialGradient id="cave-glow" cx="50%" cy="90%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
          {/* Ambient light from dragon */}
          <radialGradient id="cave-ambient" cx="50%" cy="60%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.04" />
            <stop offset="60%" stopColor={glow} stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Cave arch — wider and taller with stone border */}
        <path
          d="M 15 520 Q 15 100 110 45 Q 200 5 270 5 Q 340 5 430 45 Q 525 100 525 520"
          fill="url(#cave-bg)"
          stroke="#1a1a2e"
          strokeWidth="6"
        />
        {/* Outer glow on cave edge */}
        <path
          d="M 15 520 Q 15 100 110 45 Q 200 5 270 5 Q 340 5 430 45 Q 525 100 525 520"
          fill="none"
          stroke={glow}
          strokeWidth="1"
          strokeOpacity="0.08"
        />
        {/* Inner edge highlight */}
        <path
          d="M 22 520 Q 22 108 115 50 Q 205 12 270 12 Q 335 12 425 50 Q 518 108 518 520"
          fill="none"
          stroke="#252545"
          strokeWidth="2"
        />

        {/* Stone texture blocks along arch */}
        {[
          { d: 'M 20 480 L 30 478 L 32 500 L 18 502 Z', o: 0.15 },
          { d: 'M 18 420 L 28 416 L 32 440 L 20 442 Z', o: 0.12 },
          { d: 'M 22 360 L 34 354 L 38 378 L 24 380 Z', o: 0.1 },
          { d: 'M 32 300 L 44 292 L 48 314 L 34 318 Z', o: 0.1 },
          { d: 'M 50 240 L 62 230 L 66 250 L 52 256 Z', o: 0.08 },
          { d: 'M 78 180 L 90 168 L 96 186 L 82 194 Z', o: 0.08 },
          { d: 'M 115 120 L 128 108 L 134 124 L 120 132 Z', o: 0.06 },
          { d: 'M 508 480 L 520 478 L 522 502 L 508 500 Z', o: 0.15 },
          { d: 'M 510 420 L 522 416 L 520 440 L 508 442 Z', o: 0.12 },
          { d: 'M 506 360 L 518 354 L 516 378 L 504 380 Z', o: 0.1 },
          { d: 'M 496 300 L 508 292 L 506 314 L 494 318 Z', o: 0.1 },
          { d: 'M 478 240 L 490 230 L 488 250 L 476 256 Z', o: 0.08 },
          { d: 'M 450 180 L 462 168 L 458 186 L 446 194 Z', o: 0.08 },
          { d: 'M 415 120 L 428 108 L 424 124 L 412 132 Z', o: 0.06 },
        ].map((s, i) => (
          <path key={`stone-${i}`} d={s.d} fill="#1a1a30" opacity={s.o} stroke="#222244" strokeWidth="0.5" />
        ))}

        {/* Inner cave shadow for depth */}
        <path
          d="M 40 520 Q 40 130 125 65 Q 210 28 270 28 Q 330 28 415 65 Q 500 130 500 520"
          fill="none"
          stroke={primary}
          strokeWidth="1"
          strokeOpacity="0.06"
        />

        {/* Ambient fill */}
        <path
          d="M 40 520 Q 40 130 125 65 Q 210 28 270 28 Q 330 28 415 65 Q 500 130 500 520"
          fill="url(#cave-ambient)"
        />

        {/* Rocky texture — stalactites */}
        <path d="M 55 140 L 64 180 L 48 142" fill="#12121f" opacity="0.6" />
        <path d="M 100 70 L 106 105 L 92 73" fill="#12121f" opacity="0.5" />
        <path d="M 440 70 L 447 103 L 433 73" fill="#12121f" opacity="0.5" />
        <path d="M 480 135 L 474 175 L 488 138" fill="#12121f" opacity="0.6" />
        <path d="M 160 32 L 166 58 L 154 35" fill="#12121f" opacity="0.4" />
        <path d="M 380 32 L 386 56 L 374 35" fill="#12121f" opacity="0.4" />
        <path d="M 210 15 L 214 35 L 206 17" fill="#12121f" opacity="0.3" />
        <path d="M 330 15 L 334 33 L 326 17" fill="#12121f" opacity="0.3" />

        {/* Ground / cave floor */}
        <ellipse cx="270" cy="495" rx="220" ry="22" fill="#0e0e1c" />
        <ellipse cx="270" cy="492" rx="200" ry="15" fill="#141428" />
        <ellipse cx="270" cy="489" rx="175" ry="8" fill="#1a1a35" />

        {/* Floor glow from dragon */}
        <ellipse cx="270" cy="488" rx="140" ry="18" fill="url(#cave-glow)" />

        {/* Scattered floor rocks */}
        <ellipse cx="75" cy="502" rx="14" ry="7" fill="#161625" />
        <ellipse cx="465" cy="504" rx="12" ry="6" fill="#161625" />
        <ellipse cx="150" cy="506" rx="9" ry="5" fill="#141422" />
        <ellipse cx="400" cy="505" rx="10" ry="5" fill="#141422" />

        {/* Accent glow on cave walls */}
        <ellipse cx="42" cy="320" rx="10" ry="50" fill={accent} opacity="0.04" />
        <ellipse cx="498" cy="320" rx="10" ry="50" fill={accent} opacity="0.04" />

        {/* Nest rocks — only visible during egg phase */}
        {isEgg && (
          <g>
            <ellipse cx="210" cy="458" rx="24" ry="30" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="330" cy="458" rx="22" ry="28" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="235" cy="452" rx="20" ry="26" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            <ellipse cx="305" cy="453" rx="19" ry="25" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            <ellipse cx="220" cy="476" rx="22" ry="18" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="320" cy="477" rx="21" ry="17" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="245" cy="482" rx="18" ry="14" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            <ellipse cx="295" cy="483" rx="17" ry="13" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            <ellipse cx="270" cy="486" rx="24" ry="12" fill="#252540" stroke="#30305a" strokeWidth="0.8" />
            <ellipse cx="195" cy="486" rx="8" ry="5" fill="#1c1c2e" />
            <ellipse cx="345" cy="487" rx="7" ry="4" fill="#1c1c2e" />
            <ellipse cx="270" cy="472" rx="40" ry="14" fill={accent} opacity="0.06" />
            <ellipse cx="270" cy="468" rx="28" ry="10" fill={glow} opacity="0.04" />
          </g>
        )}
      </svg>

      {/* Dragon content — anchored to cave floor, can overflow out the top */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 24,
        display: 'flex', justifyContent: 'center',
        overflow: 'visible',
      }}>
        {children}
      </div>
    </div>
  );
}

// Ambient floating particles for the game background
function AmbientParticles({ color, count = 20 }) {
  const particles = React.useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 30,
    })),
    [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: color,
          }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, p.drift],
            opacity: [0, 0.4, 0.3, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Flying answer overlay — renders at fixed position so it can cross layout boundaries
function FlyingAnswer({ dragon, answer, dragonRef, numbersRef }) {
  const colors = dragon?.colors || {};
  const [coords, setCoords] = React.useState(null);

  React.useEffect(() => {
    const numEl = numbersRef?.current;
    const dragEl = dragonRef?.current;
    if (!numEl || !dragEl) return;

    const numRect = numEl.getBoundingClientRect();
    const dragRect = dragEl.getBoundingClientRect();

    const startX = numRect.left + numRect.width / 2;
    const startY = numRect.top + numRect.height * 0.3;
    // Dragon SVG is scaleX(-1) so head/mouth is on the RIGHT side visually
    const endX = dragRect.left + dragRect.width * 0.68;
    const endY = dragRect.top + dragRect.height * 0.22;

    setCoords({ startX, startY, endX, endY, dx: endX - startX, dy: endY - startY });
  }, [dragonRef, numbersRef]);

  if (!coords) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Trail particles */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <motion.div
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            left: coords.startX,
            top: coords.startY,
            width: 16 - i * 2,
            height: 16 - i * 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? colors.accent : colors.glow,
            boxShadow: `0 0 12px ${colors.glow}`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: coords.dx * (0.3 + i * 0.08),
            y: coords.dy * (0.3 + i * 0.08),
            opacity: [0, 0.9, 0.6, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{ duration: 0.9, delay: 0.25 + i * 0.06, ease: 'easeOut' }}
        />
      ))}
      {/* Main answer bubble — hovers then arcs to dragon mouth */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.startX,
          top: coords.startY,
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}40, inset 0 -4px 12px ${colors.glow}30`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={{
          x: [0, 0, coords.dx * 0.35, coords.dx],
          y: [0, -15, coords.dy * 0.5 - 30, coords.dy],
          scale: [1, 1.15, 0.9, 0.15],
          opacity: [1, 1, 1, 0],
        }}
        transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.12, 0.5, 1] }}
      >
        {answer}
      </motion.div>
      {/* Impact flash at dragon position */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.endX,
          top: coords.endY,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}90, ${colors.accent}50, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 3], opacity: [0, 0.9, 0] }}
        transition={{ delay: 0.95, duration: 0.4 }}
      />
    </div>
  );
}

// === ELEMENTAL SKILL EFFECTS ===
// Each dragon type gets a unique full-screen VFX

function FireBlast({ colors }) {
  return (
    <>
      {/* Screen engulfed in rising flames */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = 5 + (i / 17) * 90;
        const h = 30 + Math.random() * 40;
        return (
          <motion.div
            key={`flame-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              bottom: 0,
              width: 40 + Math.random() * 30,
              height: `${h}%`,
              borderRadius: '50% 50% 0 0',
              background: `linear-gradient(to top, ${colors.primary}cc, ${colors.accent}88, transparent)`,
              filter: `blur(${2 + Math.random() * 4}px)`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.2, 0.8, 0], opacity: [0, 0.8, 0.6, 0] }}
            transition={{ duration: 1.8, delay: i * 0.06, ease: 'easeOut' }}
          />
        );
      })}
      {/* Central fireball */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '35%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}dd, ${colors.primary}88, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(8px)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 3, 2, 0], opacity: [0, 0.9, 0.5, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Ember particles */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`emb-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            borderRadius: '50%',
            background: i % 3 === 0 ? colors.accent : i % 3 === 1 ? '#ff6b35' : '#ff9800',
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 600,
            y: -100 - Math.random() * 500,
            opacity: [0, 1, 0.6, 0],
            scale: [0, 1.5, 0.5],
          }}
          transition={{ duration: 1.5, delay: 0.1 + Math.random() * 0.4 }}
        />
      ))}
    </>
  );
}

function IceBlast({ colors }) {
  return (
    <>
      {/* Frost wave expanding from center */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: '100vw', height: '100vh',
          borderRadius: '50%',
          border: `3px solid ${colors.accent}`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 40px ${colors.glow}60, inset 0 0 40px ${colors.glow}30`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5], opacity: [0.9, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* Ice crystals forming across screen */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 100 + Math.random() * 250;
        return (
          <motion.div
            key={`ice-${i}`}
            style={{
              position: 'absolute',
              left: '50%', top: '45%',
              width: 3,
              height: 20 + Math.random() * 30,
              background: `linear-gradient(to top, ${colors.accent}, #fff)`,
              borderRadius: 2,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '50% 100%',
              boxShadow: `0 0 8px ${colors.glow}80`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 0.8],
              opacity: [0, 0.9, 0],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
            }}
            transition={{ duration: 1.4, delay: 0.05 + i * 0.04, ease: 'easeOut' }}
          />
        );
      })}
      {/* Frost overlay */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${colors.glow}20, transparent 40%, transparent 60%, ${colors.glow}20)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Snowflake particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`snow-${i}`}
          style={{
            position: 'absolute',
            left: `${10 + Math.random() * 80}%`,
            top: '-5%',
            fontSize: 14 + Math.random() * 14,
            opacity: 0,
          }}
          animate={{ y: [0, 300 + Math.random() * 300], opacity: [0, 0.7, 0], rotate: [0, 180] }}
          transition={{ duration: 2, delay: Math.random() * 0.6 }}
        >
          ❄
        </motion.div>
      ))}
    </>
  );
}

function EarthBlast({ colors }) {
  return (
    <>
      {/* Screen shake effect via CSS filter */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, 4, -4, 3, -3, 2, -1, 0] }}
        transition={{ duration: 0.6 }}
      />
      {/* Ground crack lines */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.div
            key={`crack-${i}`}
            style={{
              position: 'absolute',
              left: '50%', top: '60%',
              width: 3,
              height: 120 + Math.random() * 80,
              background: `linear-gradient(to top, ${colors.accent}cc, ${colors.primary}44, transparent)`,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '50% 0',
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1, 0.7], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.0, delay: 0.1 + i * 0.05 }}
          />
        );
      })}
      {/* Rising boulders */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`rock-${i}`}
          style={{
            position: 'absolute',
            left: `${15 + Math.random() * 70}%`,
            bottom: '10%',
            width: 16 + Math.random() * 24,
            height: 14 + Math.random() * 20,
            borderRadius: '30%',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
            boxShadow: `0 0 6px ${colors.glow}40, inset -2px -2px 4px rgba(0,0,0,0.3)`,
          }}
          initial={{ y: 50, opacity: 0, scale: 0 }}
          animate={{
            y: [50, -100 - Math.random() * 200, -60 - Math.random() * 150],
            opacity: [0, 0.9, 0],
            scale: [0, 1.2, 0.4],
            rotate: [0, (Math.random() - 0.5) * 180],
          }}
          transition={{ duration: 1.5, delay: 0.15 + Math.random() * 0.3 }}
        />
      ))}
      {/* Dust cloud at base */}
      <motion.div
        style={{
          position: 'absolute', left: '10%', right: '10%', bottom: 0,
          height: '25%',
          background: `linear-gradient(to top, ${colors.accent}40, transparent)`,
          filter: 'blur(12px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.5 }}
      />
    </>
  );
}

function ShadowBlast({ colors }) {
  return (
    <>
      {/* Screen dims to near-black */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#0a001a' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.7, 0] }}
        transition={{ duration: 1.8 }}
      />
      {/* Purple lightning cracks */}
      {Array.from({ length: 6 }, (_, i) => {
        const startX = 20 + Math.random() * 60;
        return (
          <motion.div
            key={`bolt-${i}`}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: 0,
              width: 3,
              height: '60%',
              background: `linear-gradient(to bottom, ${colors.accent}, ${colors.primary}, transparent)`,
              boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.primary}80`,
              transform: `skewX(${(Math.random() - 0.5) * 30}deg)`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0], scaleY: [0, 1, 1, 0.5] }}
            transition={{ duration: 0.8, delay: 0.15 + i * 0.12 }}
          />
        );
      })}
      {/* Central void pulse */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '40%',
          width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}aa, ${colors.primary}60, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 60px ${colors.glow}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 3, 4, 0], opacity: [0, 1, 0.5, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Shadow wisps */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`wisp-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 60, height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, transparent, ${colors.primary}88, transparent)`,
            transform: `rotate(${(i / 10) * 360}deg)`,
            transformOrigin: 'left center',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: [0, 3, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: 1.2, delay: 0.2 + i * 0.06 }}
        />
      ))}
    </>
  );
}

function LightBlast({ colors }) {
  return (
    <>
      {/* Blinding white-gold flash */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 40%, #ffffffee, ${colors.accent}88, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 0] }}
        transition={{ duration: 1.2 }}
      />
      {/* Expanding light rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`ring-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 100, height: 100,
            borderRadius: '50%',
            border: `2px solid ${colors.accent}`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 20px ${colors.glow}80`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3 + i, 4 + i * 1.5], opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, delay: i * 0.2 }}
        />
      ))}
      {/* Light beam rays from center */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`ray-${i}`}
          style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: 3,
            height: 200,
            background: `linear-gradient(to bottom, ${colors.accent}cc, ${colors.glow}44, transparent)`,
            transformOrigin: '50% 0',
            transform: `rotate(${(i / 12) * 360}deg)`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.5], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.0, delay: 0.1 + i * 0.04 }}
        />
      ))}
      {/* Sparkle burst */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`spr-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 4, height: 4,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: `0 0 6px ${colors.accent}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
          }}
          transition={{ duration: 1.2, delay: 0.15 + Math.random() * 0.3 }}
        />
      ))}
    </>
  );
}

function StormBlast({ colors }) {
  return (
    <>
      {/* Dark storm clouds at top */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '30%',
          background: 'linear-gradient(to bottom, #0a0a1a, transparent)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.5, 0] }}
        transition={{ duration: 1.8 }}
      />
      {/* Lightning bolts */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={`zap-${i}`}
          style={{
            position: 'absolute',
            left: `${15 + i * 17}%`,
            top: 0,
            width: 4,
            height: '55%',
            background: `linear-gradient(to bottom, ${colors.accent}, #fff, ${colors.accent}80, transparent)`,
            boxShadow: `0 0 20px ${colors.accent}, 0 0 40px ${colors.glow}80`,
            clipPath: `polygon(${[
              '0% 0%', '40% 20%', '60% 20%', '30% 45%', '55% 45%', '20% 70%', '50% 70%', '10% 100%', '45% 65%', '15% 65%', '50% 40%', '25% 40%', '55% 15%', '20% 15%'
            ].join(', ')})`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 1, 0.9, 0], scaleY: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
        />
      ))}
      {/* Rain streaks */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`rain-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-10%',
            width: 1.5,
            height: 20 + Math.random() * 15,
            background: `linear-gradient(to bottom, ${colors.primary}80, transparent)`,
            borderRadius: 1,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, 500], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.6 + Math.random() * 0.3, delay: Math.random() * 0.8 }}
        />
      ))}
      {/* Wind gust particles */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`wind-${i}`}
          style={{
            position: 'absolute',
            left: '-5%',
            top: `${20 + Math.random() * 60}%`,
            width: 40 + Math.random() * 30,
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, transparent, ${colors.primary}44, transparent)`,
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: [0, 500], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.8, delay: 0.1 + i * 0.08 }}
        />
      ))}
      {/* Thunder flash */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#fff' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </>
  );
}

// Unified skill blast that delegates to element-specific effects
function SkillBlast({ skill, dragon, dispatch }) {
  const colors = dragon?.colors || {};
  const element = dragon?.id;

  React.useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ACTIVE_SKILL' }), 2200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const elementEffects = {
    ember: FireBlast,
    frost: IceBlast,
    stone: EarthBlast,
    shadow: ShadowBlast,
    glimmer: LightBlast,
    storm: StormBlast,
  };

  const ElementEffect = elementEffects[element] || FireBlast;

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Element-specific VFX */}
      <ElementEffect colors={colors} skill={skill} />

      {/* Giant skill icon (shared across all elements) */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '38%',
          fontSize: 100, transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 25px ${colors.glow}) drop-shadow(0 0 50px ${colors.primary}80)`,
        }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{
          scale: [0, 1.8, 1.3, 2, 0],
          rotate: [0, 10, -10, 5, 0],
          opacity: [0, 1, 1, 1, 0],
        }}
        transition={{ duration: 2.0, times: [0, 0.15, 0.4, 0.7, 1] }}
      >
        {skill.icon}
      </motion.div>

      {/* Skill name text */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '56%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28, fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.primary}`,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
        transition={{ duration: 2.0, times: [0, 0.2, 0.7, 1] }}
      >
        {skill.name}!
      </motion.div>
    </motion.div>
  );
}

export default function GameScreen() {
  const { dragon, progress, eating, mouthOpen, streak, wrongAnswer, currentQuestion, activeSkill, dispatch } = useGame();
  const version = useVersion();
  const isPixi = version === 'v2';
  const dragonRef = useRef(null);
  const numbersRef = useRef(null);

  // Responsive sizing — scale up dragon on desktop
  const isWide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const caveSize = isWide ? 680 : 540;
  const dragonSize = isWide ? 560 : 440;

  if (!dragon) return null;
  const stageIndex = Math.min(4, Math.floor(progress * 5));

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-2 md:py-4 relative"
      style={{
        background: 'linear-gradient(180deg, #050510 0%, #0a0a20 40%, #0d0d28 100%)',
      }}
    >
      {/* Ambient background particles */}
      <AmbientParticles color={dragon.colors.glow + '40'} count={15} />

      {/* Progress bar at top */}
      <div className="w-full max-w-3xl relative z-10">
        <ProgressBar />
      </div>

      {/* Main game area — side by side on wide screens, vertically centered */}
      <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 lg:gap-10 w-full max-w-6xl flex-1 relative z-10">

        {/* Dragon display — scales up on desktop */}
        <div className="flex flex-col items-center" style={{ width: caveSize }}>
          <div className="flex-shrink-0" ref={dragonRef}>
            {isPixi ? (
              <Suspense fallback={
                <DragonCave dragon={dragon} progress={progress} caveSize={caveSize}>
                  <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
                </DragonCave>
              }>
                <DragonCave dragon={dragon} progress={progress} caveSize={caveSize}>
                  <DragonPixi
                    dragon={dragon}
                    progress={progress}
                    size={dragonSize}
                    chomping={mouthOpen}
                    streak={streak}
                    wrongAnswer={wrongAnswer}
                    DragonSVGComponent={DragonSVG}
                  />
                </DragonCave>
              </Suspense>
            ) : (
              <DragonCave dragon={dragon} progress={progress} caveSize={caveSize}>
                <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
              </DragonCave>
            )}
          </div>

          {/* Stage name + description — overlaid at bottom of cave */}
          <motion.div
            className="text-center -mt-6 relative z-10"
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xl lg:text-2xl font-black tracking-wide" style={{
              color: dragon.colors.accent,
              textShadow: `0 0 12px ${dragon.colors.glow}60, 0 2px 4px rgba(0,0,0,0.5)`,
            }}>
              {dragon.stages[stageIndex]?.name}
            </p>
            <p className="text-sm lg:text-base text-gray-400 italic" style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              {dragon.stages[stageIndex]?.description}
            </p>
          </motion.div>

          {/* Skill bar below dragon */}
          <div className="mt-3">
            <SkillBar />
          </div>
        </div>

        {/* Question + input area — vertically centered alongside dragon */}
        <div ref={numbersRef} className="flex flex-col items-center justify-center" style={{ width: 420 }}>
          <FloatingNumbers />
          <AnswerInput />
        </div>
      </div>

      {/* Flying answer overlay — uses fixed positioning to cross layout boundaries */}
      <AnimatePresence>
        {eating && currentQuestion && (
          <FlyingAnswer
            key={`fly-${currentQuestion.display}`}
            dragon={dragon}
            answer={currentQuestion.answer}
            dragonRef={dragonRef}
            numbersRef={numbersRef}
          />
        )}
      </AnimatePresence>

      {/* Dramatic skill activation overlay */}
      <AnimatePresence>
        {activeSkill && (
          <SkillBlast
            key={`skill-${activeSkill.name}`}
            skill={activeSkill}
            dragon={dragon}
            dispatch={dispatch}
          />
        )}
      </AnimatePresence>

      {/* Developer tools — growth stage scrubber */}
      <DevPanel />
    </div>
  );
}
