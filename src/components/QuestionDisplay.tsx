type Props = {
  text: string;
  questionNumber: number;
  totalQuestions: number;
};

export const QuestionDisplay = ({
  text,
  questionNumber,
  totalQuestions,
}: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.counter}>
        Q{questionNumber} / {totalQuestions}
      </div>
      <div style={styles.text}>
        {text}
        <span style={styles.cursor}>|</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 24px',
    minHeight: '180px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    marginBottom: '24px',
  },
  counter: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--accent)',
    marginBottom: '16px',
    letterSpacing: '0.05em',
  },
  text: {
    fontSize: '22px',
    lineHeight: 1.7,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  cursor: {
    color: 'var(--accent)',
    animation: 'blink 1s infinite',
    marginLeft: '2px',
  },
};
