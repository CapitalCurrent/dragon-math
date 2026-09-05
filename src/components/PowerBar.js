import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { morphSetFor } from './DragonSprite';
import { powerFxFor } from '../utils/powers';

// Powers for morph art sets: each unlocked power performed itself when it unlocked; one tap here
// replays it once, then the button dims. No charges, no meter.
export default function PowerBar() {
  const { dragon, unlockedSkills, activePower, powerUsed, showMerge, dispatch } = useGame();
  const set = morphSetFor(dragon);
  const colors = dragon?.colors || {};
  const skills = (dragon?.skills || []).filter(s => unlockedSkills.includes(s.name));
  if (!skills.length) return null;
  return (
    <div className="flex gap-3 items-center justify-center">
      {skills.map(skill => {
        const fx = powerFxFor(set, dragon, skill);
        const used = !!(powerUsed && fx && powerUsed[fx.id]);
        const canPlay = !!fx && !used && !activePower && !showMerge;
        return (
          <motion.button
            key={skill.name}
            title={used ? `${skill.name} (used)` : skill.name}
            disabled={!canPlay}
            onClick={() => canPlay && dispatch({ type: 'PLAY_POWER', id: fx.id, skill, replay: true })}
            whileTap={canPlay ? { scale: 0.9 } : {}}
            animate={canPlay ? { boxShadow: [`0 0 8px ${colors.glow}66`, `0 0 22px ${colors.glow}cc`, `0 0 8px ${colors.glow}66`] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="rounded-full flex items-center justify-center text-2xl"
            style={{
              width: 56, height: 56,
              background: canPlay ? `radial-gradient(circle, ${colors.primary} 0%, #0a0a2a 80%)` : '#111122',
              border: `3px solid ${canPlay ? colors.accent : '#333'}`,
              opacity: used ? 0.35 : 1,
              filter: used ? 'grayscale(1)' : 'none',
            }}
          >
            {skill.icon}
          </motion.button>
        );
      })}
    </div>
  );
}
