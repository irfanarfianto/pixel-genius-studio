import React from 'react';
import { Stage, Layer, Rect, Image } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CanvasItem } from '@/components/CanvasItem';
import { CanvasOverlay } from './CanvasOverlay';

import type { Layer as DrawingLayer, Line, Tool, SelectionBox } from '@/types';

interface CanvasRendererProps {
  // Refs
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;

  // State
  stageSize: { width: number; height: number };
  scale: number;
  position: { x: number; y: number };
  layers: DrawingLayer[];
  activeLayerId: string;
  activeTool: Tool;
  currentLine: Line | null;
  selectedIds: Set<string>;
  selectionBox: SelectionBox | null;
  refImgObj: HTMLImageElement | null;
  referenceOpacity: number;
  cursorPos: { x: number; y: number } | null;
  brushColor: string;
  brushSize: number;
  isMirrorAxisVisible: boolean;

  // Event handlers
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
  handleMouseDown: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  handleMouseMove: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  handleMouseUp: () => void;
  selectShape: (id: string, shiftKey: boolean) => void;
  onShapeDragEnd: (e: KonvaEventObject<DragEvent>, i: number) => void;
  onShapeTransformEnd: (e: KonvaEventObject<Event>, i: number) => void;
  setCursorPos: (pos: { x: number; y: number } | null) => void;
}

/**
 * Canvas Renderer Component
 * Handles all Konva rendering logic
 */
export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  stageRef,
  transformerRef,
  stageSize,
  scale,
  position,
  layers,
  activeLayerId,
  activeTool,
  currentLine,
  selectedIds,
  selectionBox,
  refImgObj,
  referenceOpacity,
  cursorPos,
  brushColor,
  brushSize,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  selectShape,
  onShapeDragEnd,
  onShapeTransformEnd,
  setCursorPos,
  isMirrorAxisVisible,
}) => {
  const showCustomCursor = activeTool !== 'select' && cursorPos;
  // If active tool is 'text', we use the 'text' cursor via CSS (set in useCanvasEvents usually)
  // or we can handle it here if we want strictly custom cursor visually.
  // For now let's keep the CSS cursor logic: if we show custom cursor, we hide system cursor.
  const cursorStyle = showCustomCursor ? 'none' : 'default';

  return (
    <div
      id="canvas-container"
      className="w-full h-full bg-gray-200 relative overflow-hidden touch-none"
      style={{ cursor: cursorStyle }}
      onMouseLeave={() => setCursorPos(null)}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Background Layer */}
        <Layer>
          <Rect
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            fill="white"
            listening={false}
          />
        </Layer>

        {/* Drawing Layers */}
        {layers.map(
          (layer) =>
            layer.visible && (
              <Layer key={layer.id} opacity={layer.opacity}>
                {layer.lines.map((line, i) => (
                  <CanvasItem
                    key={line.id || i}
                    line={line}
                    index={i}
                    isSelected={selectedIds.has(line.id || '')}
                    isSelectTool={activeTool === 'select'}
                    onSelect={selectShape}
                    onDragEnd={onShapeDragEnd}
                    onTransformEnd={onShapeTransformEnd}
                  />
                ))}
                {/* Real-time preview */}
                {layer.id === activeLayerId && currentLine && (
                  <CanvasItem
                    line={{ ...currentLine, id: 'preview' }}
                    index={-1}
                    isSelected={false}
                    isSelectTool={false}
                    onSelect={() => {}}
                    onDragEnd={() => {}}
                    onTransformEnd={() => {}}
                  />
                )}
              </Layer>
            )
        )}

        {/* Reference Image Layer */}
        {refImgObj && (
          <Layer listening={false}>
            <Image
              image={refImgObj}
              x={10}
              y={10}
              height={150}
              width={(150 * refImgObj.width) / refImgObj.height}
              opacity={referenceOpacity}
              listening={false}
            />
          </Layer>
        )}

        {/* Overlay Layer */}
        <CanvasOverlay
          transformerRef={transformerRef}
          selectionBox={selectionBox}
          activeTool={activeTool}
          cursorPos={cursorPos}
          brushColor={brushColor}
          brushSize={brushSize}
          isMirrorAxisVisible={isMirrorAxisVisible}
          currentLine={currentLine}
          stageSize={stageSize}
        />
      </Stage>
    </div>
  );
};
