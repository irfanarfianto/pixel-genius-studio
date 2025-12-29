// Canvas default values and constraints
export const CANVAS_DEFAULTS = {
  WIDTH: 1200,
  HEIGHT: 800,
  BACKGROUND_COLOR: '#FFFFFF',
  MIN_SCALE: 0.1,
  MAX_SCALE: 10,
  SCALE_STEP: 0.1,
} as const;

export const LAYER_DEFAULTS = {
  NAME_PREFIX: 'Layer',
  OPACITY: 1,
  VISIBLE: true,
  LOCKED: false,
} as const;

export const HISTORY_DEFAULTS = {
  MAX_STEPS: 20,
  INITIAL_STEP: 0,
} as const;
