/**
 * Single source of truth for resolving a tournament's banner image.
 *
 * Why this exists:
 *   The same uploaded `banner_image` was rendering with three different
 *   aspect ratios across Home / All Tournaments / Detail / My Registrations
 *   because each surface had its own resolution + sizing logic. Posters
 *   designed for one surface ended up cropped on others (the client's
 *   "REGISTER" text getting cut off was the trigger).
 *
 * What this exports:
 *   - resolveBannerImage(tournament): returns an absolute URL or local
 *     fallback game poster. Honours the field-priority order
 *     `banner_image > poster_image > hero_image > image > game-fallback`.
 *   - BANNER_ASPECT_CLASS: Tailwind classes for the SAME responsive aspect
 *     ratio used everywhere (4:5 mobile → 16:9 tablet → 21:8 wide desktop).
 *     Importing from one place means changing it once changes it everywhere.
 */

import posterBgmi from '../assets/poster-bgmi.png';
import posterFreefire from '../assets/poster-freefire.jpg';
import posterScarfall from '../assets/poster-scarfall.png';
import posterValorant from '../assets/poster-valorant.jpg';
import posterCodm from '../assets/poster-codm.jpg';

const GAME_POSTERS = {
  BGMI: posterBgmi,
  Freefire: posterFreefire,
  'Free Fire': posterFreefire,
  Scarfall: posterScarfall,
  Valorant: posterValorant,
  COD: posterCodm,
  'COD Mobile': posterCodm,
};

const getMediaBase = () => {
  const base =
    process.env.REACT_APP_MEDIA_URL ||
    process.env.REACT_APP_API_URL?.replace('/api', '') ||
    'http://localhost:8000';
  return base.replace(/\/media\/?$/, '');
};

const absolutise = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getMediaBase()}${path}`;
};

/**
 * Returns the best image URL for a tournament, falling back to a game-specific
 * default poster if no uploaded image exists.
 */
export const resolveBannerImage = (tournament) => {
  if (!tournament) return posterBgmi;
  const remote =
    absolutise(tournament.banner_image) ||
    absolutise(tournament.poster_image) ||
    absolutise(tournament.hero_image) ||
    absolutise(tournament.image);
  if (remote) return remote;

  const game = tournament.game_name || tournament.game || '';
  return GAME_POSTERS[game] || GAME_POSTERS[game.split(' ')[0]] || posterBgmi;
};

/**
 * Single Tailwind aspect-ratio class string used across the app for tournament
 * banner display. Matches the Home / Overview hero carousel so a poster
 * uploaded for one surface looks identical on all others.
 */
export const BANNER_ASPECT_CLASS = 'aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/8]';
