import type { GeneralGenre } from '../types';

type Props = {
  onSelect: (genre: GeneralGenre | 'all') => void;
  onBack: () => void;
  questionCounts: Record<GeneralGenre | 'all', number>;
};

const GENRES: { key: GeneralGenre | 'all'; emoji: string; label: string }[] = [
  { key: 'language', emoji: '📝', label: 'ことば' },
  { key: 'history', emoji: '🏛️', label: '歴史' },
  { key: 'science', emoji: '🔬', label: '科学・自然' },
  { key: 'entertainment', emoji: '🎬', label: 'エンタメ' },
  { key: 'sports', emoji: '⚽', label: 'スポーツ' },
  { key: 'food', emoji: '🍽️', label: '食べ物' },
  { key: 'all', emoji: '🌈', label: '全ジャンル' },
];

export const GenreSelect = ({ onSelect, onBack, questionCounts }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
        <div style={styles.title}>ジャンルを選択</div>
      </div>

      <div style={styles.cards}>
        {GENRES.map(({ key, emoji, label }) => (
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
            <div style={styles.label}>{label}</div>
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
  count: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
};
