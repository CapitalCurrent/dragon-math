import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

const DEFAULT_COLORS = { primary: '#fff', secondary: '#ccc', accent: '#ff0', glow: '#fff' };

// Skill effect configs — what happens to the numbers before the dragon eats them
const SKILL_EFFECTS = {
  ember: { emoji: '🔥', label: 'Fire!', bg: '#ff6b35', anim: 'burn' },
  frost: { emoji: '❄️', label: 'Freeze!', bg: '#4fc3f7', anim: 'freeze' },
  stone: { emoji: '🪨', label: 'Smash!', bg: '#8bc34a', anim: 'smash' },
  shadow: { emoji: '⚡', label: 'Zap!', bg: '#9c27b0', anim: 'zap' },
  glimmer: { emoji: '✨', label: 'Shine!', bg: '#ffd54f', anim: 'shine' },
  storm: { emoji: '🌩️', label: 'Thunder!', bg: '#29b6f6', anim: 'storm' },
};

// Floating number bubbles → skill effect → merge → fly to dragon
export default function FloatingNumbers() {
  const { currentQuestion, showMerge, dragon, unlockedSkills } = useGame();
  const [particles, setParticles] = useState([]);
  const [phase, setPhase] = useState('question'); // question → skill → merge → eat
  const [skillEffect, setSkillEffect] = useState(null);

  const colors = useMemo(() => dragon?.colors || DEFAULT_COLORS, [dragon]);
  const hasSkill = unlockedSkills && unlockedSkills.length > 0;
  const latestSkill = dragon?.skills?.filter(s => unlockedSkills?.includes(s.name)).pop();

  // Handle the answer sequence: skill → merge → eat
  useEffect(() => {
    if (showMerge) {
      if (hasSkill && dragon) {
        // Phase 1: Skill attack on numbers
        setPhase('skill');
        setSkillEffect(SKILL_EFFECTS[dragon.id]);
        setTimeout(() => {
          // Phase 2: Numbers merge into answer
          setPhase('merge');
          setSkillEffect(null);
          // Spawn particles
          spawnParticles();
          setTimeout(() => {
            // Phase 3: Answer flies up toward dragon
            setPhase('eat');
          }, 600);
        }, 800);
      } else {
        // No skills yet — just merge and eat
        setPhase('merge');
        spawnParticles();
        setTimeout(() => setPhase('eat'), 600);
      }
    } else {
      setPhase('question');
      setSkillEffect(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMerge]);

  function spawnParticles() {
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      dx: (Math.random() - 0.5) * 140,
      dy: (Math.random() - 0.5) * 140 - 30,
      color: [colors.primary, colors.accent, colors.secondary, '#fff'][i % 4],
      size: 4 + Math.random() * 6,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }

  if (!currentQuestion) return null;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[180px] my-4">
      <AnimatePresence mode="wait">
        {/* === QUESTION PHASE: floating number bubbles === */}
        {phase === 'question' && (
          <motion.div
            key={`q-${currentQuestion.display}`}
            className="flex items-center gap-3 md:gap-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4 }}
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

        {/* === SKILL PHASE: dragon's power attacks the numbers === */}
        {phase === 'skill' && skillEffect && (
          <motion.div
            key="skill"
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Numbers being affected by skill */}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
                style={{ background: colors.primary, boxShadow: `0 0 20px ${skillEffect.bg}` }}
                animate={{
                  scale: [1, 0.8, 1.1, 0.9],
                  rotate: skillEffect.anim === 'zap' ? [0, -15, 15, 0] : [0, 5, -5, 0],
                  filter: [
                    'brightness(1)',
                    `brightness(2) drop-shadow(0 0 10px ${skillEffect.bg})`,
                    'brightness(1.5)',
                  ],
                }}
                transition={{ duration: 0.6 }}
              >
                {currentQuestion.a}
              </motion.div>

              <motion.span className="text-3xl" style={{ color: colors.accent }}>
                {currentQuestion.op}
              </motion.span>

              <motion.div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
                style={{ background: colors.secondary, boxShadow: `0 0 20px ${skillEffect.bg}` }}
                animate={{
                  scale: [1, 0.8, 1.1, 0.9],
                  rotate: skillEffect.anim === 'zap' ? [0, 15, -15, 0] : [0, -5, 5, 0],
                  filter: [
                    'brightness(1)',
                    `brightness(2) drop-shadow(0 0 10px ${skillEffect.bg})`,
                    'brightness(1.5)',
                  ],
                }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {currentQuestion.b}
              </motion.div>
            </div>

            {/* Skill effect overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.8], scale: [0.5, 1.3, 1] }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-6xl">{skillEffect.emoji}</span>
            </motion.div>

            {/* Skill name flash */}
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

        {/* === MERGE PHASE: numbers combine into answer === */}
        {phase === 'merge' && (
          <motion.div
            key="merge"
            className="flex items-center justify-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5, y: -80, opacity: 0 }}
            transition={{ exit: { duration: 0.5, ease: 'easeIn' } }}
          >
            <motion.div
              className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${colors.accent}, ${colors.primary})`,
                color: '#fff',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}40`,
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {currentQuestion.answer}
            </motion.div>
          </motion.div>
        )}

        {/* === EAT PHASE: answer flies up to dragon === */}
        {phase === 'eat' && (
          <motion.div
            key="eat"
            className="flex items-center justify-center"
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-xl"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${colors.accent}, ${colors.primary})`,
                color: '#fff',
                textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                boxShadow: `0 0 20px ${colors.glow}`,
              }}
              initial={{ scale: 1, y: 0, opacity: 1 }}
              animate={{
                y: -180,
                scale: 0.3,
                opacity: 0,
              }}
              transition={{ duration: 0.6, ease: 'easeIn' }}
            >
              {currentQuestion.answer}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{ background: p.color, width: p.size, height: p.size }}
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
        background: `radial-gradient(circle at 30% 30%, ${color}88, ${color})`,
        color: '#fff',
        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
        boxShadow: `0 0 20px ${glow}60`,
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
