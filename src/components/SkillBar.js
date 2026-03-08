import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

const CHARGE_NEEDED = 3;

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
    <div className="flex flex-wrap items-center justify-center gap-2 px-4">
      {dragon.skills.map((skill) => {
        const unlocked = unlockedSkills.includes(skill.name);
        const upcoming = !unlocked && progress >= skill.unlocksAt - 0.15;
        const charge = skillCharges[skill.name] || 0;
        const isCharged = charge >= CHARGE_NEEDED;
        const isActive = activeSkill?.name === skill.name;

        if (!unlocked && !upcoming) return null;

        return (
          <motion.button
            key={skill.name}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${dragon.colors.primary}, ${dragon.colors.glow})`
                : isCharged
                  ? `${dragon.colors.primary}40`
                  : unlocked ? '#1a1a2e' : '#111',
              border: `2px solid ${isCharged ? dragon.colors.accent : unlocked ? dragon.colors.primary + '60' : '#2a2a4a'}`,
              color: unlocked ? (isCharged ? '#fff' : dragon.colors.accent) : '#555',
              opacity: unlocked ? 1 : 0.35,
              cursor: isCharged && !showMerge ? 'pointer' : 'default',
              boxShadow: isCharged ? `0 0 15px ${dragon.colors.glow}40` : 'none',
            }}
            disabled={!isCharged || !!activeSkill || showMerge || !unlocked}
            onClick={() => handleSkillClick(skill)}
            animate={isCharged && !isActive ? {
              boxShadow: [`0 0 10px ${dragon.colors.glow}30`, `0 0 25px ${dragon.colors.glow}60`, `0 0 10px ${dragon.colors.glow}30`],
            } : isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={isCharged ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
            whileTap={isCharged ? { scale: 0.9 } : {}}
          >
            <span className="text-xl">{skill.icon}</span>
            <span className="hidden md:inline">{skill.name}</span>
            {/* Charge pips */}
            {unlocked && !isActive && (
              <div className="flex gap-0.5 ml-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: i < charge ? dragon.colors.accent : '#333',
                      boxShadow: i < charge ? `0 0 4px ${dragon.colors.glow}` : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.button>
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
