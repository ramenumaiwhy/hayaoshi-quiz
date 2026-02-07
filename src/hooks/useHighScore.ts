import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';

const getStorageKey = (category: Category | null) =>
  category ? `hayaoshi-quiz-highscore-${category}` : 'hayaoshi-quiz-highscore';

type HighScoreData = {
  score: number;
  total: number;
  date: string;
};

export const useHighScore = (category: Category | null = null) => {
  const [highScore, setHighScore] = useState<HighScoreData | null>(null);

  useEffect(() => {
    const key = getStorageKey(category);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setHighScore(JSON.parse(stored));
      } catch {
        localStorage.removeItem(key);
        setHighScore(null);
      }
    } else {
      setHighScore(null);
    }
  }, [category]);

  const updateHighScore = useCallback(
    (score: number, total: number) => {
      const percentage = score / total;
      const currentPercentage = highScore ? highScore.score / highScore.total : 0;

      if (percentage > currentPercentage) {
        const newHighScore: HighScoreData = {
          score,
          total,
          date: new Date().toISOString(),
        };
        setHighScore(newHighScore);
        localStorage.setItem(getStorageKey(category), JSON.stringify(newHighScore));
        return true;
      }
      return false;
    },
    [highScore, category]
  );

  return { highScore, updateHighScore };
};
