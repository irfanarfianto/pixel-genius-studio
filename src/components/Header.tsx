import React, { useRef } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { FolderOpen, Save, Download } from 'lucide-react';
export const Header: React.FC = () => {
    const { undo, redo, toggleLayerPanel, isLayerPanelOpen, setCanvasAction, loadProject, userName, userColor, historyStep, historyStack } = useDrawingStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (Keep existing logic)
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

            {/* Logo / Brand / Identity */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: displayColor }}
                >
                    {userInitial}
                </div>
                <div>
                    <h1 className="font-bold text-gray-800 text-lg md:text-xl tracking-tight leading-tight">
                        {userName || 'Pixel Genius'}
                    </h1>

                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* File Actions */}
                <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl">
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        title="Load Project"
                    >
                        <FolderOpen size={20} />
                    </button>
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all"
                        onClick={() => setCanvasAction('SAVE_PROJECT')}
                        title="Save Project"
                    >
                        <Save size={20} />
                    </button>
                    <button
                        className="modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 transition-all"
                        onClick={() => setCanvasAction('EXPORT_PNG')}
                        title="Export Image"
                    >
                        <Download size={20} />
                    </button>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-gray-300"></div>

                {/* Center Actions (Undo/Redo) */}
                <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl">
                    <button
                        className={`modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all
                            ${historyStep > 0
                                ? 'hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }
                        `}
                        onClick={undo}
                        disabled={historyStep <= 0}
                        title="Undo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>
                    <button
                        className={`modern-button w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg transition-all
                            ${historyStack.length > 0 && historyStep < historyStack.length - 1
                                ? 'hover:bg-white hover:text-indigo-600 hover:shadow-md text-gray-600 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'
                            }
                        `}
                        onClick={redo}
                        disabled={!historyStack.length || historyStep >= historyStack.length - 1}
                        title="Redo"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                        </svg>
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
