import { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { useDrawingStore } from '@/store/drawingStore';
import type { Line } from '@/types';

/**
 * Custom hook to manage canvas state
 * Handles refs, local state, and derived state
 */
export const useCanvasState = () => {
  const {
    stageSize,
    activeTool,
    brushColor,
    brushSize,
    layers,
    addLineToActiveLayer,
    updateLineInActiveLayer,
    setStageSize,
    scale,
    setScale,
    position,
    setPosition,
    canvasAction,
    setCanvasAction,
    deleteLines,
    referenceImage,
    activeLayerId,
    referenceOpacity,
    isMirrorAxisVisible,
  } = useDrawingStore();

  // Refs
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const isFinalizing = useRef(false);
  const creationTime = useRef(0);

  // Local State
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Use Line type for currentLine, but allow it to be null
  // Note: During creation, it might not have an ID yet, which fits Line interface (id is optional)
  const [currentLine, setCurrentLine] = useState<Line | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [refImgObj, setRefImgObj] = useState<HTMLImageElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const [textInput, setTextInput] = useState<{
    x: number;
    y: number;
    domX: number;
    domY: number;
    text: string;
  } | null>(null);

  // Load Reference Image
  useEffect(() => {
    if (referenceImage) {
      const img = new window.Image();
      img.src = referenceImage;
      img.onload = () => setRefImgObj(img);
    } else {
      // eslint-disable-next-line
      setRefImgObj((p) => (p ? null : p));
    }
  }, [referenceImage]);

  // Transformer Logic
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const stage = stageRef.current;
      const nodes = Array.from(selectedIds)
        .map((id) => stage.findOne('#' + id))
        .filter(Boolean);
      transformerRef.current.nodes(nodes as Konva.Node[]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, layers]);

  return {
    // Store state
    stageSize,
    activeTool,
    brushColor,
    brushSize,
    layers,
    addLineToActiveLayer,
    updateLineInActiveLayer,
    setStageSize,
    scale,
    setScale,
    position,
    setPosition,
    canvasAction,
    setCanvasAction,
    deleteLines,
    referenceImage,
    activeLayerId,
    referenceOpacity,
    isMirrorAxisVisible,

    // Refs
    stageRef,
    transformerRef,
    isDrawing,
    isPanning,
    lastPanPos,
    isFinalizing,
    creationTime,

    // Local state
    isSpacePressed,
    setIsSpacePressed,
    currentLine,
    setCurrentLine,
    selectedIds,
    setSelectedIds,
    selectionBox,
    setSelectionBox,
    refImgObj,
    cursorPos,
    setCursorPos,
    textInput,
    setTextInput,
  };
};
