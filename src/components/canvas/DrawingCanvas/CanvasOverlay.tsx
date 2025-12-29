import React from 'react';
import {
  Layer,
  Rect,
  Circle,
  Transformer,
  Group,
  Text,
  Line as KonvaLine,
} from 'react-konva';
import type Konva from 'konva';
import { CanvasItem } from '@/components/CanvasItem'; // Imports strictly from where it exists
import type { Line } from '@/types';

interface CanvasOverlayProps {
  transformerRef: React.RefObject<Konva.Transformer | null>;
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
  } | null;
  activeTool: string;
  cursorPos: { x: number; y: number } | null;
  brushColor: string;
  brushSize: number;
  currentLine: Line | null;
  stageSize: { width: number; height: number };
}

/**
 * CanvasOverlay Component
 * Renders overlay elements like Transformer, Selection Box, Tools Previews (Mirror), and Custom Cursor.
 */
export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  transformerRef,
  selectionBox,
  activeTool,
  cursorPos,
  brushColor,
  brushSize,
  currentLine,
  stageSize,
}) => {
  const showCustomCursor = activeTool !== 'select' && cursorPos;

  return (
    <Layer>
      {/* Transformer for selections */}
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) =>
          newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
        }
      />

      {/* Selection Box */}
      {selectionBox && (
        <Rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          fill="rgba(99, 102, 241, 0.1)"
          stroke="rgba(99, 102, 241, 0.8)"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Mirror Axis Helper */}
      {activeTool === 'mirror' && (
        <KonvaLine
          points={[
            stageSize.width / 2,
            0,
            stageSize.width / 2,
            stageSize.height,
          ]}
          stroke="#6366F1"
          opacity={0.75}
          strokeWidth={2}
          dash={[10, 10]}
          listening={false}
        />
      )}

      {/* Mirror Tool Preview */}
      {activeTool === 'mirror' && currentLine && (
        <CanvasItem
          line={{
            ...currentLine,
            points: currentLine.points.map((val: number, i: number) =>
              i % 2 === 0 ? stageSize.width - val : val
            ),
            id: 'preview-mirror',
          }}
          index={-1}
          isSelected={false}
          isSelectTool={false}
          onSelect={() => {}}
          onDragEnd={() => {}}
          onTransformEnd={() => {}}
        />
      )}

      {/* Custom Cursor */}
      {showCustomCursor && cursorPos && (
        <Group listening={false}>
          {activeTool !== 'text' && (
            <Circle
              x={cursorPos.x}
              y={cursorPos.y}
              radius={
                activeTool === 'eraser' ? (brushSize * 1.5) / 2 : brushSize / 2
              }
              stroke={activeTool === 'eraser' ? '#000' : brushColor}
              strokeWidth={1}
              fillEnabled={false}
              opacity={0.8}
            />
          )}
          {activeTool === 'text' && (
            <Text
              text="A"
              x={cursorPos.x}
              y={cursorPos.y - (brushSize * 3) / 2}
              fontSize={brushSize * 3}
              fill={brushColor}
              opacity={0.5}
            />
          )}
        </Group>
      )}
    </Layer>
  );
};
