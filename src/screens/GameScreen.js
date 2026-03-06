import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import DragonSVG from '../components/DragonSVG';
import FloatingNumbers from '../components/FloatingNumbers';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';

export default function GameScreen() {
  const { dragon, progress, showMerge } = useGame();

  if (!dragon) return null;

  const stageIndex = Math.min(4, Math.floor(progress * 5));

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-4 md:py-6">
      {/* Progress bar at top */}
      <div className="w-full max-w-2xl">
        <ProgressBar />
      </div>

      {/* Main game area — side by side on wide screens */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-12 w-full max-w-5xl mt-4">

        {/* Dragon display — big and prominent */}
        <div className="flex flex-col items-center">
          <motion.div
            className="flex-shrink-0"
            layout
          >
            <DragonSVG
              dragon={dragon}
              progress={progress}
              size={420}
              chomping={showMerge}
            />
          </motion.div>

          {/* Stage name + description */}
          <motion.div
            className="text-center mt-2"
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-lg font-bold" style={{ color: dragon.colors.accent }}>
              {dragon.stages[stageIndex]?.name}
            </p>
            <p className="text-sm text-gray-400 italic">
              {dragon.stages[stageIndex]?.description}
            </p>
          </motion.div>

          {/* Skill bar below dragon */}
          <div className="mt-3">
            <SkillBar />
          </div>
        </div>

        {/* Question + input area */}
        <div className="flex flex-col items-center justify-center lg:pt-12">
          <FloatingNumbers />
          <AnswerInput />
        </div>
      </div>
    </div>
  );
}
