import React, { lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useVersion } from '../App';
import DragonSVG from '../components/DragonSVG';
import FloatingNumbers from '../components/FloatingNumbers';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';

const DragonPixi = lazy(() => import('../engine/DragonPixi'));

function DragonCave({ dragon, progress, children }) {
  const { primary, accent, glow } = dragon.colors;
  const isEgg = progress <= 0.15;
  return (
    <div className="relative" style={{ width: 540, height: 520, overflow: 'visible' }}>
      {/* Cave background */}
      <svg
        width="100%" height="100%" viewBox="0 0 540 520"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="cave-bg" cx="50%" cy="55%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.06" />
            <stop offset="40%" stopColor="#0a0a1a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#050510" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="cave-glow" cx="50%" cy="90%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.15" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cave arch — wider and taller */}
        <path
          d="M 15 520 Q 15 100 110 45 Q 200 5 270 5 Q 340 5 430 45 Q 525 100 525 520"
          fill="url(#cave-bg)"
          stroke="#1a1a2e"
          strokeWidth="3"
        />

        {/* Inner cave shadow for depth */}
        <path
          d="M 40 520 Q 40 130 125 65 Q 210 28 270 28 Q 330 28 415 65 Q 500 130 500 520"
          fill="none"
          stroke={primary}
          strokeWidth="1"
          strokeOpacity="0.06"
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
            {/* Back rocks — taller, behind egg */}
            <ellipse cx="210" cy="458" rx="24" ry="30" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="330" cy="458" rx="22" ry="28" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="235" cy="452" rx="20" ry="26" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            <ellipse cx="305" cy="453" rx="19" ry="25" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            {/* Front rocks — overlap egg base */}
            <ellipse cx="220" cy="476" rx="22" ry="18" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="320" cy="477" rx="21" ry="17" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="245" cy="482" rx="18" ry="14" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            <ellipse cx="295" cy="483" rx="17" ry="13" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            {/* Center front rock */}
            <ellipse cx="270" cy="486" rx="24" ry="12" fill="#252540" stroke="#30305a" strokeWidth="0.8" />
            {/* Pebbles */}
            <ellipse cx="195" cy="486" rx="8" ry="5" fill="#1c1c2e" />
            <ellipse cx="345" cy="487" rx="7" ry="4" fill="#1c1c2e" />
            {/* Warm glow from egg heat */}
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
    // Target the dragon's mouth area (upper-left quadrant since dragon faces left, but SVG is scaleX(-1))
    const endX = dragRect.left + dragRect.width * 0.35;
    const endY = dragRect.top + dragRect.height * 0.25;

    setCoords({ startX, startY, endX, endY, dx: endX - startX, dy: endY - startY });
  }, [dragonRef, numbersRef]);

  if (!coords) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Trail particles — slower, more visible */}
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
          transition={{ duration: 1.0, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
        />
      ))}
      {/* Main answer bubble — hovers first, then arcs to dragon */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.startX,
          top: coords.startY,
          width: 90,
          height: 90,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          background: `radial-gradient(circle at 30% 30%, ${colors.accent}, ${colors.primary})`,
          boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow}40`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={{
          x: [0, 0, coords.dx * 0.3, coords.dx],
          y: [0, -20, coords.dy * 0.5 - 40, coords.dy],
          scale: [1, 1.2, 1.0, 0.2],
          opacity: [1, 1, 1, 0],
        }}
        transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.15, 0.55, 1] }}
      >
        {answer}
      </motion.div>
      {/* Impact flash at dragon position */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.endX,
          top: coords.endY,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}80, ${colors.accent}40, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 2.5], opacity: [0, 0.8, 0] }}
        transition={{ delay: 1.2, duration: 0.4 }}
      />
    </div>
  );
}

// Full-screen dramatic skill activation overlay
function SkillBlast({ skill, dragon, dispatch }) {
  const colors = dragon?.colors || {};

  React.useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ACTIVE_SKILL' }), 2200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Full-screen color flash */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${colors.glow}60, ${colors.primary}20, transparent 70%)`,
        }}
        animate={{ opacity: [0, 0.8, 0.4, 0] }}
        transition={{ duration: 1.5 }}
      />

      {/* Giant skill icon */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '40%',
          fontSize: 120, transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 30px ${colors.glow})`,
        }}
        initial={{ scale: 0, rotate: -45 }}
        animate={{
          scale: [0, 2, 1.5, 2.5, 0],
          rotate: [0, 15, -15, 10, 0],
          opacity: [0, 1, 1, 1, 0],
        }}
        transition={{ duration: 2.0, times: [0, 0.15, 0.4, 0.7, 1] }}
      >
        {skill.icon}
      </motion.div>

      {/* Skill name text */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '58%',
          transform: 'translate(-50%, -50%)',
          fontSize: 32, fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.primary}`,
          whiteSpace: 'nowrap',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
        transition={{ duration: 2.0, times: [0, 0.2, 0.7, 1] }}
      >
        {skill.name}!
      </motion.div>

      {/* Burst rays */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%', top: '40%',
              width: 4, height: 80,
              borderRadius: 2,
              background: `linear-gradient(to bottom, ${colors.accent}, transparent)`,
              transformOrigin: '50% 0',
              transform: `rotate(${angle}rad)`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1, 0], opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.0, delay: 0.1 + i * 0.03 }}
          />
        );
      })}

      {/* Floating particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`sp-${i}`}
          style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
            borderRadius: '50%',
            background: i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.glow : colors.primary,
            boxShadow: `0 0 6px ${colors.glow}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{ duration: 1.5, delay: 0.2 + Math.random() * 0.3 }}
        />
      ))}
    </motion.div>
  );
}

export default function GameScreen() {
  const { dragon, progress, eating, mouthOpen, streak, wrongAnswer, currentQuestion, activeSkill, dispatch } = useGame();
  const version = useVersion();
  const isPixi = version === 'v2';
  const dragonRef = useRef(null);
  const numbersRef = useRef(null);

  if (!dragon) return null;
  const stageIndex = Math.min(4, Math.floor(progress * 5));

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-4 md:py-6">
      {/* Progress bar at top */}
      <div className="w-full max-w-2xl">
        <ProgressBar />
      </div>

      {/* Main game area — side by side on wide screens */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-12 w-full max-w-5xl mt-4">

        {/* Dragon display — fixed width prevents layout shift during chomp */}
        <div className="flex flex-col items-center" style={{ width: 540 }}>
          <div className="flex-shrink-0" ref={dragonRef}>
            {isPixi ? (
              <Suspense fallback={
                <DragonCave dragon={dragon} progress={progress}>
                  <DragonSVG dragon={dragon} progress={progress} size={440} chomping={mouthOpen} />
                </DragonCave>
              }>
                <DragonCave dragon={dragon} progress={progress}>
                  <DragonPixi
                    dragon={dragon}
                    progress={progress}
                    size={440}
                    chomping={mouthOpen}
                    streak={streak}
                    wrongAnswer={wrongAnswer}
                    DragonSVGComponent={DragonSVG}
                  />
                </DragonCave>
              </Suspense>
            ) : (
              <DragonCave dragon={dragon} progress={progress}>
                <DragonSVG dragon={dragon} progress={progress} size={440} chomping={mouthOpen} />
              </DragonCave>
            )}
          </div>

          {/* Stage name + description */}
          <motion.div
            className="text-center mt-1"
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-lg font-bold" style={{ color: dragon.colors.accent }}>
              {dragon.stages[stageIndex]?.name}
            </p>
            <p className="text-sm text-gray-400 italic">
              {dragon.stages[stageIndex]?.description}
            </p>
          </motion.div>

          {/* Skill bar below dragon */}
          <div className="mt-3">
            <SkillBar />
          </div>
        </div>

        {/* Question + input area — fixed width prevents layout shift */}
        <div ref={numbersRef} className="flex flex-col items-center justify-center lg:pt-12" style={{ width: 420 }}>
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
    </div>
  );
}
