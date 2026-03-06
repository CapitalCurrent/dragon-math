// Math levels matching SC College and Career Ready Standards progression
// Level 1 is what she's working on now: addition facts 0-9

export const MATH_LEVELS = [
  {
    id: 1,
    name: 'Addition 0-9',
    description: 'Add numbers from 0 to 9',
    passThreshold: 0.95, // 95% to advance (matches school)
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
      // Mix in some non-10 pairs too
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
      return { a, b, op: '-', answer, display: `${a} - ${b}` };
    },
  },
  {
    id: 6,
    name: 'Subtraction to 20',
    description: 'Subtract with numbers up to 20',
    passThreshold: 0.95,
    generate: () => {
      const a = Math.floor(Math.random() * 21);
      const b = Math.floor(Math.random() * (a + 1));
      return { a, b, op: '-', answer: a - b, display: `${a} - ${b}` };
    },
  },
  {
    id: 7,
    name: 'Mixed Add & Subtract',
    description: 'Both addition and subtraction!',
    passThreshold: 0.95,
    generate: () => {
      if (Math.random() < 0.5) {
        const a = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        return { a, b, op: '+', answer: a + b, display: `${a} + ${b}` };
      } else {
        const answer = Math.floor(Math.random() * 10);
        const b = Math.floor(Math.random() * 10);
        const a = answer + b;
        return { a, b, op: '-', answer, display: `${a} - ${b}` };
      }
    },
  },
];

export const QUESTIONS_PER_ROUND = 20;
