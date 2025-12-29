// Canvas-related types
export type Tool =
  | 'select'
  | 'brush'
  | 'eraser'
  | 'rainbow'
  | 'sparkles'
  | 'mirror'
  | 'fill'
  | 'text'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'bucket'
  | 'eyedropper'
  | 'shape';

export interface Line {
  id?: string;
  tool: Tool;
  points: number[];
  color: string;
  size: number;
  filledImage?: string;
  x?: number;
  y?: number;
  text?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  lines: Line[];
}

export interface StageSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export type CanvasAction = 'pan' | 'draw' | null;

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
}

export interface TextInputState {
  x: number;
  y: number;
  domX: number;
  domY: number;
  text: string;
}
