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

// Standard math mode: the equation's answer bubble shows the digits; the app's own pad is the only
// pad (the phone keyboard never opens - it covered the question in portrait). Desktop types + Enter.
function MathInput({ onSubmit, showMerge, wrongAnswer, colors, newSkill, dispatch }) {
  const [value, setValue] = useState('');
  const set = (v) => { setValue(v); dispatch({ type: 'SET_ANSWER_DRAFT', value: v }); };

  useEffect(() => {
    if (!showMerge) set('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMerge]);

  useEffect(() => {
    if (wrongAnswer) setTimeout(() => set(''), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongAnswer]);

  const submit = () => {
    if (value.trim() === '' || showMerge) return;
    onSubmit(value.trim());
  };

  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'Enter' && newSkill) {
        dispatch({ type: 'CLEAR_SKILL_POPUP' });
        return;
      }
      if (showMerge) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); set(value.length < 3 ? value + e.key : value); }
      else if (e.key === 'Backspace') { e.preventDefault(); set(value.slice(0, -1)); }
      else if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSkill, showMerge, dispatch, value]);

  const numberPad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'GO'];
  const handlePadPress = (key) => {
    if (key === 'C') set('');
    else if (key === 'GO') submit();
    else if (value.length < 3) set(value + String(key));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="grid grid-cols-3 gap-2 w-[228px]"
        animate={wrongAnswer ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {numberPad.map((key) => (
          <motion.button
            key={key}
            onClick={() => handlePadPress(key)}
            disabled={showMerge || (key === 'GO' && value.trim() === '')}
            className="h-11 rounded-xl text-xl font-black transition-all disabled:opacity-30 select-none"
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
              WebkitTapHighlightColor: 'transparent',
            }}
            whileTap={{ scale: 0.88 }}
          >
            {key}
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        className="text-lg md:text-xl font-bold h-7"
        animate={wrongAnswer ? { scale: [1, 1.2, 1] } : {}}
      >
        {wrongAnswer && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400">
            Try again! You got this!
          </motion.span>
        )}
        {showMerge && (
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: colors.accent }}>
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
