import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hayaoshi-quiz-highscore';

type HighScoreData = {
  score: number;
  total: number;
  date: string;
};

export const useHighScore = () => {
  const [highScore, setHighScore] = useState<HighScoreData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHighScore(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHighScore));
        return true; // 新記録
      }
      return false;
    },
    [highScore]
  );

  return { highScore, updateHighScore };
};
