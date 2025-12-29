import React from 'react';
import { X } from 'lucide-react';
import { useDrawingStore } from '../store/drawingStore';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    toggleLayerPanel,
  } = useDrawingStore();

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLayerPanel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
            title="Close Panel"
          >
            <X size={18} />
          </button>
          <h2 className="font-semibold text-gray-700">Layers</h2>
        </div>
        <button
          onClick={addLayer}
          className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-colors"
          title="New Layer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col-reverse gap-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`
              group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
              ${
                activeLayerId === layer.id
                  ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100'
                  : 'bg-white/50 border-transparent hover:bg-white hover:shadow-sm'
              }
            `}
          >
            {/* Visibility Toggle */}
            <button
              className={`p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 ${!layer.visible && 'opacity-50'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerVisibility(layer.id);
              }}
            >
              {layer.visible ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>

            {/* Layer Name */}
            <span
              className={`flex-1 text-sm font-medium select-none ${activeLayerId === layer.id ? 'text-indigo-900' : 'text-gray-600'}`}
            >
              {layer.name}
            </span>

            {/* Delete Action */}
            <button
              className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (layers.length === 1) {
                  alert('⚠️ Tidak bisa menghapus layer terakhir!');
                  return;
                }
                if (
                  confirm(
                    `Hapus layer "${layer.name}"?\n\nTindakan ini tidak bisa dibatalkan.`
                  )
                ) {
                  deleteLayer(layer.id);
                }
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Footer / Opacity Control */}
      <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Opacity
          </label>
          <span className="text-xs font-mono text-gray-500">
            {layers.find((l) => l.id === activeLayerId)?.opacity
              ? Math.round(
                  layers.find((l) => l.id === activeLayerId)!.opacity * 100
                )
              : 100}
            %
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={layers.find((l) => l.id === activeLayerId)?.opacity ?? 1}
          onChange={(e) => {
            if (activeLayerId) {
              updateLayerOpacity(activeLayerId, parseFloat(e.target.value));
            }
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>
    </div>
  );
};
