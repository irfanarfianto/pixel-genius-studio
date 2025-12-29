// Tool-related constants
export const TOOL_DEFAULTS = {
  BRUSH_SIZE: 5,
  MIN_BRUSH_SIZE: 1,
  MAX_BRUSH_SIZE: 100,
  DEFAULT_COLOR: '#000000',
  ERASER_SIZE: 20,
} as const;

export const TOOLS = {
  BRUSH: 'brush',
  ERASER: 'eraser',
  BUCKET: 'bucket',
  EYEDROPPER: 'eyedropper',
  TEXT: 'text',
  SHAPE: 'shape',
} as const;
