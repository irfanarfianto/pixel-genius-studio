import React from 'react';
import { X } from 'lucide-react';
import { useDrawingStore } from '../../store/drawingStore';

export const ReferenceImageControls = () => {
    const {
        referenceImage, setReferenceImage,
        referenceOpacity, setReferenceOpacity,
        position, scale
    } = useDrawingStore();

    if (!referenceImage) return null;

    return (
        <div
            className="absolute z-50 flex flex-col gap-2 pointer-events-auto transition-opacity duration-75"
            style={{
                left: position.x + (10 * scale),
                top: position.y + (10 * scale),
                transform: 'translate(calc(-100% - 12px), 0)', // Position to the left of the image
            }}
        >
            {/* Close Button & Title */}
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-indigo-100 flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider px-1">Ref Image</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setReferenceImage(null);
                    }}
                    className="bg-red-50 text-red-500 rounded p-1 hover:bg-red-100 transition-colors"
                    title="Close Reference"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Opacity Slider */}
            <div
                className="bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-lg shadow-md border border-indigo-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Opacity</span>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={referenceOpacity}
                        onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer w-24"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    );
};
