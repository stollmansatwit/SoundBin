/// <reference types="vite/client" />

/**
 * Types for the `VITE_`-prefixed environment variables SoundBin reads at
 * build/dev time. Adding a variable here gives it autocomplete and type
 * checking wherever `import.meta.env` is used.
 */
interface ImportMetaEnv {
  /** Full backend URL, e.g. `http://localhost:3000`. Overrides the two below. */
  readonly VITE_API_URL?: string;
  /** Backend host without a port, e.g. `http://localhost`. */
  readonly VITE_APPLICATION_URL?: string;
  /** Port the backend listens on, e.g. `3000`. */
  readonly VITE_BACKEND_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
