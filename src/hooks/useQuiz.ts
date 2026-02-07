import { useState, useEffect, useCallback, useRef } from 'react';
import type { Question, QuizState } from '../types';

const CHAR_INTERVAL_MS = 80;
const QUESTIONS_PER_GAME = 10;

// ひらがな/カタカナ判定（拗音・促音・長音を含む）
const isHiragana = (str: string): boolean => /^[\u3041-\u3096\u30FC]+$/.test(str);
const isKatakana = (str: string): boolean => /^[\u30A1-\u30FC]+$/.test(str);
const isKanaOnly = (str: string): boolean => isHiragana(str) || isKatakana(str);

// 正解の読みを取得（文字種を保持）
const getAnswerReading = (question: Question): string => {
  const { answer, alternativeAnswers } = question;

  if (isKanaOnly(answer)) return answer;

  if (alternativeAnswers) {
    for (const alt of alternativeAnswers) {
      if (isKanaOnly(alt)) return alt;
    }
  }

  return answer;
};

// 文字種に応じたダミー文字プールを取得
const getCharPool = (char: string): string => {
  if (/[\u3041-\u3096]/.test(char)) {
    return 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっー';
  }
  return 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッー';
};

const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateChoices = (correctChar: string): string[] => {
  const pool = getCharPool(correctChar);
  const dummyChars = new Set<string>();

  while (dummyChars.size < 3) {
    const randomChar = pool[Math.floor(Math.random() * pool.length)];
    if (randomChar !== correctChar) {
      dummyChars.add(randomChar);
    }
  }

  return shuffle([correctChar, ...dummyChars]);
};

type UseQuizReturn = {
  state: QuizState;
  currentQuestion: Question | null;
  answerReading: string;
  totalQuestions: number;
  startQuiz: () => void;
  buzz: () => void;
  selectChoice: (char: string) => void;
  nextQuestion: () => void;
  restart: () => void;
};

const createInitialState = (): QuizState => ({
  phase: 'waiting',
  currentQuestionIndex: 0,
  displayedText: '',
  userAnswer: '',
  isCorrect: null,
  currentCharIndex: 0,
  choices: [],
  score: 0,
});

export const useQuiz = (questions: Question[], key = 0): UseQuizReturn => {
  const [shuffledQuestions, setShuffledQuestions] = useState(() =>
    shuffle(questions).slice(0, QUESTIONS_PER_GAME)
  );

  // key または questions が変わったら再初期化
  useEffect(() => {
    setShuffledQuestions(shuffle(questions).slice(0, QUESTIONS_PER_GAME));
    setState(createInitialState());
  }, [key, questions]);
  const [state, setState] = useState<QuizState>(createInitialState);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = shuffledQuestions[state.currentQuestionIndex] ?? null;
  const answerReading = currentQuestion ? getAnswerReading(currentQuestion) : '';

  // 1文字ずつ表示するタイマー
  useEffect(() => {
    if (state.phase !== 'reading' || !currentQuestion) {
      return;
    }

    const fullText = currentQuestion.text;
    let charIndex = state.displayedText.length;

    intervalRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= fullText.length) {
        setState((prev) => ({
          ...prev,
          displayedText: fullText.slice(0, charIndex),
        }));
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.phase, currentQuestion, state.displayedText.length]);

  // 最初の1問目をスタート
  const startQuiz = useCallback(() => {
    if (state.phase !== 'waiting') return;
    setState((prev) => ({
      ...prev,
      phase: 'reading',
      displayedText: '',
    }));
  }, [state.phase]);

  const buzz = useCallback(() => {
    if (state.phase !== 'reading') return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const reading = currentQuestion ? getAnswerReading(currentQuestion) : '';
    const firstChar = reading[0] || '';
    setState((prev) => ({
      ...prev,
      phase: 'answering',
      currentCharIndex: 0,
      userAnswer: '',
      choices: firstChar ? generateChoices(firstChar) : [],
    }));
  }, [state.phase, currentQuestion]);

  const selectChoice = useCallback(
    (char: string) => {
      if (state.phase !== 'answering' || !currentQuestion) return;

      const reading = getAnswerReading(currentQuestion);
      const correctChar = reading[state.currentCharIndex];

      if (char === correctChar) {
        const newAnswer = state.userAnswer + char;
        const nextIndex = state.currentCharIndex + 1;

        if (nextIndex >= reading.length) {
          setState((prev) => ({
            ...prev,
            phase: 'result',
            userAnswer: newAnswer,
            isCorrect: true,
            score: prev.score + 1,
          }));
        } else {
          const nextChar = reading[nextIndex];
          setState((prev) => ({
            ...prev,
            currentCharIndex: nextIndex,
            userAnswer: newAnswer,
            choices: generateChoices(nextChar),
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          phase: 'result',
          userAnswer: prev.userAnswer + char,
          isCorrect: false,
        }));
      }
    },
    [state.phase, state.currentCharIndex, state.userAnswer, currentQuestion]
  );

  // 次の問題へ（即座にreadingに遷移）
  const nextQuestion = useCallback(() => {
    if (state.phase !== 'result') return;

    const nextIndex = state.currentQuestionIndex + 1;
    const isFinished = nextIndex >= shuffledQuestions.length;

    if (isFinished) {
      setState((prev) => ({
        ...prev,
        phase: 'finished',
      }));
    } else {
      setState((prev) => ({
        ...prev,
        phase: 'reading',
        currentQuestionIndex: nextIndex,
        displayedText: '',
        userAnswer: '',
        isCorrect: null,
        currentCharIndex: 0,
        choices: [],
      }));
    }
  }, [state.phase, state.currentQuestionIndex, shuffledQuestions.length]);

  // 最初からやり直し
  const restart = useCallback(() => {
    setShuffledQuestions(shuffle(questions).slice(0, QUESTIONS_PER_GAME));
    setState(createInitialState());
  }, [questions]);

  return {
    state,
    currentQuestion,
    answerReading,
    totalQuestions: shuffledQuestions.length,
    startQuiz,
    buzz,
    selectChoice,
    nextQuestion,
    restart,
  };
};
