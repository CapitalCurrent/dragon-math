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

// Full-bleed side-view cave — fills entire screen as cross-section
function CaveBackground({ dragon, progress }) {
  const { primary, accent, glow } = dragon.colors;
  const isEgg = progress <= 0.15;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        {/* Deep cave darkness on left */}
        <linearGradient id="cave-depth" x1="0%" y1="0%" x2="60%" y2="0%">
          <stop offset="0%" stopColor="#020208" />
          <stop offset="40%" stopColor="#060612" />
          <stop offset="70%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#0d0d28" />
        </linearGradient>
        {/* Floor gradient */}
        <linearGradient id="floor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0a0a18" />
          <stop offset="60%" stopColor="#111125" />
          <stop offset="100%" stopColor="#161630" />
        </linearGradient>
        {/* Dragon glow on floor */}
        <radialGradient id="dragon-floor-glow" cx="30%" cy="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.15" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {/* Dragon ambient light on walls */}
        <radialGradient id="dragon-ambient" cx="30%" cy="55%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.06" />
          <stop offset="50%" stopColor={glow} stopOpacity="0.02" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Light from cave mouth (right side) */}
        <linearGradient id="mouth-light" x1="100%" y1="50%" x2="40%" y2="50%">
          <stop offset="0%" stopColor="#1a1a3a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Cave interior fill */}
      <rect width="1600" height="900" fill="url(#cave-depth)" />

      {/* Ceiling — rocky curve from left wall down to cave mouth on right */}
      <path
        d="M 0 0 L 0 80 Q 100 120 250 140 Q 500 170 750 130 Q 1000 90 1200 60 Q 1400 40 1600 80 L 1600 0 Z"
        fill="#08080f"
      />
      {/* Ceiling inner edge — stone lip */}
      <path
        d="M 0 80 Q 100 120 250 140 Q 500 170 750 130 Q 1000 90 1200 60 Q 1400 40 1600 80"
        fill="none" stroke="#1a1a30" strokeWidth="4"
      />
      {/* Ceiling edge glow */}
      <path
        d="M 0 82 Q 100 122 250 142 Q 500 172 750 132 Q 1000 92 1200 62 Q 1400 42 1600 82"
        fill="none" stroke={glow} strokeWidth="1" strokeOpacity="0.06"
      />

      {/* Stalactites hanging from ceiling */}
      <path d="M 120 130 L 130 190 L 115 132" fill="#0c0c18" opacity="0.8" />
      <path d="M 280 145 L 288 220 L 274 148" fill="#0c0c18" opacity="0.7" />
      <path d="M 450 165 L 456 230 L 443 167" fill="#0c0c18" opacity="0.6" />
      <path d="M 600 150 L 608 200 L 594 152" fill="#0c0c18" opacity="0.5" />
      <path d="M 780 125 L 786 175 L 773 127" fill="#0c0c18" opacity="0.5" />
      <path d="M 950 100 L 958 145 L 944 102" fill="#0c0c18" opacity="0.4" />
      <path d="M 1100 75 L 1106 115 L 1094 77" fill="#0c0c18" opacity="0.35" />
      <path d="M 1300 55 L 1305 85 L 1295 57" fill="#0c0c18" opacity="0.3" />
      {/* Small stalactites */}
      <path d="M 200 138 L 205 165 L 196 139" fill="#0e0e1a" opacity="0.5" />
      <path d="M 370 158 L 374 185 L 366 160" fill="#0e0e1a" opacity="0.4" />
      <path d="M 680 138 L 684 162 L 676 140" fill="#0e0e1a" opacity="0.4" />
      <path d="M 860 112 L 864 135 L 856 114" fill="#0e0e1a" opacity="0.35" />
      <path d="M 1050 82 L 1053 105 L 1046 84" fill="#0e0e1a" opacity="0.3" />

      {/* Stone texture blocks on ceiling */}
      {[
        { d: 'M 80 95 L 100 90 L 105 108 L 82 110', o: 0.12 },
        { d: 'M 320 148 L 342 142 L 345 160 L 322 164', o: 0.1 },
        { d: 'M 550 160 L 570 155 L 572 170 L 552 173', o: 0.08 },
        { d: 'M 850 110 L 870 104 L 873 120 L 852 124', o: 0.07 },
        { d: 'M 1150 65 L 1170 60 L 1172 75 L 1152 78', o: 0.06 },
      ].map((s, i) => (
        <path key={`ceil-stone-${i}`} d={s.d} fill="#14142a" opacity={s.o} stroke="#1e1e3a" strokeWidth="0.5" />
      ))}

      {/* Floor — rocky ground with gentle undulation */}
      <path
        d="M 0 900 L 0 740 Q 150 730 300 735 Q 500 740 700 730 Q 900 720 1100 715 Q 1300 710 1600 720 L 1600 900 Z"
        fill="url(#floor-grad)"
      />
      {/* Floor surface line */}
      <path
        d="M 0 740 Q 150 730 300 735 Q 500 740 700 730 Q 900 720 1100 715 Q 1300 710 1600 720"
        fill="none" stroke="#1e1e38" strokeWidth="3"
      />
      {/* Floor edge glow */}
      <path
        d="M 0 738 Q 150 728 300 733 Q 500 738 700 728 Q 900 718 1100 713 Q 1300 708 1600 718"
        fill="none" stroke={glow} strokeWidth="1" strokeOpacity="0.05"
      />

      {/* Floor rocks and pebbles */}
      <ellipse cx="100" cy="750" rx="18" ry="8" fill="#12122a" />
      <ellipse cx="250" cy="745" rx="14" ry="6" fill="#141430" />
      <ellipse cx="420" cy="742" rx="20" ry="9" fill="#111128" />
      <ellipse cx="600" cy="738" rx="12" ry="5" fill="#131330" />
      <ellipse cx="800" cy="730" rx="16" ry="7" fill="#121228" />
      <ellipse cx="1000" cy="724" rx="22" ry="8" fill="#111126" />
      <ellipse cx="1200" cy="720" rx="15" ry="6" fill="#131330" />
      <ellipse cx="1400" cy="722" rx="18" ry="7" fill="#121228" />

      {/* Stalagmites rising from floor */}
      <path d="M 160 735 L 170 690 L 178 736" fill="#10102a" opacity="0.5" />
      <path d="M 500 740 L 512 700 L 520 741" fill="#10102a" opacity="0.4" />
      <path d="M 850 725 L 860 688 L 868 726" fill="#10102a" opacity="0.35" />
      <path d="M 1350 718 L 1358 685 L 1365 719" fill="#10102a" opacity="0.3" />

      {/* Back wall depth (left side — cave goes deeper) */}
      <path
        d="M 0 80 L 0 740"
        stroke="#0e0e1c" strokeWidth="40" opacity="0.6"
      />
      <path
        d="M 0 80 Q 30 400 0 740"
        fill="none" stroke="#18182e" strokeWidth="2" opacity="0.4"
      />

      {/* Ambient dragon light on cave interior */}
      <rect x="0" y="80" width="1200" height="660" fill="url(#dragon-ambient)" />

      {/* Dragon glow on floor */}
      <ellipse cx="480" cy="735" rx="280" ry="40" fill="url(#dragon-floor-glow)" />

      {/* Light spill from cave mouth (right side) */}
      <rect x="0" y="0" width="1600" height="900" fill="url(#mouth-light)" />

      {/* Nest rocks — egg phase only, positioned in dragon area */}
      {isEgg && (
        <g>
          <ellipse cx="400" cy="720" rx="35" ry="18" fill="#1a1a2e" stroke="#282845" strokeWidth="1.5" />
          <ellipse cx="540" cy="718" rx="30" ry="16" fill="#1a1a2e" stroke="#282845" strokeWidth="1.5" />
          <ellipse cx="430" cy="728" rx="25" ry="14" fill="#1e1e34" stroke="#2a2a48" strokeWidth="1" />
          <ellipse cx="510" cy="727" rx="22" ry="13" fill="#1e1e34" stroke="#2a2a48" strokeWidth="1" />
          <ellipse cx="460" cy="732" rx="30" ry="12" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
          <ellipse cx="470" cy="715" rx="50" ry="16" fill={accent} opacity="0.05" />
          <ellipse cx="470" cy="712" rx="35" ry="12" fill={glow} opacity="0.04" />
        </g>
      )}

      {/* Subtle stone texture on left wall */}
      {[
        { d: 'M 5 200 L 20 195 L 22 220 L 7 222', o: 0.1 },
        { d: 'M 8 350 L 25 345 L 27 370 L 10 372', o: 0.08 },
        { d: 'M 4 500 L 18 496 L 20 518 L 6 520', o: 0.08 },
        { d: 'M 6 620 L 22 615 L 24 638 L 8 640', o: 0.06 },
      ].map((s, i) => (
        <path key={`wall-stone-${i}`} d={s.d} fill="#14142a" opacity={s.o} stroke="#1e1e3a" strokeWidth="0.5" />
      ))}
    </svg>
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

  // Responsive sizing
  const isWide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const dragonSize = isWide ? 520 : 380;

  if (!dragon) return null;
  const stageIndex = Math.min(4, Math.floor(progress * 5));

  return (
    <div className="h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#050510' }}
    >
      {/* Full-bleed cave background */}
      <CaveBackground dragon={dragon} progress={progress} />

      {/* Ambient background particles */}
      <AmbientParticles color={dragon.colors.glow + '40'} count={20} />

      {/* Progress bar at top — overlaid on cave ceiling */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-3 relative z-10">
        <ProgressBar />
      </div>

      {/* Main game area — dragon on left in cave, numbers at cave mouth on right */}
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center gap-4 lg:gap-0 w-full flex-1 relative z-10 px-4">

        {/* Dragon area — sits on cave floor, left ~45% */}
        <div className="flex flex-col items-center lg:items-center lg:flex-1" style={{ maxWidth: 600 }}>
          {/* Dragon on the floor */}
          <div className="flex-shrink-0 flex items-end justify-center" ref={dragonRef}
            style={{ marginBottom: isWide ? -20 : 0 }}
          >
            {isPixi ? (
              <Suspense fallback={
                <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
              }>
                <DragonPixi
                  dragon={dragon}
                  progress={progress}
                  size={dragonSize}
                  chomping={mouthOpen}
                  streak={streak}
                  wrongAnswer={wrongAnswer}
                  DragonSVGComponent={DragonSVG}
                />
              </Suspense>
            ) : (
              <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
            )}
          </div>

          {/* Stage name + skill bar — below dragon, above cave floor */}
          <motion.div
            className="text-center relative z-10"
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

          <div className="mt-2 mb-4">
            <SkillBar />
          </div>
        </div>

        {/* Question + input — at cave mouth, right side */}
        <div ref={numbersRef} className="flex flex-col items-center justify-center lg:flex-1 lg:pb-20" style={{ maxWidth: 480 }}>
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
