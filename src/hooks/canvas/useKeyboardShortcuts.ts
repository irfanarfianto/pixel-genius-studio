import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  deleteLines: (ids: string[]) => void;
  setIsSpacePressed: (value: boolean) => void;
}

/**
 * Custom hook for global keyboard shortcuts
 */
export const useKeyboardShortcuts = ({
  selectedIds,
  setSelectedIds,
  deleteLines,
  setIsSpacePressed,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar for panning
      if (
        e.code === 'Space' &&
        !e.repeat &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        setIsSpacePressed(true);
      }

      // Delete/Backspace for deleting items
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIds.size > 0
      ) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        e.preventDefault();
        deleteLines(Array.from(selectedIds));
        setSelectedIds(new Set());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, deleteLines, setSelectedIds, setIsSpacePressed]);
};
