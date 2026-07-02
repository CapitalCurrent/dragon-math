import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

// Arrange vehicles in rows for easy counting
// 1-5: single row, 6-10: two rows (top row = first half, bottom row = rest)
function getLayout(count) {
  if (count <= 5) return [count];
  const top = Math.ceil(count / 2);
  return [top, count - top];
}

export default function TruckCounting() {
  const { currentQuestion, showMerge, dragon, dispatch } = useGame();
  const colors = dragon?.colors || { accent: '#fff', glow: '#fff', primary: '#fff' };
  const [phase, setPhase] = useState('question'); // question | flyAway | done

  const layout = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== 'counting') return [];
    return getLayout(currentQuestion.count);
  }, [currentQuestion]);

  // When correct answer: celebration → open mouth → trucks fly to dragon
  useEffect(() => {
    if (showMerge) {
      setPhase('celebrate');
      // Brief celebration, then trucks fly away to dragon
      const t1 = setTimeout(() => {
        dispatch({ type: 'OPEN_MOUTH' });
      }, 400);
      const t2 = setTimeout(() => {
        setPhase('flyAway');
        dispatch({ type: 'START_EATING' });
      }, 700);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setPhase('question');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMerge]);

  if (!currentQuestion || currentQuestion.type !== 'counting') return null;

  const { vehicle, count } = currentQuestion;
  let itemIndex = 0;

  return (
    <div className="flex flex-col items-center w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${count}-${vehicle.emoji}-${currentQuestion._id || ''}`}
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* "How many?" prompt */}
          <motion.p
            className="text-lg md:text-xl font-bold text-gray-300 mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            How many {vehicle.name}?
          </motion.p>

          {/* Vehicle rows */}
          {layout.map((rowCount, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-center gap-3 md:gap-4">
              {Array.from({ length: rowCount }, (_, colIdx) => {
                const idx = itemIndex++;
                return (
                  <motion.div
                    key={idx}
                    className="text-4xl md:text-5xl lg:text-6xl"
                    initial={{ x: 120, opacity: 0, scale: 0.3 }}
                    animate={phase === 'flyAway' ? {
                      // Fly up-left toward dragon (rough direction)
                      x: -150 - idx * 20,
                      y: -120 - idx * 15,
                      scale: 0.2,
                      opacity: 0,
                    } : {
                      x: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={phase === 'flyAway' ? {
                      duration: 0.6,
                      delay: idx * 0.06,
                      ease: 'easeIn',
                    } : {
                      delay: idx * 0.18,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 300,
                      damping: 18,
                    }}
                    style={{
                      filter: showMerge
                        ? `drop-shadow(0 0 12px ${colors.glow})`
                        : 'none',
                    }}
                  >
                    {/* Idle bounce / celebration animation */}
                    <motion.span
                      style={{ display: 'inline-block' }}
                      animate={phase === 'celebrate' ? {
                        // Celebration: trucks jump!
                        y: [0, -20, 0],
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.2, 1],
                      } : phase === 'flyAway' ? {} : {
                        // Gentle idle bounce
                        y: [0, -4, 0],
                      }}
                      transition={phase === 'celebrate' ? {
                        duration: 0.5,
                        delay: idx * 0.08,
                      } : {
                        duration: 1.5 + idx * 0.2,
                        repeat: Infinity,
                        delay: idx * 0.15,
                        ease: 'easeInOut',
                      }}
                    >
                      {vehicle.emoji}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Correct answer celebration text */}
          <AnimatePresence>
            {showMerge && (
              <motion.div
                className="text-3xl md:text-4xl font-black mt-2"
                style={{
                  color: colors.accent,
                  textShadow: `0 0 20px ${colors.glow}80`,
                }}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {count}! {['Yes!', 'Great!', 'Wow!', 'Yay!', 'Super!'][Math.floor(Math.random() * 5)]}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Big visual gap — separator so numbers don't look like labels */}
      <div className="my-6 md:my-8 w-full flex justify-center">
        <div className="w-24 h-0.5 rounded-full" style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)`,
        }} />
      </div>
    </div>
  );
}
