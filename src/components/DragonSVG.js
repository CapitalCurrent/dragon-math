import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dragon art with egg hatching → baby → full dragon growth
// progress: 0 = egg, ~0.05 = hatching, 0.05+ = baby growing to adult

export default function DragonSVG({ dragon, progress, size = 400, chomping = false }) {
  if (!dragon) return null;

  const { primary, secondary, accent, glow } = dragon.colors;

  // Egg phase: progress 0 to ~0.05 (first correct answer triggers hatch)
  if (progress <= 0) {
    return <Egg dragon={dragon} size={size} wobble={false} />;
  }

  if (progress <= 0.05) {
    return <HatchingEgg dragon={dragon} size={size} />;
  }

  // Dragon growth phase: 0.05 → 1.0
  const growthT = (progress - 0.05) / 0.95; // normalize to 0-1
  return (
    <GrowingDragon
      dragon={dragon}
      t={growthT}
      size={size}
      chomping={chomping}
    />
  );
}

// === EGG (pre-game, wobbles gently) ===
function Egg({ dragon, size, wobble = true }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const s = Math.min(size * 0.6, 250);

  return (
    <motion.div
      style={{ width: s, height: s }}
      animate={wobble ? { rotate: [0, 2, -2, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 260">
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

        {/* Nest / ground */}
        <ellipse cx="100" cy="230" rx="70" ry="12" fill="#3d2b1f" opacity="0.4" />
        <ellipse cx="100" cy="228" rx="65" ry="10" fill="#5d4037" opacity="0.3" />

        {/* Main egg */}
        <ellipse
          cx="100" cy="145" rx="55" ry="75"
          fill={`url(#egg-g-${dragon.id})`}
          filter={`url(#egg-glow-${dragon.id})`}
        />

        {/* Egg markings (unique per dragon type) */}
        <EggMarkings dragon={dragon} />

        {/* Shine highlight */}
        <ellipse cx="80" cy="115" rx="20" ry="30"
          fill={`url(#egg-shine-${dragon.id})`}
        />

        {/* Subtle pulse glow */}
        <motion.ellipse
          cx="100" cy="145" rx="58" ry="78"
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
  const { primary, accent, glow } = dragon.colors;
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
function HatchingEgg({ dragon, size }) {
  const { primary, secondary, accent, glow } = dragon.colors;
  const [phase, setPhase] = useState(0); // 0=cracking, 1=breaking, 2=baby emerges
  const s = Math.min(size * 0.7, 300);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{ width: s, height: s, position: 'relative' }}>
      <AnimatePresence>
        {phase < 2 && (
          <motion.svg
            key="egg"
            width="100%" height="100%" viewBox="0 0 200 260"
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <defs>
              <radialGradient id={`hatch-g-${dragon.id}`} cx="38%" cy="32%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
                <stop offset="45%" stopColor={primary} />
                <stop offset="100%" stopColor={secondary} />
              </radialGradient>
            </defs>

            {/* Egg with cracks */}
            <motion.g
              animate={phase >= 1 ? { x: [0, -3, 3, -2, 2, 0] } : { rotate: [0, 3, -3, 0] }}
              transition={phase >= 1
                ? { duration: 0.3, repeat: 3 }
                : { duration: 0.8, repeat: Infinity }
              }
            >
              <ellipse cx="100" cy="145" rx="55" ry="75" fill={`url(#hatch-g-${dragon.id})`} />

              {/* Crack lines */}
              <motion.path
                d="M 85 130 L 95 115 L 88 100 L 100 90"
                stroke={accent}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              {phase >= 1 && (
                <>
                  <motion.path
                    d="M 95 115 L 115 120 L 125 105"
                    stroke={accent}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <motion.path
                    d="M 88 100 L 75 90 L 70 100"
                    stroke={accent}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />
                  {/* Light shining through cracks */}
                  <motion.circle
                    cx="95" cy="110" r="15"
                    fill={glow}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0.2, 0.5] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                </>
              )}
            </motion.g>
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Shell pieces flying out */}
      {phase >= 2 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            return (
              <motion.div
                key={`shell${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 12 + Math.random() * 10,
                  height: 10 + Math.random() * 8,
                  borderRadius: '30%',
                  background: primary,
                  border: `1px solid ${accent}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist + 30,
                  opacity: 0,
                  scale: 0.3,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      )}

      {/* Baby dragon emerging */}
      {phase >= 2 && (
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          initial={{ scale: 0.3, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        >
          <GrowingDragon dragon={dragon} t={0} size={s} chomping={false} />
        </motion.div>
      )}
    </div>
  );
}

// === GROWING DRAGON (baby → adult) ===
// t: 0 = just hatched baby, 1 = full adult
// PROPORTIONAL MATURITY — baby ≠ small adult
// Baby: big head, huge eyes, round body, stubby legs, tiny wings, short snout
// Adult: small head ratio, narrow eyes, long neck, angular jaw, massive wings, muscular legs
function GrowingDragon({ dragon, t, size, chomping }) {
  const { primary, secondary, accent, glow } = dragon.colors;

  // === PROPORTIONAL GROWTH CURVES ===
  // Each part grows at its own rate to create real maturity
  const headRatio = 1.3 - t * 0.45;      // Baby: huge head (1.3x), Adult: proportional (0.85x)
  const eyeRatio = 1.5 - t * 0.7;        // Baby: giant cute eyes, Adult: narrow fierce
  const bodyRound = 1.2 - t * 0.35;      // Baby: round belly, Adult: lean muscular
  const neckLen = 0.5 + t * 0.5;         // Baby: short stubby, Adult: long elegant
  const legLen = 0.4 + t * 0.6;          // Baby: stubby, Adult: tall powerful
  const legThick = 0.7 + t * 0.5;        // Baby: chubby, Adult: muscular
  const wingSpan = 0.15 + t * 0.85;      // Baby: tiny buds, Adult: massive
  const tailLen = 0.3 + t * 0.7;         // Baby: short, Adult: long whip
  const snoutLen = 0.4 + t * 0.6;        // Baby: button nose, Adult: long snout
  const hornLen = 0.1 + t * 0.9;         // Baby: tiny nubs, Adult: huge
  const jawAngularity = t;                // Baby: round, Adult: angular
  const spineCount = Math.floor(2 + t * 6);
  const bellyPlates = Math.floor(2 + t * 5);
  const breathIntensity = Math.max(0, (t - 0.35) / 0.65);
  const clawSize = 0.25 + t * 0.75;
  const browRidge = t * 0.8;             // Adult gets stern brow
  const scaleDetail = t;                 // More visible scales when older
  const overallSize = 0.55 + t * 0.45;   // Still grows, but less dramatic

  // Body anchor points (shift based on proportions)
  const bodyCx = 245;
  const bodyCy = 310;
  const bodyRx = 48 * bodyRound * (0.85 + t * 0.15);
  const bodyRy = 58 * bodyRound * (0.85 + t * 0.15);

  // Neck endpoint (head position moves up and forward as neck lengthens)
  const neckTopX = bodyCx - 75 - neckLen * 25;
  const neckTopY = bodyCy - 80 - neckLen * 60;

  // Head size (shrinks proportionally as body grows)
  const headRx = (28 + (1 - t) * 10) * headRatio;
  const headRy = (22 + (1 - t) * 8) * headRatio;
  const headCx = neckTopX - 5;
  const headCy = neckTopY - 5;

  const displaySize = size * overallSize;

  return (
    <motion.div
      style={{ width: displaySize, height: displaySize }}
      animate={chomping
        ? { scale: [1, 1.18, 0.9, 1.08, 1] }
        : { y: [0, -5, 0] }
      }
      transition={chomping
        ? { duration: 0.6, ease: 'easeOut' }
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
          <radialGradient id={`belly-${dragon.id}`} cx="50%" cy="20%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id={`wg-${dragon.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.45" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id={`eg-${dragon.id}`}>
            <stop offset="0%" stopColor="#fff" />
            <stop offset="35%" stopColor={accent} />
            <stop offset="100%" stopColor={glow} />
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

        <g filter={`url(#gl-${dragon.id})`}>

          {/* === TAIL === */}
          <motion.path
            d={tailPath(tailLen)}
            stroke={primary}
            strokeWidth={5 + tailLen * 9}
            fill="none"
            strokeLinecap="round"
            animate={{ d: [tailPath(tailLen), tailPath2(tailLen), tailPath(tailLen)] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <TailSpade tailLen={tailLen} accent={accent} t={t} />

          {/* === BACK LEGS (far side) === */}
          <Leg x={bodyCx + 25} y={bodyCy + 35} hipDx={12} hipDy={legLen * 55}
            legLen={legLen} legThick={legThick} claw={clawSize}
            color={secondary} accent={accent} t={t} side="far" />

          {/* === WINGS === */}
          <AnimatedWings dragon={dragon} ws={wingSpan} t={t}
            anchorX={bodyCx - 10} anchorY={bodyCy - 30} />

          {/* === BODY === */}
          <ellipse cx={bodyCx} cy={bodyCy} rx={bodyRx} ry={bodyRy}
            fill={`url(#bg-${dragon.id})`} stroke={primary} strokeWidth="1.5" strokeOpacity="0.25" />

          {/* Body scale texture (increases with age) */}
          <g opacity={0.08 + scaleDetail * 0.2}>
            {Array.from({ length: Math.floor(3 + scaleDetail * 8) }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const cx = bodyCx - 18 + col * 16 - row * 4;
              const cy = bodyCy - 25 + row * 16;
              return (
                <path key={`sc${i}`}
                  d={`M ${cx - 5} ${cy} Q ${cx} ${cy - 4} ${cx + 5} ${cy}`}
                  stroke={accent} strokeWidth="1" fill="none" />
              );
            })}
          </g>

          {/* Belly plates */}
          <g opacity={0.4 + t * 0.2}>
            {Array.from({ length: bellyPlates }, (_, i) => {
              const cy = bodyCy - 28 + i * (bodyRy * 1.4 / bellyPlates);
              const rx = (bodyRx * 0.45) - i * 1.5;
              return rx > 3 ? (
                <ellipse key={`bp${i}`} cx={bodyCx} cy={cy} rx={rx} ry={5}
                  fill={`url(#belly-${dragon.id})`} stroke={accent} strokeWidth="0.5" strokeOpacity="0.2" />
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

          {/* === ARMS === */}
          <path d={`M ${bodyCx - 35} ${bodyCy - 10}
                     Q ${bodyCx - 52} ${bodyCy + 5} ${bodyCx - 56} ${bodyCy + 20 + t * 8}
                     L ${bodyCx - 62} ${bodyCy + 28 + t * 10}`}
            stroke={primary} strokeWidth={4 + legThick * 4} fill="none" strokeLinecap="round" />
          {[0,1,2].map(c => (
            <line key={`lac${c}`}
              x1={bodyCx - 62 - c * 4} y1={bodyCy + 28 + t * 10}
              x2={bodyCx - 66 - c * 4} y2={bodyCy + 34 + t * 10 + clawSize * 3}
              stroke={accent} strokeWidth={1 + clawSize * 0.6} strokeLinecap="round" />
          ))}

          {/* === SPINES (grow taller + more numerous) === */}
          <g opacity={0.4 + t * 0.6}>
            {Array.from({ length: spineCount }, (_, i) => {
              const frac = i / Math.max(1, spineCount - 1);
              // Spines follow the curve from neck to tail
              const sx = bodyCx - 50 + frac * 90;
              const sy = bodyCy - 55 + Math.sin(frac * Math.PI * 0.8) * 15 + frac * 10;
              const h = (4 + t * 18) * (0.6 + (1 - Math.abs(frac - 0.4)) * 0.6);
              return (
                <polygon key={`sp${i}`}
                  points={`${sx - 2.5 - t},${sy} ${sx},${sy - h} ${sx + 2.5 + t},${sy}`}
                  fill={accent} stroke={primary} strokeWidth="0.5" />
              );
            })}
          </g>

          {/* === NECK (lengthens dramatically with maturity) === */}
          <path d={`M ${bodyCx - 25} ${bodyCy - 35}
                     Q ${bodyCx - 50 - neckLen * 15} ${bodyCy - 60 - neckLen * 30}
                       ${neckTopX} ${neckTopY}`}
            stroke={primary} strokeWidth={12 + (1 - t) * 6 + t * 4}
            fill="none" strokeLinecap="round" />
          {/* Neck underside */}
          <path d={`M ${bodyCx - 22} ${bodyCy - 30}
                     Q ${bodyCx - 46 - neckLen * 12} ${bodyCy - 55 - neckLen * 28}
                       ${neckTopX + 3} ${neckTopY + 4}`}
            stroke={accent} strokeWidth={4 + (1 - t) * 3}
            fill="none" strokeLinecap="round" opacity="0.12" />

          {/* === HEAD (proportions change with maturity) === */}
          <Head dragon={dragon} t={t}
            headCx={headCx} headCy={headCy} headRx={headRx} headRy={headRy}
            snoutLen={snoutLen} hornLen={hornLen} eyeRatio={eyeRatio}
            jawAngularity={jawAngularity} browRidge={browRidge}
            breathIntensity={breathIntensity} />
        </g>

        {/* Ground shadow */}
        <ellipse cx={bodyCx} cy={bodyCy + bodyRy + legLen * 56 + 22}
          rx={50 + t * 30} ry={4 + t * 4}
          fill="black" opacity={0.12 + t * 0.15} />
      </svg>
    </motion.div>
  );
}

// === SUB-COMPONENTS ===

function Head({ dragon, t, headCx, headCy, headRx, headRy, snoutLen, hornLen, eyeRatio, jawAngularity, browRidge, breathIntensity }) {
  const { primary, secondary, accent, glow } = dragon.colors;

  // Eye size decreases with maturity (baby=big cute, adult=narrow fierce)
  const eyeW = 7 * eyeRatio;
  const eyeH = 6 * eyeRatio;
  const pupilW = 2 + (1 - t) * 1.5;   // Baby: round pupil, Adult: narrow slit
  const pupilH = eyeH * 0.85;

  // Snout extends forward with age
  const snoutTipX = headCx - 30 - snoutLen * 25;
  const snoutTipY = headCy + 3;

  // Jaw drops more with maturity (angular vs round)
  const jawDrop = 4 + jawAngularity * 10;

  return (
    <g>
      {/* Head shape */}
      <ellipse cx={headCx} cy={headCy} rx={headRx} ry={headRy}
        fill={`url(#bg-${dragon.id})`} stroke={primary} strokeWidth="1.2" strokeOpacity="0.3" />

      {/* Brow ridge (gets more prominent with age) */}
      {browRidge > 0.1 && (
        <path d={`M ${headCx - headRx * 0.7} ${headCy - headRy * 0.5}
                   Q ${headCx} ${headCy - headRy * 0.5 - browRidge * 8} ${headCx + headRx * 0.7} ${headCy - headRy * 0.4}`}
          stroke={primary} strokeWidth={1.5 + browRidge * 3} fill="none" strokeLinecap="round" opacity={0.3 + browRidge * 0.3} />
      )}

      {/* Snout (longer + more angular with age) */}
      <path d={`M ${headCx - headRx * 0.6} ${headCy}
                 Q ${snoutTipX + 10} ${snoutTipY - 6 - jawAngularity * 3} ${snoutTipX} ${snoutTipY}
                 Q ${snoutTipX + 8} ${snoutTipY + jawDrop * 0.5} ${headCx - headRx * 0.5} ${headCy + headRy * 0.4}`}
        fill={secondary} stroke={primary} strokeWidth="1.2" strokeOpacity="0.3" />

      {/* Jaw (wider + more defined with maturity) */}
      <path d={`M ${headCx - headRx * 0.5} ${headCy + headRy * 0.4}
                 Q ${snoutTipX + 15} ${snoutTipY + jawDrop} ${snoutTipX + 3} ${snoutTipY + jawDrop * 0.6}`}
        stroke={primary} strokeWidth={1.5 + jawAngularity * 2} fill="none" opacity={0.3 + jawAngularity * 0.25} />

      {/* Nostrils */}
      <circle cx={snoutTipX + 6} cy={snoutTipY - 2} r={2 + snoutLen} fill={glow} opacity="0.7" />
      <circle cx={snoutTipX + 12} cy={snoutTipY - 3} r={1.5 + snoutLen * 0.5} fill={glow} opacity="0.5" />

      {/* Nostril wisps */}
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
  const w = side === 'near' ? (5 + legThick * 7) : (4 + legThick * 5);
  const kneeX = x + hipDx * 0.4;
  const kneeY = y + hipDy * 0.55;
  const footX = x + hipDx * 0.8;
  const footY = y + hipDy + 8;

  return (
    <g>
      {/* Thigh (gets more muscular with age) */}
      <path d={`M ${x} ${y} Q ${kneeX + legThick * 3} ${kneeY - 5} ${kneeX} ${kneeY}`}
        stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      {/* Shin (longer with age) */}
      <path d={`M ${kneeX} ${kneeY} Q ${footX - 1} ${footY - hipDy * 0.2} ${footX} ${footY}`}
        stroke={color} strokeWidth={w * 0.78} fill="none" strokeLinecap="round" />
      {/* Foot */}
      <ellipse cx={footX} cy={footY + 2} rx={8 + claw * 6} ry={3 + claw * 2} fill={color} />
      {/* Claws (longer with maturity) */}
      {[0,1,2].map(c => (
        <line key={`c${c}`}
          x1={footX - 6 - claw * 2 + c * (5 + claw * 3)} y1={footY + 2}
          x2={footX - 8 - claw * 2 + c * (4 + claw * 2.5)} y2={footY + 5 + claw * 5}
          stroke={accent} strokeWidth={1.2 + claw * 0.8} strokeLinecap="round" />
      ))}
    </g>
  );
}

function AnimatedWings({ dragon, ws, t, anchorX = 235, anchorY = 280 }) {
  const { primary, secondary, accent } = dragon.colors;
  const ax = anchorX;
  const ay = anchorY;

  return (
    <motion.g
      animate={{ rotate: [0, 2, -2, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: `${ax}px ${ay}px` }}
    >
      {/* Left wing */}
      <path d={`M ${ax - 20} ${ay}
          Q ${ax - 70 - ws * 65} ${ay - 45 - ws * 55} ${ax - 110 - ws * 85} ${ay - 65 - ws * 55}
          Q ${ax - 130 - ws * 75} ${ay - 35 - ws * 35} ${ax - 120 - ws * 65} ${ay - 5 - ws * 12}
          Q ${ax - 90 - ws * 42} ${ay + 15} ${ax - 30} ${ay + 15}`}
        fill={`url(#wg-${dragon.id})`} stroke={primary} strokeWidth="2" strokeOpacity="0.5" />
      <path d={`M ${ax - 20} ${ay} Q ${ax - 60 - ws * 45} ${ay - 30 - ws * 35} ${ax - 110 - ws * 85} ${ay - 65 - ws * 55}`}
        stroke={secondary} strokeWidth={2.5 + ws * 2.5} fill="none" strokeLinecap="round" opacity="0.45" />
      <path d={`M ${ax - 30} ${ay + 5} Q ${ax - 70 - ws * 32} ${ay - 10 - ws * 18} ${ax - 120 - ws * 65} ${ay - 5 - ws * 12}`}
        stroke={secondary} strokeWidth={2 + ws * 2} fill="none" strokeLinecap="round" opacity="0.35" />
      {ws > 0.45 && <circle cx={ax - 112 - ws * 85} cy={ay - 67 - ws * 55} r={2 + ws * 2} fill={accent} opacity="0.6" />}
      {t > 0.25 && [0.25, 0.5, 0.75].map((f, i) => (
        <line key={`lv${i}`}
          x1={ax - 20 - f * (95 + ws * 65)} y1={ay - f * (35 + ws * 25)}
          x2={ax - 30 - f * (75 + ws * 42)} y2={ay + 15 - f * 6}
          stroke={accent} strokeWidth="0.8" opacity={0.1 + t * 0.12} />
      ))}

      {/* Right wing */}
      <path d={`M ${ax + 30} ${ay}
          Q ${ax + 80 + ws * 65} ${ay - 45 - ws * 55} ${ax + 120 + ws * 85} ${ay - 65 - ws * 55}
          Q ${ax + 140 + ws * 75} ${ay - 35 - ws * 35} ${ax + 130 + ws * 65} ${ay - 5 - ws * 12}
          Q ${ax + 100 + ws * 42} ${ay + 15} ${ax + 40} ${ay + 15}`}
        fill={`url(#wg-${dragon.id})`} stroke={primary} strokeWidth="2" strokeOpacity="0.5" />
      <path d={`M ${ax + 30} ${ay} Q ${ax + 70 + ws * 45} ${ay - 30 - ws * 35} ${ax + 120 + ws * 85} ${ay - 65 - ws * 55}`}
        stroke={secondary} strokeWidth={2.5 + ws * 2.5} fill="none" strokeLinecap="round" opacity="0.45" />
      <path d={`M ${ax + 40} ${ay + 5} Q ${ax + 80 + ws * 32} ${ay - 10 - ws * 18} ${ax + 130 + ws * 65} ${ay - 5 - ws * 12}`}
        stroke={secondary} strokeWidth={2 + ws * 2} fill="none" strokeLinecap="round" opacity="0.35" />
      {ws > 0.45 && <circle cx={ax + 122 + ws * 85} cy={ay - 67 - ws * 55} r={2 + ws * 2} fill={accent} opacity="0.6" />}
      {t > 0.25 && [0.25, 0.5, 0.75].map((f, i) => (
        <line key={`rv${i}`}
          x1={ax + 30 + f * (95 + ws * 65)} y1={ay - f * (35 + ws * 25)}
          x2={ax + 40 + f * (75 + ws * 42)} y2={ay + 15 - f * 6}
          stroke={accent} strokeWidth="0.8" opacity={0.1 + t * 0.12} />
      ))}
    </motion.g>
  );
}

function TailSpade({ tailLen, accent, t }) {
  const tx = 350 + tailLen * 70;
  const ty = 245 - tailLen * 40;
  return (
    <motion.path
      d={`M ${tx - 5} ${ty}
          L ${tx + 15} ${ty - 20 - t * 5}
          L ${tx} ${ty - 5}
          L ${tx - 15} ${ty - 18 - t * 5} Z`}
      fill={accent}
      animate={{ rotate: [0, 4, -4, 0] }}
      transition={{ duration: 3.5, repeat: Infinity }}
      style={{ transformOrigin: `${tx}px ${ty}px` }}
    />
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
  return `M 290 315 Q ${320 + tl * 42} ${332 - tl * 12} ${342 + tl * 62} ${292 - tl * 32} Q ${362 + tl * 52} ${262 - tl * 42} ${350 + tl * 70} ${245 - tl * 40}`;
}
function tailPath2(tl) {
  return `M 290 315 Q ${332 + tl * 42} ${322 - tl * 12} ${352 + tl * 62} ${287 - tl * 32} Q ${372 + tl * 52} ${257 - tl * 42} ${356 + tl * 70} ${238 - tl * 40}`;
}
