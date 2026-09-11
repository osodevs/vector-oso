interface ImportMetaEnv {
  readonly VITE_KOFI_URL?: string;
  readonly VITE_LEGAL_NAME?: string;
  readonly VITE_LEGAL_ADDRESS?: string;
  readonly VITE_LEGAL_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
