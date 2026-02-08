import type { QuestionCount, ChapterId } from '../types';
import { CHAPTERS } from '../data/chapters';
import claudeCodeQuestions from '../data/claude-code-questions.json';
import type { Question } from '../types';

type Props = {
  chapter: ChapterId;
  onSelect: (count: QuestionCount) => void;
  onBack: () => void;
};

const typedQuestions = claudeCodeQuestions as Question[];

export const QuestionCountSelect = ({ chapter, onSelect, onBack }: Props) => {
  const chapterData = CHAPTERS.find((c) => c.id === chapter);
  const chapterTitle = chapterData?.title ?? chapter;

  const availableCount =
    chapter === 'all'
      ? typedQuestions.length
      : typedQuestions.filter((q) => q.chapter === chapter).length;

  const options: { count: QuestionCount; label: string; disabled: boolean }[] = [
    { count: 10, label: '10問', disabled: availableCount < 10 },
    { count: 20, label: '20問', disabled: availableCount < 20 },
    { count: 'all', label: `全問 (${availableCount}問)`, disabled: false },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
        <div style={styles.title}>問題数を選択</div>
      </div>

      <div style={styles.chapterBadge}>{chapterTitle}</div>

      <div style={styles.options}>
        {options.map(({ count, label, disabled }) => (
          <button
            key={count}
            onClick={() => !disabled && onSelect(count)}
            style={{
              ...styles.optionCard,
              ...(disabled ? styles.disabled : {}),
            }}
            disabled={disabled}
          >
            <div style={styles.optionLabel}>{label}</div>
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
    alignItems: 'center',
    gap: '32px',
    animation: 'fadeIn 0.4s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
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
  chapterBadge: {
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    backgroundColor: 'var(--accent-glow)',
    color: 'var(--accent)',
    borderRadius: '16px',
  },
  options: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 40px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px',
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  optionLabel: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
};
