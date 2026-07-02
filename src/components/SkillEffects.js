import React from 'react';
import { motion } from 'framer-motion';

// Each effect has a unique motion vocabulary so they feel different at a glance:
// - Fire = vertical rising columns + raining embers
// - Ice = edges-inward freeze + radial shatter
// - Earth = horizontal seismic split + vertical slam
// - Shadow = corner-tendrils + implosion/explosion
// - Light = top-down divine beam
// - Storm = rotational vortex + chained strikes

export const SKILL_DURATION_MS = 2800;

// ============================================================
// FIRE — vertical pillar inferno + raining embers
// ============================================================
export function FireBlast({ colors }) {
  return (
    <>
      {/* Bottom heat haze — rises fast then lingers */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%',
          background: `linear-gradient(to top, ${colors.primary}cc 0%, ${colors.accent}66 35%, transparent 75%)`,
          filter: 'blur(10px)',
          transformOrigin: 'bottom',
        }}
        initial={{ opacity: 0, scaleY: 0.1 }}
        animate={{ opacity: [0, 0.85, 0.7, 0.4, 0], scaleY: [0.1, 1.0, 1.1, 0.9, 0.6] }}
        transition={{ duration: 2.6, times: [0, 0.18, 0.45, 0.75, 1] }}
      />

      {/* Three towering fire pillars from bottom */}
      {[18, 50, 82].map((x, i) => (
        <motion.div
          key={`pillar-${i}`}
          style={{
            position: 'absolute', left: `${x}%`, bottom: 0,
            width: 110, height: '95%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(to top, #fff 0%, ${colors.accent} 12%, ${colors.primary}dd 40%, ${colors.glow}66 70%, transparent 100%)`,
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
            transformOrigin: 'bottom',
            borderRadius: '50% 50% 30% 30% / 80% 80% 20% 20%',
          }}
          initial={{ scaleY: 0, scaleX: 0.6, opacity: 0 }}
          animate={{
            scaleY: [0, 1.1, 0.95, 0.7, 0],
            scaleX: [0.6, 1.0, 1.15, 0.9, 0.5],
            opacity: [0, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: 2.4, delay: 0.15 + i * 0.12,
            times: [0, 0.25, 0.55, 0.8, 1],
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Central fireball — pulses bigger then explodes */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '38%',
          width: 240, height: 240,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${colors.accent}ee 25%, ${colors.primary}aa 55%, transparent 75%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(6px)',
          mixBlendMode: 'screen',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1.1, 3.2, 0], opacity: [0, 1, 1, 0.4, 0] }}
        transition={{ duration: 2.2, times: [0, 0.25, 0.55, 0.85, 1] }}
      />

      {/* Embers RAINING down (not just rising — gives fire mood depth) */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`emb-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-5%',
            width: 5 + Math.random() * 7,
            height: 5 + Math.random() * 7,
            borderRadius: '50%',
            background: i % 3 === 0 ? '#ffeb3b' : i % 3 === 1 ? colors.accent : '#ff6b35',
            boxShadow: `0 0 10px ${colors.glow}`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, 600 + Math.random() * 300],
            x: (Math.random() - 0.5) * 80,
            opacity: [0, 1, 0.9, 0],
            scale: [0.5, 1.2, 0.6],
          }}
          transition={{ duration: 2.0, delay: 0.4 + Math.random() * 1.0, ease: 'easeIn' }}
        />
      ))}

      {/* Final whole-screen red flash on impact */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${colors.accent}66, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.9, 0] }}
        transition={{ duration: 2.6, times: [0, 0.55, 0.7, 1] }}
      />
    </>
  );
}

// ============================================================
// ICE — edges freeze inward, central snowflake shatters outward
// ============================================================
export function IceBlast({ colors }) {
  return (
    <>
      {/* Edge frost — 4 panels crawl inward from each edge */}
      {[
        { side: 'top', from: { y: '-100%' }, to: { y: 0 }, w: '100%', h: '38%' },
        { side: 'bottom', from: { y: '100%' }, to: { y: 0 }, w: '100%', h: '38%', bottom: 0 },
        { side: 'left', from: { x: '-100%' }, to: { x: 0 }, w: '32%', h: '100%' },
        { side: 'right', from: { x: '100%' }, to: { x: 0 }, w: '32%', h: '100%', right: 0 },
      ].map((s, i) => (
        <motion.div
          key={`frost-${s.side}`}
          style={{
            position: 'absolute',
            top: s.bottom !== undefined ? 'auto' : 0,
            bottom: s.bottom,
            left: s.right !== undefined ? 'auto' : 0,
            right: s.right,
            width: s.w, height: s.h,
            background: s.side === 'top' || s.side === 'bottom'
              ? `linear-gradient(to ${s.side === 'top' ? 'bottom' : 'top'}, ${colors.glow}aa, ${colors.accent}55, transparent)`
              : `linear-gradient(to ${s.side === 'left' ? 'right' : 'left'}, ${colors.glow}aa, ${colors.accent}55, transparent)`,
            filter: 'blur(3px)',
            mixBlendMode: 'screen',
          }}
          initial={{ ...s.from, opacity: 0 }}
          animate={{ ...s.to, opacity: [0, 0.85, 0.85, 0] }}
          transition={{ duration: 2.4, times: [0, 0.3, 0.7, 1], ease: [0.2, 0.8, 0.4, 1] }}
        />
      ))}

      {/* Six radial ice spokes forming a snowflake at the center */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <motion.div
            key={`spoke-${i}`}
            style={{
              position: 'absolute',
              left: '50%', top: '45%',
              width: 6,
              height: 180,
              background: `linear-gradient(to top, transparent, ${colors.accent}, #fff, ${colors.accent}, transparent)`,
              transformOrigin: '50% 50%',
              transform: `translate(-50%, -50%) rotate(${(i / 6) * 360}deg)`,
              boxShadow: `0 0 18px ${colors.glow}, 0 0 36px ${colors.glow}80`,
              borderRadius: 3,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1, 1, 1.6, 0], opacity: [0, 1, 1, 0.7, 0] }}
            transition={{ duration: 2.4, delay: 0.4 + i * 0.04, times: [0, 0.2, 0.55, 0.8, 1] }}
          />
        );
      })}

      {/* Central crystallized snowflake hub */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '45%',
          width: 90, height: 90,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${colors.accent} 50%, transparent 75%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 50px ${colors.glow}, 0 0 100px ${colors.glow}80`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.4, 1.0, 2.2, 0], opacity: [0, 1, 1, 0.5, 0] }}
        transition={{ duration: 2.4, times: [0, 0.3, 0.6, 0.85, 1] }}
      />

      {/* Ice shards explode outward at climax */}
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 350 + Math.random() * 200;
        return (
          <motion.div
            key={`shard-${i}`}
            style={{
              position: 'absolute', left: '50%', top: '45%',
              width: 4,
              height: 28 + Math.random() * 18,
              background: `linear-gradient(to top, transparent, #fff, ${colors.accent})`,
              borderRadius: 2,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
              boxShadow: `0 0 10px ${colors.glow}`,
              transformOrigin: '50% 100%',
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: [0, 1.2, 0.8],
              opacity: [0, 1, 0],
              rotate: angle * (180 / Math.PI),
            }}
            transition={{ duration: 1.4, delay: 1.2 + i * 0.02, ease: 'easeOut' }}
          />
        );
      })}

      {/* Whole-screen frost overlay — reads as "everything is frozen" */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, transparent 20%, ${colors.glow}40 60%, ${colors.glow}80 100%)`,
          mixBlendMode: 'screen',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.7, 0.5, 0] }}
        transition={{ duration: 2.6, times: [0, 0.3, 0.55, 0.8, 1] }}
      />
    </>
  );
}

// ============================================================
// EARTH — horizontal seismic split + boulder slam
// ============================================================
export function EarthBlast({ colors }) {
  return (
    <>
      {/* Big horizontal crack splits the screen */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, top: '52%',
          height: 8,
          background: `linear-gradient(90deg, transparent 0%, ${colors.accent} 20%, #fff 50%, ${colors.accent} 80%, transparent 100%)`,
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.primary}`,
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
      />

      {/* Crack jaggedness — secondary cracks branching off */}
      {[-1, 1].map(dir => (
        <motion.div
          key={`branch-${dir}`}
          style={{
            position: 'absolute',
            left: dir < 0 ? '20%' : '60%',
            top: '52%',
            width: 4,
            height: 200,
            background: `linear-gradient(to ${dir < 0 ? 'top' : 'bottom'}, ${colors.accent}, transparent)`,
            transformOrigin: 'top',
            transform: `rotate(${dir * 25}deg)`,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.7], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.4 }}
        />
      ))}

      {/* Massive boulder slamming down from top */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: 0,
          width: 180, height: 180,
          borderRadius: '40% 60% 50% 45% / 55% 45% 50% 50%',
          background: `linear-gradient(140deg, ${colors.accent}, ${colors.primary}, #2a1a0a)`,
          boxShadow: `0 8px 30px rgba(0,0,0,0.7), inset -8px -10px 20px rgba(0,0,0,0.5), inset 6px 6px 12px ${colors.glow}40`,
          transform: 'translate(-50%, -120%)',
        }}
        initial={{ y: -200, rotate: -20, opacity: 0 }}
        animate={{
          y: [-200, 100, 280, 280],
          rotate: [-20, 5, 0, 0],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 2.4, times: [0, 0.45, 0.6, 1], ease: [0.5, 0, 0.7, 1] }}
      />

      {/* Stone pillars erupting from bottom on either side */}
      {[15, 30, 70, 85].map((x, i) => (
        <motion.div
          key={`stone-${i}`}
          style={{
            position: 'absolute', left: `${x}%`, bottom: 0,
            width: 50 + Math.random() * 30,
            height: 220 + Math.random() * 60,
            background: `linear-gradient(180deg, ${colors.accent}, ${colors.primary}, #1a0a05)`,
            transform: 'translateX(-50%)',
            transformOrigin: 'bottom',
            boxShadow: `inset -4px -4px 12px rgba(0,0,0,0.4), 0 4px 20px ${colors.glow}40`,
            clipPath: 'polygon(20% 100%, 0% 60%, 30% 0%, 70% 0%, 100% 60%, 80% 100%)',
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1.0, 1.0, 0.8], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, delay: 0.5 + i * 0.08, ease: 'easeOut', times: [0, 0.4, 0.7, 1] }}
        />
      ))}

      {/* Screen shake via repeated x/y wobble */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        animate={{ x: [0, -10, 12, -8, 6, -4, 2, 0], y: [0, 6, -5, 3, -2, 1, 0, 0] }}
        transition={{ duration: 0.7, delay: 0.3, repeat: 1 }}
      />

      {/* Dust shockwave at impact */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '60%',
          width: 100, height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}80, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(15px)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 5, 8], opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.4, delay: 0.6 }}
      />

      {/* Pebble debris flying up */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`peb-${i}`}
          style={{
            position: 'absolute',
            left: `${30 + Math.random() * 40}%`,
            top: '60%',
            width: 10 + Math.random() * 14,
            height: 10 + Math.random() * 14,
            borderRadius: '40%',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -150 - Math.random() * 250,
            x: (Math.random() - 0.5) * 400,
            rotate: (Math.random() - 0.5) * 540,
            opacity: [0, 1, 0],
            scale: [0.4, 1, 0.6],
          }}
          transition={{ duration: 1.6, delay: 0.7 + Math.random() * 0.3, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// ============================================================
// SHADOW — corner tendrils consume screen, then explosive burst
// ============================================================
export function ShadowBlast({ colors }) {
  return (
    <>
      {/* Four corner tendrils crawling inward */}
      {[
        { x: '0%', y: '0%', rot: 45 },
        { x: '100%', y: '0%', rot: 135 },
        { x: '0%', y: '100%', rot: -45 },
        { x: '100%', y: '100%', rot: -135 },
      ].map((c, i) => (
        <motion.div
          key={`tendril-${i}`}
          style={{
            position: 'absolute',
            left: c.x, top: c.y,
            width: 600, height: 80,
            background: `linear-gradient(90deg, #000 0%, ${colors.primary}cc 40%, ${colors.accent}88 70%, transparent 100%)`,
            transformOrigin: '0% 50%',
            transform: `rotate(${c.rot}deg)`,
            filter: 'blur(8px)',
            mixBlendMode: 'multiply',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 0.9, 0.9, 0], opacity: [0, 1, 0.9, 0] }}
          transition={{ duration: 2.4, delay: i * 0.05, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }}
        />
      ))}

      {/* Screen consumed by darkness mid-effect */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#06000f' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.92, 0.7, 0] }}
        transition={{ duration: 2.6, times: [0, 0.25, 0.5, 0.75, 1] }}
      />

      {/* Singularity at center — small purple eye that grows */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '40%',
          width: 60, height: 60,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow} 0%, ${colors.primary} 30%, #1a0033 60%, transparent 80%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 80px ${colors.glow}, 0 0 160px ${colors.primary}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 0.3, 1, 0.4, 5, 0], opacity: [0, 0.8, 1, 1, 0.8, 0] }}
        transition={{ duration: 2.4, times: [0, 0.2, 0.45, 0.55, 0.85, 1] }}
      />

      {/* Sucked-in particles spiraling toward center */}
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const startDist = 400;
        return (
          <motion.div
            key={`spiral-${i}`}
            style={{
              position: 'absolute', left: '50%', top: '40%',
              width: 8, height: 8,
              borderRadius: '50%',
              background: colors.accent,
              boxShadow: `0 0 14px ${colors.glow}`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{
              x: Math.cos(angle) * startDist,
              y: Math.sin(angle) * startDist,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: [Math.cos(angle) * startDist, Math.cos(angle + 2) * 100, 0],
              y: [Math.sin(angle) * startDist, Math.sin(angle + 2) * 100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{ duration: 1.4, delay: 0.3 + i * 0.04, ease: 'easeIn' }}
          />
        );
      })}

      {/* Singularity bursts outward — expanding dark wave with purple leading edge */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`burst-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 200, height: 200,
            borderRadius: '50%',
            border: `${4 - i}px solid ${colors.accent}`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 40px ${colors.glow}, inset 0 0 40px ${colors.primary}80`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 0, 4 + i, 6 + i * 1.5], opacity: [0, 0, 0.9, 0] }}
          transition={{ duration: 2.6, delay: i * 0.1, times: [0, 0.55, 0.85, 1] }}
        />
      ))}

      {/* Lightning cracks (jagged purple bolts) at climax */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={`bolt-${i}`}
          style={{
            position: 'absolute',
            left: `${20 + i * 15}%`,
            top: 0,
            width: 4,
            height: '70%',
            background: `linear-gradient(to bottom, ${colors.accent}, #fff, ${colors.primary}aa, transparent)`,
            boxShadow: `0 0 18px ${colors.accent}, 0 0 36px ${colors.glow}`,
            transform: `skewX(${(Math.random() - 0.5) * 40}deg)`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 1, 0.8, 0], scaleY: [0, 1, 1, 0.5] }}
          transition={{ duration: 0.6, delay: 1.6 + i * 0.08 }}
        />
      ))}
    </>
  );
}

// ============================================================
// LIGHT — top-down divine beam + radial sparkle burst
// ============================================================
export function LightBlast({ colors }) {
  return (
    <>
      {/* Sky brightens — golden gradient from top */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, #ffeb3bee 0%, ${colors.accent}aa 25%, transparent 60%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.7, 0.5, 0] }}
        transition={{ duration: 2.6, times: [0, 0.25, 0.5, 0.75, 1] }}
      />

      {/* Massive vertical pillar of light from top */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: 0,
          width: 240, height: '100%',
          background: `linear-gradient(180deg, #ffffff 0%, ${colors.accent}ee 30%, ${colors.glow}aa 60%, transparent 100%)`,
          transform: 'translateX(-50%)',
          filter: 'blur(8px)',
          mixBlendMode: 'screen',
          transformOrigin: 'top',
        }}
        initial={{ scaleY: 0, scaleX: 0.3, opacity: 0 }}
        animate={{
          scaleY: [0, 1, 1, 1, 0],
          scaleX: [0.3, 1.2, 1.0, 1.4, 1.8],
          opacity: [0, 1, 1, 0.7, 0],
        }}
        transition={{ duration: 2.6, times: [0, 0.2, 0.5, 0.8, 1], ease: [0.2, 0.8, 0.4, 1] }}
      />

      {/* Inner brilliant beam core */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: 0,
          width: 80, height: '100%',
          background: `linear-gradient(180deg, #ffffff 0%, #ffeb3bdd 40%, transparent 100%)`,
          transform: 'translateX(-50%)',
          mixBlendMode: 'screen',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.25, 0.7, 1] }}
      />

      {/* Center solar disc — the source of the beam */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '40%',
          width: 160, height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, #ffffff 0%, #ffeb3bcc 30%, ${colors.accent}88 60%, transparent 80%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 60px ${colors.glow}, 0 0 120px #ffeb3b`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 1.4, 2.0, 0], opacity: [0, 1, 1, 0.7, 0] }}
        transition={{ duration: 2.4, times: [0, 0.3, 0.55, 0.8, 1] }}
      />

      {/* 16 light rays expanding outward */}
      {Array.from({ length: 16 }, (_, i) => (
        <motion.div
          key={`ray-${i}`}
          style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: 4,
            height: 320,
            background: `linear-gradient(to bottom, ${colors.accent}, ${colors.glow}80, transparent)`,
            transformOrigin: '50% 0',
            transform: `translate(-50%, 0) rotate(${(i / 16) * 360}deg)`,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.8, 0], opacity: [0, 0.85, 0.6, 0] }}
          transition={{ duration: 1.8, delay: 0.5 + i * 0.03 }}
        />
      ))}

      {/* Sparkle burst — golden particles raining down */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`spark-${i}`}
          style={{
            position: 'absolute',
            left: `${40 + Math.random() * 20}%`,
            top: '40%',
            width: 6,
            height: 6,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: `0 0 8px ${colors.accent}, 0 0 16px #ffeb3b`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 700,
            y: 100 + Math.random() * 400,
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
          }}
          transition={{ duration: 1.6, delay: 1.0 + Math.random() * 0.5, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// ============================================================
// STORM — rotational vortex + chained lightning + thunderclap
// ============================================================
export function StormBlast({ colors }) {
  return (
    <>
      {/* Storm cloud cover rolls in from top */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '50%',
          background: `linear-gradient(to bottom, #0a0a1a 0%, ${colors.primary}99 40%, transparent 100%)`,
          filter: 'blur(8px)',
        }}
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: [-200, 0, 0, 0, -100], opacity: [0, 1, 1, 0.7, 0] }}
        transition={{ duration: 2.6, times: [0, 0.2, 0.5, 0.8, 1] }}
      />

      {/* Vortex — three rotating spiral arms */}
      {[0, 120, 240].map((startAngle, i) => (
        <motion.div
          key={`spiral-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '45%',
            width: 500, height: 12,
            background: `linear-gradient(90deg, transparent 0%, ${colors.primary}80 30%, ${colors.accent} 60%, transparent 100%)`,
            transformOrigin: '50% 50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(4px)',
            mixBlendMode: 'screen',
            borderRadius: 6,
          }}
          initial={{ rotate: startAngle, scale: 0, opacity: 0 }}
          animate={{
            rotate: startAngle + 540,
            scale: [0, 1.2, 1, 0.6, 0],
            opacity: [0, 1, 1, 0.5, 0],
          }}
          transition={{ duration: 2.4, delay: 0.1 * i, ease: 'easeOut', times: [0, 0.25, 0.6, 0.85, 1] }}
        />
      ))}

      {/* Eye of the storm — bright center */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '45%',
          width: 80, height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${colors.accent}cc 40%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 40px #fff, 0 0 80px ${colors.accent}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 1.3, 4, 0], opacity: [0, 1, 1, 0.7, 0] }}
        transition={{ duration: 2.4, times: [0, 0.3, 0.6, 0.85, 1] }}
      />

      {/* Chained lightning bolts — strike one at a time across screen */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = 12 + i * 14 + (Math.random() - 0.5) * 6;
        return (
          <motion.div
            key={`zap-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: 0,
              width: 6,
              height: '70%',
              background: `linear-gradient(to bottom, ${colors.accent}, #fff, ${colors.accent}, transparent)`,
              boxShadow: `0 0 22px ${colors.accent}, 0 0 44px #fff, 0 0 88px ${colors.glow}`,
              clipPath: `polygon(0% 0%, 100% 0%, 50% 25%, 100% 30%, 25% 55%, 75% 55%, 30% 80%, 60% 80%, 0% 100%, 50% 75%, 0% 70%, 70% 45%, 0% 45%, 60% 20%, 0% 20%)`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 1, 0.9, 0], scaleY: [0, 1, 1, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.18 }}
          />
        );
      })}

      {/* Horizontal rain blast — wind-driven sheets */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`rain-${i}`}
          style={{
            position: 'absolute',
            left: '-10%',
            top: `${5 + Math.random() * 90}%`,
            width: 40 + Math.random() * 30,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.accent}aa, transparent)`,
            borderRadius: 1,
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: [0, 1500], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.8 + Math.random() * 0.4, delay: 0.3 + Math.random() * 1.5 }}
        />
      ))}

      {/* Thunderclap shockwave ring */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '45%',
          width: 100, height: 100,
          borderRadius: '50%',
          border: `4px solid ${colors.accent}`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 30px ${colors.glow}80`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 8, 12], opacity: [0, 0, 0.85, 0] }}
        transition={{ duration: 1.6, delay: 1.4, times: [0, 0.3, 0.6, 1] }}
      />

      {/* Final thunder flash — whole screen briefly white */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#fff' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.6, 0, 0.3, 0] }}
        transition={{ duration: 0.6, delay: 1.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }}
      />
    </>
  );
}
