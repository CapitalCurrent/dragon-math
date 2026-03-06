import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import DragonSVG from '../components/DragonSVG';
import FloatingNumbers from '../components/FloatingNumbers';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';

function DragonCave({ dragon, progress, children }) {
  const { primary, accent, glow } = dragon.colors;
  const isEgg = progress <= 0.15;
  return (
    <div className="relative" style={{ width: 540, height: 520, overflow: 'visible' }}>
      {/* Cave background */}
      <svg
        width="100%" height="100%" viewBox="0 0 540 520"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <radialGradient id="cave-bg" cx="50%" cy="55%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.06" />
            <stop offset="40%" stopColor="#0a0a1a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#050510" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="cave-glow" cx="50%" cy="90%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.15" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cave arch — wider and taller */}
        <path
          d="M 15 520 Q 15 100 110 45 Q 200 5 270 5 Q 340 5 430 45 Q 525 100 525 520"
          fill="url(#cave-bg)"
          stroke="#1a1a2e"
          strokeWidth="3"
        />

        {/* Inner cave shadow for depth */}
        <path
          d="M 40 520 Q 40 130 125 65 Q 210 28 270 28 Q 330 28 415 65 Q 500 130 500 520"
          fill="none"
          stroke={primary}
          strokeWidth="1"
          strokeOpacity="0.06"
        />

        {/* Rocky texture — stalactites */}
        <path d="M 55 140 L 64 180 L 48 142" fill="#12121f" opacity="0.6" />
        <path d="M 100 70 L 106 105 L 92 73" fill="#12121f" opacity="0.5" />
        <path d="M 440 70 L 447 103 L 433 73" fill="#12121f" opacity="0.5" />
        <path d="M 480 135 L 474 175 L 488 138" fill="#12121f" opacity="0.6" />
        <path d="M 160 32 L 166 58 L 154 35" fill="#12121f" opacity="0.4" />
        <path d="M 380 32 L 386 56 L 374 35" fill="#12121f" opacity="0.4" />
        <path d="M 210 15 L 214 35 L 206 17" fill="#12121f" opacity="0.3" />
        <path d="M 330 15 L 334 33 L 326 17" fill="#12121f" opacity="0.3" />

        {/* Ground / cave floor */}
        <ellipse cx="270" cy="495" rx="220" ry="22" fill="#0e0e1c" />
        <ellipse cx="270" cy="492" rx="200" ry="15" fill="#141428" />
        <ellipse cx="270" cy="489" rx="175" ry="8" fill="#1a1a35" />

        {/* Floor glow from dragon */}
        <ellipse cx="270" cy="488" rx="140" ry="18" fill="url(#cave-glow)" />

        {/* Scattered floor rocks */}
        <ellipse cx="75" cy="502" rx="14" ry="7" fill="#161625" />
        <ellipse cx="465" cy="504" rx="12" ry="6" fill="#161625" />
        <ellipse cx="150" cy="506" rx="9" ry="5" fill="#141422" />
        <ellipse cx="400" cy="505" rx="10" ry="5" fill="#141422" />

        {/* Accent glow on cave walls */}
        <ellipse cx="42" cy="320" rx="10" ry="50" fill={accent} opacity="0.04" />
        <ellipse cx="498" cy="320" rx="10" ry="50" fill={accent} opacity="0.04" />

        {/* Nest rocks — only visible during egg phase */}
        {isEgg && (
          <g>
            {/* Back rocks — taller, behind egg */}
            <ellipse cx="210" cy="458" rx="24" ry="30" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="330" cy="458" rx="22" ry="28" fill="#1a1a2e" stroke="#282845" strokeWidth="1" />
            <ellipse cx="235" cy="452" rx="20" ry="26" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            <ellipse cx="305" cy="453" rx="19" ry="25" fill="#1e1e34" stroke="#2a2a48" strokeWidth="0.8" />
            {/* Front rocks — overlap egg base */}
            <ellipse cx="220" cy="476" rx="22" ry="18" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="320" cy="477" rx="21" ry="17" fill="#222238" stroke="#2e2e4a" strokeWidth="1" />
            <ellipse cx="245" cy="482" rx="18" ry="14" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            <ellipse cx="295" cy="483" rx="17" ry="13" fill="#282842" stroke="#32325a" strokeWidth="0.8" />
            {/* Center front rock */}
            <ellipse cx="270" cy="486" rx="24" ry="12" fill="#252540" stroke="#30305a" strokeWidth="0.8" />
            {/* Pebbles */}
            <ellipse cx="195" cy="486" rx="8" ry="5" fill="#1c1c2e" />
            <ellipse cx="345" cy="487" rx="7" ry="4" fill="#1c1c2e" />
            {/* Warm glow from egg heat */}
            <ellipse cx="270" cy="472" rx="40" ry="14" fill={accent} opacity="0.06" />
            <ellipse cx="270" cy="468" rx="28" ry="10" fill={glow} opacity="0.04" />
          </g>
        )}
      </svg>

      {/* Dragon content — anchored to cave floor, can overflow out the top */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 24,
        display: 'flex', justifyContent: 'center',
        overflow: 'visible',
      }}>
        {children}
      </div>
    </div>
  );
}

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

        {/* Dragon display */}
        <div className="flex flex-col items-center">
          <div className="flex-shrink-0">
            <DragonCave dragon={dragon} progress={progress}>
              <DragonSVG
                dragon={dragon}
                progress={progress}
                size={440}
                chomping={showMerge}
              />
            </DragonCave>
          </div>

          {/* Stage name + description */}
          <motion.div
            className="text-center mt-1"
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

        {/* Question + input area — fixed width prevents layout shift */}
        <div className="flex flex-col items-center justify-center lg:pt-12" style={{ minWidth: 420 }}>
          <FloatingNumbers />
          <AnswerInput />
        </div>
      </div>
    </div>
  );
}
