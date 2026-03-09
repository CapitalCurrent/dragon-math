import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { DRAGON_LIST } from '../data/dragons';

import DragonSVG from '../components/DragonSVG';

export default function DragonSelectScreen() {
  const { selectDragon, level } = useGame();
  const isCounting = typeof level === 'string' && level.startsWith('0');

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <motion.h1
        className="text-3xl md:text-4xl font-black text-white mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Choose Your Egg!
      </motion.h1>
      <motion.p
        className="text-gray-400 mb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isCounting ? 'Count the trucks to hatch your dragon!' : 'Answer math facts to hatch your dragon and help it grow!'}
      </motion.p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {DRAGON_LIST.map((dragon, index) => (
          <motion.button
            key={dragon.id}
            className="flex flex-col items-center p-5 rounded-2xl transition-all"
            style={{
              background: `linear-gradient(135deg, #0a0a2a, ${dragon.colors.primary}15)`,
              border: `3px solid ${dragon.colors.primary}40`,
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              scale: 1.05,
              borderColor: dragon.colors.primary,
              boxShadow: `0 0 30px ${dragon.colors.glow}35`,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectDragon(dragon.id)}
          >
            {/* Egg preview */}
            <div className="mb-3">
              <DragonSVG dragon={dragon} progress={0} size={150} />
            </div>

            <h3
              className="text-lg font-bold"
              style={{ color: dragon.colors.accent }}
            >
              {dragon.name}
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              {dragon.stages[0].description}
            </p>

            {/* Skill preview */}
            <div className="flex gap-1.5 mt-2">
              {dragon.skills.map((skill) => (
                <span key={skill.name} className="text-sm opacity-40" title={skill.name}>
                  {skill.icon}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
