import React from 'react';
import { useSound } from '@/hooks/useSound';
import { ReferenceImageControls } from '../ReferenceImageControls';
import { TextInputOverlay } from '../TextInputOverlay';
import { useCanvasState } from '@/hooks/canvas/useCanvasState';
import { useCanvasEvents } from '@/hooks/canvas/useCanvasEvents';
import { useCanvasActions } from '@/hooks/canvas/useCanvasActions';
import { CanvasRenderer } from './CanvasRenderer';

/**
 * Main Drawing Canvas Component
 * Orchestrates all canvas functionality using custom hooks and components
 */
export const DrawingCanvas: React.FC = () => {
  const { playSound } = useSound();

  // Get all canvas state
  const state = useCanvasState();

  // Setup canvas events
  const events = useCanvasEvents({
    ...state,
    playSound,
  });

  // Setup canvas actions (export, keyboard shortcuts, etc.)
  useCanvasActions({
    stageRef: state.stageRef,
    transformerRef: state.transformerRef,
    canvasAction: state.canvasAction,
    setCanvasAction: state.setCanvasAction,
    layers: state.layers,
    selectedIds: state.selectedIds,
    setSelectedIds: state.setSelectedIds,
    deleteLines: state.deleteLines,
    setIsSpacePressed: state.setIsSpacePressed,
    stageSize: state.stageSize,
    setStageSize: state.setStageSize,
    setScale: state.setScale,
    setPosition: state.setPosition,
  });

  return (
    <div className="relative w-full h-full">
      {/* Canvas Renderer */}
      <CanvasRenderer
        stageRef={state.stageRef}
        transformerRef={state.transformerRef}
        stageSize={state.stageSize}
        scale={state.scale}
        position={state.position}
        layers={state.layers}
        activeLayerId={state.activeLayerId}
        activeTool={state.activeTool}
        currentLine={state.currentLine}
        selectedIds={state.selectedIds}
        selectionBox={state.selectionBox}
        refImgObj={state.refImgObj}
        referenceOpacity={state.referenceOpacity}
        cursorPos={state.cursorPos}
        brushColor={state.brushColor}
        brushSize={state.brushSize}
        isMirrorAxisVisible={state.isMirrorAxisVisible}
        handleWheel={events.handleWheel}
        handleMouseDown={events.handleMouseDown}
        handleMouseMove={events.handleMouseMove}
        handleMouseUp={events.handleMouseUp}
        selectShape={events.selectShape}
        onShapeDragEnd={events.onShapeDragEnd}
        onShapeTransformEnd={events.onShapeTransformEnd}
        setCursorPos={state.setCursorPos}
      />

      {/* Reference Image Controls */}
      <ReferenceImageControls />

      {/* Text Input Overlay */}
      <TextInputOverlay
        textInput={state.textInput}
        setTextInput={state.setTextInput}
        brushSize={state.brushSize}
        brushColor={state.brushColor}
        scale={state.scale}
        onFinalize={events.finalizeText}
      />
    </div>
  );
};
