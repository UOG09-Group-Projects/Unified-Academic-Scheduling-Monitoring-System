// Single source of truth for the backend's location. Set VITE_API_URL in
// frontend/.env.production when building for deployment (Vite only inlines
// vars prefixed VITE_); falls back to the local dev server otherwise.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
