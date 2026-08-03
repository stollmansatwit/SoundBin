/// <reference types="vite/client" />

/**
 * Types for the `VITE_`-prefixed environment variables SoundBin reads at
 * build/dev time. Adding a variable here gives it autocomplete and type
 * checking wherever `import.meta.env` is used.
 */
interface ImportMetaEnv {
  /** Full backend URL, e.g. `http://localhost:3000`. If unset, API calls
   *  use the same origin the page was loaded from (see src/config.ts). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
