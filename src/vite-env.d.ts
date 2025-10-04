/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly TELEGRAM_BOT_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ensure this file is treated as a module
export {};
