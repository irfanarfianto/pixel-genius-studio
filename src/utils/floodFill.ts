/**
 * Performs a flood fill operation on a canvas context.
 * Uses a stack-based approach for performance (avoiding recursion depth limits).
 */
export const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance: number = 30
): void => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // 1. Get all pixel data
  // Note: This can be slow for very large canvases, but works for typical drawing app sizes
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Helper: Hex to RGBA
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 255,
        }
      : { r: 0, g: 0, b: 0, a: 255 };
  };

  const fillColor = hexToRgb(fillColorHex);

  // Get starting pixel color
  const pixelPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
  const startColor = {
    r: data[pixelPos],
    g: data[pixelPos + 1],
    b: data[pixelPos + 2],
    a: data[pixelPos + 3],
  };

  // Optimization: If fill color is same as start color, do nothing
  if (
    Math.abs(startColor.r - fillColor.r) < tolerance &&
    Math.abs(startColor.g - fillColor.g) < tolerance &&
    Math.abs(startColor.b - fillColor.b) < tolerance &&
    Math.abs(startColor.a - fillColor.a) < tolerance
  ) {
    return;
  }

  // Helper: Check if pixel matches start color within tolerance
  const matchStartColor = (pos: number) => {
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const a = data[pos + 3];

    return (
      Math.abs(r - startColor.r) <= tolerance &&
      Math.abs(g - startColor.g) <= tolerance &&
      Math.abs(b - startColor.b) <= tolerance &&
      Math.abs(a - startColor.a) <= tolerance
    );
  };

  // Helper: Setup pixel color
  const colorPixel = (pos: number) => {
    data[pos] = fillColor.r;
    data[pos + 1] = fillColor.g;
    data[pos + 2] = fillColor.b;
    data[pos + 3] = fillColor.a; // Fully opaque fill
  };

  // Stack based flood fill
  const stack = [[Math.floor(startX), Math.floor(startY)]];

  // To prevent infinite loops (though color check helps), we can use a visited typed array?
  // Actually, changing the color prevents revisiting if new color != old color.
  // If we use tolerance, we might revisit. So let's be safe but typically changing color is enough.

  while (stack.length) {
    const [x, y] = stack.pop()!;
    let pixelPos = (y * width + x) * 4;

    // Move Up as long as we match
    let y1 = y;
    while (y1 >= 0 && matchStartColor((y1 * width + x) * 4)) {
      y1--;
    }
    y1++; // Recover first valid pixel

    // Scan Down
    let spanLeft = false;
    let spanRight = false;

    while (y1 < height && matchStartColor((y1 * width + x) * 4)) {
      pixelPos = (y1 * width + x) * 4;
      colorPixel(pixelPos);

      // Access neighbors
      if (x > 0) {
        if (matchStartColor(pixelPos - 4)) {
          if (!spanLeft) {
            stack.push([x - 1, y1]);
            spanLeft = true;
          }
        } else if (spanLeft) {
          spanLeft = false;
        }
      }

      if (x < width - 1) {
        if (matchStartColor(pixelPos + 4)) {
          if (!spanRight) {
            stack.push([x + 1, y1]);
            spanRight = true;
          }
        } else if (spanRight) {
          spanRight = false;
        }
      }

      y1++;
    }
  }

  // Put image data back
  ctx.putImageData(imageData, 0, 0);
};
