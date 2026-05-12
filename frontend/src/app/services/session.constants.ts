// Storage key used to persist the active user ID in localStorage across page reloads.
// Centralised here so all reads and writes reference the same string.
export const CURRENT_USER_STORAGE_KEY = 'coffee-and-kudos.currentUserId';

// Storage key for the JWT token returned by POST /api/Auth/login.
export const JWT_TOKEN_KEY = 'coffee-and-kudos.jwtToken';
