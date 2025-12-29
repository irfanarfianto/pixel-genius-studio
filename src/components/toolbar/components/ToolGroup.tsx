import React from 'react';
import { createPortal } from 'react-dom';
import type { Tool } from '@/types';
import type { ToolConfig } from '../config/toolConfig';

interface ToolGroupProps {
  label: string;
  tools: ToolConfig[];
  activeTool: Tool;
  currentTool: ToolConfig;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelectTool: (toolId: Tool) => void;
  onCloseAll: () => void;
  position: 'top' | 'middle' | 'bottom';
}

/**
 * Tool group component with popup menu
 */
export const ToolGroup: React.FC<ToolGroupProps> = ({
  label,
  tools,
  activeTool,
  currentTool,
  isActive,
  isOpen,
  onToggle,
  onSelectTool,
  onCloseAll,
  position,
}) => {
  // Calculate popup position based on group position
  const getPopupPosition = () => {
    switch (position) {
      case 'top':
        return 'bottom-24 left-4 md:top-24 md:left-20 md:bottom-auto';
      case 'middle':
        return 'bottom-24 left-16 md:top-40 md:left-20 md:bottom-auto';
      case 'bottom':
        return 'bottom-24 left-28 md:top-56 md:left-20 md:bottom-auto';
      default:
        return 'bottom-24 left-4 md:top-24 md:left-20 md:bottom-auto';
    }
  };

  return (
    <div className="relative group/toolgroup">
      <button
        className={`modern-button w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all relative shrink-0 group
                    ${
                      isActive && !isOpen
                        ? 'bg-indigo-100 text-indigo-700 shadow-inner ring-2 ring-indigo-500 ring-offset-2'
                        : 'hover:bg-gray-100'
                    }
                    ${isOpen ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500 ring-offset-2' : ''}
                `}
        onClick={onToggle}
      >
        <span className="pointer-events-none">{currentTool?.icon}</span>
        <div
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full transition-colors pointer-events-none ${isActive ? 'bg-indigo-500' : 'bg-gray-400'}`}
        ></div>
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 bg-black/5" onClick={onCloseAll} />
            <div
              className={`fixed bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5 flex flex-col gap-2
                          animate-in fade-in zoom-in-95 duration-200 min-w-[3.5rem]
                          ${getPopupPosition()}`}
            >
              <div className="text-xs font-bold text-gray-400 px-1 uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
                                ${
                                  activeTool === tool.id
                                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                                    : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105'
                                }`}
                    onClick={() => onSelectTool(tool.id)}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
