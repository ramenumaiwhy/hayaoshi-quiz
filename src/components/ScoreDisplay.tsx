type HighScoreData = {
  score: number;
  total: number;
  date: string;
} | null;

type Props = {
  score: number;
  totalQuestions: number;
  highScore: HighScoreData;
  isNewRecord: boolean;
  onRestart: () => void;
};

export const ScoreDisplay = ({
  score,
  totalQuestions,
  highScore,
  isNewRecord,
  onRestart,
}: Props) => {
  const percentage = Math.round((score / totalQuestions) * 100);

  const getMessage = () => {
    if (isNewRecord) return '🎊 新記録！';
    if (percentage === 100) return '🏆 完璧！';
    if (percentage >= 80) return '🎉 すごい！';
    if (percentage >= 60) return '👍 いい調子！';
    if (percentage >= 40) return '💪 もう少し！';
    return '📚 がんばろう！';
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>結果発表</div>

      <div style={styles.scoreCard}>
        <div style={styles.scoreNumber}>
          {score} <span style={styles.divider}>/</span> {totalQuestions}
        </div>
        <div
          style={{
            ...styles.percentage,
            color: percentage >= 60 ? 'var(--success)' : 'var(--accent)',
          }}
        >
          {percentage}%
        </div>
        <div style={styles.message}>{getMessage()}</div>
      </div>

      {highScore && (
        <div style={styles.highScoreCard}>
          <div style={styles.highScoreLabel}>🏅 ハイスコア</div>
          <div style={styles.highScoreValue}>
            {highScore.score} / {highScore.total}
            <span style={styles.highScorePercentage}>
              ({Math.round((highScore.score / highScore.total) * 100)}%)
            </span>
          </div>
        </div>
      )}

      <button onClick={onRestart} style={styles.restartButton}>
        もう一度挑戦
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center',
    padding: '48px 24px',
    animation: 'fadeIn 0.4s ease-out',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '32px',
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
  },
  scoreCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '20px',
    padding: '40px 32px',
    marginBottom: '24px',
    border: '1px solid var(--border)',
  },
  scoreNumber: {
    fontSize: '56px',
    fontWeight: 900,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  divider: {
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  percentage: {
    fontSize: '32px',
    fontWeight: 900,
    marginBottom: '16px',
  },
  message: {
    fontSize: '24px',
    color: 'var(--text-secondary)',
  },
  highScoreCard: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '12px',
    padding: '16px 24px',
    marginBottom: '32px',
    border: '1px solid var(--border)',
  },
  highScoreLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  highScoreValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  highScorePercentage: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    marginLeft: '8px',
    fontWeight: 400,
  },
  restartButton: {
    fontSize: '20px',
    fontWeight: 700,
    padding: '18px 48px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px var(--accent-glow)',
    transition: 'all 0.2s ease',
  },
};
