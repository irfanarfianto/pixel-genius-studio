import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Layer, Line, StageSize, Position, Tool } from '@/types';
import {
  CANVAS_DEFAULTS,
  LAYER_DEFAULTS,
  TOOL_DEFAULTS,
  HISTORY_DEFAULTS,
  STORAGE_KEYS,
  DEFAULT_USER_COLORS,
} from '@/constants';

// Mode type (specific to this app)
export type Mode = 'junior' | 'pro';

// Canvas Action type
export type CanvasAction = 'EXPORT_PNG' | 'EXPORT_JPG' | 'SAVE_PROJECT' | null;

interface DrawingState {
  // UI State
  isLayerPanelOpen: boolean;
  toggleLayerPanel: () => void;

  // Canvas Setup
  stageSize: StageSize;
  setStageSize: (size: StageSize) => void;
  scale: number;
  setScale: (scale: number) => void;
  position: Position;
  setPosition: (pos: Position) => void;

  // Canvas Actions (Triggered by UI, Handled by Canvas)
  canvasAction: CanvasAction;
  setCanvasAction: (action: CanvasAction) => void;

  // Tools
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isMirrorAxisVisible: boolean;
  toggleMirrorAxisVisibility: () => void;

  // Layers
  layers: Layer[];
  activeLayerId: string;
  setActiveLayer: (id: string) => void;
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  addLineToActiveLayer: (line: Line) => void;
  updateLineInActiveLayer: (lineIndex: number, newAttrs: Partial<Line>) => void;
  deleteLines: (ids: string[]) => void;

  // Reference Image (Tracing)
  referenceImage: string | null;
  setReferenceImage: (img: string | null) => void;
  referenceOpacity: number;
  setReferenceOpacity: (opacity: number) => void;

  // History
  historyStep: number;
  historyStack: Layer[][];
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  loadProject: (layers: Layer[]) => void;

  // User Identity
  userName: string | null;
  userColor: string;
  setUserIdentity: (name: string, color: string) => void;
}

export const useDrawingStore = create<DrawingState>()(
  persist(
    (set, get) => ({
      // User Identity
      userName: null,
      userColor: DEFAULT_USER_COLORS[0],

      setUserIdentity: (name: string, color: string) => {
        set({ userName: name, userColor: color });
      },
      // Initial UI State
      isLayerPanelOpen: false, // Hidden by default as requested
      toggleLayerPanel: () =>
        set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),

      // Initial Canvas Size
      stageSize: {
        width: CANVAS_DEFAULTS.WIDTH,
        height: CANVAS_DEFAULTS.HEIGHT,
      },
      setStageSize: (size) => set({ stageSize: size }),
      scale: 1,
      setScale: (scale) => set({ scale }),
      position: { x: 0, y: 0 },
      setPosition: (pos) => set({ position: pos }),

      canvasAction: null,
      setCanvasAction: (action) => set({ canvasAction: action }),

      // Initial Tool Settings
      activeTool: 'brush',
      setActiveTool: (tool) => set({ activeTool: tool }),
      brushColor: TOOL_DEFAULTS.DEFAULT_COLOR,
      setBrushColor: (color) => set({ brushColor: color }),
      brushSize: TOOL_DEFAULTS.BRUSH_SIZE,
      setBrushSize: (size) => set({ brushSize: size }),

      // Mirror Tool Settings
      isMirrorAxisVisible: true,
      toggleMirrorAxisVisibility: () =>
        set((state) => ({ isMirrorAxisVisible: !state.isMirrorAxisVisible })),

      // Initial Layers
      layers: [
        {
          id: 'layer-1',
          name: `${LAYER_DEFAULTS.NAME_PREFIX} 1`,
          visible: LAYER_DEFAULTS.VISIBLE,
          locked: LAYER_DEFAULTS.LOCKED,
          opacity: LAYER_DEFAULTS.OPACITY,
          lines: [],
        },
      ],
      activeLayerId: 'layer-1',
      setActiveLayer: (id) => set({ activeLayerId: id }),

      addLayer: () => {
        const layers = get().layers;
        const newLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `${LAYER_DEFAULTS.NAME_PREFIX} ${layers.length + 1}`,
          visible: LAYER_DEFAULTS.VISIBLE,
          locked: LAYER_DEFAULTS.LOCKED,
          opacity: LAYER_DEFAULTS.OPACITY,
          lines: [],
        };
        set({ layers: [...layers, newLayer], activeLayerId: newLayer.id });
      },

      deleteLayer: (id) => {
        const layers = get().layers.filter((layer) => layer.id !== id);
        if (layers.length === 0) {
          // Always keep at least one layer
          return;
        }
        const activeLayerId =
          get().activeLayerId === id ? layers[0].id : get().activeLayerId;
        set({ layers, activeLayerId });
      },

      toggleLayerVisibility: (id) => {
        const layers = get().layers.map((layer) =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer
        );
        set({ layers });
      },

      updateLayerOpacity: (id, opacity) => {
        const layers = get().layers.map((layer) =>
          layer.id === id ? { ...layer, opacity } : layer
        );
        set({ layers });
      },

      addLineToActiveLayer: (line) => {
        const activeLayerId = get().activeLayerId;
        // Ensure every line has an ID
        const lineWithId = {
          ...line,
          id: line.id || `line-${Date.now()}-${Math.random()}`,
        };

        const layers = get().layers.map((layer) =>
          layer.id === activeLayerId
            ? { ...layer, lines: [...layer.lines, lineWithId] }
            : layer
        );
        set({ layers });
        get().saveHistory();
      },

      updateLineInActiveLayer: (lineIndex, newAttrs) => {
        const activeLayerId = get().activeLayerId;
        const layers = get().layers.map((layer) => {
          if (layer.id === activeLayerId) {
            const newLines = [...layer.lines];
            if (newLines[lineIndex]) {
              newLines[lineIndex] = { ...newLines[lineIndex], ...newAttrs };
            }
            return { ...layer, lines: newLines };
          }
          return layer;
        });
        set({ layers });
        get().saveHistory();
      },

      deleteLines: (ids) => {
        const activeLayerId = get().activeLayerId;
        const idsSet = new Set(ids);
        const layers = get().layers.map((layer) => {
          if (layer.id === activeLayerId) {
            return {
              ...layer,
              lines: layer.lines.filter((l) => !l.id || !idsSet.has(l.id)),
            };
          }
          return layer;
        });
        set({ layers });
        get().saveHistory();
      },

      // Reference Image
      referenceImage: null,
      setReferenceImage: (img) => set({ referenceImage: img }),
      referenceOpacity: 0.5,
      setReferenceOpacity: (opacity) => set({ referenceOpacity: opacity }),

      // History Management
      historyStep: HISTORY_DEFAULTS.INITIAL_STEP,
      historyStack: [],

      saveHistory: () => {
        const { layers, historyStep, historyStack } = get();
        // Ensure historyStack is defined (in case of hydration issues)
        const safeStack = historyStack || [];
        const newStack = safeStack.slice(0, historyStep + 1);
        newStack.push(JSON.parse(JSON.stringify(layers))); // Deep copy

        // Limit history to max steps
        if (newStack.length > HISTORY_DEFAULTS.MAX_STEPS) {
          newStack.shift();
        } else {
          set({ historyStep: historyStep + 1 });
        }

        set({ historyStack: newStack });
      },

      undo: () => {
        const { historyStep, historyStack } = get();
        if (historyStep > 0 && historyStack[historyStep - 1]) {
          const newStep = historyStep - 1;
          set({
            layers: JSON.parse(JSON.stringify(historyStack[newStep])),
            historyStep: newStep,
          });
        }
      },

      redo: () => {
        const { historyStep, historyStack } = get();
        if (
          historyStep < historyStack.length - 1 &&
          historyStack[historyStep + 1]
        ) {
          const newStep = historyStep + 1;
          set({
            layers: JSON.parse(JSON.stringify(historyStack[newStep])),
            historyStep: newStep,
          });
        }
      },

      loadProject: (layers) => {
        set({
          layers,
          activeLayerId: layers[0]?.id,
          historyStack: [],
          historyStep: HISTORY_DEFAULTS.INITIAL_STEP,
        });
      },
    }),
    {
      name: STORAGE_KEYS.DRAWING_STATE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Filter out filledImage from layers to prevent localStorage quota exceeded
        const cleanLayers = state.layers.map((layer) => ({
          ...layer,
          lines: layer.lines.map((line) => {
            const { filledImage: _filledImage, ...rest } = line; // eslint-disable-line @typescript-eslint/no-unused-vars
            return rest;
          }),
        }));

        // Don't persist historyStack to save space (it will rebuild on actions)
        // Don't persist stageSize to allow responsive canvas sizing
        return {
          layers: cleanLayers,
          activeLayerId: state.activeLayerId,
          brushColor: state.brushColor,
          brushSize: state.brushSize,
          activeTool: state.activeTool,
          userName: state.userName,
          userColor: state.userColor,
          referenceImage: state.referenceImage,
          referenceOpacity: state.referenceOpacity,
        };
      },
    }
  )
);
