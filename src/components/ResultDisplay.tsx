type Props = {
  isCorrect: boolean;
  correctAnswer: string;
  answerReading: string;
  userAnswer: string;
  explanation?: string;
};

export const ResultDisplay = ({
  isCorrect,
  correctAnswer,
  answerReading,
  userAnswer,
  explanation,
}: Props) => {
  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.result,
          backgroundColor: isCorrect ? 'var(--success)' : 'var(--error)',
          boxShadow: isCorrect
            ? '0 4px 24px var(--success-glow)'
            : '0 4px 24px var(--accent-glow)',
        }}
      >
        {isCorrect ? '🎉 正解！' : '😢 不正解...'}
      </div>

      <div style={styles.answerSection}>
        {!isCorrect && (
          <>
            <div style={styles.label}>あなたの回答</div>
            <div style={styles.userAnswer}>{userAnswer || '（未入力）'}</div>
          </>
        )}
        <div style={{ ...styles.label, marginTop: !isCorrect ? '16px' : '0' }}>
          正解
        </div>
        <div style={styles.correctAnswer}>{correctAnswer}</div>
        {correctAnswer !== answerReading && (
          <div style={styles.reading}>（{answerReading}）</div>
        )}

        {explanation && (
          <>
            <div style={{ ...styles.label, marginTop: '16px' }}>解説</div>
            <div style={styles.explanation}>{explanation}</div>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    textAlign: 'center',
    animation: 'popIn 0.3s ease-out',
  },
  result: {
    fontSize: '28px',
    fontWeight: 900,
    color: 'white',
    padding: '24px 32px',
    borderRadius: '16px',
    marginBottom: '24px',
    letterSpacing: '0.05em',
  },
  answerSection: {
    textAlign: 'left',
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px 24px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  label: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    fontWeight: 500,
  },
  userAnswer: {
    fontSize: '20px',
    color: 'var(--text-secondary)',
  },
  correctAnswer: {
    fontSize: '28px',
    fontWeight: 900,
    color: 'var(--text-primary)',
  },
  reading: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  explanation: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    lineHeight: 1.6,
  },
};
