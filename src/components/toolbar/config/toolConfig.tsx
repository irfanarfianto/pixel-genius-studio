/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import type { Tool } from '@/types';
import {
  Brush,
  Eraser,
  Sparkles,
  Spline,
  PaintBucket,
  Type,
  Circle,
  Square,
  Triangle,
  Star,
  Minus,
  MousePointer2,
} from 'lucide-react';

export interface ToolConfig {
  id: Tool;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const TOOLS: ToolConfig[] = [
  {
    id: 'select',
    label: 'Select',
    icon: <MousePointer2 size={24} />,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'brush',
    label: 'Brush',
    icon: <Brush size={24} />,
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'line',
    label: 'Line',
    icon: <Minus size={24} className="-rotate-45" />,
    color: 'bg-slate-100 text-slate-600',
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: <Circle size={24} />,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'rectangle',
    label: 'Box',
    icon: <Square size={24} />,
    color: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'triangle',
    label: 'Triangle',
    icon: <Triangle size={24} />,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'star',
    label: 'Star',
    icon: <Star size={24} />,
    color: 'bg-yellow-100 text-yellow-500',
  },
  {
    id: 'eraser',
    label: 'Eraser',
    icon: <Eraser size={24} />,
    color: 'bg-gray-100 text-gray-600',
  },
  {
    id: 'sparkles',
    label: 'Sparkles',
    icon: <Sparkles size={24} />,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    id: 'text',
    label: 'Text',
    icon: <Type size={24} />,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'mirror',
    label: 'Mirror',
    icon: <Spline size={24} />,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'fill',
    label: 'Fill',
    icon: <PaintBucket size={24} />,
    color: 'bg-green-100 text-green-600',
  },
];

// Tool grouping
export const SELECT_TOOL = TOOLS.find((t) => t.id === 'select');

export const SHAPE_TOOLS = TOOLS.filter((t) =>
  ['line', 'rectangle', 'circle', 'triangle', 'star'].includes(t.id)
);

export const BRUSH_TOOLS = TOOLS.filter((t) =>
  ['brush', 'sparkles', 'mirror'].includes(t.id)
);

export const UTILITY_TOOLS = TOOLS.filter((t) =>
  ['eraser', 'text', 'fill'].includes(t.id)
);
