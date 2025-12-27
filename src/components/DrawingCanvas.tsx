import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { useDrawingStore } from '../store/drawingStore';
import { useSound } from '../hooks/useSound';
import { getRelativePointerPosition, floodFill } from '../utils/canvasUtils';
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
        setCanvasAction
    } = useDrawingStore();

    const { playSound } = useSound();
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    const isDrawing = useRef(false);
    const [currentLine, setCurrentLine] = useState<{
        tool: string;
        points: number[];
        color: string;
        size: number;
        mirrorLines?: number[][];
    } | null>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
            const uri = stage.toDataURL({ pixelRatio: 2 });
            stage.scale({ x: oldScale, y: oldScale });
            stage.position(oldPos);

            if (selectedIds.size > 0 && transformerRef.current) { // Restore transformer
                const nodes = Array.from(selectedIds).map(id => stage.findOne('#' + id)).filter(Boolean);
                transformerRef.current.nodes(nodes as any);
            }

            const link = document.createElement('a');
            link.download = `pixel-genius-${Date.now()}.png`;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (canvasAction === 'SAVE_PROJECT') {
            const projectData = JSON.stringify(layers);
            const blob = new Blob([projectData], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pixel-genius-project-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setCanvasAction(null);
    }, [canvasAction, layers, setCanvasAction, selectedIds]);

    // Resize Logic
    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('canvas-container');
            if (container) {
                setStageSize({ width: container.offsetWidth, height: container.offsetHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [setStageSize]);

    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Text Input Logic
    const [textInput, setTextInput] = useState<{
        x: number; y: number; domX: number; domY: number; text: string;
    } | null>(null);

    const isFinalizing = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textInput && textareaRef.current) textareaRef.current.focus();
    }, [textInput]);

    const finalizeText = () => {
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
        setTimeout(() => { isFinalizing.current = false; }, 200);
    };

    // Events
    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
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
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.evt.type === 'mousedown' && (e.evt as MouseEvent).button === 1) return;
        if (isFinalizing.current) return;

        checkDeselect(e);

        if (textInput) {
            finalizeText();
            return;
        }

        if (activeTool === 'select') return;

        const stage = e.target.getStage();
        const layer = stage?.getLayers()[0];
        const pos = layer ? getRelativePointerPosition(layer) : null;
        if (!stage || !pos) return;

        // TEXT TOOL
        if (activeTool === 'text') {
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            isFinalizing.current = false;
            setTextInput({
                x: pos.x, y: pos.y, domX: pointer.x, domY: pointer.y, text: ""
            });
            return;
        }

        // FLOOD FILL
        if (activeTool === 'fill') {
            playSound('pop');
            const layerDataURL = layer!.toDataURL({
                pixelRatio: 1, x: 0, y: 0, width: stageSize.width, height: stageSize.height
            });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = stageSize.width;
            tempCanvas.height = stageSize.height;
            const ctx = tempCanvas.getContext('2d');

            if (ctx) {
                const imgLocal = new window.Image();
                imgLocal.src = layerDataURL;
                imgLocal.onload = () => {
                    ctx.drawImage(imgLocal, 0, 0);
                    const localPos = getRelativePointerPosition(layer!);
                    floodFill(ctx, Math.floor(localPos.x), Math.floor(localPos.y), brushColor);
                    const filledDataURL = tempCanvas.toDataURL();
                    addLineToActiveLayer({
                        tool: 'fill', points: [], color: brushColor, size: 0, filledImage: filledDataURL, x: 0, y: 0
                    });
                };
            }
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
        const stage = e.target.getStage();
        const layer = stage?.getLayers()[0];
        const point = layer ? getRelativePointerPosition(layer) : null;

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
                                    stageSize={stageSize}
                                    index={i}
                                    isSelected={selectedIds.has(line.id || '')}
                                    isSelectTool={activeTool === 'select'}
                                    onSelect={selectShape}
                                    onDragEnd={onShapeDragEnd}
                                    onTransformEnd={onShapeTransformEnd}
                                />
                            ))}
                        </Layer>
                    )
                ))}

                {/* COMBINED OVERLAY LAYER: Transformer, Preview, Cursor */}
                <Layer>
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox}
                    />

                    {/* PREVIEW */}
                    {activeTool !== 'select' && currentLine && (
                        <Group opacity={0.7}>
                            <CanvasItem
                                line={{ ...currentLine, id: 'preview' } as any}
                                stageSize={stageSize}
                                index={-1}
                                isSelected={false}
                                isSelectTool={false}
                                onSelect={() => { }}
                                onDragEnd={() => { }}
                                onTransformEnd={() => { }}
                            />
                            {activeTool === 'mirror' && (
                                <CanvasItem
                                    line={{
                                        ...currentLine,
                                        id: 'preview-mirror',
                                        points: currentLine.points.map((val, i) => i % 2 === 0 ? stageSize.width - val : val)
                                    } as any}
                                    stageSize={stageSize}
                                    index={-1}
                                    isSelected={false}
                                    isSelectTool={false}
                                    onSelect={() => { }}
                                    onDragEnd={() => { }}
                                    onTransformEnd={() => { }}
                                />
                            )}
                        </Group>
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

            {textInput && (
                <textarea
                    ref={textareaRef}
                    value={textInput.text}
                    onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finalizeText(); }
                        if (e.key === 'Escape') setTextInput(null);
                    }}
                    onBlur={finalizeText}
                    placeholder="Type..."
                    style={{
                        position: 'absolute',
                        left: textInput.domX,
                        top: textInput.domY,
                        fontSize: `${brushSize * 3 * scale}px`,
                        lineHeight: 1,
                        color: brushColor,
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #6366f1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        outline: 'none',
                        minWidth: '100px',
                        padding: '4px 8px',
                        margin: '0',
                        resize: 'none',
                        overflow: 'hidden',
                        whiteSpace: 'pre',
                        transformOrigin: 'top left',
                        zIndex: 100,
                        fontFamily: 'sans-serif'
                    }}
                    className="backdrop-blur-sm animate-in fade-in zoom-in duration-200"
                />
            )}
        </div>
    );
};
