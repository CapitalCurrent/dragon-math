import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { MATH_LEVELS, QUESTIONS_PER_ROUND } from '../data/mathLevels';

export default function ProgressBar() {
  const { dragon, progress, correctAnswers, streak, accuracy, level, skillBoost } = useGame();
  const levelData = MATH_LEVELS[level - 1];
  if (!dragon) return null;

  const stageIndex = Math.min(4, Math.floor(progress * 5));
  const stage = dragon.stages[stageIndex];

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Stage name */}
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-sm font-bold"
          style={{ color: dragon.colors.accent }}
        >
          {levelData?.name || stage?.name}
        </span>
        <div className="flex items-center gap-2">
          {/* 2x boost indicator */}
          <AnimatePresence>
            {skillBoost && (
              <motion.span
                className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${dragon.colors.primary}, ${dragon.colors.glow})`,
                  color: '#fff',
                  boxShadow: `0 0 10px ${dragon.colors.glow}60`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                2X
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-sm text-gray-400">
            {correctAnswers} / {QUESTIONS_PER_ROUND}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div
        className="h-5 rounded-full overflow-hidden relative"
        style={{
          background: '#1a1a3a',
          border: `2px solid ${dragon.colors.primary}40`,
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3)`,
        }}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, ${dragon.colors.glow}, ${dragon.colors.primary}, ${dragon.colors.accent})`,
            boxShadow: `0 0 10px ${dragon.colors.glow}`,
          }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          {/* Sheen highlight */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            borderRadius: '9999px 9999px 0 0',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)',
          }} />
        </motion.div>
      </div>

      {/* Stats row */}
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Accuracy: {accuracy}%</span>
        {streak > 2 && (
          <motion.span
            style={{ color: dragon.colors.accent }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {streak} streak!
          </motion.span>
        )}
      </div>
    </div>
  );
}
