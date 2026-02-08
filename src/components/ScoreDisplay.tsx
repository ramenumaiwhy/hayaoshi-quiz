import { useState } from 'react';
import type { MasterScore, MasterRanking } from '../types';

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
  onBackToCategory?: () => void;
  isMasterMode?: boolean;
  averageTime?: number;
  masterBestScore?: MasterScore | null;
  ranking?: MasterRanking;
  showNameInput?: boolean;
  pendingRankPosition?: number | null;
  onNameSubmit?: (name: string) => void;
};

export const ScoreDisplay = ({
  score,
  totalQuestions,
  highScore,
  isNewRecord,
  onRestart,
  onBackToCategory,
  isMasterMode = false,
  averageTime = 0,
  ranking = [],
  showNameInput = false,
  pendingRankPosition = null,
  onNameSubmit,
}: Props) => {
  void isNewRecord;
  const [nameInput, setNameInput] = useState('');
  const percentage = Math.round((score / totalQuestions) * 100);

  const getMessage = () => {
    if (pendingRankPosition === 1) return '🎊 1位おめでとう！';
    if (pendingRankPosition !== null && pendingRankPosition <= 3) return '🎉 ランクイン！';
    if (pendingRankPosition !== null) return '👏 Top5入り！';
    if (percentage === 100) return '🏆 完璧！';
    if (percentage >= 80) return '🎉 すごい！';
    if (percentage >= 60) return '👍 いい調子！';
    if (percentage >= 40) return '💪 もう少し！';
    return '📚 がんばろう！';
  };

  const formatTime = (time: number) => time.toFixed(2);

  const handleSubmitName = () => {
    if (nameInput.trim() && onNameSubmit) {
      onNameSubmit(nameInput.trim());
      setNameInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        {isMasterMode ? '⚡ マスターモード結果' : '結果発表'}
      </div>

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

        {isMasterMode && (
          <div style={styles.timeSection}>
            <div style={styles.timeLabel}>平均回答時間</div>
            <div style={styles.timeValue}>
              {averageTime > 0 ? `${formatTime(averageTime)} 秒` : '- 秒'}
            </div>
          </div>
        )}

        <div style={styles.message}>{getMessage()}</div>
      </div>

      {showNameInput && pendingRankPosition !== null && (
        <div style={styles.nameInputCard}>
          <div style={styles.rankAnnounce}>
            🏆 {pendingRankPosition}位にランクイン！
          </div>
          <div style={styles.nameInputLabel}>名前を入力してください</div>
          <div style={styles.nameInputRow}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="名前"
              style={styles.nameInput}
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleSubmitName}
              style={styles.nameSubmitButton}
              disabled={!nameInput.trim()}
            >
              登録
            </button>
          </div>
        </div>
      )}

      {isMasterMode && ranking.length > 0 && !showNameInput && (
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

      {!isMasterMode && highScore && (
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

      {!showNameInput && (
        <>
          <button onClick={onRestart} style={styles.restartButton}>
            もう一度挑戦
          </button>
          {onBackToCategory && (
            <button onClick={onBackToCategory} style={styles.backButton}>
              ← カテゴリ選択に戻る
            </button>
          )}
        </>
      )}
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
  timeSection: {
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '12px',
  },
  timeLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  timeValue: {
    fontSize: '28px',
    fontWeight: 900,
    color: 'var(--accent)',
  },
  message: {
    fontSize: '24px',
    color: 'var(--text-secondary)',
  },
  nameInputCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '2px solid var(--accent)',
  },
  rankAnnounce: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--accent)',
    marginBottom: '12px',
  },
  nameInputLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  nameInputRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  nameInput: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    width: '200px',
    outline: 'none',
  },
  nameSubmitButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 700,
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  rankingCard: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '12px',
    padding: '16px 20px',
    marginBottom: '24px',
    border: '1px solid var(--border)',
  },
  rankingLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rankingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  rankNumber: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent)',
    width: '24px',
  },
  rankName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    flex: 1,
    textAlign: 'left',
  },
  rankScore: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  rankTime: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    width: '60px',
    textAlign: 'right',
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
  backButton: {
    display: 'block',
    margin: '16px auto 0',
    fontSize: '14px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};
