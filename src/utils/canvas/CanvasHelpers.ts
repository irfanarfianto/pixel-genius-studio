/**
 * Canvas Helper Functions
 * Pure utility functions for canvas operations
 */

/**
 * Calculate bounding box for a line/shape
 * @param line - Line object with points, x, y, and size
 * @returns Bounding box with x, y, width, height
 */
import type { Line } from '@/types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate bounding box for a line/shape
 * @param line - Line object with points, x, y, and size
 * @returns Bounding box with x, y, width, height
 */
export const getBounds = (line: Line): Rect => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const offsetX = line.x || 0;
  const offsetY = line.y || 0;
  const pts = line.points || [];

  if (pts.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  for (let i = 0; i < pts.length; i += 2) {
    const px = pts[i] + offsetX;
    const py = pts[i + 1] + offsetY;
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }

  const pad = (line.size || 5) / 2;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
};

/**
 * Check if two rectangles intersect
 * @param r1 - First rectangle {x, y, width, height}
 * @param r2 - Second rectangle {x, y, width, height}
 * @returns true if rectangles intersect
 */
export const isIntersect = (r1: Rect, r2: Rect) => {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
};

/**
 * Calculate bounds for box selection
 * @param line - Line object
 * @param pad - Optional padding (defaults to line.size / 2)
 * @returns Bounding box coordinates
 */
export const getLineBoundsForSelection = (line: Line, pad?: number) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const pts = line.points || [];
  const ox = line.x || 0;
  const oy = line.y || 0;

  if (pts.length > 0) {
    for (let i = 0; i < pts.length; i += 2) {
      const px = pts[i] + ox;
      const py = pts[i + 1] + oy;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  } else {
    // Fallback for objects without points (like text)
    minX = ox;
    maxX = ox + (line.size || 24) * 5; // Approximate
    minY = oy;
    maxY = oy + (line.size || 24);
  }

  // Add padding to line bounds for easier selection
  const padding = pad !== undefined ? pad : (line.size || 5) / 2;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return { minX, minY, maxX, maxY };
};

/**
 * Check if a line overlaps with a selection box
 * @param line - Line object
 * @param box - Selection box {x, y, width, height}
 * @returns true if line overlaps with box
 */
export const isLineInSelectionBox = (line: Line, box: Rect) => {
  const { minX, minY, maxX, maxY } = getLineBoundsForSelection(line);

  return !(
    box.x > maxX ||
    box.x + box.width < minX ||
    box.y > maxY ||
    box.y + box.height < minY
  );
};
