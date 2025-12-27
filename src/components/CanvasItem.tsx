import React, { useEffect, useState } from 'react';
import { Line, Rect, Circle, Image as KonvaImage, Text, RegularPolygon } from 'react-konva';
import type { Line as LineType } from '../store/drawingStore';
import { getLineOptions } from '../utils/canvasUtils';

// Image Loader Component
const URLImage = ({ src, x, y, width, height, ...props }: any) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        if (!src) return;
        const img = new window.Image();
        img.src = src;
        img.onload = () => setImage(img);
    }, [src]);
    return <KonvaImage image={image || undefined} x={x} y={y} width={width} height={height} {...props} />;
};

// New Props Interface
interface CanvasItemProps {
    line: LineType;
    stageSize: { width: number; height: number };
    index: number;
    isSelected: boolean;
    isSelectTool: boolean;
    onSelect: (id: string, shiftKey: boolean) => void;
    onDragEnd: (e: any, i: number) => void;
    onTransformEnd: (e: any, i: number) => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = React.memo(({
    line,
    stageSize,
    index,
    isSelected,
    isSelectTool,
    onSelect,
    onDragEnd,
    onTransformEnd
}) => {

    // Stable handlers
    const handleClick = React.useCallback((e: any) => {
        onSelect(line.id || '', e.evt.shiftKey);
    }, [onSelect, line.id]);
    const handleDragEnd = React.useCallback((e: any) => onDragEnd(e, index), [onDragEnd, index]);
    const handleTransformEnd = React.useCallback((e: any) => onTransformEnd(e, index), [onTransformEnd, index]);

    const sharedProps = {
        id: line.id,
        onClick: handleClick,
        onTap: handleClick,
        draggable: isSelectTool && isSelected,
        onDragEnd: handleDragEnd,
        onTransformEnd: handleTransformEnd,
        hitStrokeWidth: 20
    };

    // 1. TEXT
    if (line.tool === 'text') {
        return (
            <Text
                key={line.id}
                text={line.text}
                x={line.x ?? 0}
                y={line.y ?? 0}
                rotation={line.rotation || 0}
                scaleX={line.scaleX || 1}
                scaleY={line.scaleY || 1}
                fill={line.color}
                fontSize={line.size ? line.size * 3 : 24}
                fontFamily="sans-serif"
                {...sharedProps}
            />
        );
    }

    // 2. FILL (Image)
    if (line.tool === 'fill' && line.filledImage) {
        return (
            <URLImage
                key={line.id}
                src={line.filledImage}
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                listening={false}
                {...sharedProps}
            />
        );
    }

    // 3. GEOMETRIC SHAPES
    if (['rectangle', 'circle', 'triangle', 'star'].includes(line.tool)) {
        const [x1, y1, x2, y2] = line.points;

        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        const dx = x2 - x1;
        const dy = y2 - y1;
        const initialRotation = Math.atan2(dy, dx) * 180 / Math.PI + 90;

        // Common Transform Props
        const transformProps = {
            rotation: line.rotation ?? (['triangle', 'star'].includes(line.tool) ? initialRotation : 0),
            scaleX: line.scaleX || 1,
            scaleY: line.scaleY || 1,
        };

        if (line.tool === 'rectangle') {
            return (
                <Rect
                    key={line.id}
                    x={line.x ?? Math.min(x1, x2)}
                    y={line.y ?? Math.min(y1, y2)}
                    width={width}
                    height={height}
                    stroke={line.color}
                    strokeWidth={line.size}
                    {...transformProps}
                    {...sharedProps}
                />
            );
        }

        if (line.tool === 'circle') {
            return (
                <Circle
                    key={line.id}
                    x={line.x ?? x1}
                    y={line.y ?? y1}
                    radius={radius}
                    stroke={line.color}
                    strokeWidth={line.size}
                    {...transformProps}
                    {...sharedProps}
                />
            );
        }

        if (line.tool === 'triangle' || line.tool === 'star') {
            return (
                <RegularPolygon
                    key={line.id}
                    sides={line.tool === 'triangle' ? 3 : 5}
                    x={line.x ?? x1}
                    y={line.y ?? y1}
                    radius={radius}
                    stroke={line.color}
                    strokeWidth={line.size}
                    {...transformProps}
                    {...sharedProps}
                />
            );
        }
    }

    // 4. STANDARD LINES & FREEHAND (Brush, Line Tool)
    return (
        <Line
            key={line.id}
            points={line.points}
            x={line.x ?? 0}
            y={line.y ?? 0}
            rotation={line.rotation || 0}
            scaleX={line.scaleX || 1}
            scaleY={line.scaleY || 1}
            {...getLineOptions(line.tool, line.color, line.points, line.size)}
            {...sharedProps}
        />
    );
});
