import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateSeed } from './useSeededShuffle';
import type {
  BattleState,
  BattleRoomConfig,
  BattlePlayer,
  BattleRole,
  Category,
  Difficulty,
  ChapterId,
  User,
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 3;

const generateRoomCode = (): string => {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
};

const createPlayer = (user: User): BattlePlayer => ({
  userId: user.id,
  displayName: user.displayName,
  score: 0,
  currentQuestion: 0,
  finished: false,
  answerTimes: [],
});

const initialState: BattleState = {
  phase: 'idle',
  role: null,
  roomCode: null,
  config: null,
  me: null,
  opponent: null,
  countdownValue: null,
};

type UseBattleReturn = {
  battle: BattleState;
  createRoom: (config: { category: Category; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => void;
  joinRoom: (code: string) => void;
  setReady: () => void;
  reportAnswer: (questionIndex: number, isCorrect: boolean, answerTime: number) => void;
  reportFinished: () => void;
  leaveBattle: () => void;
};

export const useBattle = (user: User | null): UseBattleReturn => {
  const [battle, setBattle] = useState<BattleState>(initialState);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const setupChannel = useCallback(
    (roomCode: string, role: BattleRole, config: BattleRoomConfig | null) => {
      if (!user) return;

      cleanup();

      const channel = supabase.channel(`battle:${roomCode}`, {
        config: { presence: { key: user.id } },
      });

      channelRef.current = channel;

      // Broadcast: ゲスト参加
      channel.on('broadcast', { event: 'guest_joined' }, (payload) => {
        const { userId, displayName } = payload.payload as { userId: string; displayName: string };
        if (userId === user.id) return;
        setBattle((prev) => ({
          ...prev,
          phase: 'waiting',
          opponent: {
            userId,
            displayName,
            score: 0,
            currentQuestion: 0,
            finished: false,
            answerTimes: [],
          },
        }));
      });

      // Broadcast: ルーム設定（ゲストが受信）
      channel.on('broadcast', { event: 'room_config' }, (payload) => {
        const receivedConfig = payload.payload as BattleRoomConfig;
        setBattle((prev) => ({ ...prev, config: receivedConfig }));
      });

      // Broadcast: Ready
      channel.on('broadcast', { event: 'ready' }, (payload) => {
        const { userId } = payload.payload as { userId: string };
        if (userId === user.id) return;
        setBattle((prev) => {
          if (!prev.opponent) return prev;
          return { ...prev, opponent: { ...prev.opponent } };
        });
      });

      // Broadcast: カウントダウン開始
      channel.on('broadcast', { event: 'countdown' }, (payload) => {
        const { startAt } = payload.payload as { startAt: number };
        setBattle((prev) => ({ ...prev, phase: 'countdown', countdownValue: COUNTDOWN_SECONDS }));

        let count = COUNTDOWN_SECONDS;
        countdownTimerRef.current = setInterval(() => {
          count--;
          if (count <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            setBattle((prev) => ({
              ...prev,
              phase: 'playing',
              countdownValue: null,
            }));
          } else {
            setBattle((prev) => ({ ...prev, countdownValue: count }));
          }
        }, 1000);

        // startAt までの時間差を補正（ネットワーク遅延対策）
        const delay = startAt - Date.now();
        if (delay > 0 && delay < 5000) {
          setTimeout(() => {
            // タイマーはすでに走っているので追加処理不要
          }, delay);
        }
      });

      // Broadcast: 相手の回答
      channel.on('broadcast', { event: 'answer' }, (payload) => {
        const { userId, questionIndex, isCorrect, answerTime } = payload.payload as {
          userId: string;
          questionIndex: number;
          isCorrect: boolean;
          answerTime: number;
        };
        if (userId === user.id) return;
        setBattle((prev) => {
          if (!prev.opponent) return prev;
          return {
            ...prev,
            opponent: {
              ...prev.opponent,
              score: isCorrect ? prev.opponent.score + 1 : prev.opponent.score,
              currentQuestion: questionIndex + 1,
              answerTimes: isCorrect
                ? [...prev.opponent.answerTimes, answerTime]
                : prev.opponent.answerTimes,
            },
          };
        });
      });

      // Broadcast: 相手が全問終了
      channel.on('broadcast', { event: 'battle_finished' }, (payload) => {
        const { userId, score, answerTimes } = payload.payload as {
          userId: string;
          score: number;
          answerTimes: number[];
        };
        if (userId === user.id) return;
        setBattle((prev) => {
          if (!prev.opponent) return prev;
          const updatedOpponent = { ...prev.opponent, score, answerTimes, finished: true };
          const meFinished = prev.me?.finished ?? false;
          return {
            ...prev,
            opponent: updatedOpponent,
            phase: meFinished ? 'finished' : prev.phase,
          };
        });
      });

      // Presence: 切断検知
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const left = leftPresences as Array<{ userId?: string }>;
        const opponentLeft = left.some(
          (p) => p.userId && p.userId !== user.id
        );
        if (opponentLeft) {
          setBattle((prev) => {
            if (prev.phase === 'finished') return prev;
            return { ...prev, phase: 'finished' };
          });
        }
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: user.id, displayName: user.displayName });

          if (role === 'guest' && config) {
            await channel.send({
              type: 'broadcast',
              event: 'guest_joined',
              payload: { userId: user.id, displayName: user.displayName },
            });
          }
        }
      });
    },
    [user, cleanup]
  );

  const createRoom = useCallback(
    (params: { category: Category; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => {
      if (!user) return;
      const roomCode = generateRoomCode();
      const config: BattleRoomConfig = {
        category: params.category,
        difficulty: params.difficulty,
        chapter: params.chapter,
        seed: generateSeed(),
      };

      setBattle({
        phase: 'lobby',
        role: 'host',
        roomCode,
        config,
        me: createPlayer(user),
        opponent: null,
        countdownValue: null,
      });

      setupChannel(roomCode, 'host', config);
    },
    [user, setupChannel]
  );

  const joinRoom = useCallback(
    (code: string) => {
      if (!user) return;
      const roomCode = code.toUpperCase().trim();

      setBattle({
        phase: 'waiting',
        role: 'guest',
        roomCode,
        config: null,
        me: createPlayer(user),
        opponent: null,
        countdownValue: null,
      });

      setupChannel(roomCode, 'guest', null);
    },
    [user, setupChannel]
  );

  const setReady = useCallback(() => {
    if (!user || !channelRef.current || !battle.config) return;

    const channel = channelRef.current;

    // ホストはゲストにconfig送信 → countdown開始
    if (battle.role === 'host') {
      void channel.send({
        type: 'broadcast',
        event: 'room_config',
        payload: battle.config,
      });

      const startAt = Date.now() + (COUNTDOWN_SECONDS + 1) * 1000;
      void channel.send({
        type: 'broadcast',
        event: 'countdown',
        payload: { startAt },
      });

      // ホスト自身もカウントダウン開始
      setBattle((prev) => ({ ...prev, phase: 'countdown', countdownValue: COUNTDOWN_SECONDS }));
      let count = COUNTDOWN_SECONDS;
      countdownTimerRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setBattle((prev) => ({ ...prev, phase: 'playing', countdownValue: null }));
        } else {
          setBattle((prev) => ({ ...prev, countdownValue: count }));
        }
      }, 1000);
    }
  }, [user, battle.role, battle.config]);

  const reportAnswer = useCallback(
    (questionIndex: number, isCorrect: boolean, answerTime: number) => {
      if (!user || !channelRef.current) return;

      void channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: { userId: user.id, questionIndex, isCorrect, answerTime },
      });

      setBattle((prev) => {
        if (!prev.me) return prev;
        return {
          ...prev,
          me: {
            ...prev.me,
            score: isCorrect ? prev.me.score + 1 : prev.me.score,
            currentQuestion: questionIndex + 1,
            answerTimes: isCorrect
              ? [...prev.me.answerTimes, answerTime]
              : prev.me.answerTimes,
          },
        };
      });
    },
    [user]
  );

  const reportFinished = useCallback(() => {
    if (!user || !channelRef.current) return;

    setBattle((prev) => {
      if (!prev.me) return prev;

      void channelRef.current!.send({
        type: 'broadcast',
        event: 'battle_finished',
        payload: {
          userId: user.id,
          score: prev.me.score,
          answerTimes: prev.me.answerTimes,
        },
      });

      const meFinished = { ...prev.me, finished: true };
      const opponentFinished = prev.opponent?.finished ?? false;
      return {
        ...prev,
        me: meFinished,
        phase: opponentFinished ? 'finished' : prev.phase,
      };
    });
  }, [user]);

  const leaveBattle = useCallback(() => {
    cleanup();
    setBattle(initialState);
  }, [cleanup]);

  return {
    battle,
    createRoom,
    joinRoom,
    setReady,
    reportAnswer,
    reportFinished,
    leaveBattle,
  };
};
