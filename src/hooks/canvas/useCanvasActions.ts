import { useEffect } from 'react';
import { useDrawingStore } from '@/store/drawingStore';
import { CANVAS_DEFAULTS } from '@/constants';
import { exportToPng, saveProject } from '@/utils/canvas/exportUtils';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

import type Konva from 'konva';
import type { Layer } from '@/types';
import type { CanvasAction } from '@/store/drawingStore';

interface UseCanvasActionsProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  canvasAction: CanvasAction;
  setCanvasAction: (action: CanvasAction) => void;
  layers: Layer[];
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  deleteLines: (ids: string[]) => void;
  setIsSpacePressed: (value: boolean) => void;
  stageSize: { width: number; height: number };
  setStageSize: (size: { width: number; height: number }) => void;
  setScale: (scale: number) => void;
  setPosition: (pos: { x: number; y: number }) => void;
}

/**
 * Custom hook for canvas actions (export, keyboard shortcuts, etc.)
 */
export const useCanvasActions = (props: UseCanvasActionsProps) => {
  const {
    stageRef,
    transformerRef,
    canvasAction,
    setCanvasAction,
    layers,
    selectedIds,
    setSelectedIds,
    deleteLines,
    setIsSpacePressed,
    stageSize,
    setStageSize,
    setScale,
    setPosition,
  } = props;

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    selectedIds,
    setSelectedIds,
    deleteLines,
    setIsSpacePressed,
  });

  // Canvas export actions
  useEffect(() => {
    if (!canvasAction) return;
    const stage = stageRef.current;
    if (!stage && canvasAction === 'EXPORT_PNG') return;

    if (canvasAction === 'EXPORT_PNG' && stage) {
      const { userName } = useDrawingStore.getState();
      exportToPng(
        stage,
        stageSize,
        userName || 'Pixel Genius',
        transformerRef.current || undefined,
        selectedIds
      );
    } else if (canvasAction === 'SAVE_PROJECT') {
      saveProject(layers);
    }
    setCanvasAction(null);
  }, [
    canvasAction,
    layers,
    setCanvasAction,
    selectedIds,
    stageRef,
    transformerRef,
    stageSize,
  ]);

  // View (Zoom/Pan) Initialization logic continues below...

  // Initialize canvas size
  useEffect(() => {
    const initializeCanvas = () => {
      const container = document.getElementById('canvas-container');
      if (!container) return false;

      const CANVAS_WIDTH = CANVAS_DEFAULTS.WIDTH;
      const CANVAS_HEIGHT = CANVAS_DEFAULTS.HEIGHT;

      if (
        stageSize.width !== CANVAS_WIDTH ||
        stageSize.height !== CANVAS_HEIGHT
      ) {
        setStageSize({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
      }

      // Auto-fit canvas to screen
      const w = container.offsetWidth;
      const h = container.offsetHeight;

      // Only proceed if container has valid dimensions
      if (w === 0 || h === 0) return false;

      const padding = 40;

      const scaleX = (w - padding) / CANVAS_WIDTH;
      const scaleY = (h - padding) / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);

      const newX = (w - CANVAS_WIDTH * newScale) / 2;
      const newY = (h - CANVAS_HEIGHT * newScale) / 2;

      setScale(newScale);
      setPosition({ x: newX, y: newY });

      return true;
    };

    // Try to initialize immediately
    const initialized = initializeCanvas();

    // If not initialized (container not ready), try again after a short delay
    if (!initialized) {
      const timer = setTimeout(() => {
        initializeCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
