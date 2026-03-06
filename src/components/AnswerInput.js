import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function AnswerInput() {
  const { submitAnswer, wrongAnswer, currentQuestion, dragon, showMerge } = useGame();
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
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={showMerge}
          placeholder="?"
          className="w-24 h-16 md:w-28 md:h-18 text-center text-3xl md:text-4xl font-bold rounded-2xl border-4 outline-none transition-all"
          style={{
            background: '#0a0a2a',
            color: colors.accent,
            borderColor: wrongAnswer ? '#ef4444' : colors.primary,
            boxShadow: wrongAnswer
              ? '0 0 20px #ef444466'
              : `0 0 15px ${colors.glow}40`,
          }}
        />
        <motion.button
          onClick={handleSubmit}
          disabled={showMerge || value.trim() === ''}
          className="h-16 px-6 md:px-8 text-xl md:text-2xl font-bold rounded-2xl text-white transition-all disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.glow})`,
            boxShadow: `0 0 20px ${colors.glow}50`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          GO!
        </motion.button>
      </motion.div>

      {/* Number pad for mobile */}
      <div className="grid grid-cols-3 gap-2 max-w-[280px] md:hidden">
        {numberPad.map((key) => (
          <motion.button
            key={key}
            onClick={() => handlePadPress(key)}
            disabled={showMerge}
            className="h-14 rounded-xl text-2xl font-bold transition-all disabled:opacity-40"
            style={{
              background: key === 'GO'
                ? `linear-gradient(135deg, ${colors.primary}, ${colors.glow})`
                : key === 'C'
                  ? '#333'
                  : '#1a1a3a',
              color: key === 'GO' ? '#fff' : key === 'C' ? '#ff6b6b' : colors.accent,
              border: `2px solid ${key === 'GO' ? colors.primary : '#2a2a4a'}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
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
