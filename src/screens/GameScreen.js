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
        {/* Cave interior darkness */}
        <radialGradient id="cave-dark" cx="25%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#06060e" />
          <stop offset="60%" stopColor="#08081a" />
          <stop offset="100%" stopColor="#0c0c24" />
        </radialGradient>
        {/* Back wall rock face gradient */}
        <linearGradient id="back-wall" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0e0e20" />
          <stop offset="50%" stopColor="#12122a" />
          <stop offset="100%" stopColor="#08081a" />
        </linearGradient>
        {/* Back wall depth shading */}
        <radialGradient id="back-wall-depth" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#16163a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#060610" stopOpacity="0" />
        </radialGradient>
        {/* Floor gradient — darker at back, lighter at mouth */}
        <linearGradient id="floor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08081a" />
          <stop offset="50%" stopColor="#0e0e25" />
          <stop offset="100%" stopColor="#161638" />
        </linearGradient>
        {/* Dragon glow on floor */}
        <radialGradient id="dragon-floor-glow" cx="35%" cy="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {/* Dragon ambient light on walls */}
        <radialGradient id="dragon-ambient" cx="35%" cy="55%" r="40%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.08" />
          <stop offset="60%" stopColor={glow} stopOpacity="0.03" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        {/* Cave mouth light — bright opening on right */}
        <linearGradient id="mouth-light" x1="100%" y1="50%" x2="60%" y2="50%">
          <stop offset="0%" stopColor="#1a2040" stopOpacity="0.4" />
          <stop offset="40%" stopColor="#10143a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        {/* Sky gradient visible through cave mouth */}
        <linearGradient id="sky-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0a1628" />
          <stop offset="40%" stopColor="#0d1a30" />
          <stop offset="100%" stopColor="#081420" />
        </linearGradient>
        {/* Ceiling gradient */}
        <linearGradient id="ceil-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#060610" />
        </linearGradient>
      </defs>

      {/* === SKY / OUTSIDE visible through cave mouth (right edge) === */}
      <rect width="1600" height="900" fill="url(#sky-grad)" />

      {/* === CAVE INTERIOR — drawn on top of sky === */}
      {/* Cave interior fill — covers most of the screen except mouth opening */}
      <path
        d="M 0 0 L 1300 0 Q 1350 200 1380 450 Q 1350 700 1300 900 L 0 900 Z"
        fill="url(#cave-dark)"
      />

      {/* === BACK WALL — visible rock face on the left === */}
      {/* Main back wall curve */}
      <path
        d="M 180 120 Q 160 250 150 400 Q 155 550 170 700"
        fill="none" stroke="#1a1a35" strokeWidth="60" strokeLinecap="round" opacity="0.4"
      />
      <path
        d="M 180 120 Q 160 250 150 400 Q 155 550 170 700"
        fill="none" stroke="#14142e" strokeWidth="40" strokeLinecap="round" opacity="0.6"
      />
      {/* Back wall rock face */}
      <path
        d="M 0 0 L 200 0 Q 220 100 210 180 Q 195 280 185 400 Q 190 520 200 620 Q 210 720 200 900 L 0 900 Z"
        fill="url(#back-wall)"
      />
      {/* Back wall depth highlight */}
      <ellipse cx="160" cy="400" rx="80" ry="250" fill="url(#back-wall-depth)" />

      {/* Back wall stone texture — visible rock blocks */}
      {[
        { d: 'M 40 150 L 120 140 L 125 180 L 35 185', o: 0.2 },
        { d: 'M 30 220 L 90 215 L 95 250 L 25 252', o: 0.15 },
        { d: 'M 50 300 L 140 290 L 145 330 L 45 335', o: 0.18 },
        { d: 'M 25 380 L 110 372 L 115 410 L 20 415', o: 0.15 },
        { d: 'M 40 460 L 130 452 L 135 490 L 35 495', o: 0.18 },
        { d: 'M 30 540 L 100 535 L 105 570 L 25 573', o: 0.14 },
        { d: 'M 45 610 L 125 602 L 130 640 L 40 645', o: 0.16 },
        { d: 'M 35 690 L 115 685 L 118 715 L 32 718', o: 0.12 },
      ].map((s, i) => (
        <path key={`bw-${i}`} d={s.d} fill="#16162e" opacity={s.o} stroke="#1e1e3e" strokeWidth="1" />
      ))}
      {/* Back wall edge — where wall meets cave interior */}
      <path
        d="M 200 0 Q 220 100 210 180 Q 195 280 185 400 Q 190 520 200 620 Q 210 720 200 900"
        fill="none" stroke="#1e1e3a" strokeWidth="3" opacity="0.5"
      />
      {/* Back wall dragon-glow reflection */}
      <path
        d="M 200 0 Q 220 100 210 180 Q 195 280 185 400 Q 190 520 200 620 Q 210 720 200 900"
        fill="none" stroke={glow} strokeWidth="2" opacity="0.06"
      />

      {/* === CEILING — curves from back wall to entrance === */}
      <path
        d="M 0 0 L 200 0 Q 220 100 210 160 Q 350 180 500 170 Q 700 150 900 120 Q 1100 90 1300 70 Q 1350 100 1380 200 L 1600 0 Z"
        fill="url(#ceil-grad)"
      />
      {/* Ceiling inner edge */}
      <path
        d="M 210 160 Q 350 180 500 170 Q 700 150 900 120 Q 1100 90 1300 70"
        fill="none" stroke="#1e1e38" strokeWidth="4"
      />
      <path
        d="M 210 162 Q 350 182 500 172 Q 700 152 900 122 Q 1100 92 1300 72"
        fill="none" stroke={glow} strokeWidth="1" strokeOpacity="0.06"
      />

      {/* Stalactites */}
      <path d="M 300 178 L 310 250 L 295 180" fill="#0c0c1e" opacity="0.7" />
      <path d="M 450 172 L 458 240 L 443 174" fill="#0c0c1e" opacity="0.6" />
      <path d="M 620 155 L 628 215 L 614 157" fill="#0c0c1e" opacity="0.55" />
      <path d="M 780 135 L 786 190 L 773 137" fill="#0c0c1e" opacity="0.5" />
      <path d="M 950 115 L 956 165 L 944 117" fill="#0c0c1e" opacity="0.4" />
      <path d="M 1120 92 L 1126 135 L 1114 94" fill="#0c0c1e" opacity="0.35" />
      {/* Small stalactites */}
      <path d="M 380 176 L 384 205 L 375 178" fill="#0e0e22" opacity="0.45" />
      <path d="M 540 168 L 545 195 L 536 170" fill="#0e0e22" opacity="0.4" />
      <path d="M 700 148 L 704 172 L 696 150" fill="#0e0e22" opacity="0.35" />
      <path d="M 870 125 L 874 148 L 866 127" fill="#0e0e22" opacity="0.3" />
      <path d="M 1050 100 L 1054 120 L 1046 102" fill="#0e0e22" opacity="0.25" />

      {/* === FLOOR === */}
      <path
        d="M 0 900 L 0 720 Q 200 715 400 720 Q 600 725 800 715 Q 1000 705 1200 700 Q 1300 700 1380 720 L 1600 900 Z"
        fill="url(#floor-grad)"
      />
      {/* Floor edge */}
      <path
        d="M 200 718 Q 400 722 600 718 Q 800 710 1000 705 Q 1200 700 1380 720"
        fill="none" stroke="#1e1e3a" strokeWidth="3"
      />
      <path
        d="M 200 716 Q 400 720 600 716 Q 800 708 1000 703 Q 1200 698 1380 718"
        fill="none" stroke={glow} strokeWidth="1" strokeOpacity="0.05"
      />

      {/* Floor rocks */}
      <ellipse cx="300" cy="728" rx="18" ry="8" fill="#12122a" />
      <ellipse cx="500" cy="725" rx="14" ry="6" fill="#141430" />
      <ellipse cx="700" cy="718" rx="20" ry="8" fill="#111128" />
      <ellipse cx="900" cy="712" rx="16" ry="7" fill="#121228" />
      <ellipse cx="1100" cy="706" rx="22" ry="8" fill="#111126" />
      <ellipse cx="1250" cy="708" rx="12" ry="5" fill="#131330" />

      {/* Stalagmites */}
      <path d="M 350 722 L 360 680 L 368 723" fill="#10102a" opacity="0.45" />
      <path d="M 650 716 L 662 675 L 670 717" fill="#10102a" opacity="0.35" />
      <path d="M 1050 703 L 1058 665 L 1065 704" fill="#10102a" opacity="0.3" />

      {/* === CAVE MOUTH — right side entrance frame === */}
      {/* Top entrance arch curving down from ceiling */}
      <path
        d="M 1300 70 Q 1340 85 1370 150 Q 1400 250 1410 400"
        fill="none" stroke="#1a1a35" strokeWidth="50" strokeLinecap="round" opacity="0.5"
      />
      <path
        d="M 1300 70 Q 1340 85 1370 150 Q 1400 250 1410 400"
        fill="none" stroke="#22223e" strokeWidth="6" opacity="0.6"
      />
      {/* Bottom entrance frame curving up from floor */}
      <path
        d="M 1380 720 Q 1400 650 1410 550 Q 1412 480 1410 400"
        fill="none" stroke="#1a1a35" strokeWidth="50" strokeLinecap="round" opacity="0.5"
      />
      <path
        d="M 1380 720 Q 1400 650 1410 550 Q 1412 480 1410 400"
        fill="none" stroke="#22223e" strokeWidth="6" opacity="0.6"
      />
      {/* Entrance glow edge */}
      <path
        d="M 1300 70 Q 1340 85 1370 150 Q 1400 250 1410 400 Q 1412 480 1410 550 Q 1400 650 1380 720"
        fill="none" stroke={glow} strokeWidth="2" opacity="0.08"
      />

      {/* Light spill from entrance */}
      <path
        d="M 1410 150 Q 1500 200 1600 100 L 1600 700 Q 1500 600 1410 650 Z"
        fill="#0d1525" opacity="0.4"
      />
      {/* Light rays from entrance */}
      <path d="M 1410 300 L 1600 200 L 1600 280 L 1410 340 Z" fill="#121a30" opacity="0.15" />
      <path d="M 1410 400 L 1600 350 L 1600 420 L 1410 440 Z" fill="#121a30" opacity="0.12" />
      <path d="M 1410 500 L 1600 480 L 1600 540 L 1410 530 Z" fill="#121a30" opacity="0.1" />

      {/* Distant landscape hint through entrance */}
      <path
        d="M 1430 680 Q 1480 650 1520 660 Q 1560 640 1600 650 L 1600 720 L 1430 720 Z"
        fill="#0a1220" opacity="0.5"
      />
      {/* Stars/dots visible through entrance */}
      <circle cx="1480" cy="250" r="1.5" fill="#8888aa" opacity="0.4" />
      <circle cx="1530" cy="180" r="1" fill="#8888aa" opacity="0.3" />
      <circle cx="1560" cy="320" r="1.2" fill="#8888aa" opacity="0.35" />
      <circle cx="1450" cy="380" r="1" fill="#8888aa" opacity="0.25" />
      <circle cx="1550" cy="450" r="1.5" fill="#8888aa" opacity="0.3" />

      {/* === LIGHTING === */}
      {/* Dragon ambient on walls/ceiling */}
      <rect x="150" y="120" width="1200" height="600" fill="url(#dragon-ambient)" />
      {/* Dragon glow on floor */}
      <ellipse cx="520" cy="718" rx="300" ry="45" fill="url(#dragon-floor-glow)" />
      {/* Light from cave mouth */}
      <rect x="0" y="0" width="1600" height="900" fill="url(#mouth-light)" />

      {/* === NEST ROCKS — egg phase === */}
      {isEgg && (
        <g>
          <ellipse cx="440" cy="706" rx="35" ry="18" fill="#1a1a2e" stroke="#282845" strokeWidth="1.5" />
          <ellipse cx="580" cy="704" rx="30" ry="16" fill="#1a1a2e" stroke="#282845" strokeWidth="1.5" />
          <ellipse cx="470" cy="712" rx="25" ry="14" fill="#1e1e34" stroke="#2a2a48" strokeWidth="1" />
          <ellipse cx="550" cy="711" rx="22" ry="13" fill="#1e1e34" stroke="#2a2a48" strokeWidth="1" />
          <ellipse cx="510" cy="716" rx="30" ry="12" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
          <ellipse cx="510" cy="700" rx="50" ry="16" fill={accent} opacity="0.05" />
          <ellipse cx="510" cy="696" rx="35" ry="12" fill={glow} opacity="0.04" />
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
