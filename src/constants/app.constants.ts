// Application-wide constants
export const APP_CONFIG = {
  APP_NAME: 'Pixel Genius Studio',
  VERSION: '1.0.0',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  SUPPORTED_IMAGE_FORMATS: ['image/png', 'image/jpeg', 'image/jpg'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

export const STORAGE_KEYS = {
  DRAWING_STATE: 'pixel-genius-drawing-state',
  USER_PREFERENCES: 'pixel-genius-user-preferences',
  RECENT_PROJECTS: 'pixel-genius-recent-projects',
} as const;
