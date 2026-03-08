import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { DRAGONS } from '../data/dragons';
import { MATH_LEVELS, QUESTIONS_PER_ROUND } from '../data/mathLevels';

const GameContext = createContext();

const SCREENS = {
  TITLE: 'title',
  SELECT_DRAGON: 'select_dragon',
  PLAYING: 'playing',
  VICTORY: 'victory',
  LEVEL_UP: 'level_up',
};

const initialState = {
  screen: SCREENS.TITLE,
  dragon: null,
  level: 1,
  currentQuestion: null,
  questionsAnswered: 0,
  correctAnswers: 0,
  streak: 0,
  bestStreak: 0,
  progress: 0, // 0 to 1 for dragon growth
  unlockedSkills: [],
  newSkill: null, // temporarily set when a skill is unlocked
  wrongAnswer: false,
  showMerge: false,
  eating: false, // true when answer is flying to dragon (mouth open phase)
  skillCharges: {}, // { skillName: charge (0-3) } — 3 correct answers to charge
  activeSkill: null, // set when player activates a skill (skill object)
  totalCorrect: 0, // lifetime
  totalPlayed: 0,  // lifetime
};

function reducer(state, action) {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };

    case 'SELECT_DRAGON':
      return {
        ...state,
        dragon: DRAGONS[action.dragonId],
        screen: SCREENS.PLAYING,
        questionsAnswered: 0,
        correctAnswers: 0,
        streak: 0,
        progress: 0,
        unlockedSkills: [],
        newSkill: null,
        skillCharges: {},
        activeSkill: null,
      };

    case 'NEW_QUESTION': {
      const levelData = MATH_LEVELS[state.level - 1] || MATH_LEVELS[0];
      return {
        ...state,
        currentQuestion: levelData.generate(),
        wrongAnswer: false,
        showMerge: false,
        eating: false,
        activeSkill: null,
      };
    }

    case 'CORRECT_ANSWER': {
      const newCorrect = state.correctAnswers + 1;
      const newAnswered = state.questionsAnswered + 1;
      const newProgress = newCorrect / QUESTIONS_PER_ROUND;
      const newStreak = state.streak + 1;

      // Check for new skill unlocks
      let newSkill = null;
      if (state.dragon) {
        const justUnlocked = state.dragon.skills.find(
          s => newProgress >= s.unlocksAt && !state.unlockedSkills.includes(s.name)
        );
        if (justUnlocked) newSkill = justUnlocked;
      }

      const isComplete = newCorrect >= QUESTIONS_PER_ROUND;

      // Charge all unlocked skills (+1 per correct answer, max 3)
      const allUnlocked = newSkill
        ? [...state.unlockedSkills, newSkill.name]
        : state.unlockedSkills;
      const newCharges = { ...state.skillCharges };
      for (const sn of allUnlocked) {
        newCharges[sn] = Math.min(3, (newCharges[sn] || 0) + 1);
      }

      return {
        ...state,
        correctAnswers: newCorrect,
        questionsAnswered: newAnswered,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        progress: Math.min(1, newProgress),
        showMerge: true,
        totalCorrect: state.totalCorrect + 1,
        totalPlayed: state.totalPlayed + 1,
        newSkill,
        unlockedSkills: allUnlocked,
        skillCharges: newCharges,
        screen: isComplete ? SCREENS.VICTORY : state.screen,
      };
    }

    case 'WRONG_ANSWER':
      return {
        ...state,
        questionsAnswered: state.questionsAnswered + 1,
        streak: 0,
        wrongAnswer: true,
        totalPlayed: state.totalPlayed + 1,
      };

    case 'START_EATING':
      return { ...state, eating: true };

    case 'USE_SKILL': {
      const skill = action.skill;
      const charges = { ...state.skillCharges, [skill.name]: 0 };
      return { ...state, activeSkill: skill, skillCharges: charges };
    }

    case 'CLEAR_ACTIVE_SKILL':
      return { ...state, activeSkill: null };

    case 'CLEAR_SKILL_POPUP':
      return { ...state, newSkill: null };

    case 'PLAY_AGAIN':
      return {
        ...initialState,
        screen: SCREENS.SELECT_DRAGON,
        totalCorrect: state.totalCorrect,
        totalPlayed: state.totalPlayed,
        level: state.level,
      };

    case 'SET_LEVEL':
      return { ...state, level: action.level };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const selectDragon = useCallback((dragonId) => {
    dispatch({ type: 'SELECT_DRAGON', dragonId });
    // Generate first question after a brief delay for transition
    setTimeout(() => dispatch({ type: 'NEW_QUESTION' }), 500);
  }, []);

  const submitAnswer = useCallback((answer) => {
    if (!state.currentQuestion) return;
    if (parseInt(answer) === state.currentQuestion.answer) {
      dispatch({ type: 'CORRECT_ANSWER' });
      // Next question after animation (join 800 + skill 900 + eat/fly 1400 + buffer 300)
      setTimeout(() => dispatch({ type: 'NEW_QUESTION' }), 3400);
    } else {
      dispatch({ type: 'WRONG_ANSWER' });
    }
  }, [state.currentQuestion]);

  const value = {
    ...state,
    SCREENS,
    selectDragon,
    submitAnswer,
    dispatch,
    accuracy: state.questionsAnswered > 0
      ? Math.round((state.correctAnswers / state.questionsAnswered) * 100)
      : 100,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

export { SCREENS };
