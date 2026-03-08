import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

const DEFAULT_COLORS = { primary: '#fff', secondary: '#ccc', accent: '#ff0', glow: '#fff' };

// Skill effect configs — what happens to the answer after numbers join
const SKILL_EFFECTS = {
  ember: { emoji: '🔥', label: 'Fire!', bg: '#ff6b35' },
  frost: { emoji: '❄️', label: 'Freeze!', bg: '#4fc3f7' },
  stone: { emoji: '🪨', label: 'Smash!', bg: '#8bc34a' },
  shadow: { emoji: '⚡', label: 'Zap!', bg: '#9c27b0' },
  glimmer: { emoji: '✨', label: 'Shine!', bg: '#ffd54f' },
  storm: { emoji: '🌩️', label: 'Thunder!', bg: '#29b6f6' },
};

// Phases: question → joining → skill → eat
export default function FloatingNumbers() {
  const { currentQuestion, showMerge, dragon, unlockedSkills, dispatch } = useGame();
  const [particles, setParticles] = useState([]);
  const [phase, setPhase] = useState('question');
  const [skillEffect, setSkillEffect] = useState(null);

  const colors = useMemo(() => dragon?.colors || DEFAULT_COLORS, [dragon]);
  const hasSkill = unlockedSkills && unlockedSkills.length > 0;
  const latestSkill = dragon?.skills?.filter(s => unlockedSkills?.includes(s.name)).pop();

  // Sequence: numbers join → skill attack → eat
  useEffect(() => {
    if (showMerge) {
      // Phase 1: Numbers slide together and merge
      setPhase('joining');
      spawnParticles();

      const joinDuration = 700; // Tighter join
      const t1 = setTimeout(() => {
        if (hasSkill && dragon) {
          // Phase 2: Dragon skill attacks the answer
          setPhase('skill');
          setSkillEffect(SKILL_EFFECTS[dragon.id]);
          // Open mouth while skill plays, then start eating
          const t2 = setTimeout(() => {
            dispatch({ type: 'OPEN_MOUTH' });
          }, 400);
          const t3 = setTimeout(() => {
            setPhase('eat');
            setSkillEffect(null);
            dispatch({ type: 'START_EATING' });
          }, 800);
          return () => { clearTimeout(t2); clearTimeout(t3); };
        } else {
          // No skills yet — open mouth first, then answer flies in
          setPhase('chomp');
          dispatch({ type: 'OPEN_MOUTH' });
          const t2 = setTimeout(() => {
            setPhase('eat');
            dispatch({ type: 'START_EATING' });
          }, 500);
          return () => clearTimeout(t2);
        }
      }, joinDuration);

      return () => clearTimeout(t1);
    } else {
      setPhase('question');
      setSkillEffect(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMerge]);

  function spawnParticles() {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      dx: (Math.random() - 0.5) * 160,
      dy: (Math.random() - 0.5) * 160 - 30,
      color: [colors.primary, colors.accent, colors.secondary, '#fff'][i % 4],
      size: 3 + Math.random() * 7,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }

  if (!currentQuestion) return null;

  return (
    <div className="relative flex flex-col items-center justify-center my-4" style={{ height: 180, width: 420 }}>
      <AnimatePresence mode="wait">
        {/* === QUESTION PHASE: floating number bubbles === */}
        {phase === 'question' && (
          <motion.div
            key={`q-${currentQuestion.display}`}
            className="flex items-center gap-3 md:gap-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <NumberBubble value={currentQuestion.a} color={colors.primary} glow={colors.glow} delay={0} />
            <motion.span className="text-4xl md:text-5xl font-bold" style={{ color: colors.accent }}
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              {currentQuestion.op}
            </motion.span>
            <NumberBubble value={currentQuestion.b} color={colors.secondary} glow={colors.glow} delay={0.2} />
            <motion.span className="text-4xl md:text-5xl font-bold text-white">=</motion.span>
            <motion.div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold border-4 border-dashed"
              style={{ borderColor: colors.accent, color: colors.accent }}
              animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ?
            </motion.div>
          </motion.div>
        )}

        {/* === JOINING PHASE: numbers slide together and merge into answer === */}
        {phase === 'joining' && (
          <motion.div
            key="joining"
            className="relative flex items-center justify-center"
            style={{ width: 300, height: 120 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Left number slides right */}
            <motion.div
              className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.primary}88, ${colors.primary})`,
                boxShadow: `0 0 15px ${colors.glow}60, inset 0 -3px 8px ${colors.glow}20`,
              }}
              initial={{ x: -80, scale: 1, opacity: 1 }}
              animate={{ x: 0, scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            >
              {currentQuestion.a}
            </motion.div>

            {/* Operator fades */}
            <motion.span
              className="absolute text-3xl font-bold"
              style={{ color: colors.accent }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
            >
              {currentQuestion.op}
            </motion.span>

            {/* Right number slides left */}
            <motion.div
              className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.secondary}88, ${colors.secondary})`,
                boxShadow: `0 0 15px ${colors.glow}60, inset 0 -3px 8px ${colors.glow}20`,
              }}
              initial={{ x: 80, scale: 1, opacity: 1 }}
              animate={{ x: 0, scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            >
              {currentQuestion.b}
            </motion.div>

            {/* Answer forms in the center after numbers merge */}
            <motion.div
              className="absolute w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}40, inset 0 -6px 16px ${colors.glow}30`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            >
              {currentQuestion.answer}
            </motion.div>

            {/* Flash burst when they merge */}
            <motion.div
              className="absolute w-36 h-36 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow}90, ${colors.accent}50, transparent 70%)`,
                pointerEvents: 'none',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 2.5], opacity: [0, 0.9, 0] }}
              transition={{ delay: 0.25, duration: 0.5 }}
            />
          </motion.div>
        )}

        {/* === SKILL PHASE: dragon's power hits the answer === */}
        {phase === 'skill' && skillEffect && (
          <motion.div
            key="skill"
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Answer bubble being hit by skill */}
            <motion.div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                boxShadow: `0 0 30px ${skillEffect.bg}, inset 0 -6px 16px ${colors.glow}30`,
              }}
              animate={{
                scale: [1, 0.85, 1.15, 0.95, 1],
                rotate: [0, -8, 8, -4, 0],
                filter: [
                  'brightness(1)',
                  `brightness(2) drop-shadow(0 0 15px ${skillEffect.bg})`,
                  'brightness(1.5)',
                  `brightness(1.8) drop-shadow(0 0 10px ${skillEffect.bg})`,
                  'brightness(1)',
                ],
              }}
              transition={{ duration: 0.6 }}
            >
              {currentQuestion.answer}
            </motion.div>

            {/* Skill emoji burst */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.8, 0], scale: [0.5, 1.5, 1.2, 0.8] }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-6xl">{skillEffect.emoji}</span>
            </motion.div>

            {/* Skill name */}
            <motion.div
              className="text-lg font-black tracking-wider"
              style={{ color: skillEffect.bg, textShadow: `0 0 15px ${skillEffect.bg}` }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0, 1, 0.7], y: 0 }}
            >
              {latestSkill?.name || skillEffect.label}
            </motion.div>
          </motion.div>
        )}

        {/* === CHOMP PHASE: dragon tugs the answer toward itself === */}
        {phase === 'chomp' && (
          <motion.div
            key="chomp"
            className="flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <motion.div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                boxShadow: `0 0 30px ${colors.glow}, inset 0 -6px 16px ${colors.glow}30`,
              }}
              animate={{
                scale: [1, 1.15, 0.9, 1.1, 1],
                x: [0, 5, -15, -8, -20],
                y: [0, 5, -20, -10, -30],
                rotate: [0, -5, 5, -3, 0],
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              {currentQuestion.answer}
            </motion.div>
          </motion.div>
        )}

        {/* EAT PHASE: answer disappears here, flies via GameScreen overlay */}
        {phase === 'eat' && (
          <motion.div key="eat" initial={{ opacity: 0 }} animate={{ opacity: 0 }} />
        )}
      </AnimatePresence>

      {/* Celebration particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              background: p.color,
              width: p.size,
              height: p.size,
              boxShadow: `0 0 4px ${p.color}`,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: p.dx, y: p.dy, scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NumberBubble({ value, color, glow, delay }) {
  return (
    <motion.div
      className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl font-black shadow-xl"
      style={{
        background: `radial-gradient(circle at 35% 35%, ${color}aa, ${color})`,
        color: '#fff',
        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
        boxShadow: `0 0 20px ${glow}60, inset 0 -4px 12px ${glow}25, inset 0 2px 6px rgba(255,255,255,0.15)`,
      }}
      initial={{ scale: 0, y: 40 }}
      animate={{ scale: 1, y: [0, -8, 0] }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 15, delay },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 },
      }}
    >
      {value}
    </motion.div>
  );
}
