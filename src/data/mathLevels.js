// Math levels matching SC College and Career Ready Standards progression
// Counting levels (0A-0C) for pre-readers learning number identification
// Math levels (1-7) for addition/subtraction facts

// Vehicle types for counting levels — rotates randomly each question
const VEHICLES = [
  { emoji: '🚜', name: 'tractors' },
  { emoji: '🚒', name: 'fire trucks' },
  { emoji: '🚛', name: 'dump trucks' },
  { emoji: '🏗️', name: 'cranes' },
  { emoji: '🚙', name: 'trucks' },
  { emoji: '🚂', name: 'trains' },
  { emoji: '🚁', name: 'helicopters' },
  { emoji: '🏎️', name: 'race cars' },
  { emoji: '🚀', name: 'rockets' },
  { emoji: '🚜', name: 'bulldozers' },
];

function countingGenerator(min, max) {
  // Track last vehicle to avoid repeats
  let lastVehicleIdx = -1;
  return () => {
    const count = min + Math.floor(Math.random() * (max - min + 1));
    let vIdx;
    do {
      vIdx = Math.floor(Math.random() * VEHICLES.length);
    } while (vIdx === lastVehicleIdx && VEHICLES.length > 1);
    lastVehicleIdx = vIdx;
    const vehicle = VEHICLES[vIdx];
    return {
      type: 'counting',
      answer: count,
      count,
      vehicle,
      display: `${count}`,
    };
  };
}

export const MATH_LEVELS = [
  // === COUNTING LEVELS (for pre-readers) ===
  {
    id: '0a',
    name: '🚛 1-5',
    description: 'Count 1 to 5',
    questionsPerRound: 10,
    passThreshold: 0.8,
    generate: countingGenerator(1, 5),
  },
  {
    id: '0b',
    name: '🚛 6-10',
    description: 'Count 6 to 10',
    questionsPerRound: 10,
    passThreshold: 0.8,
    generate: countingGenerator(6, 10),
  },
  {
    id: '0c',
    name: '🚛 1-10',
    description: 'Count 1 to 10',
    questionsPerRound: 10,
    passThreshold: 0.8,
    generate: countingGenerator(1, 10),
  },
  // === MATH LEVELS ===
  {
    id: 1,
    name: 'Addition 0-9',
    description: 'Add numbers from 0 to 9',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      return { a, b, op: '+', answer: a + b, display: `${a} + ${b}` };
    },
  },
  {
    id: 2,
    name: 'Doubles & Near Doubles',
    description: 'Special addition patterns',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 10);
      const isDouble = Math.random() < 0.5;
      const b = isDouble ? a : a + (Math.random() < 0.5 ? 1 : -1);
      const bClamped = Math.max(0, Math.min(9, b));
      return { a, b: bClamped, op: '+', answer: a + bClamped, display: `${a} + ${bClamped}` };
    },
  },
  {
    id: 3,
    name: 'Making 10',
    description: 'Pairs that add up to 10',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 11);
      const b = 10 - a;
      if (Math.random() < 0.3) {
        const c = Math.floor(Math.random() * 10);
        const d = Math.floor(Math.random() * 10);
        return { a: c, b: d, op: '+', answer: c + d, display: `${c} + ${d}` };
      }
      return { a, b, op: '+', answer: 10, display: `${a} + ${b}` };
    },
  },
  {
    id: 4,
    name: 'Addition to 20',
    description: 'Add numbers with sums up to 20',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 11);
      const b = Math.floor(Math.random() * (21 - a));
      return { a, b, op: '+', answer: a + b, display: `${a} + ${b}` };
    },
  },
  {
    id: 5,
    name: 'Subtraction 0-9',
    description: 'Subtract numbers from 0 to 9',
    passThreshold: 0.95,
    generate: () => {
      const answer = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      const a = answer + b;
      return { a, b, op: '-', answer, display: `${a} − ${b}` };
    },
  },
  {
    id: 6,
    name: 'Subtraction to 18',
    description: 'Subtract with sums up to 18',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 19);
      const b = Math.floor(Math.random() * (a + 1));
      return { a, b, op: '-', answer: a - b, display: `${a} − ${b}` };
    },
  },
  {
    id: 7,
    name: 'Mixed Add & Subtract',
    description: 'Addition and subtraction to 18!',
    passThreshold: 0.95,
    generate: () => {
      if (Math.random() < 0.5) {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * (19 - a));
        return { a, b, op: '+', answer: a + b, display: `${a} + ${b}` };
      } else {
        const a = Math.floor(Math.random() * 19);
        const b = Math.floor(Math.random() * (a + 1));
        return { a, b, op: '-', answer: a - b, display: `${a} − ${b}` };
      }
    },
  },
];

export const QUESTIONS_PER_ROUND = 20;
