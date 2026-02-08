import { useMemo } from 'react';

// mulberry32: 高品質32ビットPRNG。同じseedから同じ乱数列を生成するため、対戦時に問題順序を通信なしで同期できる
const mulberry32 = (seed: number): (() => number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededShuffle = <T,>(array: T[], seed: number): T[] => {
  const arr = [...array];
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const generateSeed = (): number =>
  Math.floor(Math.random() * 0xffffffff);

export const useSeededShuffle = <T,>(array: T[], seed: number | null): T[] =>
  useMemo(
    () => (seed !== null ? seededShuffle(array, seed) : array),
    [array, seed]
  );
