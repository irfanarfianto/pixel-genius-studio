import React from 'react';
import type { ToolConfig } from '../config/toolConfig';

interface ToolButtonProps {
  tool: ToolConfig;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * Reusable tool button component
 */
export const ToolButton: React.FC<ToolButtonProps> = ({
  tool,
  isActive,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`modern-button w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-all relative group shrink-0
                  ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 shadow-inner ring-2 ring-indigo-500 ring-offset-2'
                      : 'hover:bg-gray-100'
                  } ${className}`}
      onClick={onClick}
    >
      <span className="pointer-events-none">{tool.icon}</span>
    </button>
  );
};
