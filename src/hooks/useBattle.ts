import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateSeed } from './useSeededShuffle';
import type {
  BattleState,
  BattleRoomConfig,
  BattlePlayer,
  BattleRole,
  Category,
  GeneralGenre,
  Difficulty,
  ChapterId,
  User,
} from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const COUNTDOWN_SECONDS = 3;
const SESSION_KEY = 'battle_room';

type SavedRoom = {
  roomCode: string;
  role: BattleRole;
  config: BattleRoomConfig | null;
};

const saveRoom = (data: SavedRoom) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
};

const loadRoom = (): SavedRoom | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as SavedRoom : null;
  } catch { return null; }
};

const clearRoom = () => {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
};

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

type PresencePayload = {
  userId: string;
  displayName: string;
  role: BattleRole;
};

type UseBattleReturn = {
  battle: BattleState;
  createRoom: (config: { category: Category; genre?: GeneralGenre | 'all'; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => void;
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
  // setupChannel内のクロージャからroleを参照するためのref
  const roleRef = useRef<BattleRole | null>(null);

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

  // カウントダウンを絶対時刻(startAt)ベースで実行
  const startCountdown = useCallback((startAt: number) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    const update = () => {
      const remaining = Math.ceil((startAt - Date.now()) / 1000);
      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setBattle((prev) => ({ ...prev, phase: 'playing', countdownValue: null }));
      } else {
        setBattle((prev) => ({ ...prev, phase: 'countdown', countdownValue: remaining }));
      }
    };

    update();
    countdownTimerRef.current = setInterval(update, 200);
  }, []);

  const setupChannel = useCallback(
    (roomCode: string, role: BattleRole) => {
      if (!user) return;

      console.log(`[Battle] setupChannel: room=${roomCode}, role=${role}, userId=${user.id}`);

      cleanup();
      roleRef.current = role;

      const channelName = `battle:${roomCode}`;
      console.log(`[Battle] Creating channel: ${channelName}`);

      const channel = supabase.channel(channelName, {
        config: { presence: { key: user.id } },
      });

      channelRef.current = channel;

      // ---- Presence: プレイヤー検出（Broadcastより信頼性が高い） ----
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresencePayload>();
        console.log('[Battle] Presence sync fired. Full state:', JSON.stringify(state));
        const others = Object.entries(state)
          .flatMap(([_key, presences]) => presences)
          .filter((p) => p.userId !== user.id);

        console.log(`[Battle] Others in room: ${others.length}`, others.map((o) => o.userId));

        if (others.length > 0) {
          const other = others[0];
          setBattle((prev) => {
            if (prev.opponent?.userId === other.userId) return prev;
            console.log(`[Battle] Opponent detected: ${other.displayName} (${other.userId})`);
            return {
              ...prev,
              phase: 'waiting',
              opponent: {
                userId: other.userId,
                displayName: other.displayName,
                score: 0,
                currentQuestion: 0,
                finished: false,
                answerTimes: [],
              },
            };
          });
        }
      });

      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[Battle] Presence JOIN:', JSON.stringify(newPresences));
      });

      // Presence: 切断検知
      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[Battle] Presence LEAVE:', JSON.stringify(leftPresences));
        const left = leftPresences as unknown as PresencePayload[];
        const opponentLeft = left.some((p) => p.userId !== user.id);
        if (opponentLeft) {
          setBattle((prev) => {
            if (prev.phase === 'finished' || prev.phase === 'idle') return prev;
            return { ...prev, opponent: null, phase: prev.phase === 'playing' ? 'finished' : 'lobby' };
          });
        }
      });

      // ---- Broadcast: ゲーム中イベント ----

      // ルーム設定（ゲストが受信）
      channel.on('broadcast', { event: 'room_config' }, (payload) => {
        console.log('[Battle] Broadcast room_config received:', payload.payload);
        const receivedConfig = payload.payload as BattleRoomConfig;
        setBattle((prev) => {
          saveRoom({ roomCode, role: roleRef.current ?? role, config: receivedConfig });
          return { ...prev, config: receivedConfig };
        });
      });

      // カウントダウン開始（startAtで同期）
      channel.on('broadcast', { event: 'countdown' }, (payload) => {
        console.log('[Battle] Broadcast countdown received:', payload.payload);
        const { startAt } = payload.payload as { startAt: number };
        startCountdown(startAt);
      });

      // 相手の回答
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

      // 相手が全問終了
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

      channel.subscribe(async (status, err) => {
        console.log(`[Battle] Channel subscribe status: ${status}`, err ? `error: ${err.message}` : '');
        if (status === 'SUBSCRIBED') {
          console.log('[Battle] Channel SUBSCRIBED. Tracking presence...');
          try {
            const trackResult = await channel.track({
              userId: user.id,
              displayName: user.displayName,
              role: roleRef.current ?? role,
            });
            console.log('[Battle] track() result:', trackResult);
          } catch (trackErr) {
            console.error('[Battle] track() FAILED:', trackErr);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Battle] CHANNEL_ERROR:', err?.message);
        } else if (status === 'TIMED_OUT') {
          console.error('[Battle] TIMED_OUT: Realtime server did not respond');
        } else if (status === 'CLOSED') {
          console.warn('[Battle] Channel CLOSED unexpectedly');
        }
      });
    },
    [user, cleanup]
  );

  // リロード時にsessionStorageからルーム情報を復元
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current || !user) return;
    hasRestoredRef.current = true;

    const saved = loadRoom();
    if (!saved) return;

    setBattle({
      phase: saved.role === 'host' ? 'lobby' : 'waiting',
      role: saved.role,
      roomCode: saved.roomCode,
      config: saved.config,
      me: createPlayer(user),
      opponent: null,
      countdownValue: null,
    });

    setupChannel(saved.roomCode, saved.role);
  }, [user, setupChannel]);

  const createRoom = useCallback(
    (params: { category: Category; genre?: GeneralGenre | 'all'; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => {
      if (!user) return;
      const roomCode = generateRoomCode();
      const config: BattleRoomConfig = {
        category: params.category,
        genre: params.genre,
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

      saveRoom({ roomCode, role: 'host', config });
      setupChannel(roomCode, 'host');
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

      saveRoom({ roomCode, role: 'guest', config: null });
      setupChannel(roomCode, 'guest');
    },
    [user, setupChannel]
  );

  const setReady = useCallback(() => {
    if (!user || !channelRef.current || !battle.config) return;

    const channel = channelRef.current;

    if (battle.role === 'host') {
      // ゲストにconfig送信
      void channel.send({
        type: 'broadcast',
        event: 'room_config',
        payload: battle.config,
      });

      // 両クライアントが同じ時刻にplaying開始するための共通タイムスタンプ
      const startAt = Date.now() + COUNTDOWN_SECONDS * 1000;

      // countdown開始（ゲストへ送信）
      void channel.send({
        type: 'broadcast',
        event: 'countdown',
        payload: { startAt },
      });

      // ホスト自身もカウントダウン開始（同じstartAt基準）
      startCountdown(startAt);
    }
  }, [user, battle.role, battle.config, startCountdown]);

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
    clearRoom();
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
