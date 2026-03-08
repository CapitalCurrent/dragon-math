import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

const CHARGE_NEEDED = 3;

// SVG ring gauge that fills around the skill button
function ChargeRing({ charge, maxCharge, colors, isCharged, size = 64 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (charge / maxCharge) * circumference;
  const gap = circumference - filled;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="3"
      />
      {/* Filled arc */}
      {charge > 0 && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isCharged ? colors.accent : colors.primary}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          strokeDashoffset={circumference * 0.25}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${filled} ${gap}` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: isCharged ? `drop-shadow(0 0 4px ${colors.glow})` : 'none',
          }}
        />
      )}
      {/* Charged glow overlay */}
      {isCharged && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.glow}
          strokeWidth="2"
          opacity="0.4"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// Individual pip indicators below the ring (subtle secondary indicator)
function ChargePips({ charge, maxCharge, colors }) {
  return (
    <div className="flex gap-1 justify-center mt-0.5">
      {Array.from({ length: maxCharge }, (_, i) => (
        <motion.div
          key={i}
          style={{
            width: 8,
            height: 3,
            borderRadius: 2,
            background: i < charge ? colors.accent : '#222',
            boxShadow: i < charge ? `0 0 6px ${colors.glow}` : 'none',
          }}
          initial={false}
          animate={i === charge - 1 && charge > 0 ? { scale: [1, 1.5, 1] } : {}}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export default function SkillBar() {
  const { dragon, unlockedSkills, progress, skillCharges, activeSkill, showMerge, dispatch } = useGame();
  if (!dragon) return null;

  const handleSkillClick = (skill) => {
    const charge = skillCharges[skill.name] || 0;
    if (charge >= CHARGE_NEEDED && !activeSkill && !showMerge) {
      dispatch({ type: 'USE_SKILL', skill });
    }
  };

  return (
    <div className="flex flex-wrap items-start justify-center gap-3 px-4">
      {dragon.skills.map((skill) => {
        const unlocked = unlockedSkills.includes(skill.name);
        const upcoming = !unlocked && progress >= skill.unlocksAt - 0.15;
        const charge = skillCharges[skill.name] || 0;
        const isCharged = charge >= CHARGE_NEEDED;
        const isActive = activeSkill?.name === skill.name;

        if (!unlocked && !upcoming) return null;

        const btnSize = 64;

        return (
          <div key={skill.name} className="flex flex-col items-center">
            {/* Ring + button container */}
            <motion.button
              className="relative flex items-center justify-center"
              style={{
                width: btnSize,
                height: btnSize,
                borderRadius: '50%',
                background: isActive
                  ? `linear-gradient(135deg, ${dragon.colors.primary}, ${dragon.colors.glow})`
                  : isCharged
                    ? `radial-gradient(circle at 40% 40%, ${dragon.colors.primary}50, ${dragon.colors.primary}20)`
                    : unlocked ? '#0e0e1e' : '#0a0a14',
                border: 'none',
                color: unlocked ? (isCharged ? '#fff' : dragon.colors.accent) : '#444',
                opacity: unlocked ? 1 : 0.3,
                cursor: isCharged && !showMerge ? 'pointer' : 'default',
                outline: 'none',
              }}
              disabled={!isCharged || !!activeSkill || showMerge || !unlocked}
              onClick={() => handleSkillClick(skill)}
              animate={
                isCharged && !isActive
                  ? {
                      boxShadow: [
                        `0 0 8px ${dragon.colors.glow}30, 0 0 16px ${dragon.colors.glow}10`,
                        `0 0 16px ${dragon.colors.glow}60, 0 0 32px ${dragon.colors.glow}20`,
                        `0 0 8px ${dragon.colors.glow}30, 0 0 16px ${dragon.colors.glow}10`,
                      ],
                    }
                  : isActive
                    ? { scale: [1, 1.15, 1] }
                    : {}
              }
              transition={isCharged ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
              whileTap={isCharged ? { scale: 0.85 } : {}}
            >
              {/* Ring gauge */}
              {unlocked && !isActive && (
                <ChargeRing
                  charge={charge}
                  maxCharge={CHARGE_NEEDED}
                  colors={dragon.colors}
                  isCharged={isCharged}
                  size={btnSize}
                />
              )}

              {/* Skill icon */}
              <motion.span
                style={{ fontSize: 28, position: 'relative', zIndex: 1 }}
                animate={isCharged && !isActive ? { scale: [1, 1.12, 1] } : {}}
                transition={isCharged ? { duration: 1.5, repeat: Infinity } : {}}
              >
                {skill.icon}
              </motion.span>

              {/* "TAP!" label when charged */}
              <AnimatePresence>
                {isCharged && !isActive && (
                  <motion.span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 9,
                      fontWeight: 900,
                      color: dragon.colors.accent,
                      textShadow: `0 0 6px ${dragon.colors.glow}`,
                      letterSpacing: 1,
                      whiteSpace: 'nowrap',
                      zIndex: 2,
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: [0.7, 1, 0.7], y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    TAP!
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Charge pips below */}
            {unlocked && !isActive && (
              <ChargePips charge={charge} maxCharge={CHARGE_NEEDED} colors={dragon.colors} />
            )}

            {/* Skill name */}
            <span
              style={{
                fontSize: 10,
                color: unlocked ? dragon.colors.accent + 'aa' : '#444',
                marginTop: 2,
                fontWeight: 600,
                maxWidth: btnSize + 10,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {skill.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SkillUnlockPopup() {
  const { newSkill, dragon, dispatch } = useGame();

  // Close on Enter/Escape key
  React.useEffect(() => {
    if (!newSkill) return;
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        dispatch({ type: 'CLEAR_SKILL_POPUP' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [newSkill, dispatch]);

  // Auto-close after 3 seconds
  React.useEffect(() => {
    if (!newSkill) return;
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_SKILL_POPUP' }), 3000);
    return () => clearTimeout(timer);
  }, [newSkill, dispatch]);

  return (
    <AnimatePresence>
      {newSkill && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch({ type: 'CLEAR_SKILL_POPUP' })}
        >
          <motion.div
            className="text-center p-8 rounded-3xl max-w-sm mx-4"
            style={{
              background: `linear-gradient(135deg, #1a1a3a, ${dragon?.colors.primary}20)`,
              border: `3px solid ${dragon?.colors.primary}`,
              boxShadow: `0 0 40px ${dragon?.colors.glow}40`,
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: 2 }}
            >
              {newSkill.icon}
            </motion.div>
            <h2
              className="text-2xl font-black mb-2"
              style={{ color: dragon?.colors.accent }}
            >
              New Skill Unlocked!
            </h2>
            <p className="text-3xl font-bold text-white mb-2">{newSkill.name}</p>
            <p className="text-lg text-gray-300 mb-6">{newSkill.description}</p>
            <motion.button
              className="px-8 py-3 rounded-xl text-lg font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${dragon?.colors.primary}, ${dragon?.colors.glow})`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch({ type: 'CLEAR_SKILL_POPUP' })}
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
