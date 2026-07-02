import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useGame, SCREENS } from './context/GameContext';
import TitleScreen from './screens/TitleScreen';
import DragonSelectScreen from './screens/DragonSelectScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import { SkillUnlockPopup } from './components/SkillBar';

const APP_VERSION = process.env.REACT_APP_VERSION || require('../package.json').version;

// Always-visible version badge — same dimensions/position on phone and PC.
// Tap/click expands to show platform info, useful when comparing across devices.
function VersionBadge() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(e => !e)}
      role="button"
      aria-label={`Version ${APP_VERSION}`}
      style={{
        position: 'fixed', top: 8, right: 8, zIndex: 9999,
        minWidth: 44, minHeight: 44,                      // touch-target floor
        padding: '8px 14px',
        background: 'rgba(10, 10, 30, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0, 167, 225, 0.4)',
        borderRadius: 10,
        color: '#7dd3fc',
        fontSize: 13, fontWeight: 700,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        cursor: 'pointer', userSelect: 'none',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#10b981', boxShadow: '0 0 6px #10b981',
      }} />
      <span>v{APP_VERSION}</span>
      {expanded && (
        <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>
          {window.innerWidth < 768 ? '📱' : '🖥️'} {window.innerWidth}×{window.innerHeight}
        </span>
      )}
    </div>
  );
}

function AppContent() {
  const { screen } = useGame();

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {screen === SCREENS.TITLE && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TitleScreen />
          </motion.div>
        )}
        {screen === SCREENS.SELECT_DRAGON && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <DragonSelectScreen />
          </motion.div>
        )}
        {screen === SCREENS.PLAYING && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <GameScreen />
          </motion.div>
        )}
        {screen === SCREENS.VICTORY && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <VictoryScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <SkillUnlockPopup />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <VersionBadge />
      <AppContent />
    </GameProvider>
  );
}

export default App;
