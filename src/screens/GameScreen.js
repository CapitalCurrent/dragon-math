import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import DragonSVG from '../components/DragonSVG';
import DragonSprite, { hasSpriteArt } from '../components/DragonSprite';
import FloatingNumbers from '../components/FloatingNumbers';
import TruckCounting from '../components/TruckCounting';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';
import PowerBar from '../components/PowerBar';
import { morphSetFor } from '../components/DragonSprite';
import { powerFxFor, setHasPowers } from '../utils/powers';
import DevPanel from '../components/DevPanel';
import WorldMarks from '../components/WorldMarks';
import {
  FireBlast as FireBlastFx,
  IceBlast as IceBlastFx,
  EarthBlast as EarthBlastFx,
  ShadowBlast as ShadowBlastFx,
  LightBlast as LightBlastFx,
  StormBlast as StormBlastFx,
  SKILL_DURATION_MS,
} from '../components/SkillEffects';

import caveArt from '../assets/art/cave-bg.webp';
import caveEmber from '../assets/art/cave-ember.webp';

// Per-dragon caves (studio-generated, same layout contract: nest ledge on the left third at the
// floor line, headroom for the wingspan, the mouth on the right). Others fall back to the shared cave.
const CAVE_ART = {
  ember: caveEmber,
};

// Full-bleed cave background — studio-generated painting (local ComfyUI, Arc B580).
// Dragon-colored lighting is layered on top in the same 1600x900 coordinate space
// so the glow still pools where the dragon stands.
function CaveBackground({ dragon }) {
  const { primary, glow } = dragon.colors;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        {/* Dragon glow effects */}
        <radialGradient id="wall-glow" cx="55%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="60%" stopColor={primary} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="floor-glow" cx="40%" cy="20%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ceil-glow" cx="40%" cy="90%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.10" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Painted cavern — moonlit opening on the right, dry open floor */}
      <image
        href={CAVE_ART[dragon.id] || caveArt}
        x="0" y="0" width="1600" height="900"
        preserveAspectRatio="xMidYMid slice"
      />

      {/* === LIGHTING FROM DRAGON === */}
      {/* Glow pool on floor — stronger */}
      <ellipse cx="560" cy="682" rx="320" ry="40" fill="url(#floor-glow)" />
      <ellipse cx="560" cy="682" rx="180" ry="25" fill={glow} opacity="0.06" />
      {/* Glow on ceiling — stronger */}
      <ellipse cx="540" cy="310" rx="380" ry="60" fill="url(#ceil-glow)" />
      {/* Glow on back wall — stronger */}
      <path
        d={`M 0 220 L 0 750 Q 50 730 100 700 Q 150 660 190 610
            Q 220 550 225 480 Q 225 410 210 350
            Q 185 290 150 260 Q 100 230 50 215 Z`}
        fill="url(#wall-glow)"
      />
      {/* Ambient glow filling cave interior — warm tint */}
      <ellipse cx="520" cy="490" rx="420" ry="200" fill={glow} opacity="0.035" />
      {/* Secondary glow halo around dragon position */}
      <ellipse cx="560" cy="520" rx="200" ry="150" fill={glow} opacity="0.04" />

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
function FlyingAnswer({ dragon, answer, dragonRef, numbersRef, mouthRef, isCounting = false }) {
  const colors = dragon?.colors || {};
  const [coords, setCoords] = React.useState(null);

  React.useEffect(() => {
    const numEl = numbersRef?.current;
    const mouthEl = mouthRef?.current;
    const dragEl = dragonRef?.current;
    if (!numEl) return;

    const numRect = numEl.getBoundingClientRect();
    const startX = numRect.left + numRect.width / 2;
    const startY = numRect.top + numRect.height * 0.3;

    // Mouth marker is an invisible <circle> placed at the snout tip inside the
    // SVG. getBoundingClientRect resolves all parent CSS transforms (scaleX flip,
    // chomp/breath animations) and per-stage growth, so this is pixel-accurate.
    let endX, endY;
    if (mouthEl) {
      const r = mouthEl.getBoundingClientRect();
      endX = r.left + r.width / 2;
      endY = r.top + r.height / 2;
    } else if (dragEl) {
      // Defensive fallback if the mouth ref didn't attach for some reason
      const r = dragEl.getBoundingClientRect();
      endX = r.left + r.width * 0.68;
      endY = r.top + r.height * 0.4;
    } else {
      return;
    }

    setCoords({ startX, startY, endX, endY, dx: endX - startX, dy: endY - startY });
  }, [dragonRef, numbersRef, mouthRef]);

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
          width: isCounting ? 60 : 80,
          height: isCounting ? 60 : 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isCounting ? 40 : 36,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          background: isCounting
            ? `radial-gradient(circle at 35% 35%, ${colors.glow}40, transparent 70%)`
            : `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
          boxShadow: isCounting
            ? `0 0 20px ${colors.glow}60`
            : `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}40, inset 0 -4px 12px ${colors.glow}30`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={{
          x: [0, 0, coords.dx * 0.35, coords.dx],
          y: [0, -15, coords.dy * 0.5 - 30, coords.dy],
          scale: [1, 1.15, 0.9, 0.15],
          opacity: [1, 1, 1, 0],
        }}
        transition={{ duration: isCounting ? 0.8 : 1.1, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.12, 0.5, 1] }}
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
// Implementations live in components/SkillEffects.js — each element has its own
// motion vocabulary (vertical pillars vs. radial shatter vs. spiral vortex etc.)
// so they don't all blur into the same animation.

const ELEMENT_EFFECTS = {
  ember: FireBlastFx,
  frost: IceBlastFx,
  stone: EarthBlastFx,
  shadow: ShadowBlastFx,
  glimmer: LightBlastFx,
  storm: StormBlastFx,
};

function SkillBlast({ skill, dragon, dispatch }) {
  const colors = dragon?.colors || {};
  const element = dragon?.id;

  React.useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ACTIVE_SKILL' }), SKILL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const ElementEffect = ELEMENT_EFFECTS[element] || FireBlastFx;

  // Per-element icon placement so the icon doesn't fight the effect's focal point.
  // Light/Storm focal point is centered around the upper third; Earth's center is
  // lower (boulder slam at 60%); the rest sit at the standard 38%.
  const iconTop = element === 'storm' || element === 'glimmer' ? '42%'
    : element === 'stone' ? '32%'
    : '38%';

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ElementEffect colors={colors} skill={skill} />

      {/* Skill icon — emerges late so the unique effect has time to register first */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: iconTop,
          fontSize: 110, transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 30px ${colors.glow}) drop-shadow(0 0 60px ${colors.primary}cc)`,
        }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{
          scale: [0, 0, 1.6, 1.3, 2.4, 0],
          rotate: [0, 0, 12, -8, 4, 0],
          opacity: [0, 0, 1, 1, 1, 0],
        }}
        transition={{ duration: 2.6, times: [0, 0.25, 0.4, 0.6, 0.85, 1] }}
      >
        {skill.icon}
      </motion.div>

      {/* Skill name text */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '62%',
          transform: 'translate(-50%, -50%)',
          fontSize: 32, fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 18px ${colors.glow}, 0 0 36px ${colors.primary}, 0 2px 6px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: [0, 0, 1, 1, 0], y: [20, 20, 0, 0, -15], scale: [0.8, 0.8, 1.1, 1, 0.9] }}
        transition={{ duration: 2.6, times: [0, 0.3, 0.5, 0.85, 1] }}
      >
        {skill.name}!
      </motion.div>
    </motion.div>
  );
}

export default function GameScreen() {
  const { dragon, progress, eating, mouthOpen, currentQuestion, activeSkill, activePower, newSkill, dispatch } = useGame();

  // Generated POWERS (morph art sets with effect frames): a newly unlocked power performs itself.
  const morphSet = morphSetFor(dragon);
  const hasPowers = setHasPowers(morphSet);
  React.useEffect(() => {
    if (!hasPowers || !newSkill) return;
    dispatch({ type: 'PLAY_POWER', id: powerFxFor(morphSet, dragon, newSkill)?.id, skill: newSkill, replay: false });
    dispatch({ type: 'CLEAR_SKILL_POPUP' });
  }, [hasPowers, newSkill, morphSet, dragon, dispatch]);
  // the shield has no generated frames (an aura drawn by the sprite); anything else without frames ends at once
  const powerFx = hasPowers && activePower
    ? (powerFxFor(morphSet, dragon, activePower.skill) || (activePower.id === 'shield' ? { id: 'shield', fx: [], frame: 0 } : null))
    : null;
  React.useEffect(() => {
    if (activePower && hasPowers && !powerFx) dispatch({ type: 'CLEAR_ACTIVE_POWER' });
  }, [activePower, hasPowers, powerFx, dispatch]);
  const dragonRef = useRef(null);
  const mouthRef = useRef(null);
  const numbersRef = useRef(null);
  const [dims, setDims] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

  // Lock to landscape on mobile during gameplay
  useEffect(() => {
    const lock = async () => {
      try {
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape');
        }
      } catch (e) { /* not supported or already landscape */ }
    };
    lock();
    return () => {
      try { window.screen?.orientation?.unlock?.(); } catch (e) {}
    };
  }, []);

  // Track resize/orientation changes
  useEffect(() => {
    const onResize = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 200));
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Responsive sizing
  const { w, h } = dims;
  const isLandscape = w > h && h < 500;
  const isMobilePortrait = w < h && w < 768;
  const isWide = w >= 1024;
  const dragonSize = isLandscape ? Math.min(280, h - 80) : isWide ? 520 : 380;
  // Morph frames sit on a wide canvas (spread wings): give the dragon column a
  // real width budget so the box scales down instead of being clipped.
  const dragonMaxWidth = isLandscape ? 340 : Math.min(isWide ? 760 : 600, Math.floor(w * 0.52));

  if (!dragon) return null;
  const stageIndex = Math.min(4, Math.floor(progress * 5));

  // Show rotate prompt on mobile portrait
  if (isMobilePortrait) {
    return (
      <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: '#050510' }}>
        <CaveBackground dragon={dragon} />
        <div className="relative z-10 text-center px-8">
          <div className="text-6xl mb-6" style={{ animation: 'spin 2s ease-in-out infinite' }}>📱</div>
          <p className="text-2xl font-bold mb-2" style={{ color: dragon.colors.accent }}>
            Rotate Your Device
          </p>
          <p className="text-gray-400">
            Dragon Math plays best in landscape mode!
          </p>
        </div>
        <style>{`@keyframes spin { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(90deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#050510' }}
    >
      {/* Full-bleed cave background */}
      <CaveBackground dragon={dragon} />

      {/* Persistent marks left by skill activations (scorch, frost, rubble, etc.) */}
      <WorldMarks />

      {/* Ambient background particles */}
      <AmbientParticles color={dragon.colors.glow + '40'} count={20} />

      {/* Progress bar at top — overlaid on cave ceiling */}
      <div className={`w-full mx-auto px-4 relative z-10 ${isLandscape ? 'pt-1 max-w-full' : 'pt-3 max-w-3xl'}`}>
        <ProgressBar />
      </div>

      {/* Main game area — dragon on left in cave, numbers at cave mouth on right */}
      <div className={`flex items-center justify-center w-full flex-1 relative z-10 px-4 ${
        isLandscape || isWide ? 'flex-row gap-0' : 'flex-col gap-4'
      }`} style={{ paddingBottom: isLandscape ? 8 : isWide ? 120 : 40 }}>

        {/* Dragon area — sits on cave floor, left ~45% */}
        <div className={`flex flex-col items-center ${isLandscape || isWide ? 'flex-1' : ''}`} style={{ maxWidth: dragonMaxWidth }}>
          {/* Dragon on the floor */}
          <div className="flex-shrink-0 flex items-end justify-center" ref={dragonRef} style={{ overflow: 'visible' }}>

            {hasSpriteArt(dragon)
              ? <DragonSprite dragon={dragon} progress={progress} size={dragonSize} maxWidth={dragonMaxWidth} chomping={mouthOpen && !activePower} mouthRef={mouthRef}
                  power={powerFx} onPowerDone={() => dispatch({ type: 'CLEAR_ACTIVE_POWER' })} />
              : <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} mouthRef={mouthRef} />}
          </div>

          {/* Stage name + skill bar — below dragon, above cave floor */}
          <motion.div
            className="text-center relative z-10"
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className={`${isLandscape ? 'text-base' : 'text-xl lg:text-2xl'} font-black tracking-wide`} style={{
              color: dragon.colors.accent,
              textShadow: `0 0 12px ${dragon.colors.glow}60, 0 2px 4px rgba(0,0,0,0.5)`,
            }}>
              {dragon.stages[stageIndex]?.name}
            </p>
            <p className={`${isLandscape ? 'text-xs' : 'text-sm lg:text-base'} text-gray-400 italic`} style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              {dragon.stages[stageIndex]?.description}
            </p>
          </motion.div>

          <div className={isLandscape ? 'mt-1 mb-1' : 'mt-2 mb-4'}>
            {hasPowers ? <PowerBar /> : <SkillBar />}
          </div>
        </div>

        {/* Question + input — at cave mouth, right side */}
        <div ref={numbersRef} className={`flex flex-col items-center justify-center ${isLandscape || isWide ? 'flex-1 pb-0' : ''}`} style={{ maxWidth: isLandscape ? 360 : 480 }}>
          {currentQuestion?.type === 'counting' ? <TruckCounting /> : <FloatingNumbers />}
          <AnswerInput />
        </div>
      </div>

      {/* Flying answer overlay — uses fixed positioning to cross layout boundaries */}
      <AnimatePresence>
        {eating && currentQuestion && (
          <FlyingAnswer
            key={`fly-${currentQuestion.display || currentQuestion.answer}`}
            dragon={dragon}
            answer={currentQuestion.type === 'counting' ? currentQuestion.vehicle?.emoji : currentQuestion.answer}
            dragonRef={dragonRef}
            numbersRef={numbersRef}
            mouthRef={mouthRef}
            isCounting={currentQuestion.type === 'counting'}
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
