export const GAME_TOKENS = [
  { id: 'dog', label: 'Dog', emoji: '🐕', color: '#f97316' }, // Orange
  { id: 'car', label: 'Race Car', emoji: '🚗', color: '#ef4444' }, // Red
  { id: 'hat', label: 'Top Hat', emoji: '🎩', color: '#1e293b' }, // Slate-900 (Black)
  { id: 'ship', label: 'Battleship', emoji: '🚢', color: '#3b82f6' }, // Blue
  { id: 'cat', label: 'Cat', emoji: '🐈', color: '#ec4899' }, // Pink
  { id: 'trex', label: 'T-Rex', emoji: '🦖', color: '#22c55e' }, // Green
  { id: 'duck', label: 'Rubber Duck', emoji: '🦆', color: '#eab308' }, // Yellow
  { id: 'robot', label: 'Robot', emoji: '🤖', color: '#06b6d4' }, // Cyan
];

export const getTokenById = (id: string) => GAME_TOKENS.find(t => t.id === id);
