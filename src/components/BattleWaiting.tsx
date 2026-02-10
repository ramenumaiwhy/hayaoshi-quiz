import { useState, useEffect, useRef, useCallback } from 'react';
import type { BattleState } from '../types';
import { supabase } from '../lib/supabase';

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
        if (msg.includes('[Battle]') || msg.includes('[Supabase RT]')) {
          setLogs((prev) => [...prev.slice(-50), `${prefix}${msg}`]);
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
  const [wsTestResult, setWsTestResult] = useState<string[]>([]);
  const logs = useBattleLogs();

  const runWsTest = useCallback(() => {
    setWsTestResult(['🔄 テスト開始...']);
    const addLine = (line: string) => setWsTestResult((prev) => [...prev, line]);

    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    addLine(`Host: ${location.host} | UA: ${navigator.userAgent.substring(0, 60)}...`);

    // Test 1: REST API
    supabase.from('users').select('id').limit(1).then(({ error }) => {
      addLine(error ? `❌ REST: ${error.message}` : '✅ REST: OK');
    });

    // Test 2: Raw WebSocket + phx_join (supabase-js を完全にバイパス)
    addLine('--- Raw WS + phx_join (supabase-js バイパス) ---');
    try {
      const wsUrl = `wss://${url.replace('https://', '')}/realtime/v1/websocket?apikey=${key}&vsn=2.0.0`;
      addLine(`URL: ${wsUrl.substring(0, 70)}...`);

      const ws = new WebSocket(wsUrl);
      addLine(`WS protocol header: "${ws.protocol || '(none)'}"`);

      ws.onopen = () => {
        addLine(`✅ Raw WS: OPEN (readyState=${ws.readyState})`);
        // Node.js で成功したのと全く同じ phx_join メッセージを送る
        const joinMsg = JSON.stringify({
          topic: 'realtime:browser-raw-test',
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { self: false, ack: false },
              presence: { key: '', enabled: false },
              postgres_changes: [],
              private: false,
            },
            access_token: key,
          },
          ref: '1',
          join_ref: '1',
        });
        ws.send(joinMsg);
        addLine('Sent phx_join (same as Node.js)');
      };

      ws.onmessage = (e) => {
        const data = typeof e.data === 'string' ? e.data.substring(0, 300) : '(binary)';
        addLine(`📩 msg: ${data}`);
        try {
          const parsed = JSON.parse(e.data as string);
          if (parsed.event === 'phx_reply' && parsed.payload?.status === 'ok') {
            addLine('✅✅ RAW phx_join 成功！サーバーは正常！');
          } else if (parsed.event === 'phx_reply' && parsed.payload?.status === 'error') {
            addLine(`❌ phx_join エラー: ${JSON.stringify(parsed.payload.response)}`);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = (e) => {
        addLine(`❌ Raw WS ERROR: type=${e.type}`);
      };

      ws.onclose = (e) => {
        addLine(`Raw WS CLOSE: code=${e.code} reason="${e.reason}" clean=${e.wasClean}`);
      };

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          addLine('❌ Raw WS: 10秒タイムアウト');
          ws.close();
        }
      }, 10000);
    } catch (e) {
      addLine(`❌ WS constructor error: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Test 3: supabase-js channel (SafeWebSocket transport)
    addLine('--- supabase-js channel ---');
    const testCh = supabase.channel(`js-test-${Date.now()}`);
    let resolved = false;
    testCh.subscribe((status, err) => {
      if (resolved) return;
      addLine(`supabase-js: ${status}${err ? ` err=${String(err)}` : ''}`);
      if (status === 'SUBSCRIBED') {
        resolved = true;
        addLine('✅ supabase-js: 成功！');
        supabase.removeChannel(testCh);
      }
      if (status === 'TIMED_OUT') {
        resolved = true;
        addLine('❌ supabase-js: タイムアウト');
        supabase.removeChannel(testCh);
      }
    });
    setTimeout(() => {
      if (!resolved) { addLine('❌ supabase-js: 10秒タイムアウト'); supabase.removeChannel(testCh); }
    }, 10000);
  }, []);

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
          <div style={{ marginBottom: '8px' }}>
            <button onClick={runWsTest} style={{ ...styles.debugButton, color: '#ff6b6b', borderColor: '#ff6b6b' }}>
              🧪 WebSocket接続テスト
            </button>
          </div>
          {wsTestResult.length > 0 && (
            <div style={{ ...styles.debugLogs, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
              {wsTestResult.map((line, i) => (
                <div key={i} style={styles.debugLogLine}>{line}</div>
              ))}
            </div>
          )}
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
