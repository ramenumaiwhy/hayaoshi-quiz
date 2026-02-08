import type { Difficulty } from '../types';

type Props = {
  onSelect: (difficulty: Difficulty | 'all') => void;
  onBack: () => void;
  questionCounts: Record<Difficulty | 'all', number>;
};

const DIFFICULTIES: { key: Difficulty | 'all'; emoji: string; label: string }[] = [
  { key: 'C', emoji: '🟢', label: 'やさしい' },
  { key: 'B', emoji: '🟡', label: 'ふつう' },
  { key: 'A', emoji: '🔴', label: 'むずかしい' },
  { key: 'S', emoji: '⚫', label: '超難問' },
  { key: 'all', emoji: '🌈', label: '全難易度' },
];

export const DifficultySelect = ({ onSelect, onBack, questionCounts }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
        <div style={styles.title}>難易度を選択</div>
      </div>

      <div style={styles.cards}>
        {DIFFICULTIES.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              ...styles.card,
              ...(questionCounts[key] === 0 ? styles.disabledCard : {}),
            }}
            disabled={questionCounts[key] === 0}
          >
            <div style={styles.emoji}>{emoji}</div>
            <div style={styles.label}>
              {label}
              {key !== 'all' && <span style={styles.rank}> ({key})</span>}
            </div>
            <div style={styles.count}>{questionCounts[key]}問</div>
          </button>
        ))}
      </div>
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
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  disabledCard: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  emoji: {
    fontSize: '24px',
  },
  label: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    flex: 1,
  },
  rank: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  count: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
};
