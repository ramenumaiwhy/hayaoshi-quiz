import type { BattlePlayer } from '../types';

type Props = {
  me: BattlePlayer;
  opponent: BattlePlayer | null;
  totalQuestions: number;
};

export const BattleOverlay = ({ me, opponent, totalQuestions }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.player}>
        <div style={styles.name}>{me.displayName}</div>
        <div style={styles.score}>{me.score}/{totalQuestions}</div>
        <div style={styles.progress}>Q{Math.min(me.currentQuestion + 1, totalQuestions)}</div>
      </div>
      <div style={styles.vs}>VS</div>
      <div style={styles.player}>
        <div style={styles.name}>{opponent?.displayName ?? '---'}</div>
        <div style={styles.score}>{opponent?.score ?? 0}/{totalQuestions}</div>
        <div style={styles.progress}>
          {opponent?.finished
            ? '完了'
            : `Q${Math.min((opponent?.currentQuestion ?? 0) + 1, totalQuestions)}`}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
  },
  player: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  name: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  score: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  progress: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-muted)',
  },
  vs: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    padding: '0 12px',
  },
};
