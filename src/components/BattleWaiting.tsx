import type { BattleState } from '../types';

type Props = {
  battle: BattleState;
  onReady: () => void;
  onLeave: () => void;
};

export const BattleWaiting = ({ battle, onReady, onLeave }: Props) => {
  const isHost = battle.role === 'host';
  const hasOpponent = battle.opponent !== null;

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
};
