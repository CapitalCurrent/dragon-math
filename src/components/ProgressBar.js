import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { QUESTIONS_PER_ROUND } from '../data/mathLevels';

export default function ProgressBar() {
  const { dragon, progress, correctAnswers, streak, accuracy } = useGame();
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
          {stage?.name}
        </span>
        <span className="text-sm text-gray-400">
          {correctAnswers} / {QUESTIONS_PER_ROUND}
        </span>
      </div>

      {/* Bar */}
      <div
        className="h-5 rounded-full overflow-hidden"
        style={{
          background: '#1a1a3a',
          border: `2px solid ${dragon.colors.primary}40`,
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${dragon.colors.glow}, ${dragon.colors.primary}, ${dragon.colors.accent})`,
            boxShadow: `0 0 10px ${dragon.colors.glow}`,
          }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
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
