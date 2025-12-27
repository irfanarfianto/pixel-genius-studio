import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Group, Image } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { useSound } from '../hooks/useSound';
import { useDrawingStore } from '../store/drawingStore';
import { ReferenceImageControls } from './canvas/ReferenceImageControls';
import { TextInputOverlay } from './canvas/TextInputOverlay';
import { getRelativePointerPosition } from '../utils/canvasUtils';
import { CanvasItem } from './CanvasItem';

export const DrawingCanvas: React.FC = () => {
    // ... (rest of the file until the overlay layer)

    // Using the same render structure but with Group instead of Konva.Group
    // which was causing the lint/runtime error.
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
        referenceOpacity
    } = useDrawingStore();

    const { playSound } = useSound();
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    const isDrawing = useRef(false);
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false); // For Space+Drag panning

    const [currentLine, setCurrentLine] = useState<{
        tool: string;
        points: number[];
        color: string;
        size: number;
        mirrorLines?: number[][];
    } | null>(null);


    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number, startX: number, startY: number } | null>(null);



    // Load Reference Image for Konva
    const [refImgObj, setRefImgObj] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        if (referenceImage) {
            const img = new window.Image();
            img.src = referenceImage;
            img.onload = () => setRefImgObj(img);
        } else {
            setRefImgObj(null);
        }
    }, [referenceImage]);

    // Transformer Logic
    useEffect(() => {
        if (transformerRef.current && stageRef.current) {
            const stage = stageRef.current;
            const nodes = Array.from(selectedIds).map(id => stage.findOne('#' + id)).filter(Boolean);
            transformerRef.current.nodes(nodes as any);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, layers]);

    const selectShape = React.useCallback((id: string, shiftKey: boolean) => {
        if (activeTool !== 'select') return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (shiftKey) {
                if (next.has(id)) next.delete(id);
                else next.add(id);
            } else {
                next.clear();
                next.add(id);

                // AUTO-SELECT INTERSECTING ERASERS
                const state = useDrawingStore.getState();
                const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
                const targetLine = activeLayer?.lines.find(l => l.id === id);

                if (targetLine && activeLayer && targetLine.tool !== 'eraser') {
                    // Helper for BBox
                    const getBounds = (line: any) => {
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        const offsetX = line.x || 0;
                        const offsetY = line.y || 0;
                        const pts = line.points || [];
                        if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

                        for (let i = 0; i < pts.length; i += 2) {
                            const px = pts[i] + offsetX;
                            const py = pts[i + 1] + offsetY;
                            minX = Math.min(minX, px);
                            maxX = Math.max(maxX, px);
                            minY = Math.min(minY, py);
                            maxY = Math.max(maxY, py);
                        }
                        const pad = (line.size || 5) / 2;
                        return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
                    };

                    const isIntersect = (r1: any, r2: any) => {
                        return !(r2.x > r1.x + r1.width || r2.x + r2.width < r1.x || r2.y > r1.y + r1.height || r2.y + r2.height < r1.y);
                    };

                    const targetBounds = getBounds(targetLine);

                    activeLayer.lines.forEach(l => {
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
    }, [activeTool]);

    const onShapeDragEnd = React.useCallback((e: KonvaEventObject<DragEvent>, i: number) => {
        updateLineInActiveLayer(i, { x: e.target.x(), y: e.target.y() });
    }, [updateLineInActiveLayer]);

    const onShapeTransformEnd = React.useCallback((e: KonvaEventObject<Event>, i: number) => {
        const node = e.target;
        updateLineInActiveLayer(i, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
        });
    }, [updateLineInActiveLayer]);

    const checkDeselect = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        // ignore if we clicked on one of the selected lines
        // This is handled by event bubbling stopping usually, but if we click empty stage:
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedIds(new Set());
        }
    };

    // Canvas & File Actions
    useEffect(() => {
        if (!canvasAction) return;
        const stage = stageRef.current;
        if (!stage) return;

        if (canvasAction === 'EXPORT_PNG') {
            const oldScale = stage.scaleX();
            const oldPos = stage.position();
            if (transformerRef.current) transformerRef.current.nodes([]); // Hide transformer

            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });

            // Add watermark temporarily
            const watermarkLayer = new Konva.Layer();
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const { userName } = useDrawingStore.getState();
            const watermarkText = `${userName || 'Pixel Genius'} • ${dateStr} ${timeStr} `;

            const text = new Konva.Text({
                x: 10,
                y: stageSize.height - 30,
                text: watermarkText,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                fill: '#666666',
                opacity: 0.7
            });

            watermarkLayer.add(text);
            stage.add(watermarkLayer);
            watermarkLayer.draw();

            const uri = stage.toDataURL({ pixelRatio: 2 });

            // Remove watermark
            watermarkLayer.destroy();

            stage.scale({ x: oldScale, y: oldScale });
            stage.position(oldPos);

            if (selectedIds.size > 0 && transformerRef.current) { // Restore transformer
                const nodes = Array.from(selectedIds).map(id => stage.findOne('#' + id)).filter(Boolean);
                transformerRef.current.nodes(nodes as any);
            }

            const link = document.createElement('a');
            link.download = `pixel - genius - ${Date.now()}.png`;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (canvasAction === 'SAVE_PROJECT') {
            const projectData = JSON.stringify(layers);
            const blob = new Blob([projectData], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pixel - genius - project - ${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setCanvasAction(null);
    }, [canvasAction, layers, setCanvasAction, selectedIds]);

    // Initialize canvas size to fixed dimensions and auto-fit
    useEffect(() => {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        // Set fixed canvas size (1200x800 - standard artboard size)
        const CANVAS_WIDTH = 1200;
        const CANVAS_HEIGHT = 800;

        if (stageSize.width !== CANVAS_WIDTH || stageSize.height !== CANVAS_HEIGHT) {
            setStageSize({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
        }

        // Auto-fit canvas to screen on initial load
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        const padding = 40;

        const scaleX = (w - padding) / CANVAS_WIDTH;
        const scaleY = (h - padding) / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

        const newX = (w - CANVAS_WIDTH * newScale) / 2;
        const newY = (h - CANVAS_HEIGHT * newScale) / 2;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    }, []); // Only run once on mount

    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Text Input Logic
    const [textInput, setTextInput] = useState<{
        x: number; y: number; domX: number; domY: number; text: string;
    } | null>(null);

    const isFinalizing = useRef(false);
    const creationTime = useRef(Date.now()); // Track creation time to prevent immediate close

    // Handle Delete Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                setIsSpacePressed(true);
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea') return;

                e.preventDefault();
                deleteLines(Array.from(selectedIds));
                setSelectedIds(new Set());
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') setIsSpacePressed(false);
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedIds, deleteLines]);

    const finalizeText = () => {
        // Prevent accidental closing immediately after creation (e.g. from phantom clicks/blurs)
        if (Date.now() - creationTime.current < 500) {
            return;
        }

        if (isFinalizing.current) return;
        isFinalizing.current = true;
        if (textInput && textInput.text.trim() !== "") {
            playSound('success');
            addLineToActiveLayer({
                tool: 'text',
                points: [],
                color: brushColor,
                size: brushSize,
                text: textInput.text,
                x: textInput.x,
                y: textInput.y
            });
        }
        setTextInput(null);
        // Reset finalizing flag after a short delay to allow clicks to register
        setTimeout(() => { isFinalizing.current = false; }, 200);
    };

    // Events
    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        // ZOOM (Ctrl + Wheel)
        if (e.evt.ctrlKey) {
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
            // PAN (Regular Scroll / 2-finger swipe)
            setPosition({
                x: position.x - e.evt.deltaX,
                y: position.y - e.evt.deltaY
            });
        }
    };

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
            // Initialize lastPanPos to the center of two fingers
            lastPanPos.current = {
                x: (p1.clientX + p2.clientX) / 2,
                y: (p1.clientY + p2.clientY) / 2
            };
            return;
        }

        // DESKTOP PAN: Middle Click or Spacebar + Click
        if (isMiddleClick || isSpacePressed) {
            isPanning.current = true;
            const clientX = isTouch ? evt.touches[0].clientX : (evt as MouseEvent).clientX;
            const clientY = isTouch ? evt.touches[0].clientY : (evt as MouseEvent).clientY;

            lastPanPos.current = { x: clientX, y: clientY };
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'grabbing';
            return;
        }

        if (isFinalizing.current) return;

        checkDeselect(e);

        // If text input exists, finalize it (but not if we just created it recently)
        if (textInput && (Date.now() - creationTime.current > 500)) {
            finalizeText();
            return;
        }

        if (activeTool === 'select') {
            const stage = e.target.getStage();
            if (stage && e.target === stage) {
                // Start Box Selection
                const pos = getRelativePointerPosition(stage.getLayers()[0]);
                if (pos) {
                    setSelectionBox({
                        startX: pos.x,
                        startY: pos.y,
                        x: pos.x,
                        y: pos.y,
                        width: 0,
                        height: 0
                    });
                    if (!e.evt.shiftKey) {
                        setSelectedIds(new Set());
                    }
                }
            }
            return;
        };

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
            console.log("Creating Text Input at:", pointer);
            setTextInput({
                x: pos.x, y: pos.y, domX: pointer.x, domY: pointer.y, text: ""
            });
            return;
        }

        // FLOOD FILL - Simplified: Just fill the entire canvas with a rectangle
        if (activeTool === 'fill') {
            playSound('pop');

            // Instead of complex flood fill algorithm, we'll create a simple filled rectangle
            // This is persistent and uses minimal storage
            addLineToActiveLayer({
                tool: 'fill',
                points: [0, 0, stageSize.width, stageSize.height], // Full canvas rectangle
                color: brushColor,
                size: 0,
                x: 0,
                y: 0
            });
            return;
        }

        isDrawing.current = true;
        playSound('draw');
        setCurrentLine({
            tool: activeTool,
            points: [pos.x, pos.y, pos.x, pos.y],
            color: brushColor,
            size: activeTool === 'eraser' ? brushSize * 1.5 : brushSize,
        });
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        // PANNING UPDATE
        if (isPanning.current) {
            const evt = e.evt;
            const isTouch = 'touches' in evt;

            let clientX, clientY;

            if (isTouch && evt.touches.length === 2) {
                // 2-Finger Pan: Calculate center movement
                e.evt.preventDefault(); // Prevent browser native behavior
                const p1 = evt.touches[0];
                const p2 = evt.touches[1];
                clientX = (p1.clientX + p2.clientX) / 2;
                clientY = (p1.clientY + p2.clientY) / 2;
            } else {
                // Single pointer pan
                const touch = isTouch ? (evt.touches[0] || evt.changedTouches[0]) : null;
                clientX = isTouch && touch ? touch.clientX : (evt as MouseEvent).clientX;
                clientY = isTouch && touch ? touch.clientY : (evt as MouseEvent).clientY;
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
            setSelectionBox(prev => ({
                ...prev!,
                x: Math.min(prev!.startX, point.x),
                y: Math.min(prev!.startY, point.y),
                width: Math.abs(point.x - prev!.startX),
                height: Math.abs(point.y - prev!.startY)
            }));
            return;
        }

        if (point) setCursorPos({ x: point.x, y: point.y });
        if (!isDrawing.current || !currentLine || !point) return;

        let newPoints: number[];
        if (['line', 'rectangle', 'circle', 'triangle', 'star'].includes(currentLine.tool)) {
            newPoints = [currentLine.points[0], currentLine.points[1], point.x, point.y];
        } else {
            newPoints = currentLine.points.concat([point.x, point.y]);
        }

        setCurrentLine({ ...currentLine, points: newPoints });
    };

    const handleMouseUp = () => {
        if (isPanning.current) {
            isPanning.current = false;
            // Restore cursor
            if (stageRef.current) {
                const cursor = activeTool === 'text' ? 'text' : activeTool === 'eraser' ? 'none' : 'default';
                stageRef.current.container().style.cursor = cursor;
            }
            return;
        }

        if (selectionBox) {
            // Finalize Box Selection
            const box = selectionBox;
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (activeLayer) {
                const newIds = new Set(selectedIds);
                activeLayer.lines.forEach(line => {
                    if (!line.id) return;
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    const pts = line.points || [];
                    const ox = line.x || 0;
                    const oy = line.y || 0;

                    if (pts.length > 0) {
                        for (let i = 0; i < pts.length; i += 2) {
                            const px = pts[i] + ox;
                            const py = pts[i + 1] + oy;
                            minX = Math.min(minX, px); maxX = Math.max(maxX, px);
                            minY = Math.min(minY, py); maxY = Math.max(maxY, py);
                        }
                    } else {
                        // Fallback for objects without points (like text if points empty, though text usually has x/y)
                        minX = ox; maxX = ox + (line.size * 5); // Approximate
                        minY = oy; maxY = oy + (line.size);
                    }

                    // Add padding to line bounds for easier selection
                    const pad = (line.size || 5) / 2;
                    minX -= pad; minY -= pad; maxX += pad; maxY += pad;

                    const overlaps = !(box.x > maxX || box.x + box.width < minX || box.y > maxY || box.y + box.height < minY);
                    if (overlaps) newIds.add(line.id);
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
                tool: currentLine.tool as any,
                points: currentLine.points,
                color: currentLine.color,
                size: currentLine.size, // Pass size
            });

            if (isMirror) {
                const mirroredPoints = currentLine.points.map((val, i) => i % 2 === 0 ? stageSize.width - val : val);
                addLineToActiveLayer({
                    tool: currentLine.tool as any,
                    points: mirroredPoints,
                    color: currentLine.color,
                    size: currentLine.size,
                });
            }
            setCurrentLine(null);
        }
    };

    const showCustomCursor = activeTool !== 'select' && cursorPos;
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
                <Layer>
                    <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="white" listening={false} />
                </Layer>


                {layers.map((layer) => (
                    layer.visible && (
                        <Layer key={layer.id} opacity={layer.opacity}>
                            {layer.lines.map((line, i) => (
                                <CanvasItem
                                    key={line.id || i}
                                    line={line as any}
                                    index={i}
                                    isSelected={selectedIds.has(line.id || '')}
                                    isSelectTool={activeTool === 'select'}
                                    onSelect={selectShape}
                                    onDragEnd={onShapeDragEnd}
                                    onTransformEnd={onShapeTransformEnd}
                                />
                            ))}
                            {/* REAL-TIME PREVIEW IN ACTIVE LAYER */}
                            {layer.id === activeLayerId && currentLine && (
                                <CanvasItem
                                    line={{ ...currentLine, id: 'preview' } as any}
                                    index={-1}
                                    isSelected={false}
                                    isSelectTool={false}
                                    onSelect={() => { }}
                                    onDragEnd={() => { }}
                                    onTransformEnd={() => { }}
                                />
                            )}
                        </Layer>
                    )
                ))}

                {/* REFERENCE IMAGE LAYER (ALWAYS ON TOP) */}
                {referenceImage && refImgObj && (
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

                {/* COMBINED OVERLAY LAYER: Transformer, Preview, Cursor */}
                <Layer>
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox}
                    />

                    {/* SELECTION BOX */}
                    {selectionBox && (
                        <Rect
                            x={selectionBox.x}
                            y={selectionBox.y}
                            width={selectionBox.width}
                            height={selectionBox.height}
                            fill="rgba(0, 161, 255, 0.3)"
                            stroke="rgba(0, 161, 255, 0.8)"
                            strokeWidth={1}
                            listening={false}
                        />
                    )}

                    {/* MIRROR PREVIEW */}
                    {activeTool === 'mirror' && currentLine && (
                        <CanvasItem
                            line={{
                                ...currentLine,
                                points: currentLine.points.map((val, i) => i % 2 === 0 ? stageSize.width - val : val),
                                id: 'preview-mirror'
                            } as any}
                            index={-1}
                            isSelected={false}
                            isSelectTool={false}
                            onSelect={() => { }}
                            onDragEnd={() => { }}
                            onTransformEnd={() => { }}
                        />
                    )}

                    {/* CURSOR */}
                    {activeTool !== 'select' && cursorPos && (
                        <Group listening={false}>
                            {activeTool !== 'text' && (
                                <Circle
                                    x={cursorPos.x}
                                    y={cursorPos.y}
                                    radius={activeTool === 'eraser' ? brushSize * 1.5 / 2 : brushSize / 2}
                                    stroke={activeTool === 'eraser' ? '#000' : brushColor}
                                    strokeWidth={1}
                                    fillEnabled={false}
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
            </Stage>

            <TextInputOverlay
                textInput={textInput}
                setTextInput={setTextInput}
                brushSize={brushSize}
                brushColor={brushColor}
                scale={scale}
                onFinalize={finalizeText}
            />

            <ReferenceImageControls />
        </div >
    );
};

