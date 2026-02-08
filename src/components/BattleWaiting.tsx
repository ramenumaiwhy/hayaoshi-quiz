import { useState, useEffect, useRef } from 'react';
import type { BattleState } from '../types';

type Props = {
  battle: BattleState;
  onReady: () => void;
  onLeave: () => void;
};

// console.logをインターセプトしてデバッグパネルに表示
const useBattleLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const originalLog = useRef<typeof console.log | null>(null);
  const originalError = useRef<typeof console.error | null>(null);
  const originalWarn = useRef<typeof console.warn | null>(null);

  useEffect(() => {
    originalLog.current = console.log;
    originalError.current = console.error;
    originalWarn.current = console.warn;

    const capture = (prefix: string, original: typeof console.log) =>
      (...args: unknown[]) => {
        const msg = args.map((a) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        if (msg.includes('[Battle]')) {
          setLogs((prev) => [...prev.slice(-30), `${prefix}${msg}`]);
        }
        original(...args);
      };

    console.log = capture('', originalLog.current);
    console.error = capture('❌ ', originalError.current);
    console.warn = capture('⚠️ ', originalWarn.current);

    return () => {
      if (originalLog.current) console.log = originalLog.current;
      if (originalError.current) console.error = originalError.current;
      if (originalWarn.current) console.warn = originalWarn.current;
    };
  }, []);

  return logs;
};

export const BattleWaiting = ({ battle, onReady, onLeave }: Props) => {
  const isHost = battle.role === 'host';
  const hasOpponent = battle.opponent !== null;
  const [showDebug, setShowDebug] = useState(false);
  const logs = useBattleLogs();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onLeave} style={styles.backButton}>← やめる</button>
        <div style={styles.title}>対戦ルーム</div>
      </div>

      <div style={styles.roomCard}>
        <div style={styles.roomLabel}>ルームコード</div>
        <div style={styles.roomCode}>{battle.roomCode}</div>
        <div style={styles.roomHint}>このコードを対戦相手に伝えてね</div>
      </div>

      <div style={styles.players}>
        <div style={styles.playerCard}>
          <div style={styles.playerRole}>{isHost ? 'ホスト' : 'ゲスト'}</div>
          <div style={styles.playerName}>{battle.me?.displayName ?? '...'}</div>
          <div style={styles.readyBadge}>あなた</div>
        </div>

        <div style={styles.vs}>VS</div>

        <div style={{
          ...styles.playerCard,
          ...(hasOpponent ? {} : styles.playerEmpty),
        }}>
          {hasOpponent ? (
            <>
              <div style={styles.playerRole}>{isHost ? 'ゲスト' : 'ホスト'}</div>
              <div style={styles.playerName}>{battle.opponent!.displayName}</div>
            </>
          ) : (
            <div style={styles.waitingText}>待機中...</div>
          )}
        </div>
      </div>

      {isHost && hasOpponent && (
        <button onClick={onReady} style={styles.readyButton}>
          スタート！
        </button>
      )}

      {!isHost && (
        <div style={styles.waitHint}>
          {hasOpponent ? 'ホストの開始を待っています...' : '接続中...'}
        </div>
      )}

      {/* デバッグパネル */}
      <div style={styles.debugToggle}>
        <button
          onClick={() => setShowDebug((v) => !v)}
          style={styles.debugButton}
        >
          {showDebug ? '🔽 デバッグ非表示' : '🔧 デバッグ表示'}
        </button>
      </div>
      {showDebug && (
        <div style={styles.debugPanel}>
          <div style={styles.debugTitle}>接続デバッグ</div>
          <div style={styles.debugInfo}>
            <div>phase: {battle.phase}</div>
            <div>role: {battle.role}</div>
            <div>myId: {battle.me?.userId ?? 'null'}</div>
            <div>opponent: {battle.opponent ? `${battle.opponent.displayName} (${battle.opponent.userId})` : 'null'}</div>
          </div>
          <div style={styles.debugLogs}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>ログなし（ルーム作成/参加するとログが出ます）</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={styles.debugLogLine}>{log}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'fadeIn 0.4s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backButton: {
    fontSize: '14px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  roomCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px',
    borderRadius: '18px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
  },
  roomLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  roomCode: {
    fontSize: '36px',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.3em',
    fontFamily: 'monospace',
  },
  roomHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  players: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    justifyContent: 'center',
  },
  playerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px 20px',
    borderRadius: '16px',
    border: '2px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    minWidth: '140px',
  },
  playerEmpty: {
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  playerRole: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--accent)',
    textTransform: 'uppercase' as const,
  },
  playerName: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  readyBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
  },
  vs: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-muted)',
  },
  waitingText: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    padding: '8px 0',
  },
  readyButton: {
    fontSize: '20px',
    fontWeight: 700,
    padding: '20px 48px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    boxShadow: '0 4px 24px var(--accent-glow)',
    transition: 'all 0.2s ease',
    animation: 'pulse 2s ease-in-out infinite',
    alignSelf: 'center',
  },
  waitHint: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  debugToggle: {
    textAlign: 'center',
    marginTop: '8px',
  },
  debugButton: {
    fontSize: '12px',
    padding: '6px 16px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  debugPanel: {
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #333',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#ccc',
    maxHeight: '300px',
    overflow: 'auto',
  },
  debugTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ff6b6b',
    marginBottom: '8px',
  },
  debugInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
    color: '#8be9fd',
  },
  debugLogs: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  debugLogLine: {
    fontSize: '10px',
    lineHeight: '1.4',
    wordBreak: 'break-all' as const,
    color: '#a8e6a8',
  },
};
