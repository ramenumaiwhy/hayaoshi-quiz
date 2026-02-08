import { useState, useEffect, useCallback, useRef } from 'react';
import type { Question, QuizState, Category, ChapterId, QuestionCount, GameMode } from '../types';

const CHAR_INTERVAL_MS = 80;
const DEFAULT_QUESTION_COUNT = 10;
const MASTER_MODE_QUESTION_COUNT = 30;

const isHiragana = (str: string): boolean => /^[\u3041-\u3096\u30FC]+$/.test(str);
const isKatakana = (str: string): boolean => /^[\u30A1-\u30FC]+$/.test(str);
const isKanaOnly = (str: string): boolean => isHiragana(str) || isKatakana(str);

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

const SIMILAR_GROUPS: string[][] = [
  ['Grep', 'Glob', 'Read', 'Write', 'Edit'],
  ['WebFetch', 'WebSearch'],
  ['Task', 'AskUserQuestion'],
  ['/clear', '/compact', '/context', '/config', '/cost', '/copy'],
  ['/resume', '/rename'],
  ['/tasks', '/todos', '/theme'],
  ['/plan', '/permissions'],
  ['/help', '/history'],
  ['/model', '/mcp'],
  ['/init', '/install'],
  ['/export', '/exit'],
  ['/stats', '/status'],
  ['Ctrl+C', 'Ctrl+D', 'Ctrl+L', 'Ctrl+G', 'Ctrl+B', 'Ctrl+T'],
  ['Shift+Tab', 'Esc×2'],
  ['.mcp.json', '~/.claude.json', 'CLAUDE.md', '.claudeignore', '.claude/settings.json'],
  ['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart', 'UserPromptSubmit', 'SubagentStop', 'PreCompact'],
  ['stdio', 'sse', 'streamable-http'],
  ['claude mcp add', 'claude mcp list', 'claude mcp remove'],
  ['/compact', '/context', '/cost', '/memory'],
  ['Model Context Protocol', 'Model Control Protocol', 'Machine Context Protocol'],
  ['自動コンパクション', '自動コミット', '自動保存'],
  ['skills', 'commands', 'agents', 'hooks', 'plugins'],
  ['plugin.json', 'package.json', 'tsconfig.json', '.claude/settings.json'],
  ['${CLAUDE_PLUGIN_ROOT}', '${HOME}', '${CLAUDE_HOME}'],
  ['allowedTools', 'blockedTools', 'allowedCommands'],
  ['--model', '--print', '--resume', '--system-prompt', '--output-format json'],
  ['@anthropic-ai/claude-code-sdk', '@anthropic-ai/sdk', '@supabase/supabase-js'],
  ['prompt', 'permissions', 'cwd', 'model'],
  ['.claude/plugins/', '.claude/settings.json', '.claude/plugin-name.local.md'],
  ['AsyncIterator', 'Promise', 'Observable', 'EventEmitter'],
  ['tool_result', 'text', 'error', 'assistant'],
  ['ラッパーCLI', 'プロセス分離', 'プロジェクト設定'],
  ['YAML frontmatter', 'JSON schema', 'TOML header'],
  ['Bash(command:*)', 'Read(*)', 'Write(*)'],
];

const getSimilarAnswers = (answer: string): string[] => {
  for (const group of SIMILAR_GROUPS) {
    if (group.includes(answer)) {
      return group.filter((a) => a !== answer);
    }
  }
  return [];
};

const generateCharChoices = (correctChar: string): string[] => {
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

const generateWordChoices = (
  correctAnswer: string,
  allQuestions: Question[],
  currentQuestion: Question
): string[] => {
  const dummyAnswers: string[] = [];

  const similarAnswers = getSimilarAnswers(correctAnswer);
  const shuffledSimilar = shuffle(similarAnswers);
  for (const ans of shuffledSimilar) {
    if (dummyAnswers.length >= 3) break;
    if (!dummyAnswers.includes(ans)) dummyAnswers.push(ans);
  }

  const sameGenreAnswers = allQuestions
    .filter((q) => q.genre === currentQuestion.genre && q.answer !== correctAnswer)
    .map((q) => q.answer);
  const shuffledSameGenre = shuffle(sameGenreAnswers);
  for (const ans of shuffledSameGenre) {
    if (dummyAnswers.length >= 3) break;
    if (!dummyAnswers.includes(ans)) dummyAnswers.push(ans);
  }

  const otherAnswers = allQuestions
    .filter((q) => q.genre !== currentQuestion.genre && q.answer !== correctAnswer)
    .map((q) => q.answer);
  const shuffledOther = shuffle(otherAnswers);
  for (const ans of shuffledOther) {
    if (dummyAnswers.length >= 3) break;
    if (!dummyAnswers.includes(ans)) dummyAnswers.push(ans);
  }

  return shuffle([correctAnswer, ...dummyAnswers]);
};

type UseQuizReturn = {
  state: QuizState;
  currentQuestion: Question | null;
  answerReading: string;
  totalQuestions: number;
  averageTime: number;
  startQuiz: () => void;
  buzz: () => void;
  selectChoice: (choice: string) => void;
  nextQuestion: () => void;
  restart: () => void;
  cancelBuzz: () => void;
};

type UseQuizOptions = {
  category: Category;
  mode?: GameMode;
  chapter?: ChapterId;
  questionCount?: QuestionCount;
  skipShuffle?: boolean;
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
  answerTimes: [],
  currentAnswerStartTime: null,
  questionStartTime: null,
});

export const useQuiz = (
  questions: Question[],
  key = 0,
  options: UseQuizOptions = { category: 'general' }
): UseQuizReturn => {
  const { category, mode, chapter, questionCount, skipShuffle } = options;
  const isClaudeCode = category === 'claude-code';
  const isMasterMode = mode === 'master';

  const getFilteredQuestions = useCallback(() => {
    let filtered = questions;

    if (isClaudeCode && chapter && chapter !== 'all') {
      filtered = questions.filter((q) => q.chapter === chapter);
    }

    let count: number;
    if (isMasterMode) {
      count = Math.min(MASTER_MODE_QUESTION_COUNT, filtered.length);
    } else if (questionCount === 'all') {
      count = filtered.length;
    } else {
      count = questionCount ?? DEFAULT_QUESTION_COUNT;
    }

    return skipShuffle ? filtered.slice(0, count) : shuffle(filtered).slice(0, count);
  }, [questions, isClaudeCode, isMasterMode, chapter, questionCount, skipShuffle]);

  const [shuffledQuestions, setShuffledQuestions] = useState(getFilteredQuestions);
  const [state, setState] = useState<QuizState>(createInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setShuffledQuestions(getFilteredQuestions());
    setState(createInitialState());
  }, [key, getFilteredQuestions]);

  const currentQuestion = shuffledQuestions[state.currentQuestionIndex] ?? null;
  const answerReading = currentQuestion ? getAnswerReading(currentQuestion) : '';

  const averageTime =
    state.answerTimes.length > 0
      ? state.answerTimes.reduce((a, b) => a + b, 0) / state.answerTimes.length
      : 0;

  useEffect(() => {
    if (state.phase !== 'reading' || !currentQuestion) return;

    const fullText = currentQuestion.text;
    let charIndex = state.displayedText.length;

    intervalRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= fullText.length) {
        setState((prev) => ({
          ...prev,
          displayedText: fullText.slice(0, charIndex),
        }));
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, CHAR_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.phase, currentQuestion, state.displayedText.length]);

  const startQuiz = useCallback(() => {
    if (state.phase !== 'waiting') return;
    setState((prev) => ({
      ...prev,
      phase: 'reading',
      displayedText: '',
      questionStartTime: Date.now(),
    }));
  }, [state.phase]);

  const buzz = useCallback(() => {
    if (state.phase !== 'reading' || !currentQuestion) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    let choices: string[];
    if (isClaudeCode) {
      choices = generateWordChoices(currentQuestion.answer, questions, currentQuestion);
    } else {
      const reading = getAnswerReading(currentQuestion);
      const firstChar = reading[0] || '';
      choices = firstChar ? generateCharChoices(firstChar) : [];
    }

    setState((prev) => ({
      ...prev,
      phase: 'answering',
      currentCharIndex: 0,
      userAnswer: '',
      choices,
      currentAnswerStartTime: Date.now(),
    }));
  }, [state.phase, currentQuestion, isClaudeCode, questions]);

  const selectChoice = useCallback(
    (choice: string) => {
      if (state.phase !== 'answering' || !currentQuestion) return;

      const answerTime = state.currentAnswerStartTime
        ? (Date.now() - state.currentAnswerStartTime) / 1000
        : 0;

      if (isClaudeCode) {
        const isCorrect = choice === currentQuestion.answer;
        setState((prev) => ({
          ...prev,
          phase: 'result',
          userAnswer: choice,
          isCorrect,
          score: isCorrect ? prev.score + 1 : prev.score,
          answerTimes: isCorrect ? [...prev.answerTimes, answerTime] : prev.answerTimes,
          currentAnswerStartTime: null,
        }));
      } else {
        const reading = getAnswerReading(currentQuestion);
        const correctChar = reading[state.currentCharIndex];

        if (choice === correctChar) {
          const newAnswer = state.userAnswer + choice;
          const nextIndex = state.currentCharIndex + 1;

          if (nextIndex >= reading.length) {
            setState((prev) => ({
              ...prev,
              phase: 'result',
              userAnswer: newAnswer,
              isCorrect: true,
              score: prev.score + 1,
              answerTimes: [...prev.answerTimes, answerTime],
              currentAnswerStartTime: null,
            }));
          } else {
            const nextChar = reading[nextIndex];
            setState((prev) => ({
              ...prev,
              currentCharIndex: nextIndex,
              userAnswer: newAnswer,
              choices: generateCharChoices(nextChar),
            }));
          }
        } else {
          setState((prev) => ({
            ...prev,
            phase: 'result',
            userAnswer: prev.userAnswer + choice,
            isCorrect: false,
            currentAnswerStartTime: null,
          }));
        }
      }
    },
    [state.phase, state.currentCharIndex, state.userAnswer, state.currentAnswerStartTime, currentQuestion, isClaudeCode]
  );

  const nextQuestion = useCallback(() => {
    if (state.phase !== 'result') return;

    const nextIndex = state.currentQuestionIndex + 1;
    const isFinished = nextIndex >= shuffledQuestions.length;

    if (isFinished) {
      setState((prev) => ({ ...prev, phase: 'finished' }));
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
        currentAnswerStartTime: null,
        questionStartTime: Date.now(),
      }));
    }
  }, [state.phase, state.currentQuestionIndex, shuffledQuestions.length]);

  const restart = useCallback(() => {
    setShuffledQuestions(getFilteredQuestions());
    setState(createInitialState());
  }, [getFilteredQuestions]);

  const cancelBuzz = useCallback(() => {
    if (state.phase !== 'answering') return;
    setState((prev) => ({
      ...prev,
      phase: 'reading',
      userAnswer: '',
      currentCharIndex: 0,
      currentAnswerStartTime: null,
    }));
  }, [state.phase]);

  return {
    state,
    currentQuestion,
    answerReading,
    totalQuestions: shuffledQuestions.length,
    averageTime,
    startQuiz,
    buzz,
    selectChoice,
    nextQuestion,
    restart,
    cancelBuzz,
  };
};
