import Konva from 'konva';

export const exportToPng = (
  stage: Konva.Stage,
  stageSize: { width: number; height: number },
  userName: string,
  transformer?: Konva.Transformer,
  selectedIds?: Set<string>
) => {
  const oldScale = stage.scaleX();
  const oldPos = stage.position();

  // Hide transformer/selection
  if (transformer) transformer.nodes([]);

  // Reset view for capture
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });

  // Add watermark
  const watermarkLayer = new Konva.Layer();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const watermarkText = `${userName || 'Pixel Genius'} • ${dateStr} ${timeStr} `;

  const text = new Konva.Text({
    x: 10,
    y: stageSize.height - 30,
    text: watermarkText,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fill: '#666666',
    opacity: 0.7,
  });

  watermarkLayer.add(text);
  stage.add(watermarkLayer);
  watermarkLayer.draw();

  // Export
  const uri = stage.toDataURL({ pixelRatio: 2 });

  // Cleanup
  watermarkLayer.destroy();
  stage.scale({ x: oldScale, y: oldScale });
  stage.position(oldPos);

  // Restore selection
  if (selectedIds && selectedIds.size > 0 && transformer) {
    const nodes = Array.from(selectedIds)
      .map((id) => stage.findOne('#' + id))
      .filter(Boolean);
    transformer.nodes(nodes as Konva.Node[]);
  }

  // Download
  const link = document.createElement('a');
  link.download = `pixel-genius-${Date.now()}.png`;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

import type { Layer } from '@/types';

export const saveProject = (layers: Layer[]) => {
  const projectData = JSON.stringify(layers);
  const blob = new Blob([projectData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pixel-genius-project-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
