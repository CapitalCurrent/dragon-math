import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function SkillBar() {
  const { dragon, unlockedSkills, progress } = useGame();
  if (!dragon) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4">
      {dragon.skills.map((skill) => {
        const unlocked = unlockedSkills.includes(skill.name);
        const upcoming = !unlocked && progress >= skill.unlocksAt - 0.15;

        return (
          <motion.div
            key={skill.name}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: unlocked ? `${dragon.colors.primary}30` : '#1a1a2e',
              border: `2px solid ${unlocked ? dragon.colors.primary : '#2a2a4a'}`,
              color: unlocked ? dragon.colors.accent : '#555',
              opacity: unlocked ? 1 : upcoming ? 0.5 : 0.25,
            }}
            animate={unlocked ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="text-lg">{skill.icon}</span>
            <span className="hidden md:inline">{skill.name}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function SkillUnlockPopup() {
  const { newSkill, dragon, dispatch } = useGame();

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
