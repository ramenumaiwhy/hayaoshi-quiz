import { useState } from 'react';
import type { Category, Difficulty, GeneralGenre, ChapterId } from '../types';

type Props = {
  onCreateRoom: (config: { category: Category; genre?: GeneralGenre | 'all'; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => void;
  onJoinRoom: (code: string) => void;
  onBack: () => void;
};

type LobbyStep = 'choose' | 'create_category' | 'create_general_genre' | 'create_general' | 'create_claude' | 'join';

export const BattleLobby = ({ onCreateRoom, onJoinRoom, onBack }: Props) => {
  const [step, setStep] = useState<LobbyStep>('choose');
  const [joinCode, setJoinCode] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<GeneralGenre | 'all'>('all');

  if (step === 'create_category') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setStep('choose')} style={styles.backButton}>← 戻る</button>
          <div style={styles.title}>テーマを選択</div>
        </div>
        <div style={styles.cards}>
          <button onClick={() => setStep('create_general_genre')} style={styles.card}>
            <div style={styles.cardIcon}>📚</div>
            <div style={styles.cardTitle}>一般クイズ</div>
          </button>
          <button onClick={() => setStep('create_claude')} style={styles.card}>
            <div style={styles.cardIcon}>🤖</div>
            <div style={styles.cardTitle}>Claude Code</div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create_general_genre') {
    const genres: { key: GeneralGenre | 'all'; emoji: string; label: string }[] = [
      { key: 'language', emoji: '📝', label: 'ことば' },
      { key: 'history', emoji: '🏛️', label: '歴史' },
      { key: 'science', emoji: '🔬', label: '科学・自然' },
      { key: 'entertainment', emoji: '🎬', label: 'エンタメ' },
      { key: 'sports', emoji: '⚽', label: 'スポーツ' },
      { key: 'food', emoji: '🍽️', label: '食べ物' },
      { key: 'all', emoji: '🌈', label: '全ジャンル' },
    ];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setStep('create_category')} style={styles.backButton}>← 戻る</button>
          <div style={styles.title}>ジャンルを選択</div>
        </div>
        <div style={styles.list}>
          {genres.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => { setSelectedGenre(key); setStep('create_general'); }}
              style={styles.listItem}
            >
              <span style={styles.listEmoji}>{emoji}</span>
              <span style={styles.listLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'create_general') {
    const difficulties: { key: Difficulty | 'all'; emoji: string; label: string }[] = [
      { key: 'C', emoji: '🟢', label: 'やさしい' },
      { key: 'B', emoji: '🟡', label: 'ふつう' },
      { key: 'A', emoji: '🔴', label: 'むずかしい' },
      { key: 'S', emoji: '⚫', label: '超難問' },
      { key: 'all', emoji: '🌈', label: '全難易度' },
    ];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setStep('create_general_genre')} style={styles.backButton}>← 戻る</button>
          <div style={styles.title}>難易度を選択</div>
        </div>
        <div style={styles.list}>
          {difficulties.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => onCreateRoom({ category: 'general', genre: selectedGenre, difficulty: key })}
              style={styles.listItem}
            >
              <span style={styles.listEmoji}>{emoji}</span>
              <span style={styles.listLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'create_claude') {
    const chapters: { key: ChapterId; label: string }[] = [
      { key: '1-1', label: 'スラッシュコマンド' },
      { key: '1-2', label: 'ショートカット' },
      { key: '1-3', label: 'ツール' },
      { key: '2-1', label: 'MCP' },
      { key: '2-2', label: 'Hooks' },
      { key: '2-3', label: 'メモリ管理' },
      { key: '3-1', label: 'プラグイン開発' },
      { key: '3-2', label: 'カスタム設定' },
      { key: '3-3', label: 'Agent SDK' },
      { key: 'all', label: '全チャプター' },
    ];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setStep('create_category')} style={styles.backButton}>← 戻る</button>
          <div style={styles.title}>チャプターを選択</div>
        </div>
        <div style={styles.list}>
          {chapters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onCreateRoom({ category: 'claude-code', chapter: key })}
              style={styles.listItem}
            >
              <span style={styles.listLabel}>{key === 'all' ? '🌈 ' : `${key} `}{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => setStep('choose')} style={styles.backButton}>← 戻る</button>
          <div style={styles.title}>ルームに参加</div>
        </div>
        <div style={styles.joinCard}>
          <div style={styles.joinLabel}>ルームコードを入力</div>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="例: ABC123"
            style={styles.joinInput}
            maxLength={6}
            autoFocus
          />
          <button
            onClick={() => joinCode.trim().length === 6 && onJoinRoom(joinCode.trim())}
            style={{
              ...styles.joinButton,
              ...(joinCode.trim().length !== 6 ? styles.joinButtonDisabled : {}),
            }}
            disabled={joinCode.trim().length !== 6}
          >
            参加する
          </button>
        </div>
      </div>
    );
  }

  // step === 'choose'
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← 戻る</button>
        <div style={styles.title}>⚔️ 対戦モード</div>
      </div>
      <div style={styles.cards}>
        <button onClick={() => setStep('create_category')} style={styles.card}>
          <div style={styles.cardIcon}>🏠</div>
          <div style={styles.cardTitle}>ルームを作る</div>
          <div style={styles.cardDesc}>テーマを選んで友達を待つ</div>
        </button>
        <button onClick={() => setStep('join')} style={styles.card}>
          <div style={styles.cardIcon}>🚪</div>
          <div style={styles.cardTitle}>ルームに参加</div>
          <div style={styles.cardDesc}>コードを入力して参加</div>
        </button>
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  listEmoji: {
    fontSize: '20px',
  },
  listLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  joinCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px 28px',
    borderRadius: '18px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    maxWidth: '420px',
    margin: '0 auto',
  },
  joinLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  joinInput: {
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '24px',
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '0.3em',
    outline: 'none',
  },
  joinButton: {
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: 700,
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  joinButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};
