type Props = {
  value: number;
};

export const BattleCountdown = ({ value }: Props) => {
  return (
    <div style={styles.container}>
      <div style={styles.label}>対戦開始</div>
      <div style={styles.number} key={value}>
        {value}
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
    gap: '24px',
    animation: 'fadeIn 0.3s ease-out',
  },
  label: {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
  },
  number: {
    fontSize: '120px',
    fontWeight: 700,
    color: 'var(--accent)',
    lineHeight: 1,
    animation: 'pulse 1s ease-in-out',
  },
};
