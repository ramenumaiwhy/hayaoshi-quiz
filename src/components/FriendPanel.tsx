import { useState } from 'react';
import type { Friend, MasterRanking, User } from '../types';

type Props = {
  user: User;
  friends: Friend[];
  onAddFriend: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveFriend: (friendUserId: string) => void;
  friendRanking: MasterRanking;
};

const formatFriendId = (friendId: string) => {
  if (friendId.length !== 6) return friendId;
  return `${friendId.slice(0, 3)}-${friendId.slice(3)}`;
};

export const FriendPanel = ({
  user,
  friends,
  onAddFriend,
  onRemoveFriend,
  friendRanking,
}: Props) => {
  const [friendCode, setFriendCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatFriendId(user.friendId));
      setStatusMessage('フレンドIDをコピーした');
      setStatusType('success');
    } catch {
      setStatusMessage('コピーに失敗した');
      setStatusType('error');
    }
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim()) return;
    setIsSubmitting(true);
    const result = await onAddFriend(friendCode);
    setIsSubmitting(false);

    if (result.success) {
      setFriendCode('');
      setStatusMessage('フレンドを追加した');
      setStatusType('success');
      return;
    }

    setStatusMessage(result.error ?? '追加に失敗した');
    setStatusType('error');
  };

  const formatTime = (time: number) => time.toFixed(2);

  return (
    <div style={styles.container}>
      <div style={styles.header}>🤝 フレンド</div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>自分のフレンドID</div>
        <div style={styles.friendIdRow}>
          <div style={styles.friendIdBox}>{formatFriendId(user.friendId)}</div>
          <button onClick={handleCopy} style={styles.copyButton}>
            コピー
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>フレンドを追加</div>
        <div style={styles.addRow}>
          <input
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
            placeholder="フレンドID"
            style={styles.input}
            maxLength={8}
          />
          <button
            onClick={handleAddFriend}
            style={styles.addButton}
            disabled={isSubmitting || !friendCode.trim()}
          >
            追加
          </button>
        </div>
        {statusMessage && (
          <div
            style={{
              ...styles.statusMessage,
              color: statusType === 'error' ? 'var(--accent)' : 'var(--success)',
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>フレンド一覧</div>
        {friends.length === 0 ? (
          <div style={styles.emptyText}>まだフレンドがいない</div>
        ) : (
          <div style={styles.friendList}>
            {friends.map((friend) => (
              <div key={friend.id} style={styles.friendRow}>
                <div style={styles.friendInfo}>
                  <div style={styles.friendName}>{friend.displayName}</div>
                  <div style={styles.friendIdText}>{formatFriendId(friend.friendId)}</div>
                </div>
                <button
                  onClick={() => onRemoveFriend(friend.userId)}
                  style={styles.removeButton}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>フレンドのベストスコア</div>
        {friendRanking.length === 0 ? (
          <div style={styles.emptyText}>まだスコアがない</div>
        ) : (
          <div style={styles.rankingList}>
            {friendRanking.map((entry, index) => (
              <div key={`${entry.name}-${index}`} style={styles.rankingRow}>
                <span style={styles.rankNumber}>{index + 1}</span>
                <span style={styles.rankName}>{entry.name}</span>
                <span style={styles.rankScore}>
                  {entry.score}/{entry.totalQuestions}
                </span>
                <span style={styles.rankTime}>{formatTime(entry.averageTime)}秒</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '24px',
    padding: '20px 24px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  friendIdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  friendIdBox: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: 'var(--text-primary)',
    padding: '10px 16px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  },
  copyButton: {
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 700,
    borderRadius: '10px',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  addRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  addButton: {
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 700,
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: 'white',
    cursor: 'pointer',
  },
  statusMessage: {
    fontSize: '12px',
    fontWeight: 600,
  },
  friendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  friendRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
  },
  friendInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  friendName: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  friendIdText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    letterSpacing: '0.12em',
  },
  removeButton: {
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  emptyText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  rankingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
  },
  rankNumber: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--accent)',
    width: '20px',
  },
  rankName: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    flex: 1,
  },
  rankScore: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  rankTime: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    width: '60px',
    textAlign: 'right',
  },
};
