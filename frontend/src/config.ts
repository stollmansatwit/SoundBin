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
 *   1. `VITE_API_URL`  — full URL, e.g. `http://localhost:3000`. If set,
 *      all API calls go to this absolute URL.
 *   2. `''` (same origin) — the Vite dev server proxies /api, /songs and
 *      /assets to the backend (see vite.config.ts), so the browser only
 *      ever talks to whatever host it loaded the page from. This is the
 *      default and works from any device without knowing the server's
 *      address. Used by docker-compose.yml's frontend service today.
 *
 * NOTE: `VITE_APPLICATION_URL` / `VITE_BACKEND_PORT` are NOT currently read
 * here — remove them if you see them in an old .env file, or wire them up
 * below if you want a "host + port" alternative to VITE_API_URL.
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
