import React, { useState, useEffect, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useGame, SCREENS } from './context/GameContext';
import TitleScreen from './screens/TitleScreen';
import DragonSelectScreen from './screens/DragonSelectScreen';
import GameScreen from './screens/GameScreen';
import VictoryScreen from './screens/VictoryScreen';
import { SkillUnlockPopup } from './components/SkillBar';

const VERSIONS = { V1: 'v1', V2: 'v2' };
const pkgVersion = process.env.REACT_APP_VERSION || require('../package.json').version;
const VERSION_LABELS = { v1: `v${pkgVersion} SVG`, v2: `v${pkgVersion} Pixi` };
const VersionContext = createContext(VERSIONS.V1);
export const useVersion = () => useContext(VersionContext);

function VersionToggle({ version, setVersion }) {
  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 9999,
      display: 'flex', gap: 4, background: '#0a0a2a', borderRadius: 12,
      padding: '4px 6px', border: '1px solid #2a2a4a',
    }}>
      {Object.entries(VERSIONS).map(([label, val]) => (
        <button
          key={val}
          onClick={() => {
            setVersion(val);
            window.location.hash = val === VERSIONS.V1 ? '' : val;
          }}
          style={{
            padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: version === val ? '#00A7E1' : 'transparent',
            color: version === val ? '#fff' : '#888',
            fontWeight: 'bold', fontSize: 12, transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{VERSION_LABELS[val]}</span>
        </button>
      ))}
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
  const [version, setVersion] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash === 'v2' ? VERSIONS.V2 : VERSIONS.V1;
  });

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      setVersion(hash === 'v2' ? VERSIONS.V2 : VERSIONS.V1);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <VersionContext.Provider value={version}>
      <GameProvider>
        <VersionToggle version={version} setVersion={setVersion} />
        <AppContent />
      </GameProvider>
    </VersionContext.Provider>
  );
}

export default App;
