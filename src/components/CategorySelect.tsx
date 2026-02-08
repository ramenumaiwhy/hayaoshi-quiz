import type { Category } from '../types';

type Props = {
  onSelect: (category: Category) => void;
  onBattle: () => void;
};

export const CategorySelect = ({ onSelect, onBattle }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.title}>カテゴリを選択</div>
      <div style={styles.cards}>
        <button
          onClick={() => onSelect('general')}
          style={styles.card}
        >
          <div style={styles.cardIcon}>📚</div>
          <div style={styles.cardTitle}>一般クイズ</div>
          <div style={styles.cardDesc}>
            歴史・言葉・科学など
            <br />
            雑学クイズに挑戦！
          </div>
        </button>
        <button
          onClick={() => onSelect('claude-code')}
          style={{ ...styles.card, ...styles.cardClaude }}
        >
          <div style={styles.cardIcon}>🤖</div>
          <div style={styles.cardTitle}>Claude Code 学習</div>
          <div style={styles.cardDesc}>
            コマンド・ショートカット
            <br />
            ツールの使い方を学ぼう！
          </div>
        </button>
      </div>
      <div style={styles.battleSection}>
        <button onClick={onBattle} style={styles.battleButton}>
          <span style={styles.battleIcon}>⚔️</span>
          <span style={styles.battleLabel}>友達と対戦</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '32px',
    animation: 'fadeIn 0.4s ease-out',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  cards: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 24px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '200px',
    maxWidth: '240px',
  },
  cardClaude: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 20px var(--accent-glow)',
  },
  cardIcon: {
    fontSize: '48px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  cardDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  battleSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  battleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 32px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  battleIcon: {
    fontSize: '24px',
  },
  battleLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
};
