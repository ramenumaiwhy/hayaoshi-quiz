import { useState, useEffect } from 'react';

type Props = {
  isRunning: boolean;
  startTime: number | null;
};

export const Timer = ({ isRunning, startTime }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (time: number) => {
    return time.toFixed(2);
  };

  if (!isRunning) return null;

  return (
    <div style={styles.container}>
      <div style={styles.time}>{formatTime(elapsed)}</div>
      <div style={styles.label}>秒</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '16px',
  },
  time: {
    fontSize: '32px',
    fontWeight: 900,
    color: 'var(--accent)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
    minWidth: '80px',
    textAlign: 'right',
  },
  label: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
};
