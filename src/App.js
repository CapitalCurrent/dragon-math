import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useGame, SCREENS } from './context/GameContext';
import TitleScreen from './screens/TitleScreen';
import DragonSelectScreen from './screens/DragonSelectScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import { SkillUnlockPopup } from './components/SkillBar';

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
      <AppContent />
    </GameProvider>
  );
}

export default App;
