type Props = {
  choices: string[];
  currentAnswer: string;
  onSelect: (char: string) => void;
};

export const AnswerChoices = ({ choices, currentAnswer, onSelect }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.label}>あなたの回答</div>
      <div style={styles.currentAnswer}>
        {currentAnswer || '\u3000'}
        <span style={styles.cursor}>_</span>
      </div>
      <div style={styles.choices}>
        {choices.map((char, index) => (
          <button
            key={`${char}-${index}`}
            onClick={() => onSelect(char)}
            style={styles.choiceButton}
          >
            {char}
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
  choices: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    maxWidth: '360px',
    margin: '0 auto',
  },
  choiceButton: {
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
};
