import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function AnswerInput() {
  const { submitAnswer, wrongAnswer, currentQuestion, dragon, showMerge, newSkill } = useGame();
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const colors = dragon?.colors || { primary: '#fff', accent: '#fff', glow: '#fff' };

  // Focus input whenever a new question appears
  useEffect(() => {
    if (currentQuestion && !showMerge) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentQuestion, showMerge]);

  // Re-focus input when skill unlock popup closes
  useEffect(() => {
    if (newSkill === null && currentQuestion && !showMerge) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [newSkill, currentQuestion, showMerge]);

  // Clear value after wrong answer shake
  useEffect(() => {
    if (wrongAnswer) {
      setTimeout(() => setValue(''), 500);
    }
  }, [wrongAnswer]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value.trim() === '' || showMerge) return;
    submitAnswer(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Number pad buttons for touch/mobile
  const numberPad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'GO'];

  const handlePadPress = (key) => {
    if (key === 'C') {
      setValue('');
      inputRef.current?.focus();
    } else if (key === 'GO') {
      handleSubmit();
    } else {
      setValue(prev => prev + String(key));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Text input */}
      <motion.div
        className="flex items-center gap-3"
        animate={wrongAnswer ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={showMerge}
            placeholder="?"
            className="w-28 h-18 md:w-32 md:h-20 text-center text-4xl md:text-5xl font-black rounded-2xl border-3 outline-none transition-all"
            style={{
              background: `linear-gradient(180deg, #0c0c2e 0%, #08081e 100%)`,
              color: colors.accent,
              borderColor: wrongAnswer ? '#ef4444' : colors.primary + '80',
              boxShadow: wrongAnswer
                ? '0 0 25px #ef444466, inset 0 2px 8px rgba(0,0,0,0.5)'
                : `0 0 20px ${colors.glow}30, inset 0 2px 8px rgba(0,0,0,0.5), inset 0 -2px 6px ${colors.glow}10`,
              caretColor: colors.accent,
            }}
          />
          {/* Subtle inner glow ring */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            border: `1px solid ${colors.glow}15`,
            borderTop: `1px solid ${colors.glow}25`,
          }} />
        </div>
        <motion.button
          onClick={handleSubmit}
          disabled={showMerge || value.trim() === ''}
          className="h-18 md:h-20 px-8 md:px-10 text-2xl md:text-3xl font-black rounded-2xl text-white transition-all disabled:opacity-30"
          style={{
            background: `linear-gradient(180deg, ${colors.accent}dd 0%, ${colors.primary} 100%)`,
            boxShadow: `0 4px 20px ${colors.glow}60, 0 0 40px ${colors.glow}20, inset 0 1px 0 rgba(255,255,255,0.2)`,
            textShadow: `0 2px 6px rgba(0,0,0,0.4)`,
            letterSpacing: '2px',
          }}
          whileHover={{ scale: 1.08, boxShadow: `0 6px 30px ${colors.glow}80, 0 0 50px ${colors.glow}30` }}
          whileTap={{ scale: 0.92 }}
        >
          GO!
        </motion.button>
      </motion.div>

      {/* Number pad for mobile */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[280px] md:hidden">
        {numberPad.map((key) => (
          <motion.button
            key={key}
            onClick={() => handlePadPress(key)}
            disabled={showMerge}
            className="h-14 rounded-xl text-2xl font-black transition-all disabled:opacity-30"
            style={{
              background: key === 'GO'
                ? `linear-gradient(180deg, ${colors.accent}dd, ${colors.primary})`
                : key === 'C'
                  ? 'linear-gradient(180deg, #3a2020, #2a1515)'
                  : 'linear-gradient(180deg, #1e1e42, #14142e)',
              color: key === 'GO' ? '#fff' : key === 'C' ? '#ff6b6b' : colors.accent,
              border: `2px solid ${key === 'GO' ? colors.primary + '80' : '#2a2a5a'}`,
              boxShadow: key === 'GO'
                ? `0 3px 12px ${colors.glow}40`
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              textShadow: key === 'GO' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.88 }}
          >
            {key}
          </motion.button>
        ))}
      </div>

      {/* Feedback text */}
      <motion.div
        className="text-xl md:text-2xl font-bold h-8"
        animate={wrongAnswer ? { scale: [1, 1.2, 1] } : {}}
      >
        {wrongAnswer && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400"
          >
            Try again! You got this!
          </motion.span>
        )}
        {showMerge && (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: colors.accent }}
          >
            {['Amazing!', 'Great job!', 'You rock!', 'Awesome!', 'Super!', 'Fantastic!'][
              Math.floor(Math.random() * 6)
            ]}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
