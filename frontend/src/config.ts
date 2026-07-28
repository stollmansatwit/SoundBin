/**
 * @file Central configuration for the frontend.
 *
 * Every component used to declare its own
 *   `const apiBaseUrl = "http://localhost:3000"`
 * which meant changing the backend port required editing ~40 files. The base
 * URL now lives here and is driven by environment variables instead.
 *
 * Vite only exposes variables prefixed with `VITE_` to browser code, so the
 * values below must be `VITE_`-prefixed in `.env` to be picked up.
 *
 * Resolution order:
 *   1. `VITE_API_URL`                            — full URL, wins outright
 *      (this is the name docker-compose.yml already sets for the frontend service)
 *   2. `VITE_APPLICATION_URL` + `VITE_BACKEND_PORT` — assembled host + port
 *   3. `http://localhost:3000`                    — development fallback
 */

//const DEFAULT_HOST = 'http://localhost';
//const DEFAULT_BACKEND_PORT = '3000';

/** Drops any trailing slashes so callers can safely concatenate `/api/...`. */
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const resolveApiBaseUrl = (): string => {
  const explicit = import.meta.env.VITE_API_URL?.trim();
  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  // Same origin. The Vite dev server proxies /api, /songs and /assets to the
  // backend, so the browser only ever talks to whatever host it loaded the
  // page from. Works from any device without knowing the server's address.
  return '';
};

/**
 * Root of the SoundBin backend, with no trailing slash and no `/api` suffix.
 * @example `${API_BASE_URL}/api/tracks`
 */
export const API_BASE_URL: string = resolveApiBaseUrl();

/**
 * Builds an absolute backend URL from a path.
 * @param path Path beginning with or without a leading slash, e.g. `/api/tracks`
 */
export const apiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
