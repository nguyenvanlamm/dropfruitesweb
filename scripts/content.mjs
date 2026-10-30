// Site data. Fruit and blessing numbers mirror the game's engine tables
// (lib/engine/fruit_spec.dart, lib/engine/blessing.dart) — keep them in sync.

export const site = {
  url: 'https://fruit-mischief.lamnv.com',
  basePath: '/',
  repo: 'https://github.com/nguyenvanlamm/dropfruitesweb',
  issues: 'https://github.com/nguyenvanlamm/dropfruitesweb/issues',
  email: 'lamnv260398@gmail.com',
  description:
    "Fruit Mischief is a balance puzzle for iPhone: carry two baskets on a Vietnamese street vendor's bamboo pole, merge tropical fruit inside each basket, keep the pole level, and pick blessings that change every run.",
};

const RADII = [3.8, 5.7, 7.7, 10.4, 13.2, 17.8, 21.6, 26.6, 32.4, 37.5, 42.5];
const size = (tier) => Math.round(30 + (RADII[tier] / 42.5) * 70);

export const chain = [
  ['Kumquat', 'kumquat', 0],
  ['Longan', 'longan', 1],
  ['Lychee', 'lychee', 3],
  ['Rambutan', 'rambutan', 6],
  ['Mangosteen', 'mangosteen', 10],
  ['Starfruit', 'starfruit', 15],
  ['Guava', 'guava', 21],
  ['Dragon fruit', 'dragon_fruit', 28],
  ['Papaya', 'papaya', 36],
  ['Jackfruit', 'jackfruit', 45],
  ['Durian', 'durian', 66],
].map(([name, file, pts], tier) => ({ name, file, pts, size: size(tier) }));

export const blessings = [
  { name: 'Magnet', icon: 'magnet', tone: '#ff6b6b', text: 'Matching fruits near each other pull together and merge.' },
  { name: 'Deep Baskets', icon: 'higher_line', tone: '#4ecdc4', text: 'Raises the lose line, so each basket holds one more layer.' },
  { name: 'Lucky Draw', icon: 'luck', tone: '#8bc34a', text: 'The queue often drops fruit types already on the board.' },
  { name: 'Combo Master', icon: 'combo_master', tone: '#ff9f1c', text: 'Combos last longer and score harder.' },
  { name: 'Cleaver', icon: 'knife', tone: '#b79fd0', text: 'Tap a fruit to split it into two smaller ones.', charges: 3, recharge: 8 },
  { name: 'Hammer', icon: 'hammer', tone: '#f0b45e', text: 'Tap a fruit to smash it and lighten its basket.', charges: 2, recharge: 14 },
  { name: 'Swap', icon: 'swap', tone: '#5aa9ff', text: 'Trade the fruit in your hand for the next one.', charges: 5, recharge: 4 },
];

export const faq = [
  {
    q: 'When can I play?',
    a: 'Fruit Mischief is being prepared for the App Store, and there is no release date yet. <a href="https://github.com/nguyenvanlamm/dropfruitesweb">Watch the GitHub repo</a> to see the App Store link the day it goes live.',
  },
  {
    q: 'Which devices will it run on?',
    a: 'The first release is for iPhone. The whole game is played with one finger, so it works on any screen size.',
  },
  {
    q: 'How much will it cost?',
    a: 'Pricing will be announced with the App Store listing. The game includes optional in-app packs that add extra Cleaver, Hammer, and Swap uses. Every run is fully playable without buying anything.',
  },
  {
    q: 'How is it different from other merge games?',
    a: 'You carry two baskets on a shoulder pole instead of filling one box. Every fruit goes left or right, only fruit in the same basket merge, and the pole tips toward the heavier side, so a big merge on one side needs an answer on the other. Every run also opens with a blessing pick, and you can hold only three.',
  },
  {
    q: 'Do I need an internet connection?',
    a: 'No. Runs are played entirely on your phone. Only the optional item shop connects to the App Store.',
  },
  {
    q: 'What data does the app collect?',
    a: 'None. There is no account, analytics, or ad tracking. Your best score and item stock are saved on your device only. Read the <a href="privacy.html">privacy policy</a> for details.',
  },
  {
    q: 'I found a bug or have an idea. Where do I send it?',
    a: 'Open an issue on GitHub or send an email. The <a href="support.html">support page</a> has links to both.',
  },
];

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icons = {
  phone: svg('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>'),
  bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  wifiOff: svg(
    '<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="m2 2 20 20"/>',
  ),
  info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  bug: svg(
    '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  ),
  bulb: svg(
    '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  ),
  chat: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  arrow: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
};
