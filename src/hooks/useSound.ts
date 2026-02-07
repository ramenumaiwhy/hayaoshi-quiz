import { useRef, useCallback } from 'react';

type SoundType = 'buzz' | 'correct' | 'wrong';

export const useSound = () => {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      const ctx = getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [getContext]
  );

  const play = useCallback(
    (sound: SoundType) => {
      switch (sound) {
        case 'buzz':
          // 早押し音: 短い高音ビープ
          playTone(880, 0.1, 'square');
          break;
        case 'correct':
          // 正解音: 上昇する2音
          playTone(523, 0.15, 'sine'); // C5
          setTimeout(() => playTone(659, 0.2, 'sine'), 100); // E5
          break;
        case 'wrong':
          // 不正解音: 低い音
          playTone(200, 0.3, 'sawtooth');
          break;
      }
    },
    [playTone]
  );

  return { play };
};
