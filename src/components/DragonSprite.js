import React from 'react';
import { motion } from 'framer-motion';

import eggEmber from '../assets/art/egg-ember.webp';
import eggFrost from '../assets/art/egg-frost.webp';
import eggStone from '../assets/art/egg-stone.webp';
import eggShadow from '../assets/art/egg-shadow.webp';
import eggGlimmer from '../assets/art/egg-glimmer.webp';
import eggStorm from '../assets/art/egg-storm.webp';

import emberBaby from '../assets/art/ember-baby.webp';
import emberBabyOpen from '../assets/art/ember-baby-open.webp';
import emberJuv from '../assets/art/ember-juv.webp';
import emberJuvOpen from '../assets/art/ember-juv-open.webp';
import emberAdult from '../assets/art/ember-adult.webp';
import emberAdultOpen from '../assets/art/ember-adult-open.webp';

// Studio-generated egg portraits — shared with DragonSelectScreen so the egg
// the player picks is the same egg they hatch in the game.
export const EGG_ART = {
  ember: eggEmber,
  frost: eggFrost,
  stone: eggStone,
  shadow: eggShadow,
  glimmer: eggGlimmer,
  storm: eggStorm,
};

// Painted growth-stage sprites. Each stage has a closed/open mouth pair cropped
// to the SAME canvas so the chomp swap doesn't shift the character.
// Dragons without an entry here fall back to the procedural DragonSVG.
const SPRITE_STAGES = {
  ember: [
    { at: 0, closed: emberBaby, open: emberBabyOpen },
    { at: 0.35, closed: emberJuv, open: emberJuvOpen },
    { at: 0.72, closed: emberAdult, open: emberAdultOpen },
  ],
};

export function hasSpriteArt(dragon) {
  return !!SPRITE_STAGES[dragon?.id];
}

// Crack lines drawn over the painted egg — same 3-stage thresholds as the SVG egg
function CrackOverlay({ crackStage, glow }) {
  return (
    <svg viewBox="0 0 100 130" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {crackStage >= 3 && (
        <ellipse cx="50" cy="60" rx="30" ry="40" fill={glow} opacity="0.28" />
      )}
      {crackStage >= 1 && (
        <path d="M 47 22 L 54 34 L 46 45 L 53 56" fill="none" stroke="#fff8e8"
          strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      )}
      {crackStage >= 2 && (
        <>
          <path d="M 54 34 L 64 40 L 61 52" fill="none" stroke="#fff8e8"
            strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
          <path d="M 46 45 L 36 50 L 39 62" fill="none" stroke="#fff8e8"
            strokeWidth="1.3" strokeLinecap="round" opacity="0.75" />
        </>
      )}
      {crackStage >= 3 && (
        <>
          <path d="M 53 56 L 48 70 L 56 82" fill="none" stroke="#fffdf5"
            strokeWidth="2" strokeLinecap="round" opacity="0.95" />
          <path d="M 39 62 L 45 74" fill="none" stroke="#fff8e8"
            strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

function SpriteEgg({ dragon, size, crackStage, mouthRef }) {
  const eggH = size * 0.5;
  const { glow } = dragon.colors;
  return (
    <div style={{
      width: size, height: size, display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <motion.div
        style={{ position: 'relative', transformOrigin: '50% 95%' }}
        animate={{ rotate: crackStage > 0 ? [-2.5, 2.5, -2.5] : [-1, 1, -1] }}
        transition={{
          duration: crackStage > 0 ? 0.45 : 3,
          repeat: Infinity, ease: 'easeInOut',
        }}
      >
        <img
          src={EGG_ART[dragon.id]}
          alt={`${dragon.name} egg`}
          style={{
            height: eggH, width: 'auto', display: 'block',
            filter: `drop-shadow(0 8px 18px ${glow}55)`,
          }}
        />
        <CrackOverlay crackStage={crackStage} glow={glow} />
        {/* Invisible marker for FlyingAnswer targeting */}
        <div ref={mouthRef} style={{
          position: 'absolute', left: '50%', top: '40%',
          width: 2, height: 2, pointerEvents: 'none',
        }} />
      </motion.div>
    </div>
  );
}

export default function DragonSprite({ dragon, progress, size = 400, chomping = false, mouthRef }) {
  const stages = SPRITE_STAGES[dragon.id];
  const { glow } = dragon.colors;

  if (progress <= 0.15) {
    const crackStage = progress <= 0 ? 0 : Math.min(3, Math.ceil(progress / 0.05));
    return <SpriteEgg dragon={dragon} size={size} crackStage={crackStage} mouthRef={mouthRef} />;
  }

  const t = Math.min(1, (progress - 0.15) / 0.85);
  const stage = [...stages].reverse().find(s => t >= s.at) || stages[0];
  const displaySize = size * (0.55 + t * 0.45);

  return (
    <div style={{
      width: size, height: size, display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <motion.div
        key={stage.at} // re-springs on stage change (growth pop)
        style={{ position: 'relative', transformOrigin: '50% 100%' }}
        initial={{ scale: 0.4, y: 25, opacity: 0 }}
        animate={chomping
          ? { scale: [1, 1.08, 0.96, 1.05, 1], y: [0, -8, 4, -3, 0], opacity: 1 }
          : { scale: 1, y: [0, -5, 0], scaleY: [1, 1.025, 1], opacity: 1 }
        }
        transition={chomping
          ? { duration: 0.7, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }
          : {
              scale: { type: 'spring', stiffness: 260, damping: 16 },
              opacity: { duration: 0.25 },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              scaleY: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }
        }
      >
        {/* Ground shadow keeps the sprite anchored to the painted cave floor */}
        <div style={{
          position: 'absolute', left: '12%', right: '12%', bottom: -6,
          height: displaySize * 0.09, borderRadius: '50%',
          background: `radial-gradient(ellipse, #000000aa 0%, transparent 70%)`,
        }} />
        {/* Aura glow in the dragon's element color */}
        <div style={{
          position: 'absolute', inset: '-12%',
          background: `radial-gradient(ellipse at 50% 60%, ${glow}2e 0%, transparent 65%)`,
          pointerEvents: 'none',
        }} />
        {/* Closed/open pair stacked — opacity swap reads as the mouth opening */}
        <img
          src={stage.closed}
          alt={dragon.name}
          style={{
            height: displaySize, width: 'auto', display: 'block',
            opacity: chomping ? 0 : 1, transition: 'opacity 0.1s',
          }}
        />
        <img
          src={stage.open}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', left: 0, top: 0,
            height: displaySize, width: 'auto',
            opacity: chomping ? 1 : 0, transition: 'opacity 0.1s',
          }}
        />
        {/* Invisible mouth marker for FlyingAnswer targeting (center of face) */}
        <div ref={mouthRef} style={{
          position: 'absolute', left: '54%', top: '40%',
          width: 2, height: 2, pointerEvents: 'none',
        }} />
      </motion.div>
    </div>
  );
}
