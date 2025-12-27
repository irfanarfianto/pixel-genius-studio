import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Mode = 'junior' | 'pro';
export type Tool = 'select' | 'brush' | 'eraser' | 'rainbow' | 'sparkles' | 'mirror' | 'fill' | 'text' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'star';

export interface Line {
    id?: string; // Unique ID for selection
    tool: Tool;
    points: number[];
    color: string;
    size: number;
    // For Flood Fill or Image stamps
    filledImage?: string; // DataURL
    x?: number;
    y?: number;
    text?: string;
    rotation?: number; // Add rotation support
    scaleX?: number;   // Add scale support
    scaleY?: number;   // Add scale support
}

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    lines: Line[];
}

interface DrawingState {
    // UI State
    isLayerPanelOpen: boolean;
    toggleLayerPanel: () => void;

    // Canvas Setup
    stageSize: { width: number; height: number };
    setStageSize: (size: { width: number; height: number }) => void;
    scale: number;
    setScale: (scale: number) => void;
    position: { x: number; y: number };
    setPosition: (pos: { x: number; y: number }) => void;

    // Canvas Actions (Triggered by UI, Handled by Canvas)
    canvasAction: 'EXPORT_PNG' | 'EXPORT_JPG' | 'SAVE_PROJECT' | null;
    setCanvasAction: (action: 'EXPORT_PNG' | 'EXPORT_JPG' | 'SAVE_PROJECT' | null) => void;

    // Tools
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    brushColor: string;
    setBrushColor: (color: string) => void;
    brushSize: number;
    setBrushSize: (size: number) => void;

    // Layers
    layers: Layer[];
    activeLayerId: string;
    setActiveLayer: (id: string) => void;
    addLayer: () => void;
    deleteLayer: (id: string) => void;
    toggleLayerVisibility: (id: string) => void;
    updateLayerOpacity: (id: string, opacity: number) => void;
    addLineToActiveLayer: (line: Line) => void;
    updateLineInActiveLayer: (lineIndex: number, newAttrs: Partial<Line>) => void; // New Action
    deleteLines: (ids: string[]) => void;

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
            userColor: '#6366f1',

            setUserIdentity: (name: string, color: string) => {
                set({ userName: name, userColor: color });
            },
            // Initial UI State
            isLayerPanelOpen: false, // Hidden by default as requested
            toggleLayerPanel: () => set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),

            // Initial Canvas Size
            stageSize: { width: 800, height: 600 },
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
            brushColor: '#000000',
            setBrushColor: (color) => set({ brushColor: color }),
            brushSize: 5,
            setBrushSize: (size) => set({ brushSize: size }),

            // Initial Layers
            layers: [
                {
                    id: 'layer-1',
                    name: 'Background',
                    visible: true,
                    locked: false,
                    opacity: 1,
                    lines: [],
                },
            ],
            activeLayerId: 'layer-1',
            setActiveLayer: (id) => set({ activeLayerId: id }),

            addLayer: () => {
                const layers = get().layers;
                const newLayer: Layer = {
                    id: `layer-${Date.now()}`,
                    name: `Layer ${layers.length + 1}`,
                    visible: true,
                    locked: false,
                    opacity: 1,
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
                const activeLayerId = get().activeLayerId === id ? layers[0].id : get().activeLayerId;
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
                const lineWithId = { ...line, id: line.id || `line-${Date.now()}-${Math.random()}` };

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
                            lines: layer.lines.filter(l => !l.id || !idsSet.has(l.id))
                        };
                    }
                    return layer;
                });
                set({ layers });
                get().saveHistory();
            },

            // History Management
            historyStep: 0,
            historyStack: [],

            saveHistory: () => {
                const { layers, historyStep, historyStack } = get();
                // Ensure historyStack is defined (in case of hydration issues)
                const safeStack = historyStack || [];
                const newStack = safeStack.slice(0, historyStep + 1);
                newStack.push(JSON.parse(JSON.stringify(layers))); // Deep copy

                // Limit history to 20 steps
                if (newStack.length > 20) {
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
                        historyStep: newStep
                    });
                }
            },

            redo: () => {
                const { historyStep, historyStack } = get();
                if (historyStep < historyStack.length - 1 && historyStack[historyStep + 1]) {
                    const newStep = historyStep + 1;
                    set({
                        layers: JSON.parse(JSON.stringify(historyStack[newStep])),
                        historyStep: newStep
                    });
                }
            },

            loadProject: (layers) => {
                set({
                    layers,
                    activeLayerId: layers[0]?.id,
                    historyStack: [],
                    historyStep: 0
                });
            },
        }),
        {
            name: 'pixel-genius-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                layers: state.layers,
                activeLayerId: state.activeLayerId,
                historyStack: state.historyStack,
                historyStep: state.historyStep,
                brushColor: state.brushColor,
                brushSize: state.brushSize,
                activeTool: state.activeTool,
                userName: state.userName,
                userColor: state.userColor,
                stageSize: state.stageSize
            }),
        }
    )
);
