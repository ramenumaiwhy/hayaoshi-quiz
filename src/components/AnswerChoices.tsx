type Props = {
  choices: string[];
  currentAnswer: string;
  onSelect: (choice: string) => void;
  isWordMode?: boolean;
};

export const AnswerChoices = ({
  choices,
  currentAnswer,
  onSelect,
  isWordMode = false,
}: Props) => {
  return (
    <div style={styles.container}>
      {!isWordMode && (
        <>
          <div style={styles.label}>あなたの回答</div>
          <div style={styles.currentAnswer}>
            {currentAnswer || '\u3000'}
            <span style={styles.cursor}>_</span>
          </div>
        </>
      )}
      <div style={isWordMode ? styles.wordChoices : styles.charChoices}>
        {choices.map((choice, index) => (
          <button
            key={`${choice}-${index}`}
            onClick={() => onSelect(choice)}
            style={isWordMode ? styles.wordButton : styles.charButton}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease-out',
  },
  label: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  currentAnswer: {
    fontSize: '36px',
    fontWeight: 900,
    marginBottom: '32px',
    minHeight: '56px',
    letterSpacing: '0.15em',
    color: 'var(--text-primary)',
  },
  cursor: {
    color: 'var(--accent)',
    animation: 'blink 1s infinite',
    fontWeight: 400,
  },
  charChoices: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    maxWidth: '360px',
    margin: '0 auto',
  },
  charButton: {
    fontSize: '32px',
    fontWeight: 700,
    padding: '24px',
    backgroundColor: 'var(--choice-bg)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: 'var(--text-primary)',
  },
  wordChoices: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  wordButton: {
    fontSize: '16px',
    fontWeight: 600,
    padding: '20px 16px',
    backgroundColor: 'var(--choice-bg)',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: 'var(--text-primary)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
    wordBreak: 'break-word',
  },
};
