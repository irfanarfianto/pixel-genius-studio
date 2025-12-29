import { floodFill } from './floodFill';
import type Konva from 'konva';

// Re-export floodFill
export { floodFill };

// Helper to get pointer position relative to a node
export const getRelativePointerPosition = (node: Konva.Node) => {
  const transform = node.getAbsoluteTransform().copy();
  transform.invert();
  const pos = node.getStage()?.getPointerPosition();
  if (!pos) return { x: 0, y: 0 };
  return transform.point(pos);
};

// Helper to calculate shape options (stroke, fill, etc)
export const getLineOptions = (
  tool: string,
  color: string,
  points: number[],
  size: number
) => {
  const isRainbow = tool === 'rainbow';
  const isSparkles = tool === 'sparkles';
  const isEraser = tool === 'eraser';

  const baseOptions: Konva.LineConfig = {
    points: points || [],
    stroke: isEraser ? '#000000' : color,
    strokeWidth: size,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.5,
    globalCompositeOperation: isEraser ? 'destination-out' : 'source-over',
  };

  if (isRainbow) {
    if (points && points.length >= 2) {
      baseOptions.strokeLinearGradientStartPoint = {
        x: points[0],
        y: points[1],
      };
      baseOptions.strokeLinearGradientEndPoint = {
        x: points[points.length - 2],
        y: points[points.length - 1],
      };
      baseOptions.strokeLinearGradientColorStops = [
        0,
        'red',
        0.2,
        'yellow',
        0.4,
        'green',
        0.6,
        'blue',
        0.8,
        'purple',
        1,
        'red',
      ];
    }
    baseOptions.stroke = undefined;
  }

  if (isSparkles) {
    baseOptions.stroke = '#F59E0B';
    baseOptions.shadowColor = '#FDE68A';
    baseOptions.shadowBlur = 10;
    baseOptions.dash = [1, 10];
    baseOptions.strokeWidth = size ? size * 0.5 : 5;
  }
  return baseOptions;
};
