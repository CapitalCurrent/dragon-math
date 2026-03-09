import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

// Counting mode: big auto-submit number buttons + keyboard number keys
function CountingInput({ onSubmit, showMerge, wrongAnswer, colors, level }) {
  // Determine which numbers to show based on level
  const maxNum = level === '0a' ? 5 : 10;
  const numbers = Array.from({ length: maxNum }, (_, i) => i + 1);

  const handleTap = (num) => {
    if (showMerge) return;
    onSubmit(String(num));
  };

  // Keyboard support — number keys auto-submit immediately
  useEffect(() => {
    const handleKey = (e) => {
      if (showMerge) return;
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= maxNum) {
        e.preventDefault();
        onSubmit(String(num));
      }
      // Also support "0" key for 10 (shift+0 or just 0 when maxNum is 10)
      if (e.key === '0' && maxNum === 10) {
        e.preventDefault();
        onSubmit('10');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showMerge, maxNum, onSubmit]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Number buttons — large, toddler-friendly */}
      <motion.div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(5, numbers.length)}, 1fr)`,
          maxWidth: 400,
          width: '100%',
        }}
        animate={wrongAnswer ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {numbers.map((num) => (
          <motion.button
            key={num}
            onClick={() => handleTap(num)}
            disabled={showMerge}
            className="aspect-square rounded-2xl text-3xl md:text-4xl font-black transition-all disabled:opacity-40"
            style={{
              background: `linear-gradient(180deg, #1e1e42 0%, #14142e 100%)`,
              color: colors.accent,
              border: `3px solid ${colors.primary}50`,
              boxShadow: `0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
              minWidth: 56,
              minHeight: 56,
            }}
            whileHover={{ scale: 1.1, borderColor: colors.primary }}
            whileTap={{ scale: 0.85, background: colors.primary }}
          >
            {num}
          </motion.button>
        ))}
      </motion.div>

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
            Try again!
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

// Standard math mode: text input + number pad + GO button
function MathInput({ onSubmit, showMerge, wrongAnswer, colors, newSkill, dispatch }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showMerge) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showMerge]);

  useEffect(() => {
    if (newSkill === null && !showMerge) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [newSkill, showMerge]);

  useEffect(() => {
    if (wrongAnswer) {
      setTimeout(() => setValue(''), 500);
    }
  }, [wrongAnswer]);

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'Enter' && newSkill) {
        dispatch({ type: 'CLEAR_SKILL_POPUP' });
        return;
      }
      if (document.activeElement === inputRef.current) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        inputRef.current?.focus();
        setValue(prev => prev + e.key);
      }
      if (e.key === 'Enter' && !showMerge) inputRef.current?.focus();
      if (e.key === 'Backspace') inputRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [newSkill, showMerge, dispatch]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (value.trim() === '' || showMerge) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

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

export default function AnswerInput() {
  const { submitAnswer, wrongAnswer, currentQuestion, dragon, showMerge, newSkill, dispatch, level } = useGame();
  const colors = dragon?.colors || { primary: '#fff', accent: '#fff', glow: '#fff' };
  const isCounting = currentQuestion?.type === 'counting';

  if (isCounting) {
    return (
      <CountingInput
        onSubmit={submitAnswer}
        showMerge={showMerge}
        wrongAnswer={wrongAnswer}
        colors={colors}
        level={level}
      />
    );
  }

  return (
    <MathInput
      onSubmit={submitAnswer}
      showMerge={showMerge}
      wrongAnswer={wrongAnswer}
      colors={colors}
      newSkill={newSkill}
      dispatch={dispatch}
    />
  );
}
