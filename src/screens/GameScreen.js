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

// Full-bleed side-view cave — back wall on left, entrance on right
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
        {/* Night sky */}
        <linearGradient id="sky-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#050a18" />
          <stop offset="50%" stopColor="#081020" />
          <stop offset="100%" stopColor="#040810" />
        </linearGradient>
        {/* Back wall — concave rock face, grey tones */}
        <radialGradient id="back-wall-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1e" />
          <stop offset="60%" stopColor="#141416" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </radialGradient>
        {/* Dragon glow on back wall */}
        <radialGradient id="wall-glow" cx="50%" cy="55%" r="45%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.12" />
          <stop offset="60%" stopColor={primary} stopOpacity="0.04" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Dragon glow on floor */}
        <radialGradient id="floor-glow" cx="35%" cy="30%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {/* Dragon glow on ceiling */}
        <radialGradient id="ceil-glow" cx="35%" cy="80%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* === NIGHT SKY — full background, visible where cave doesn't cover === */}
      <rect width="1600" height="900" fill="url(#sky-grad)" />
      {/* Moon glow */}
      <ellipse cx="1400" cy="200" rx="150" ry="150" fill="#0c1628" opacity="0.5" />
      {/* Stars */}
      {[
        [1180,80,1.5], [1250,150,1], [1350,100,2], [1420,60,1.2], [1500,130,1.8],
        [1300,200,1], [1450,250,1.5], [1550,180,1], [1200,300,1.2], [1400,350,1],
        [1500,300,1.5], [1350,400,1], [1480,420,1.2], [1250,450,1], [1550,380,1.5],
        [1200,500,1], [1400,520,1.2], [1500,480,1], [1300,550,1.5], [1450,580,1],
      ].map(([x,y,r], i) => (
        <circle key={`star-${i}`} cx={x} cy={y} r={r} fill="#aabbdd" opacity={0.2 + Math.random() * 0.3} />
      ))}
      {/* Distant treeline silhouette */}
      <path
        d="M 1100 700 Q 1150 665 1200 675 Q 1250 650 1300 660 Q 1350 640 1400 650 Q 1450 630 1500 645 Q 1550 625 1600 640 L 1600 720 L 1100 720 Z"
        fill="#030610" opacity="0.8"
      />

      {/* === CAVE SHELL — one continuous shape: ceiling curves into back wall curves into floor === */}
      {/* The cave is a U-shape / bowl viewed from the side */}

      {/* CEILING mass — curves down from right, thickens at back wall */}
      <path
        d="M 1600 0 L 0 0 L 0 350 Q 80 220 200 200 Q 400 220 600 210 Q 800 195 1000 175 Q 1150 160 1250 150 L 1600 0 Z"
        fill="#0c0c0e"
      />
      {/* Ceiling underside — the visible rock surface */}
      <path
        d="M 200 200 Q 400 220 600 210 Q 800 195 1000 175 Q 1150 160 1250 150"
        fill="none" stroke="#222228" strokeWidth="4"
      />
      {/* Ceiling rock strata lines */}
      <path d="M 220 190 Q 500 205 800 185 Q 1050 168 1240 145" fill="none" stroke="#1a1a1e" strokeWidth="2" opacity="0.5" />
      <path d="M 250 178 Q 550 190 850 172 Q 1080 158 1230 138" fill="none" stroke="#161618" strokeWidth="1.5" opacity="0.4" />

      {/* BACK WALL — concave rounded surface on left */}
      <path
        d="M 0 0 L 0 900 L 200 900 Q 160 780 140 650 Q 120 500 125 400 Q 130 280 150 200 Q 170 130 200 0 Z"
        fill="url(#back-wall-grad)"
      />
      {/* Back wall rock strata — horizontal bands in greys */}
      {[
        { y: 180, w: 140, o: 0.3, c: '#1e1e22' },
        { y: 250, w: 130, o: 0.25, c: '#1c1c20' },
        { y: 320, w: 135, o: 0.3, c: '#202024' },
        { y: 400, w: 128, o: 0.25, c: '#1a1a1e' },
        { y: 470, w: 132, o: 0.28, c: '#1e1e22' },
        { y: 540, w: 125, o: 0.25, c: '#1c1c20' },
        { y: 610, w: 138, o: 0.3, c: '#202026' },
        { y: 680, w: 145, o: 0.22, c: '#1a1a1e' },
      ].map((s, i) => (
        <path key={`strata-${i}`}
          d={`M 5 ${s.y} Q ${s.w-10} ${s.y-3} ${s.w} ${s.y+2} Q ${s.w+5} ${s.y+12} ${s.w-8} ${s.y+15} Q 40 ${s.y+18} 5 ${s.y+14} Z`}
          fill={s.c} opacity={s.o}
        />
      ))}
      {/* Crystal/mineral veins on back wall */}
      <path d="M 60 280 Q 90 290 80 310 Q 65 315 55 300 Z" fill="#2a2a40" opacity="0.3" />
      <path d="M 30 420 Q 55 415 65 435 Q 50 445 25 438 Z" fill="#2a3040" opacity="0.25" />
      <path d="M 80 550 Q 110 545 105 570 Q 85 578 75 565 Z" fill="#282840" opacity="0.3" />
      {/* Crystal glints — small bright spots that catch dragon glow */}
      <circle cx="70" cy="295" r="2" fill={accent} opacity="0.15" />
      <circle cx="45" cy="430" r="1.5" fill={accent} opacity="0.12" />
      <circle cx="95" cy="560" r="2" fill={accent} opacity="0.1" />
      <circle cx="35" cy="350" r="1" fill="#6666aa" opacity="0.2" />
      <circle cx="100" cy="480" r="1.5" fill="#6666aa" opacity="0.15" />

      {/* Dragon glow reflecting on back wall */}
      <path
        d="M 0 200 L 0 700 Q 80 680 140 600 Q 130 450 135 350 Q 140 250 120 200 Z"
        fill="url(#wall-glow)"
      />

      {/* Back wall edge — where it curves into the cave interior */}
      <path
        d="M 200 0 Q 170 130 150 200 Q 130 280 125 400 Q 120 500 140 650 Q 160 780 200 900"
        fill="none" stroke="#28282e" strokeWidth="3" opacity="0.5"
      />

      {/* FLOOR mass — curves up from right, thickens into back wall */}
      <path
        d="M 1600 900 L 0 900 L 0 650 Q 80 780 200 720 Q 400 700 600 695 Q 800 685 1000 675 Q 1150 668 1250 665 L 1600 900 Z"
        fill="#0e0e10"
      />
      {/* Floor top surface */}
      <path
        d="M 200 720 Q 400 700 600 695 Q 800 685 1000 675 Q 1150 668 1250 665"
        fill="none" stroke="#222228" strokeWidth="4"
      />
      {/* Floor rock strata */}
      <path d="M 220 728 Q 500 710 800 695 Q 1050 680 1240 672" fill="none" stroke="#1a1a1e" strokeWidth="2" opacity="0.4" />

      {/* Stalactites hanging from ceiling */}
      <path d="M 350 218 L 365 295 L 340 220" fill="#101014" opacity="0.8" />
      <path d="M 520 212 L 534 280 L 512 214" fill="#101014" opacity="0.7" />
      <path d="M 700 198 L 712 260 L 692 200" fill="#101014" opacity="0.6" />
      <path d="M 880 185 L 890 240 L 872 187" fill="#101014" opacity="0.5" />
      <path d="M 1050 172 L 1058 218 L 1042 174" fill="#101014" opacity="0.4" />
      {/* Small stalactites */}
      <path d="M 430 216 L 436 245 L 425 217" fill="#121216" opacity="0.55" />
      <path d="M 610 208 L 616 235 L 605 209" fill="#121216" opacity="0.45" />
      <path d="M 790 193 L 795 215 L 785 194" fill="#121216" opacity="0.4" />
      <path d="M 970 178 L 975 198 L 965 179" fill="#121216" opacity="0.3" />

      {/* Stalagmites rising from floor */}
      <path d="M 400 698 L 412 655 L 420 699" fill="#121216" opacity="0.5" />
      <path d="M 650 690 L 660 650 L 668 691" fill="#121216" opacity="0.4" />
      <path d="M 900 678 L 908 645 L 915 679" fill="#121216" opacity="0.35" />
      <path d="M 1100 670 L 1108 640 L 1115 671" fill="#121216" opacity="0.3" />

      {/* Floor rocks/rubble */}
      <ellipse cx="330" cy="708" rx="18" ry="7" fill="#141418" />
      <ellipse cx="550" cy="698" rx="14" ry="6" fill="#161618" />
      <ellipse cx="780" cy="690" rx="20" ry="8" fill="#141418" />
      <ellipse cx="1000" cy="680" rx="16" ry="6" fill="#151518" />

      {/* === LIGHTING === */}
      {/* Dragon glow pool on floor */}
      <ellipse cx="500" cy="695" rx="300" ry="40" fill="url(#floor-glow)" />
      {/* Dragon glow on ceiling */}
      <ellipse cx="480" cy="210" rx="350" ry="60" fill="url(#ceil-glow)" />

      {/* === NEST ROCKS — egg phase, grey stone === */}
      {isEgg && (
        <g>
          <ellipse cx="430" cy="688" rx="30" ry="14" fill="#18181c" stroke="#222228" strokeWidth="1.5" />
          <ellipse cx="560" cy="686" rx="26" ry="12" fill="#18181c" stroke="#222228" strokeWidth="1.5" />
          <ellipse cx="460" cy="694" rx="20" ry="10" fill="#1c1c20" stroke="#262628" strokeWidth="1" />
          <ellipse cx="530" cy="693" rx="18" ry="9" fill="#1c1c20" stroke="#262628" strokeWidth="1" />
          <ellipse cx="495" cy="698" rx="26" ry="9" fill="#1e1e22" stroke="#282830" strokeWidth="1" />
          <ellipse cx="495" cy="682" rx="42" ry="12" fill={accent} opacity="0.06" />
          <ellipse cx="495" cy="678" rx="28" ry="8" fill={glow} opacity="0.05" />
        </g>
      )}
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
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center gap-4 lg:gap-0 w-full flex-1 relative z-10 px-4" style={{ paddingBottom: isWide ? 120 : 40 }}>

        {/* Dragon area — sits on cave floor, left ~45% */}
        <div className="flex flex-col items-center lg:items-center lg:flex-1" style={{ maxWidth: 600 }}>
          {/* Dragon on the floor */}
          <div className="flex-shrink-0 flex items-end justify-center" ref={dragonRef}>

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
