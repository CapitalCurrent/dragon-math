import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { DRAGONS } from '../data/dragons';
import { MATH_LEVELS, QUESTIONS_PER_ROUND } from '../data/mathLevels';
import { pickMarkPosition } from '../components/WorldMarks';

const GameContext = createContext();

const SCREENS = {
  TITLE: 'title',
  SELECT_DRAGON: 'select_dragon',
  PLAYING: 'playing',
  VICTORY: 'victory',
  LEVEL_UP: 'level_up',
};

function getLevelData(levelId) {
  return MATH_LEVELS.find(l => l.id === levelId) || MATH_LEVELS[0];
}

function getQuestionsForLevel(levelId) {
  const lvl = getLevelData(levelId);
  return lvl.questionsPerRound || QUESTIONS_PER_ROUND;
}

const initialState = {
  screen: SCREENS.TITLE,
  dragon: null,
  level: 1,
  currentQuestion: null,
  questionsAnswered: 0,
  correctAnswers: 0,        // count of correct events (drives accuracy display)
  progressScore: 0,         // weighted score (skill-boost-aware) — drives growth + round end
  streak: 0,
  bestStreak: 0,
  progress: 0, // 0 to 1 for dragon growth
  unlockedSkills: [],
  newSkill: null, // temporarily set when a skill is unlocked
  wrongAnswer: false,
  showMerge: false,
  eating: false, // true when answer is flying to dragon
  mouthOpen: false, // true when dragon's mouth is open (starts before eating)
  skillCharges: {}, // { skillName: charge (0-3) } — 3 correct answers to charge
  activeSkill: null, // set when player activates a skill (skill object)
  skillBoost: false, // true = next correct answer gives 2x progress
  totalCorrect: 0, // lifetime
  totalPlayed: 0,  // lifetime
  currentQuestionMissed: false, // true if any wrong attempt on the current question
  missQueue: [], // [{ question, delay }] — questions to re-ask after N more correct answers
  worldMarks: [], // persistent marks left on the cave by skill activations
  answerDraft: '', // digits typed so far - shown inside the equation's answer bubble
};

const REQUEUE_DELAY = 2; // re-ask a missed problem 2 correct answers later
const MAX_WORLD_MARKS = 8;

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
        progressScore: 0,
        streak: 0,
        progress: 0,
        unlockedSkills: [],
        newSkill: null,
        skillCharges: {},
        activeSkill: null,
        currentQuestionMissed: false,
        missQueue: [],
        worldMarks: [],
      };

    case 'NEW_QUESTION': {
      const levelData = getLevelData(state.level);
      // If any miss is ready (delay ≤ 0), re-deal it instead of pulling fresh.
      const readyIdx = state.missQueue.findIndex(m => m.delay <= 0);
      let nextQuestion;
      let newQueue = state.missQueue;
      if (readyIdx >= 0) {
        nextQuestion = { ...state.missQueue[readyIdx].question, _isRequeue: true };
        newQueue = state.missQueue.filter((_, i) => i !== readyIdx);
      } else {
        nextQuestion = levelData.generate();
      }
      return {
        ...state,
        currentQuestion: nextQuestion,
        currentQuestionMissed: false,
        missQueue: newQueue,
        wrongAnswer: false,
        showMerge: false,
        eating: false,
        mouthOpen: false,
        activeSkill: null,
      };
    }

    case 'CORRECT_ANSWER': {
      const roundSize = getQuestionsForLevel(state.level);
      // Skill boost speeds up dragon growth, NOT the accuracy count.
      // correctAnswers always +1 (display + accuracy);
      // progressScore +1 normally, +2 when boosted (drives growth + round end).
      const scoreIncrement = state.skillBoost ? 2 : 1;
      const newCorrect = state.correctAnswers + 1;
      const newScore = state.progressScore + scoreIncrement;
      const newAnswered = state.questionsAnswered + 1;
      const newProgress = Math.min(1, newScore / roundSize);
      const newStreak = state.streak + 1;

      // Check for new skill unlocks
      let newSkill = null;
      if (state.dragon) {
        const justUnlocked = state.dragon.skills.find(
          s => newProgress >= s.unlocksAt && !state.unlockedSkills.includes(s.name)
        );
        if (justUnlocked) newSkill = justUnlocked;
      }

      const isComplete = newScore >= roundSize;

      // Charge all unlocked skills (+1 per correct answer, max 3)
      const allUnlocked = newSkill
        ? [...state.unlockedSkills, newSkill.name]
        : state.unlockedSkills;
      const newCharges = { ...state.skillCharges };
      for (const sn of allUnlocked) {
        newCharges[sn] = Math.min(3, (newCharges[sn] || 0) + 1);
      }

      // Decrement existing miss-queue delays. If this question was missed and
      // isn't itself a re-queue, schedule it to come back in REQUEUE_DELAY turns.
      let newMissQueue = state.missQueue.map(m => ({ ...m, delay: m.delay - 1 }));
      if (state.currentQuestionMissed && !state.currentQuestion?._isRequeue) {
        newMissQueue = [
          ...newMissQueue,
          { question: state.currentQuestion, delay: REQUEUE_DELAY },
        ];
      }

      return {
        ...state,
        correctAnswers: newCorrect,
        progressScore: newScore,
        questionsAnswered: newAnswered,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        progress: Math.min(1, newProgress),
        showMerge: true,
        skillBoost: false, // consume boost on correct answer
        totalCorrect: state.totalCorrect + 1,
        totalPlayed: state.totalPlayed + 1,
        newSkill,
        unlockedSkills: allUnlocked,
        skillCharges: newCharges,
        currentQuestionMissed: false,
        missQueue: newMissQueue,
        screen: isComplete ? SCREENS.VICTORY : state.screen,
      };
    }

    case 'SET_ANSWER_DRAFT':
      return { ...state, answerDraft: action.value };
    case 'WRONG_ANSWER':
      return {
        ...state,
        questionsAnswered: state.questionsAnswered + 1,
        streak: 0,
        wrongAnswer: true,
        totalPlayed: state.totalPlayed + 1,
        currentQuestionMissed: true,
      };

    case 'OPEN_MOUTH':
      return { ...state, mouthOpen: true };

    case 'START_EATING':
      return { ...state, eating: true, mouthOpen: true };

    case 'USE_SKILL': {
      const skill = action.skill;
      const charges = { ...state.skillCharges, [skill.name]: 0 };
      // Leave a persistent mark on the cave at a zone-aware random position
      const element = state.dragon?.id || 'ember';
      const pos = pickMarkPosition(element, state.worldMarks);
      const newMark = {
        id: `mk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        element,
        x: pos.x,
        y: pos.y,
        rot: (Math.random() - 0.5) * 24,
        scale: 0.8 + Math.random() * 0.5,
        createdAt: Date.now(),
      };
      const trimmed = [...state.worldMarks, newMark];
      while (trimmed.length > MAX_WORLD_MARKS) trimmed.shift();
      return {
        ...state,
        activeSkill: skill,
        skillCharges: charges,
        skillBoost: true,
        worldMarks: trimmed,
      };
    }

    case 'CLEAR_ACTIVE_SKILL':
      return { ...state, activeSkill: null };

    case 'CLEAR_SKILL_POPUP':
      return { ...state, newSkill: null };

    // POWERS (generated performances): performed once automatically at unlock, then ONE tap replay
    // each (Ryan 9/5: no recharge). `activePower` = { id, skill, replay } while it plays.
    case 'PLAY_POWER': {
      if (state.activePower) return state;
      const used = action.replay ? { ...(state.powerUsed || {}), [action.id]: true } : (state.powerUsed || {});
      return { ...state, activePower: { id: action.id, skill: action.skill, replay: !!action.replay }, powerUsed: used,
               mouthOpen: true };
    }
    case 'CLEAR_ACTIVE_POWER':
      return { ...state, activePower: null, mouthOpen: state.eating };

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

    // === DEV TOOLS ===
    case 'DEV_SET_PROGRESS': {
      const p = Math.max(0, Math.min(1, action.progress));
      // Recalculate unlocked skills for this progress
      const skills = state.dragon?.skills || [];
      const unlocked = skills.filter(s => p >= s.unlocksAt).map(s => s.name);
      const charges = {};
      for (const sn of unlocked) charges[sn] = 3;
      const slotCount = Math.round(p * getQuestionsForLevel(state.level));
      return {
        ...state,
        progress: p,
        correctAnswers: slotCount,
        progressScore: slotCount,
        unlockedSkills: unlocked,
        skillCharges: charges,
        screen: SCREENS.PLAYING,
      };
    }

    case 'DEV_SET_DRAGON':
      return {
        ...state,
        dragon: DRAGONS[action.dragonId],
        screen: SCREENS.PLAYING,
      };

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
      // Counting mode: celebrate 700 + fly 800 + buffer 300 = 1800
      // Math mode: join 700 + skill 800 + eat/fly 1100 + buffer 200 = 2800
      const isCounting = state.currentQuestion.type === 'counting';
      setTimeout(() => dispatch({ type: 'NEW_QUESTION' }), isCounting ? 2200 : 2800);
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
