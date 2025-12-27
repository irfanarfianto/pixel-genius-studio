import React, { useEffect, useRef } from 'react';

interface TextInputOverlayProps {
    textInput: { x: number; y: number; domX: number; domY: number; text: string } | null;
    setTextInput: (val: any) => void;
    brushSize: number;
    brushColor: string;
    scale: number;
    onFinalize: () => void;
}

export const TextInputOverlay: React.FC<TextInputOverlayProps> = ({
    textInput, setTextInput, brushSize, brushColor, scale, onFinalize
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textInput && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [textInput]);

    if (!textInput) return null;

    return (
        <textarea
            ref={textareaRef}
            value={textInput.text}
            onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onFinalize(); }
                if (e.key === 'Escape') setTextInput(null);
            }}
            onBlur={onFinalize}
            placeholder="Type..."
            autoFocus
            style={{
                position: 'absolute',
                zIndex: 10000,
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
                minHeight: '40px',
                backgroundColor: '#fffbeb',
                padding: '4px 8px',
                margin: '0',
                resize: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre',
                transformOrigin: 'top left',
                fontFamily: 'sans-serif'
            }}
            className="backdrop-blur-sm animate-in fade-in zoom-in duration-200"
        />
    );
};
