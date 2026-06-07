const ADJECTIVES = [
  'Pending',
  'Patient',
  'Hopeful',
  'Sleepy',
  'Lucky',
  'Cosmic',
  'Stealth',
  'Brave',
  'Calm',
  'Eager',
  'Zen',
  'Turbo',
  'Mildly Stressed',
  'Chronically',
  'Delulu',
  'Chill',
  'Chaotic',
  'Optimistic',
  'Perpetually',
  'Secretly',
];

const NOUNS = [
  'Panda',
  'Owl',
  'Phoenix',
  'Pigeon',
  'Nomad',
  'Filers',
  'Wanderer',
  'Optimist',
  'Block Watcher',
  'Receipt Fan',
  'GC Dreamer',
  'Biometrics Buddy',
  'Silent Updater',
  'IOE Spotter',
  'Approval Gremlin',
  'Field Office Fan',
  'NIW Night Owl',
  'Timeline Tourist',
  'Status Checker',
  'Portal Refresher',
];

const PHRASES = [
  'Still In Line',
  'Refresh The Page',
  'Probably Fine',
  'Where Is My EAD',
  'Approved Eventually',
  'Biometrics Someday',
  'Block Who Knows',
  'Silent Update When',
  'Receipt Month Club',
  'Green Card Goblin',
  'IOE Mysteries',
  'Case Closed Maybe',
  'Interview Waived Pls',
  'RFE Not Today',
  'Pending Since Forever',
];

export function randomFunnyUsername() {
  if (Math.random() < 0.28) {
    return PHRASES[Math.floor(Math.random() * PHRASES.length)];
  }

  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
