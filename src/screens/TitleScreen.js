import React from 'react';
import { motion } from 'framer-motion';
import { useGame, SCREENS } from '../context/GameContext';
import { MATH_LEVELS } from '../data/mathLevels';

export default function TitleScreen() {
  const { dispatch, level } = useGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Animated dragon silhouette */}
      <motion.div
        className="text-8xl md:text-9xl mb-4"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🐉
      </motion.div>

      <motion.h1
        className="text-4xl md:text-6xl font-black mb-2"
        style={{
          background: 'linear-gradient(135deg, #ff6b35, #ffd54f, #4fc3f7, #9c27b0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Dragon Math
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-gray-300 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {typeof level === 'string' && level.startsWith('0')
          ? 'Count the trucks to hatch and grow your dragon!'
          : 'Answer math facts to hatch and grow your dragon!'}
        {' '}Unlock awesome dragon powers along the way!
      </motion.p>

      <motion.button
        className="px-10 py-4 rounded-2xl text-2xl md:text-3xl font-black text-white"
        style={{
          background: 'linear-gradient(135deg, #ff6b35, #ff9800)',
          boxShadow: '0 0 30px #ff6b3540, 0 8px 25px rgba(0,0,0,0.3)',
        }}
        whileHover={{ scale: 1.08, boxShadow: '0 0 40px #ff6b3570' }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={() => dispatch({ type: 'GO_TO_SCREEN', screen: SCREENS.SELECT_DRAGON })}
      >
        Start Adventure!
      </motion.button>

      {/* Level selector */}
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-2 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        {MATH_LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: level === lvl.id
                ? 'linear-gradient(135deg, #ff6b35, #ff9800)'
                : '#1a1a3a',
              color: level === lvl.id ? '#fff' : '#888',
              border: level === lvl.id ? '2px solid #ff9800' : '2px solid #333',
            }}
            onClick={() => dispatch({ type: 'SET_LEVEL', level: lvl.id })}
            title={lvl.description}
          >
            {lvl.name}
          </button>
        ))}
      </motion.div>

      {/* Floating decorative elements */}
      {['✨', '⚡', '❄️', '🔥', '💎', '🌟'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-40"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}
