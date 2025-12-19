/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Weitere Umgebungsvariablen können hier hinzugefügt werden
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}