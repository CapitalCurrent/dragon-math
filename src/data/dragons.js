// Dragon types — inspired by fantasy archetypes, no trademarks
export const DRAGONS = {
  ember: {
    id: 'ember',
    name: 'Ember Drake',
    colors: { primary: '#ff6b35', secondary: '#ff9800', accent: '#ffeb3b', glow: '#ff4400' },
    stages: [
      { name: 'Ember Egg', size: 0.4, description: 'A warm, glowing egg' },
      { name: 'Spark Hatchling', size: 0.55, description: 'Tiny with flickering sparks' },
      { name: 'Flame Whelp', size: 0.7, description: 'Growing stronger, smoke rises' },
      { name: 'Fire Drake', size: 0.85, description: 'Wings spread wide, fire in its eyes' },
      { name: 'Inferno Dragon', size: 1.0, description: 'A mighty dragon of fire!' },
    ],
    skills: [
      { name: 'Spark', icon: '✨', unlocksAt: 0.2, description: 'Tiny sparks fly!' },
      { name: 'Smoke Puff', icon: '💨', unlocksAt: 0.4, description: 'Puffs of smoke!' },
      { name: 'Fire Breath', icon: '🔥', unlocksAt: 0.6, description: 'Breathes fire!' },
      { name: 'Flame Shield', icon: '🛡️', unlocksAt: 0.8, description: 'Protected by flames!' },
      { name: 'Inferno Blast', icon: '💥', unlocksAt: 1.0, description: 'ULTIMATE FIRE POWER!' },
    ],
  },
  frost: {
    id: 'frost',
    name: 'Frost Wing',
    colors: { primary: '#4fc3f7', secondary: '#81d4fa', accent: '#e1f5fe', glow: '#0288d1' },
    stages: [
      { name: 'Ice Crystal Egg', size: 0.4, description: 'Frozen and shimmering' },
      { name: 'Snow Hatchling', size: 0.55, description: 'Cold mist surrounds it' },
      { name: 'Frost Whelp', size: 0.7, description: 'Ice crystals form on its wings' },
      { name: 'Blizzard Drake', size: 0.85, description: 'Commands the cold winds' },
      { name: 'Glacial Dragon', size: 1.0, description: 'Master of ice and snow!' },
    ],
    skills: [
      { name: 'Snowflake', icon: '❄️', unlocksAt: 0.2, description: 'Gentle snowflakes fall!' },
      { name: 'Ice Shard', icon: '🧊', unlocksAt: 0.4, description: 'Sharp ice crystals!' },
      { name: 'Freeze Breath', icon: '🌬️', unlocksAt: 0.6, description: 'Freezing breath!' },
      { name: 'Blizzard', icon: '🌨️', unlocksAt: 0.8, description: 'A swirling blizzard!' },
      { name: 'Absolute Zero', icon: '💎', unlocksAt: 1.0, description: 'ULTIMATE ICE POWER!' },
    ],
  },
  stone: {
    id: 'stone',
    name: 'Stone Tail',
    colors: { primary: '#8bc34a', secondary: '#a5d6a7', accent: '#795548', glow: '#33691e' },
    stages: [
      { name: 'Mossy Egg', size: 0.4, description: 'Covered in soft green moss' },
      { name: 'Sprout Hatchling', size: 0.55, description: 'Plants grow on its back' },
      { name: 'Boulder Whelp', size: 0.7, description: 'Rocky armor forming' },
      { name: 'Mountain Drake', size: 0.85, description: 'Strong as the earth itself' },
      { name: 'Titan Dragon', size: 1.0, description: 'An unstoppable force of nature!' },
    ],
    skills: [
      { name: 'Pebble Toss', icon: '🪨', unlocksAt: 0.2, description: 'Tosses small rocks!' },
      { name: 'Vine Whip', icon: '🌿', unlocksAt: 0.4, description: 'Vines lash out!' },
      { name: 'Rock Smash', icon: '💪', unlocksAt: 0.6, description: 'Smashes boulders!' },
      { name: 'Earthquake', icon: '🌋', unlocksAt: 0.8, description: 'The ground shakes!' },
      { name: 'Titan Slam', icon: '⛰️', unlocksAt: 1.0, description: 'ULTIMATE EARTH POWER!' },
    ],
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow Fang',
    colors: { primary: '#9c27b0', secondary: '#7b1fa2', accent: '#e1bee7', glow: '#6a1b9a' },
    stages: [
      { name: 'Dark Egg', size: 0.4, description: 'Almost invisible in the dark' },
      { name: 'Shade Hatchling', size: 0.55, description: 'Flickers in and out of shadows' },
      { name: 'Night Whelp', size: 0.7, description: 'Purple lightning crackles' },
      { name: 'Phantom Drake', size: 0.85, description: 'Moves like a ghost' },
      { name: 'Void Dragon', size: 1.0, description: 'Master of darkness and lightning!' },
    ],
    skills: [
      { name: 'Shadow Step', icon: '👤', unlocksAt: 0.2, description: 'Vanishes briefly!' },
      { name: 'Dark Pulse', icon: '🌑', unlocksAt: 0.4, description: 'A wave of darkness!' },
      { name: 'Lightning Bolt', icon: '⚡', unlocksAt: 0.6, description: 'Purple lightning!' },
      { name: 'Night Cloak', icon: '🌙', unlocksAt: 0.8, description: 'Hidden in shadows!' },
      { name: 'Void Strike', icon: '☄️', unlocksAt: 1.0, description: 'ULTIMATE SHADOW POWER!' },
    ],
  },
  glimmer: {
    id: 'glimmer',
    name: 'Glimmer Wing',
    colors: { primary: '#ffd54f', secondary: '#fff176', accent: '#ffffff', glow: '#f9a825' },
    stages: [
      { name: 'Golden Egg', size: 0.4, description: 'Glows with warm light' },
      { name: 'Sparkle Hatchling', size: 0.55, description: 'Shimmers like sunshine' },
      { name: 'Radiant Whelp', size: 0.7, description: 'Light beams from its wings' },
      { name: 'Solar Drake', size: 0.85, description: 'Bright as the sun' },
      { name: 'Celestial Dragon', size: 1.0, description: 'A beautiful dragon of pure light!' },
    ],
    skills: [
      { name: 'Glitter', icon: '✨', unlocksAt: 0.2, description: 'Sparkles everywhere!' },
      { name: 'Light Beam', icon: '🌟', unlocksAt: 0.4, description: 'A beam of light!' },
      { name: 'Sun Burst', icon: '☀️', unlocksAt: 0.6, description: 'Blinding sunlight!' },
      { name: 'Heal Glow', icon: '💛', unlocksAt: 0.8, description: 'Healing golden light!' },
      { name: 'Nova Flash', icon: '⭐', unlocksAt: 1.0, description: 'ULTIMATE LIGHT POWER!' },
    ],
  },
  storm: {
    id: 'storm',
    name: 'Storm Rider',
    colors: { primary: '#29b6f6', secondary: '#4dd0e1', accent: '#ffee58', glow: '#0277bd' },
    stages: [
      { name: 'Thunder Egg', size: 0.4, description: 'Crackles with static' },
      { name: 'Breeze Hatchling', size: 0.55, description: 'Wind swirls around it' },
      { name: 'Gale Whelp', size: 0.7, description: 'Flies in little gusts' },
      { name: 'Tempest Drake', size: 0.85, description: 'Commands wind and rain' },
      { name: 'Hurricane Dragon', size: 1.0, description: 'Ruler of all storms!' },
    ],
    skills: [
      { name: 'Static Shock', icon: '⚡', unlocksAt: 0.2, description: 'A little zap!' },
      { name: 'Wind Gust', icon: '💨', unlocksAt: 0.4, description: 'A powerful gust!' },
      { name: 'Thunder Clap', icon: '🌩️', unlocksAt: 0.6, description: 'BOOM! Thunder!' },
      { name: 'Tornado', icon: '🌪️', unlocksAt: 0.8, description: 'A spinning tornado!' },
      { name: 'Storm Surge', icon: '🌊', unlocksAt: 1.0, description: 'ULTIMATE STORM POWER!' },
    ],
  },
};

export const DRAGON_LIST = Object.values(DRAGONS);
