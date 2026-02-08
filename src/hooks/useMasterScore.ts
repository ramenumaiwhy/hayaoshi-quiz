import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MasterScore, MasterRanking } from '../types';

const MAX_RANKING = 5;

type DbRow = {
  id: string;
  name: string;
  score: number;
  total_questions: number;
  average_time: number;
  created_at: string;
  user_id?: string | null;
};

const rowToScore = (row: DbRow): MasterScore => ({
  name: row.name,
  score: row.score,
  totalQuestions: row.total_questions,
  averageTime: row.average_time,
  date: row.created_at,
});

const compareScores = (a: MasterScore, b: MasterScore): number => {
  if (a.score !== b.score) return b.score - a.score;
  return a.averageTime - b.averageTime;
};

export const useMasterScore = () => {
  const [ranking, setRanking] = useState<MasterRanking>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRanking = useCallback(async () => {
    const { data, error } = await supabase
      .from('master_ranking')
      .select('*')
      .order('score', { ascending: false })
      .order('average_time', { ascending: true })
      .limit(MAX_RANKING);

    if (error) {
      console.error('Failed to fetch ranking:', error);
      return;
    }

    setRanking((data as DbRow[]).map(rowToScore));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const checkRankPosition = useCallback(
    (score: number, averageTime: number): number | null => {
      const tempScore: MasterScore = {
        name: '',
        score,
        totalQuestions: 30,
        averageTime,
        date: '',
      };

      if (ranking.length < MAX_RANKING) {
        const position = ranking.filter((r) => compareScores(r, tempScore) < 0).length;
        return position + 1;
      }

      const worstInRanking = ranking[ranking.length - 1];
      if (compareScores(tempScore, worstInRanking) < 0) {
        const position = ranking.filter((r) => compareScores(r, tempScore) < 0).length;
        return position + 1;
      }

      return null;
    },
    [ranking]
  );

  const addToRanking = useCallback(
    async (
      name: string,
      score: number,
      totalQuestions: number,
      averageTime: number,
      userId?: string
    ): Promise<number> => {
      const { error } = await supabase.from('master_ranking').insert({
        name,
        score,
        total_questions: totalQuestions,
        average_time: averageTime,
        user_id: userId ?? null,
      });

      if (error) {
        console.error('Failed to insert ranking:', error);
        return -1;
      }

      await fetchRanking();

      const newScore: MasterScore = { name, score, totalQuestions, averageTime, date: '' };
      const position = ranking.filter((r) => compareScores(r, newScore) < 0).length + 1;
      return position;
    },
    [ranking, fetchRanking]
  );

  const fetchFriendRanking = useCallback(async (friendUserIds: string[]): Promise<MasterRanking> => {
    if (friendUserIds.length === 0) return [];

    const { data, error } = await supabase
      .from('master_ranking')
      .select('*')
      .in('user_id', friendUserIds)
      .order('score', { ascending: false })
      .order('average_time', { ascending: true });

    if (error) {
      console.error('Failed to fetch friend ranking:', error);
      return [];
    }

    const bestByUser = new Map<string, MasterScore>();
    (data as DbRow[]).forEach((row) => {
      if (!row.user_id) return;
      const score = rowToScore(row);
      const current = bestByUser.get(row.user_id);
      if (!current || compareScores(score, current) < 0) {
        bestByUser.set(row.user_id, score);
      }
    });

    return Array.from(bestByUser.values())
      .sort(compareScores)
      .slice(0, 10);
  }, []);

  const bestScore = ranking.length > 0 ? ranking[0] : null;

  return { ranking, bestScore, checkRankPosition, addToRanking, fetchFriendRanking, isLoading };
};
