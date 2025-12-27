import React from 'react';
import { createPortal } from 'react-dom';
import { useDrawingStore } from '../store/drawingStore';
import type { Tool } from '../store/drawingStore';
import { Brush, Eraser, Sparkles, Spline, PaintBucket, Type, Circle, Square, Triangle, Star, Minus, MousePointer2 } from 'lucide-react';

const TOOLS: { id: Tool; label: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'select',
        label: 'Select',
        icon: <MousePointer2 size={24} />,
        color: 'bg-purple-100 text-purple-600'
    },
    {
        id: 'brush',
        label: 'Brush',
        icon: <Brush size={24} />,
        color: 'bg-indigo-100 text-indigo-700'
    },
    {
        id: 'line',
        label: 'Line',
        icon: <Minus size={24} className="-rotate-45" />,
        color: 'bg-slate-100 text-slate-600'
    },
    {
        id: 'circle',
        label: 'Circle',
        icon: <Circle size={24} />,
        color: 'bg-green-100 text-green-600'
    },
    {
        id: 'rectangle',
        label: 'Box',
        icon: <Square size={24} />,
        color: 'bg-teal-100 text-teal-600'
    },
    {
        id: 'triangle',
        label: 'Triangle',
        icon: <Triangle size={24} />,
        color: 'bg-indigo-100 text-indigo-600'
    },
    {
        id: 'star',
        label: 'Star',
        icon: <Star size={24} />,
        color: 'bg-yellow-100 text-yellow-500'
    },
    {
        id: 'eraser',
        label: 'Eraser',
        icon: <Eraser size={24} />,
        color: 'bg-gray-100 text-gray-600'
    },
    {
        id: 'sparkles',
        label: 'Sparkles',
        icon: <Sparkles size={24} />,
        color: 'bg-yellow-100 text-yellow-600'
    },
    {
        id: 'text',
        label: 'Text',
        icon: <Type size={24} />,
        color: 'bg-orange-100 text-orange-600'
    },
    {
        id: 'mirror',
        label: 'Mirror',
        icon: <Spline size={24} />,
        color: 'bg-pink-100 text-pink-600'
    },
    {
        id: 'fill',
        label: 'Fill',
        icon: <PaintBucket size={24} />,
        color: 'bg-green-100 text-green-600'
    },
];

const COLORS = [
    '#000000', '#4b5563', '#dc2626', '#d97706',
    '#16a34a', '#0891b2', '#2563eb', '#7c3aed',
    '#db2777', '#ffffff', '#ef4444', '#f59e0b',
    '#84cc16', '#06b6d4', '#3b82f6', '#d946ef',
];

export const Toolbar: React.FC = () => {
    const { activeTool, setActiveTool, brushColor, setBrushColor, brushSize, setBrushSize } = useDrawingStore();

    const [isShapesOpen, setIsShapesOpen] = React.useState(false);
    const [isBrushesOpen, setIsBrushesOpen] = React.useState(false);
    const [isColorsOpen, setIsColorsOpen] = React.useState(false);

    // Tooltip State with Debounce
    const [tooltipData, setTooltipData] = React.useState<{ x: number, y: number, text: string, align: 'right' | 'top' } | null>(null);
    const hoverTimeout = React.useRef<any>(null);

    const handleMouseEnter = (e: React.MouseEvent, text: string) => {
        // Clear any existing timeout to prevent double triggers
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

        const rect = e.currentTarget.getBoundingClientRect();
        const isDesktop = window.innerWidth >= 768;
        const x = isDesktop ? rect.right + 12 : rect.left + rect.width / 2;
        const y = isDesktop ? rect.top + rect.height / 2 : rect.top - 12;
        const align = isDesktop ? 'right' : 'top';

        // Add delay (200ms) before showing tooltip - reduced for better responsiveness
        hoverTimeout.current = setTimeout(() => {
            setTooltipData({ x, y, text, align });
        }, 200);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

        // Add small delay before hiding tooltip to prevent flickering
        hoverTimeout.current = setTimeout(() => {
            setTooltipData(null);
        }, 100);
    };

    // Auto-close tooltip when tool changes or popups open
    React.useEffect(() => {
        setTooltipData(null);
    }, [activeTool, isShapesOpen, isBrushesOpen, isColorsOpen]);

    // Debounce tool selection to prevent multiple rapid clicks on THE SAME tool
    const lastClickedTool = React.useRef<Tool | null>(null);
    const lastClickTime = React.useRef(0);
    const handleToolSelect = React.useCallback((toolId: Tool) => {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime.current;

        // Only debounce if clicking the SAME tool repeatedly
        if (toolId === lastClickedTool.current && timeSinceLastClick < 300) {
            return; // Ignore rapid clicks on same tool within 300ms
        }

        lastClickedTool.current = toolId;
        lastClickTime.current = now;

        // Close all popups FIRST to ensure clean visual state
        closeAllPopups();

        // Then set the active tool
        setActiveTool(toolId);
    }, [setActiveTool]);

    // Grouping Logic
    const SELECT_TOOL = TOOLS.find(t => t.id === 'select');

    const SHAPE_TOOLS = TOOLS.filter(t => ['line', 'rectangle', 'circle', 'triangle', 'star'].includes(t.id));
    const BRUSH_TOOLS = TOOLS.filter(t => ['brush', 'sparkles', 'mirror'].includes(t.id));
    const UTILITY_TOOLS = TOOLS.filter(t => ['eraser', 'text', 'fill'].includes(t.id));

    const isShapeActive = SHAPE_TOOLS.some(t => t.id === activeTool);
    const isBrushActive = BRUSH_TOOLS.some(t => t.id === activeTool);

    const currentShape = SHAPE_TOOLS.find(t => t.id === activeTool) || SHAPE_TOOLS.find(t => t.id === 'rectangle');
    const currentBrush = BRUSH_TOOLS.find(t => t.id === activeTool) || BRUSH_TOOLS.find(t => t.id === 'brush');

    const ToolButton = ({ tool, isActive, onClick, className = "" }: any) => {
        // Create explicit handler to avoid closure issues
        const handleEnter = React.useCallback((e: React.MouseEvent) => {
            handleMouseEnter(e, tool.label);
        }, [tool.label]);

        return (
            <button
                className={`modern-button w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all relative group shrink-0
                    ${isActive
                        ? 'bg-indigo-100 text-indigo-700 shadow-inner ring-2 ring-indigo-500 ring-offset-2'
                        : 'hover:bg-gray-100'
                    } ${className}`}
                onClick={(e) => { handleMouseLeave(); onClick(e); }}
                onMouseEnter={handleEnter}
                onMouseLeave={handleMouseLeave}
            >
                <span className="pointer-events-none">{tool.icon}</span>
            </button>
        );
    };

    const closeAllPopups = () => {
        setIsShapesOpen(false);
        setIsBrushesOpen(false);
        setIsColorsOpen(false);
    };

    // Helper to render popup via Portal
    const RenderPopup = ({ children }: { children: React.ReactNode }) => {
        return createPortal(
            <div className="relative z-[9999]">
                {children}
            </div>,
            document.body
        );
    };

    return (
        <div className="glass-panel p-1.5 md:p-2 flex flex-row md:flex-col gap-2 md:gap-3 items-center w-full md:w-16 md:h-full shrink-0 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

            <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 shrink-0 items-center">
                {SELECT_TOOL && (
                    <ToolButton
                        key="select-tool"
                        tool={SELECT_TOOL}
                        isActive={activeTool === 'select'}
                        onClick={() => handleToolSelect('select')}
                    />
                )}

                {/* SHAPES */}
                <div className="relative group/shape" key="shapes-group">
                    <button
                        className={`modern-button w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all relative shrink-0 group
                            ${isShapeActive && !isShapesOpen
                                ? 'bg-indigo-100 text-indigo-700 shadow-inner ring-2 ring-indigo-500 ring-offset-2'
                                : 'hover:bg-gray-100'
                            }
                            ${isShapesOpen ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-2' : ''}
                        `}
                        onClick={() => { handleMouseLeave(); setIsShapesOpen(!isShapesOpen); setIsBrushesOpen(false); setIsColorsOpen(false); }}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Shapes')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span className="pointer-events-none">{currentShape?.icon}</span>
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full transition-colors pointer-events-none ${isShapeActive ? 'bg-indigo-500' : 'bg-gray-400'}"></div>
                    </button>
                    {isShapesOpen && (
                        <RenderPopup>
                            <div className="fixed inset-0 bg-black/5" onClick={closeAllPopups} />
                            <div className="fixed bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 flex flex-col gap-2
                                animate-in fade-in zoom-in-95 duration-200
                                bottom-24 left-4 md:top-24 md:left-20 md:bottom-auto min-w-[3.5rem]"
                            >
                                <div className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider mb-1">Shapes</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {SHAPE_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                                                ${activeTool === tool.id
                                                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                                                    : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
                                                }`}
                                            onClick={() => handleToolSelect(tool.id)}
                                            onMouseEnter={(e) => handleMouseEnter(e, tool.label)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {tool.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </RenderPopup>
                    )}
                </div>

                {/* BRUSHES */}
                <div className="relative group/brush" key="brushes-group">
                    <button
                        className={`modern-button w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all relative shrink-0 group
                            ${isBrushActive && !isBrushesOpen
                                ? 'bg-indigo-100 text-indigo-700 shadow-inner ring-2 ring-indigo-500 ring-offset-2'
                                : 'hover:bg-gray-100'
                            }
                            ${isBrushesOpen ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-2' : ''}
                        `}
                        onClick={() => { handleMouseLeave(); setIsBrushesOpen(!isBrushesOpen); setIsShapesOpen(false); setIsColorsOpen(false); }}
                        onMouseEnter={(e) => handleMouseEnter(e, 'Brushes')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span className="pointer-events-none">{currentBrush?.icon}</span>
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full transition-colors pointer-events-none ${isBrushActive ? 'bg-indigo-500' : 'bg-gray-400'}"></div>
                    </button>
                    {isBrushesOpen && (
                        <RenderPopup>
                            <div className="fixed inset-0 bg-black/5" onClick={closeAllPopups} />
                            <div className="fixed bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 flex flex-col gap-2
                                animate-in fade-in zoom-in-95 duration-200
                                bottom-24 left-16 md:top-40 md:left-20 md:bottom-auto min-w-[3.5rem]"
                            >
                                <div className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider mb-1">Brushes</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {BRUSH_TOOLS.map((tool) => (
                                        <button
                                            key={tool.id}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                                                ${activeTool === tool.id
                                                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                                                    : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
                                                }`}
                                            onClick={() => handleToolSelect(tool.id)}
                                            onMouseEnter={(e) => handleMouseEnter(e, tool.label)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {tool.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </RenderPopup>
                    )}
                </div>

                {UTILITY_TOOLS.map((tool) => (
                    <ToolButton
                        key={tool.id}
                        tool={tool}
                        isActive={activeTool === tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                    />
                ))}
            </div>

            <div className="w-px h-6 md:w-8 md:h-px bg-gray-300 md:bg-gray-200 shrink-0 my-1"></div>

            <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
                <div
                    className="w-3 h-3 md:w-3/4 md:aspect-square bg-gray-900 rounded-full transition-all"
                    style={{ transform: `scale(${Math.max(0.4, brushSize / 60)})`, backgroundColor: brushColor }}
                />
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-20 md:w-1.5 md:h-24 appearance-none bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full"
                    style={window.innerWidth >= 768 ? { writingMode: 'vertical-lr', direction: 'rtl' } : {}}
                />
            </div>

            <div className="w-px h-6 md:w-8 md:h-px bg-gray-300 md:bg-gray-200 shrink-0 my-1"></div>

            <div className="relative group/colors shrink-0">
                <button
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-200 transition-transform group relative ${isColorsOpen ? 'scale-110 ring-indigo-300' : 'hover:scale-105'}`}
                    style={{ backgroundColor: brushColor }}
                    onClick={() => { handleMouseLeave(); setIsColorsOpen(!isColorsOpen); setIsShapesOpen(false); setIsBrushesOpen(false); }}
                    onMouseEnter={(e) => handleMouseEnter(e, 'Colors')}
                    onMouseLeave={handleMouseLeave}
                />

                {isColorsOpen && (
                    <RenderPopup>
                        <div className="fixed inset-0 bg-black/5" onClick={closeAllPopups} />
                        <div className="fixed bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/50 ring-1 ring-black/5 flex flex-col gap-4
                            animate-in fade-in zoom-in-95 duration-200
                            bottom-24 right-4 md:bottom-20 md:left-20 md:right-auto min-w-[220px]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Palette</span>
                                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-100 cursor-pointer hover:scale-110 transition-transform shadow-sm" title="Custom Color">
                                    <input
                                        type="color"
                                        value={brushColor}
                                        onChange={(e) => setBrushColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2.5">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 shadow-sm ${brushColor === color
                                            ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110 z-10'
                                            : 'border-white'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => { setBrushColor(color); closeAllPopups(); }}
                                        onMouseEnter={(e) => handleMouseEnter(e, color)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                ))}
                            </div>
                        </div>
                    </RenderPopup>
                )}
            </div>
            {tooltipData && createPortal(
                <div
                    className="fixed z-[10000] px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-200"
                    style={{
                        left: tooltipData.x,
                        top: tooltipData.y,
                        transform: tooltipData.align === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)'
                    }}
                >
                    {tooltipData.text}
                    <div className={`absolute w-0 h-0 border-4 border-transparent ${tooltipData.align === 'right'
                        ? 'border-r-gray-800 right-full top-1/2 -translate-y-1/2 -mr-[1px]'
                        : 'border-t-gray-800 top-full left-1/2 -translate-x-1/2 -mt-[1px]'
                        }`} />
                </div>,
                document.body
            )}
        </div>
    );
};
