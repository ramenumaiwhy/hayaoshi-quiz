import { useState, useCallback, useEffect } from 'react';
import type { ChapterId } from '../types';

const STORAGE_KEY = 'claude-code-chapter-cleared';

type ChapterProgress = Record<string, boolean>;

export const useChapterProgress = () => {
  const [cleared, setCleared] = useState<ChapterProgress>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCleared(JSON.parse(saved));
    }
  }, []);

  const markCleared = useCallback((chapterId: ChapterId) => {
    setCleared((prev) => {
      const updated = { ...prev, [chapterId]: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isCleared = useCallback(
    (chapterId: ChapterId): boolean => {
      return cleared[chapterId] === true;
    },
    [cleared]
  );

  return { isCleared, markCleared };
};
