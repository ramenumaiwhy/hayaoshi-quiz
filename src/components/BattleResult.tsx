import type { BattlePlayer } from '../types';

type Props = {
  me: BattlePlayer;
  opponent: BattlePlayer | null;
  totalQuestions: number;
  onLeave: () => void;
};

type Verdict = 'win' | 'lose' | 'draw';

const getVerdict = (me: BattlePlayer, opponent: BattlePlayer | null): Verdict => {
  if (!opponent) return 'win';
  if (me.score > opponent.score) return 'win';
  if (me.score < opponent.score) return 'lose';

  const myAvg = me.answerTimes.length > 0
    ? me.answerTimes.reduce((a, b) => a + b, 0) / me.answerTimes.length
    : Infinity;
  const oppAvg = opponent.answerTimes.length > 0
    ? opponent.answerTimes.reduce((a, b) => a + b, 0) / opponent.answerTimes.length
    : Infinity;

  if (myAvg < oppAvg) return 'win';
  if (myAvg > oppAvg) return 'lose';
  return 'draw';
};

const VERDICT_CONFIG: Record<Verdict, { emoji: string; label: string; color: string }> = {
  win:  { emoji: '🎉', label: 'YOU WIN!', color: 'var(--success)' },
  lose: { emoji: '😢', label: 'YOU LOSE', color: 'var(--accent)' },
  draw: { emoji: '🤝', label: 'DRAW', color: 'var(--text-secondary)' },
};

export const BattleResult = ({ me, opponent, totalQuestions, onLeave }: Props) => {
  const verdict = getVerdict(me, opponent);
  const { emoji, label, color } = VERDICT_CONFIG[verdict];
  const formatTime = (times: number[]) =>
    times.length > 0
      ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)
      : '-';

  return (
    <div style={styles.container}>
      <div style={styles.verdictEmoji}>{emoji}</div>
      <div style={{ ...styles.verdictLabel, color }}>{label}</div>

      <div style={styles.comparison}>
        <div style={styles.compPlayer}>
          <div style={styles.compName}>{me.displayName}</div>
          <div style={styles.compScore}>{me.score}/{totalQuestions}</div>
          <div style={styles.compTime}>平均 {formatTime(me.answerTimes)}秒</div>
        </div>
        <div style={styles.compVs}>VS</div>
        <div style={styles.compPlayer}>
          <div style={styles.compName}>{opponent?.displayName ?? '(切断)'}</div>
          <div style={styles.compScore}>{opponent?.score ?? 0}/{totalQuestions}</div>
          <div style={styles.compTime}>
            平均 {opponent ? formatTime(opponent.answerTimes) : '-'}秒
          </div>
        </div>
      </div>

      <button onClick={onLeave} style={styles.leaveButton}>
        ロビーに戻る
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '32px 0',
    animation: 'fadeIn 0.4s ease-out',
  },
  verdictEmoji: {
    fontSize: '64px',
  },
  verdictLabel: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  comparison: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    borderRadius: '18px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    width: '100%',
    maxWidth: '480px',
    justifyContent: 'center',
  },
  compPlayer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  compName: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  compScore: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  compTime: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  compVs: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    padding: '0 8px',
  },
  leaveButton: {
    fontSize: '16px',
    fontWeight: 700,
    padding: '16px 40px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
