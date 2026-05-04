/**
 * Centralised game-to-map-list mapping.
 *
 * Used by both `CreateTournament.js` (host picking a map for each match) and
 * `TournamentDetail.js` (displaying the map pool for a tournament). Keeping
 * this in one file means adding a new map only requires editing here.
 *
 * The `OTHER_OPTION` constant is the sentinel value that tells the form to
 * render a free-text input where the host can type a custom map name. It is
 * never stored in the DB itself — only the typed name is persisted.
 */

export const OTHER_OPTION = '__other__';

export const GAME_MAPS = {
  BGMI: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Karakin', 'Rondo', 'Nusa'],
  'Free Fire': ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'],
  Freefire: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'Nexterra'],
  'COD Mobile': ['Isolated', 'Alcatraz', 'Blackout', 'Rebirth Island', "Fortune's Keep"],
  COD: ['Isolated', 'Alcatraz', 'Blackout', 'Rebirth Island', "Fortune's Keep"],
  Valorant: [
    'Bind',
    'Haven',
    'Split',
    'Ascent',
    'Icebox',
    'Breeze',
    'Fracture',
    'Pearl',
    'Lotus',
    'Sunset',
    'Abyss',
    'Corrode',
  ],
  Scarfall: [
    'Valley',
    'Seaview',
    'Graveyard',
    'Desert',
    'Norvania',
    'Gorge',
    'Tropicana',
    'Bayfront',
  ],
};

/**
 * Look up the map list for a game, with case- and whitespace-insensitive matching
 * so callers don't have to normalise their game-name input. Falls back to BGMI
 * because that's the most common case across the platform.
 */
export const getMapsForGame = (gameName = '') => {
  if (!gameName) return GAME_MAPS.BGMI;
  // Exact key first
  if (GAME_MAPS[gameName]) return GAME_MAPS[gameName];
  const lc = gameName.toLowerCase().replace(/\s+/g, '');
  if (lc.includes('bgmi') || lc.includes('pubg')) return GAME_MAPS.BGMI;
  if (lc.includes('freefire') || lc.includes('free fire')) return GAME_MAPS['Free Fire'];
  if (lc.includes('scar')) return GAME_MAPS.Scarfall;
  if (lc.includes('valorant')) return GAME_MAPS.Valorant;
  if (lc.includes('cod')) return GAME_MAPS['COD Mobile'];
  return GAME_MAPS.BGMI;
};
