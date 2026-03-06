import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import DragonSVG from '../components/DragonSVG';

export default function VictoryScreen() {
  const { dragon, accuracy, bestStreak, correctAnswers, questionsAnswered, dispatch } = useGame();

  if (!dragon) return null;

  const perfect = accuracy >= 95;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      {/* Big celebration */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      >
        <DragonSVG dragon={dragon} progress={1} size={450} />
      </motion.div>

      <motion.h1
        className="text-4xl md:text-5xl font-black mt-4 mb-2"
        style={{
          background: `linear-gradient(135deg, ${dragon.colors.primary}, ${dragon.colors.accent})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {dragon.stages[4].name} Complete!
      </motion.h1>

      <motion.p
        className="text-xl text-gray-300 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {dragon.stages[4].description}
      </motion.p>

      {/* Stats card */}
      <motion.div
        className="rounded-2xl p-6 max-w-sm w-full mb-6"
        style={{
          background: `linear-gradient(135deg, #1a1a3a, ${dragon.colors.primary}15)`,
          border: `2px solid ${dragon.colors.primary}40`,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="grid grid-cols-2 gap-4">
          <StatItem label="Correct" value={correctAnswers} color={dragon.colors.accent} />
          <StatItem label="Total" value={questionsAnswered} color="#aaa" />
          <StatItem label="Accuracy" value={`${accuracy}%`} color={perfect ? '#4caf50' : '#ff9800'} />
          <StatItem label="Best Streak" value={bestStreak} color={dragon.colors.primary} />
        </div>

        {perfect && (
          <motion.div
            className="mt-4 text-lg font-bold text-green-400"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            95%+ Mastery Achieved!
          </motion.div>
        )}
      </motion.div>

      {/* Unlocked skills recap */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        {dragon.skills.map((skill, i) => (
          <motion.div
            key={skill.name}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
            style={{
              background: `${dragon.colors.primary}25`,
              border: `2px solid ${dragon.colors.primary}`,
              color: dragon.colors.accent,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + i * 0.15 }}
          >
            <span>{skill.icon}</span>
            <span>{skill.name}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Play again */}
      <motion.button
        className="px-10 py-4 rounded-2xl text-xl font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${dragon.colors.primary}, ${dragon.colors.glow})`,
          boxShadow: `0 0 30px ${dragon.colors.glow}40`,
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
      >
        Play Again - New Dragon!
      </motion.button>

      {/* Floating celebration emojis */}
      {['🎉', '⭐', '🏆', '🐉', '✨', '🎊'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${10 + i * 15}%`,
            bottom: '10%',
          }}
          animate={{
            y: [0, -200, -400],
            opacity: [0, 1, 0],
            x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
