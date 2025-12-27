import React, { useRef } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { FolderOpen, Save, Download, Image as ImageIcon, Maximize } from 'lucide-react';

export const Header: React.FC = () => {
    const { undo, redo, toggleLayerPanel, isLayerPanelOpen, setCanvasAction, loadProject, userName, userColor, historyStep, historyStack, setReferenceImage, referenceImage, stageSize, setScale, setPosition } = useDrawingStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const content = ev.target?.result as string;
                const layers = JSON.parse(content);
                if (Array.isArray(layers)) {
                    loadProject(layers);
                } else {
                    alert('Invalid project file format');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to load project');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setReferenceImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleFitToScreen = () => {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const w = container.offsetWidth;
        const h = container.offsetHeight;
        const padding = 40; // Space for UI elements

        const scaleX = (w - padding) / stageSize.width;
        const scaleY = (h - padding) / stageSize.height;
        const newScale = Math.min(scaleX, scaleY); // Allow > 1 if screen is huge

        const newX = (w - stageSize.width * newScale) / 2;
        const newY = (h - stageSize.height * newScale) / 2;

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    const userInitial = userName ? userName.charAt(0).toUpperCase() : 'P';
    const displayColor = userColor || '#6366f1';

    return (
        <div className="glass-panel px-3 py-2 md:px-6 md:py-3 flex items-center justify-between shrink-0 gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileLoad}
                accept=".json"
                className="hidden"
            />
            <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageLoad}
                accept="image/*"
                className="hidden"
            />

            {/* Logo / Brand / Identity */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: displayColor }}
                >
                    {userInitial}
                </div>
                <div className="hidden md:block">
                    <h1 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight leading-tight">
                        {userName || 'Pixel Genius'}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* File Actions */}
                <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl">
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all relative group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FolderOpen size={20} />
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Load Project
                        </span>
                    </button>
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all relative group"
                        onClick={() => setCanvasAction('SAVE_PROJECT')}
                    >
                        <Save size={20} />
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Save Project
                        </span>
                    </button>
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all relative group"
                        onClick={() => setCanvasAction('EXPORT_PNG')}
                    >
                        <Download size={20} />
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Export Image
                        </span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    <button
                        className={`modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all relative group
                             ${referenceImage ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600'}`}
                        onClick={() => imageInputRef.current?.click()}
                    >
                        <ImageIcon size={20} />
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Contoh Gambar
                        </span>
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-gray-300 self-center"></div>

                {/* Center Actions (Undo/Redo) */}
                <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl">
                    <button
                        className={`modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all relative group
                            ${historyStep > 0
                                ? 'hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }
                        `}
                        onClick={undo}
                        disabled={historyStep <= 0}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Undo
                        </span>
                    </button>
                    <button
                        className={`modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all relative group
                            ${historyStack.length > 0 && historyStep < historyStack.length - 1
                                ? 'hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }
                        `}
                        onClick={redo}
                        disabled={!historyStack.length || historyStep >= historyStack.length - 1}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                        </svg>
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Redo
                        </span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all relative group"
                        onClick={handleFitToScreen}
                    >
                        <Maximize size={18} />
                        <span className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none top-full left-1/2 -translate-x-1/2 mt-2 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:-mb-0 before:border-4 before:border-transparent before:border-b-gray-800">
                            Fit Screen
                        </span>
                    </button>
                </div>
            </div>

            {/* Layer Toggle */}
            <button
                className={`modern-button px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${isLayerPanelOpen
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-indigo-50'
                    }`}
                onClick={toggleLayerPanel}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                <span className="hidden sm:inline">Layers</span>
            </button>
        </div>
    );
};
