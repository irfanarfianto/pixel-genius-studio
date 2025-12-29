import React from 'react';

interface BrushSizeControlProps {
  brushSize: number;
  brushColor: string;
  onSizeChange: (size: number) => void;
}

/**
 * Brush size control with preview and slider
 */
export const BrushSizeControl: React.FC<BrushSizeControlProps> = ({
  brushSize,
  brushColor,
  onSizeChange,
}) => {
  return (
    <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
      {/* Brush size preview */}
      <div
        className="w-3 h-3 md:w-3/4 md:aspect-square bg-gray-900 rounded-full transition-all"
        style={{
          transform: `scale(${Math.max(0.4, brushSize / 60)})`,
          backgroundColor: brushColor,
        }}
      />

      {/* Brush size slider */}
      <input
        type="range"
        min="1"
        max="50"
        value={brushSize}
        onChange={(e) => onSizeChange(parseInt(e.target.value))}
        className="w-20 md:w-1.5 md:h-24 appearance-none bg-gray-200 rounded-full outline-none 
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                   [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full"
        style={
          window.innerWidth >= 768
            ? { writingMode: 'vertical-lr', direction: 'rtl' }
            : {}
        }
      />
    </div>
  );
};
