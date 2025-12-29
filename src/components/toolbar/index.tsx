import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDrawingStore } from '@/store/drawingStore';
import type { Tool } from '@/types';
import {
  SELECT_TOOL,
  SHAPE_TOOLS,
  BRUSH_TOOLS,
  UTILITY_TOOLS,
} from './config/toolConfig';
import { ToolButton } from './components/ToolButton';
import { ToolGroup } from './components/ToolGroup';
import { ColorPicker } from './components/ColorPicker';
import { BrushSizeControl } from './components/BrushSizeControl';

/**
 * Main Toolbar Component
 * Orchestrates all toolbar functionality
 */
export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    isMirrorAxisVisible,
    toggleMirrorAxisVisibility,
  } = useDrawingStore();

  const [isShapesOpen, setIsShapesOpen] = React.useState(false);
  const [isBrushesOpen, setIsBrushesOpen] = React.useState(false);
  const [isColorsOpen, setIsColorsOpen] = React.useState(false);

  const closeAllPopups = () => {
    setIsShapesOpen(false);
    setIsBrushesOpen(false);
    setIsColorsOpen(false);
  };

  // Debounce tool selection to prevent multiple rapid clicks
  const lastClickedTool = React.useRef<Tool | null>(null);
  const lastClickTime = React.useRef<number>(0);

  const handleToolSelect = React.useCallback(
    (toolId: Tool) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;

      // Only debounce if clicking the SAME tool repeatedly
      if (toolId === lastClickedTool.current && timeSinceLastClick < 300) {
        return;
      }

      lastClickedTool.current = toolId;
      lastClickTime.current = now;

      closeAllPopups();
      setActiveTool(toolId);
    },
    [setActiveTool]
  );

  // Check if tools are active
  const isShapeActive = SHAPE_TOOLS.some((t) => t.id === activeTool);
  const isBrushActive = BRUSH_TOOLS.some((t) => t.id === activeTool);

  // Get current tool for each group
  const currentShape =
    SHAPE_TOOLS.find((t) => t.id === activeTool) ||
    SHAPE_TOOLS.find((t) => t.id === 'rectangle')!;
  const currentBrush =
    BRUSH_TOOLS.find((t) => t.id === activeTool) ||
    BRUSH_TOOLS.find((t) => t.id === 'brush')!;

  return (
    <div className="glass-panel p-1.5 md:p-2 flex flex-row md:flex-col gap-2 md:gap-3 items-center w-full md:w-16 md:h-full shrink-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 shrink-0 items-center">
        {/* Select Tool */}
        {SELECT_TOOL && (
          <ToolButton
            tool={SELECT_TOOL}
            isActive={activeTool === 'select'}
            onClick={() => handleToolSelect('select')}
          />
        )}

        {/* Shapes Group */}
        <ToolGroup
          label="Shapes"
          tools={SHAPE_TOOLS}
          activeTool={activeTool}
          currentTool={currentShape}
          isActive={isShapeActive}
          isOpen={isShapesOpen}
          onToggle={() => {
            setIsShapesOpen(!isShapesOpen);
            setIsBrushesOpen(false);
            setIsColorsOpen(false);
          }}
          onSelectTool={handleToolSelect}
          onCloseAll={closeAllPopups}
          position="top"
        />

        {/* Brushes Group */}
        <ToolGroup
          label="Brushes"
          tools={BRUSH_TOOLS}
          activeTool={activeTool}
          currentTool={currentBrush}
          isActive={isBrushActive}
          isOpen={isBrushesOpen}
          onToggle={() => {
            setIsBrushesOpen(!isBrushesOpen);
            setIsShapesOpen(false);
            setIsColorsOpen(false);
          }}
          onSelectTool={handleToolSelect}
          onCloseAll={closeAllPopups}
          position="middle"
        />

        {/* Utility Tools */}
        {UTILITY_TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => handleToolSelect(tool.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 md:w-8 md:h-px bg-gray-300 md:bg-gray-200 shrink-0 my-1"></div>

      {/* Brush Size Control */}
      <BrushSizeControl
        brushSize={brushSize}
        brushColor={brushColor}
        onSizeChange={setBrushSize}
      />

      {/* Divider */}
      <div className="w-px h-6 md:w-8 md:h-px bg-gray-300 md:bg-gray-200 shrink-0 my-1"></div>

      {/* Color Picker */}
      <ColorPicker
        brushColor={brushColor}
        isOpen={isColorsOpen}
        onToggle={() => {
          setIsColorsOpen(!isColorsOpen);
          setIsShapesOpen(false);
          setIsBrushesOpen(false);
        }}
        onSelectColor={setBrushColor}
        onCloseAll={closeAllPopups}
      />

      {/* Mirror Axis Toggle */}
      {activeTool === 'mirror' && (
        <>
          <div className="w-px h-6 md:w-8 md:h-px bg-gray-300 md:bg-gray-200 shrink-0 my-1"></div>
          <button
            onClick={toggleMirrorAxisVisibility}
            className={`p-2 rounded-xl transition-all shadow-sm ${
              isMirrorAxisVisible
                ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200'
                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-200'
            }`}
            title={
              isMirrorAxisVisible
                ? 'Sembunyikan Garis Bantu'
                : 'Tampilkan Garis Bantu'
            }
          >
            {isMirrorAxisVisible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </>
      )}
    </div>
  );
};
