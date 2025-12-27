import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { DrawingCanvas } from './components/DrawingCanvas';
import { LayerPanel } from './components/LayerPanel';
import { useDrawingStore } from './store/drawingStore';
import { WelcomeModal } from './components/WelcomeModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const App: React.FC = () => {
  const { isLayerPanelOpen } = useDrawingStore();

  // Prevent default gesture zooming on mobile
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    return () => {
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden select-none">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Header - Fixed at Top */}
      <Header />

      {/* Main Workspace - Flexible Area */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0">

        {/* Toolbar - Bottom on Mobile, Left on Desktop */}
        <div className="order-3 md:order-1 w-full md:w-auto z-20 md:h-full md:py-4 md:pl-4">
          <Toolbar />
        </div>

        {/* Canvas Area - Takes remaining space */}
        <div className="flex-1 order-2 relative bg-gray-100 md:m-4 md:rounded-2xl shadow-inner overflow-hidden border border-gray-200">
          <DrawingCanvas />

          {/* Layer Panel Overlay (Desktop & Mobile) */}
          {isLayerPanelOpen && (
            <div className="absolute top-4 right-4 bottom-4 w-72 z-30 glass-panel shadow-2xl animate-fade-in-up flex flex-col overflow-hidden">
              <LayerPanel />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default App;
