import React, { useMemo } from 'react';
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
  const { currentQuestion, showMerge, dragon } = useGame();
  const colors = dragon?.colors || { accent: '#fff', glow: '#fff', primary: '#fff' };

  const layout = useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== 'counting') return [];
    return getLayout(currentQuestion.count);
  }, [currentQuestion]);

  if (!currentQuestion || currentQuestion.type !== 'counting') return null;

  const { vehicle, count } = currentQuestion;
  let itemIndex = 0;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${count}-${vehicle.emoji}-${currentQuestion._id || ''}`}
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
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
                    animate={{
                      x: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
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
                    {/* Idle bounce animation after entrance */}
                    <motion.span
                      style={{ display: 'inline-block' }}
                      animate={showMerge ? {
                        // Celebration: trucks jump!
                        y: [0, -20, 0],
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.2, 1],
                      } : {
                        // Gentle idle bounce
                        y: [0, -4, 0],
                      }}
                      transition={showMerge ? {
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
    </div>
  );
}
