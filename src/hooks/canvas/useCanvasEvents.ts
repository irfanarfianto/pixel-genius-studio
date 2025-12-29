import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getRelativePointerPosition } from '@/utils/canvasUtils';
import {
  getBounds,
  isIntersect,
  isLineInSelectionBox,
} from '@/utils/canvas/CanvasHelpers';
import { useDrawingStore } from '@/store/drawingStore';
import type { Layer, Line, Tool, SelectionBox, TextInputState } from '@/types';

interface UseCanvasEventsProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isDrawing: React.MutableRefObject<boolean>;
  isPanning: React.MutableRefObject<boolean>;
  lastPanPos: React.MutableRefObject<{ x: number; y: number }>;
  isFinalizing: React.MutableRefObject<boolean>;
  creationTime: React.MutableRefObject<number>;
  isSpacePressed: boolean;
  currentLine: Line | null;
  setCurrentLine: (line: Line | null) => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectionBox: SelectionBox | null;
  setSelectionBox: (
    box:
      | SelectionBox
      | null
      | ((prev: SelectionBox | null) => SelectionBox | null)
  ) => void;
  textInput: TextInputState | null;
  setTextInput: (input: TextInputState | null) => void;
  setCursorPos: (pos: { x: number; y: number } | null) => void;
  activeTool: Tool;
  brushColor: string;
  brushSize: number;
  stageSize: { width: number; height: number };
  setScale: (scale: number) => void;
  position: { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  layers: Layer[];
  activeLayerId: string;
  addLineToActiveLayer: (line: Line) => void;
  updateLineInActiveLayer: (index: number, attrs: Partial<Line>) => void;
  playSound: (type: 'pop' | 'draw' | 'success' | 'delete') => void;
}

/**
 * Custom hook for canvas event handlers
 */
export const useCanvasEvents = (props: UseCanvasEventsProps) => {
  const {
    stageRef,
    isDrawing,
    isPanning,
    lastPanPos,
    isFinalizing,
    creationTime,
    isSpacePressed,
    currentLine,
    setCurrentLine,
    selectedIds,
    setSelectedIds,
    selectionBox,
    setSelectionBox,
    textInput,
    setTextInput,
    setCursorPos,
    activeTool,
    brushColor,
    brushSize,
    stageSize,
    setScale,
    position,
    setPosition,
    layers,
    activeLayerId,
    addLineToActiveLayer,
    updateLineInActiveLayer,
    playSound,
  } = props;

  // Selection handler
  const selectShape = (id: string, shiftKey: boolean) => {
    if (activeTool !== 'select') return;

    setSelectedIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (shiftKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);

        // AUTO-SELECT INTERSECTING ERASERS
        const state = useDrawingStore.getState();
        const activeLayer = state.layers.find(
          (l) => l.id === state.activeLayerId
        );
        const targetLine = activeLayer?.lines.find((l) => l.id === id);

        if (targetLine && activeLayer && targetLine.tool !== 'eraser') {
          const targetBounds = getBounds(targetLine);

          activeLayer.lines.forEach((l) => {
            if (l.tool === 'eraser' && l.id !== id) {
              const eraserBounds = getBounds(l);
              if (isIntersect(targetBounds, eraserBounds)) {
                next.add(l.id!);
              }
            }
          });
        }
      }
      return next;
    });
  };

  // Shape transformation handlers
  const onShapeDragEnd = (e: KonvaEventObject<DragEvent>, i: number) => {
    updateLineInActiveLayer(i, { x: e.target.x(), y: e.target.y() });
  };

  const onShapeTransformEnd = (e: KonvaEventObject<Event>, i: number) => {
    const node = e.target;
    updateLineInActiveLayer(i, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  };

  // Deselection handler
  const checkDeselect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedIds(new Set());
    }
  };

  // Text finalization
  const finalizeText = () => {
    if (Date.now() - creationTime.current < 500) {
      return;
    }

    if (isFinalizing.current) return;
    isFinalizing.current = true;
    if (textInput && textInput.text.trim() !== '') {
      playSound('success');
      addLineToActiveLayer({
        tool: 'text',
        points: [],
        color: brushColor,
        size: brushSize,
        text: textInput.text,
        x: textInput.x,
        y: textInput.y,
      });
    }
    setTextInput(null);
    setTimeout(() => {
      isFinalizing.current = false;
    }, 200);
  };

  // Wheel handler (zoom/pan)
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    if (e.evt.ctrlKey) {
      // ZOOM
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      let newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
      newScale = Math.max(0.1, Math.min(newScale, 5));

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setScale(newScale);
      setPosition(newPos);
    } else {
      // PAN
      setPosition({
        x: position.x - e.evt.deltaX,
        y: position.y - e.evt.deltaY,
      });
    }
  };

  // Mouse down handler
  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt;
    const isTouch = 'touches' in evt;
    const isMiddleClick = !isTouch && (evt as MouseEvent).button === 1;

    // 2-FINGER TOUCH (Pan Start)
    if (isTouch && evt.touches.length === 2) {
      isPanning.current = true;
      isDrawing.current = false;

      const p1 = evt.touches[0];
      const p2 = evt.touches[1];
      lastPanPos.current = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };
      return;
    }

    // DESKTOP PAN: Middle Click or Spacebar + Click
    if (isMiddleClick || isSpacePressed) {
      isPanning.current = true;
      const clientX = isTouch
        ? evt.touches[0].clientX
        : (evt as MouseEvent).clientX;
      const clientY = isTouch
        ? evt.touches[0].clientY
        : (evt as MouseEvent).clientY;

      lastPanPos.current = { x: clientX, y: clientY };
      const container = e.target.getStage()?.container();
      if (container) container.style.cursor = 'grabbing';
      return;
    }

    if (isFinalizing.current) return;

    checkDeselect(e);

    // If text input exists, finalize it
    if (textInput && Date.now() - creationTime.current > 500) {
      finalizeText();
      return;
    }

    if (activeTool === 'select') {
      const stage = e.target.getStage();
      if (stage && e.target === stage) {
        const pos = getRelativePointerPosition(stage.getLayers()[0]);
        if (pos) {
          setSelectionBox({
            startX: pos.x,
            startY: pos.y,
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
          });
          if (!e.evt.shiftKey) {
            setSelectedIds(new Set());
          }
        }
      }
      return;
    }

    const stage = e.target.getStage();
    const layer = stage?.getLayers()[0];
    const pos = layer ? getRelativePointerPosition(layer) : null;
    if (!stage || !pos) return;

    // TEXT TOOL
    if (activeTool === 'text') {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      isFinalizing.current = false;
      creationTime.current = Date.now();
      setTextInput({
        x: pos.x,
        y: pos.y,
        domX: pointer.x,
        domY: pointer.y,
        text: '',
      });
      return;
    }

    // FLOOD FILL
    if (activeTool === 'fill') {
      playSound('pop');
      addLineToActiveLayer({
        tool: 'fill',
        points: [0, 0, stageSize.width, stageSize.height],
        color: brushColor,
        size: 0,
        x: 0,
        y: 0,
      });
      return;
    }

    // Start drawing
    isDrawing.current = true;
    playSound('draw');
    setCurrentLine({
      tool: activeTool,
      points: [pos.x, pos.y, pos.x, pos.y],
      color: brushColor,
      size: activeTool === 'eraser' ? brushSize * 1.5 : brushSize,
    });
  };

  // Mouse move handler
  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // PANNING UPDATE
    if (isPanning.current) {
      const evt = e.evt;
      const isTouch = 'touches' in evt;

      let clientX, clientY;

      if (isTouch && evt.touches.length === 2) {
        e.evt.preventDefault();
        const p1 = evt.touches[0];
        const p2 = evt.touches[1];
        clientX = (p1.clientX + p2.clientX) / 2;
        clientY = (p1.clientY + p2.clientY) / 2;
      } else {
        const touch = isTouch ? evt.touches[0] || evt.changedTouches[0] : null;
        clientX =
          isTouch && touch ? touch.clientX : (evt as MouseEvent).clientX;
        clientY =
          isTouch && touch ? touch.clientY : (evt as MouseEvent).clientY;
      }

      const dx = clientX - lastPanPos.current.x;
      const dy = clientY - lastPanPos.current.y;
      lastPanPos.current = { x: clientX, y: clientY };
      setPosition({ x: position.x + dx, y: position.y + dy });
      return;
    }

    const stage = e.target.getStage();
    const layer = stage?.getLayers()[0];
    const point = layer ? getRelativePointerPosition(layer) : null;

    if (selectionBox && point) {
      setSelectionBox((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          x: Math.min(prev.startX, point.x),
          y: Math.min(prev.startY, point.y),
          width: Math.abs(point.x - prev.startX),
          height: Math.abs(point.y - prev.startY),
        };
      });
      return;
    }

    if (point) setCursorPos({ x: point.x, y: point.y });
    if (!isDrawing.current || !currentLine || !point) return;

    let newPoints: number[];
    if (
      ['line', 'rectangle', 'circle', 'triangle', 'star'].includes(
        currentLine.tool
      )
    ) {
      newPoints = [
        currentLine.points[0],
        currentLine.points[1],
        point.x,
        point.y,
      ];
    } else {
      newPoints = currentLine.points.concat([point.x, point.y]);
    }

    setCurrentLine({ ...currentLine, points: newPoints });
  };

  // Mouse up handler
  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      if (stageRef.current) {
        const cursor =
          activeTool === 'text'
            ? 'text'
            : activeTool === 'eraser'
              ? 'none'
              : 'default';
        stageRef.current.container().style.cursor = cursor;
      }
      return;
    }

    if (selectionBox) {
      const box = selectionBox;
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (activeLayer) {
        const newIds = new Set(selectedIds);
        activeLayer.lines.forEach((line) => {
          if (!line.id) return;
          if (isLineInSelectionBox(line, box)) {
            newIds.add(line.id);
          }
        });
        setSelectedIds(newIds);
      }
      setSelectionBox(null);
      return;
    }

    isDrawing.current = false;
    if (currentLine) {
      playSound('pop');
      const isMirror = activeTool === 'mirror';

      addLineToActiveLayer({
        tool: currentLine.tool,
        points: currentLine.points,
        color: currentLine.color,
        size: currentLine.size,
      });

      if (isMirror) {
        const mirroredPoints = currentLine.points.map(
          (val: number, i: number) =>
            i % 2 === 0 ? stageSize.width - val : val
        );
        addLineToActiveLayer({
          tool: currentLine.tool,
          points: mirroredPoints,
          color: currentLine.color,
          size: currentLine.size,
        });
      }
      setCurrentLine(null);
    }
  };

  return {
    selectShape,
    onShapeDragEnd,
    onShapeTransformEnd,
    checkDeselect,
    finalizeText,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
