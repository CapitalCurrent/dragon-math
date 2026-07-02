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

// Deck-based generator: shuffles a fact pool and deals without replacement.
// When the deck runs out, reshuffle. Guarantees no near-duplicates inside a cycle.
function deckGenerator(facts, toQuestion) {
  let deck = [];
  let lastDealt = null;
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return () => {
    if (deck.length === 0) {
      deck = shuffle(facts);
      // Avoid the very first card of a new deck matching the last card of the old one
      if (lastDealt && deck.length > 1 && deck[deck.length - 1].key === lastDealt.key) {
        [deck[deck.length - 1], deck[0]] = [deck[0], deck[deck.length - 1]];
      }
    }
    const fact = deck.pop();
    lastDealt = fact;
    return toQuestion(fact);
  };
}

// === FACT POOLS ===
// Each builder returns a list of unique problems with a stable `key` for the deck.

// Addition 0-9: all (a,b) with a,b ∈ [0,9]; skip 0+0.
function buildAdd09() {
  const facts = [];
  for (let a = 0; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      if (a === 0 && b === 0) continue;
      facts.push({ a, b, op: '+', key: `+${a}+${b}` });
    }
  }
  return facts;
}

// Doubles (1+1..9+9) + near-doubles (a + a±1) in both directions.
function buildDoublesNear() {
  const facts = [];
  for (let a = 1; a <= 9; a++) {
    facts.push({ a, b: a, op: '+', key: `+${a}+${a}` });
  }
  for (let a = 0; a <= 8; a++) {
    facts.push({ a, b: a + 1, op: '+', key: `+${a}+${a + 1}` });
    facts.push({ a: a + 1, b: a, op: '+', key: `+${a + 1}+${a}` });
  }
  return facts;
}

// Making 10: the 11 pairs that sum to 10 (0+10..10+0).
function buildMakingTen() {
  const facts = [];
  for (let a = 0; a <= 10; a++) {
    facts.push({ a, b: 10 - a, op: '+', key: `+${a}+${10 - a}` });
  }
  return facts;
}

// Addition to 20: all (a,b) with a,b ∈ [0,10] and sum ≤ 20; skip 0+0.
function buildAddTo20() {
  const facts = [];
  for (let a = 0; a <= 10; a++) {
    for (let b = 0; b <= 10; b++) {
      if (a === 0 && b === 0) continue;
      if (a + b > 20) continue;
      facts.push({ a, b, op: '+', key: `+${a}+${b}` });
    }
  }
  return facts;
}

// Subtraction within 0-9: difference 0-9, subtrahend 1-9, minuend ≤ 18.
// Skips a-0 (trivial); keeps a-a (= 0).
function buildSub09() {
  const facts = [];
  for (let answer = 0; answer <= 9; answer++) {
    for (let b = 1; b <= 9; b++) {
      const a = answer + b;
      facts.push({ a, b, op: '-', key: `-${a}-${b}` });
    }
  }
  return facts;
}

// Subtraction to 18: all (a,b) with minuend ≤ 18 and difference 0-9.
// Skips a-0 (trivial); keeps a-a (= 0) since that's a real fact-family entry.
function buildSubTo18() {
  const facts = [];
  for (let a = 1; a <= 18; a++) {
    for (let b = 1; b <= Math.min(a, 9); b++) {
      const ans = a - b;
      if (ans <= 9) facts.push({ a, b, op: '-', key: `-${a}-${b}` });
    }
  }
  return facts;
}

// Convert a fact (with op) into a question object the game expects.
function factToQuestion(f) {
  if (f.op === '-') {
    return { a: f.a, b: f.b, op: '-', answer: f.a - f.b, display: `${f.a} − ${f.b}` };
  }
  return { a: f.a, b: f.b, op: '+', answer: f.a + f.b, display: `${f.a} + ${f.b}` };
}

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
    generate: deckGenerator(buildAdd09(), factToQuestion),
  },
  {
    id: 2,
    name: 'Doubles & Near Doubles',
    description: 'Special addition patterns',
    passThreshold: 0.95,
    generate: deckGenerator(buildDoublesNear(), factToQuestion),
  },
  {
    id: 3,
    // 70% making-10 from a dedicated deck, 30% distractor adds from a separate deck.
    // Both decks deal without replacement, so neither side near-duplicates inside a cycle.
    name: 'Making 10',
    description: 'Pairs that add up to 10',
    passThreshold: 0.95,
    generate: (() => {
      const tenDeck = deckGenerator(buildMakingTen(), factToQuestion);
      const distractorDeck = deckGenerator(buildAdd09(), factToQuestion);
      return () => (Math.random() < 0.3 ? distractorDeck() : tenDeck());
    })(),
  },
  {
    id: 4,
    name: 'Addition to 20',
    description: 'Add numbers with sums up to 20',
    passThreshold: 0.95,
    generate: deckGenerator(buildAddTo20(), factToQuestion),
  },
  {
    id: 5,
    name: 'Subtraction 0-9',
    description: 'Subtract numbers from 0 to 9',
    passThreshold: 0.95,
    generate: deckGenerator(buildSub09(), factToQuestion),
  },
  {
    id: 6,
    name: 'Subtraction to 18',
    description: 'Subtract with sums up to 18',
    passThreshold: 0.95,
    generate: deckGenerator(buildSubTo18(), factToQuestion),
  },
  {
    id: 7,
    name: 'Mixed Add & Subtract',
    description: 'Addition and subtraction to 18!',
    passThreshold: 0.95,
    generate: deckGenerator(
      [...buildAddTo20(), ...buildSubTo18()],
      factToQuestion,
    ),
  },
];

export const QUESTIONS_PER_ROUND = 20;
