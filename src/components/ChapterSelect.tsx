import type { ChapterId, MasterRanking } from '../types';
import { CHAPTERS } from '../data/chapters';

type Props = {
  onSelectChapter: (chapter: ChapterId) => void;
  onSelectMaster: () => void;
  onBack: () => void;
  isChapterCleared: (chapter: ChapterId) => boolean;
  ranking?: MasterRanking;
};

export const ChapterSelect = ({
  onSelectChapter,
  onSelectMaster,
  onBack,
  isChapterCleared,
  ranking = [],
}: Props) => {
  const formatTime = (time: number) => time.toFixed(2);
  const phase1Chapters = CHAPTERS.filter((c) => c.phase === 1);
  const phase2Chapters = CHAPTERS.filter((c) => c.phase === 2);
  const phase3Chapters = CHAPTERS.filter((c) => c.phase === 3);
  const allChapter = CHAPTERS.find((c) => c.id === 'all')!;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← 戻る
        </button>
        <div style={styles.title}>モードを選択</div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>🎯 マスターモード</div>
        <div style={styles.sectionDesc}>30問・タイム計測・ハイスコア挑戦</div>
        <button onClick={onSelectMaster} style={styles.masterButton}>
          <div style={styles.masterTitle}>⚡ 挑戦する</div>
          <div style={styles.masterDesc}>正解数 × 平均回答秒数で競う</div>
        </button>
        {ranking.length > 0 && (
          <div style={styles.rankingCard}>
            <div style={styles.rankingLabel}>🏆 ランキング</div>
            <div style={styles.rankingList}>
              {ranking.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.rankingRow,
                    backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                  }}
                >
                  <span style={styles.rankNumber}>{index + 1}</span>
                  <span style={styles.rankName}>{entry.name}</span>
                  <span style={styles.rankScore}>
                    {entry.score}/{entry.totalQuestions}
                  </span>
                  <span style={styles.rankTime}>{formatTime(entry.averageTime)}秒</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.divider}>または</div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>📚 練習モード</div>
        <div style={styles.sectionDesc}>Chapter を選んで練習</div>

        <div style={styles.phaseTitle}>Phase 1: 基本操作</div>
        <div style={styles.chapters}>
          {phase1Chapters.map((chapter) => {
            const cleared = isChapterCleared(chapter.id);
            return (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  ...styles.chapterCard,
                  ...(cleared ? styles.clearedCard : {}),
                }}
              >
                {cleared && <div style={styles.clearedBadge}>Cleared!</div>}
                <div style={styles.chapterId}>{chapter.id}</div>
                <div style={styles.chapterTitle}>{chapter.title}</div>
              </button>
            );
          })}
        </div>

        <div style={styles.phaseTitle}>Phase 2: 中級操作</div>
        <div style={styles.chapters}>
          {phase2Chapters.map((chapter) => {
            const cleared = isChapterCleared(chapter.id);
            return (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  ...styles.chapterCard,
                  ...(cleared ? styles.clearedCard : {}),
                }}
              >
                {cleared && <div style={styles.clearedBadge}>Cleared!</div>}
                <div style={styles.chapterId}>{chapter.id}</div>
                <div style={styles.chapterTitle}>{chapter.title}</div>
              </button>
            );
          })}
        </div>

        <div style={styles.phaseTitle}>Phase 3: 上級・開発者向け</div>
        <div style={styles.chapters}>
          {phase3Chapters.map((chapter) => {
            const cleared = isChapterCleared(chapter.id);
            return (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                style={{
                  ...styles.chapterCard,
                  ...(cleared ? styles.clearedCard : {}),
                }}
              >
                {cleared && <div style={styles.clearedBadge}>Cleared!</div>}
                <div style={styles.chapterId}>{chapter.id}</div>
                <div style={styles.chapterTitle}>{chapter.title}</div>
              </button>
            );
          })}
        </div>

        <div style={styles.allContainer}>
          <button
            onClick={() => onSelectChapter(allChapter.id)}
            style={{ ...styles.chapterCard, ...styles.allCard }}
          >
            <div style={styles.chapterTitle}>{allChapter.title}</div>
            <div style={styles.allDesc}>全問題からランダム出題</div>
          </button>
        </div>
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  sectionDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  masterButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px 32px',
    backgroundColor: 'var(--accent)',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 24px var(--accent-glow)',
  },
  masterTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'white',
  },
  masterDesc: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  divider: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-muted)',
    position: 'relative',
  },
  phaseTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: '8px',
  },
  chapters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  chapterCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '20px 28px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px',
    position: 'relative',
  },
  clearedCard: {
    borderColor: 'var(--success)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  clearedBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 8px',
    backgroundColor: 'var(--success)',
    color: 'white',
    borderRadius: '8px',
  },
  chapterId: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-glow)',
    padding: '3px 10px',
    borderRadius: '10px',
  },
  chapterTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  allContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px',
  },
  allCard: {
    minWidth: '180px',
  },
  allDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  rankingCard: {
    marginTop: '12px',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '10px',
    border: '1px solid var(--border)',
  },
  rankingLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  rankingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: '6px',
  },
  rankNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--accent)',
    width: '20px',
  },
  rankName: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1,
  },
  rankScore: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  rankTime: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    width: '50px',
    textAlign: 'right',
  },
};
