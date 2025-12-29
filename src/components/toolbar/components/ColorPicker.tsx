import React from 'react';
import { createPortal } from 'react-dom';
import { COLOR_PALETTES } from '@/constants';

interface ColorPickerProps {
  brushColor: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectColor: (color: string) => void;
  onCloseAll: () => void;
}

// Use color palette from constants
const COLORS = [
  ...COLOR_PALETTES.BASIC.slice(0, 2), // Black and White
  ...COLOR_PALETTES.VIBRANT, // Vibrant colors
];

/**
 * Color picker component with palette
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  brushColor,
  isOpen,
  onToggle,
  onSelectColor,
  onCloseAll,
}) => {
  return (
    <div className="relative group/colors shrink-0">
      <button
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-200 transition-transform group relative ${isOpen ? 'scale-110 ring-indigo-300' : 'hover:scale-105'}`}
        style={{ backgroundColor: brushColor }}
        onClick={onToggle}
      />

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 bg-black/5" onClick={onCloseAll} />
            <div
              className="fixed bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/50 ring-1 ring-black/5 flex flex-col gap-4
                          animate-in fade-in zoom-in-95 duration-200
                          bottom-24 right-4 md:bottom-20 md:left-20 md:right-auto min-w-[220px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Palette
                </span>
                <div
                  className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                  title="Custom Color"
                >
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => onSelectColor(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 shadow-sm ${
                      brushColor === color
                        ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110 z-10'
                        : 'border-white'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onSelectColor(color);
                      onCloseAll();
                    }}
                  />
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
