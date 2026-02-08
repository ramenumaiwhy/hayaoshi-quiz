import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { useSound } from '../hooks/useSound';
import { seededShuffle } from '../hooks/useSeededShuffle';
import { QuestionDisplay } from './QuestionDisplay';
import { AnswerChoices } from './AnswerChoices';
import { ResultDisplay } from './ResultDisplay';
import { Timer } from './Timer';
import { BattleLobby } from './BattleLobby';
import { BattleWaiting } from './BattleWaiting';
import { BattleCountdown } from './BattleCountdown';
import { BattleOverlay } from './BattleOverlay';
import { BattleResult } from './BattleResult';
import generalQuestions from '../data/questions.json';
import claudeCodeQuestions from '../data/claude-code-questions.json';
import type {
  Question,
  BattleState,
  Category,
  Difficulty,
  ChapterId,
} from '../types';

const typedGeneralQuestions = generalQuestions as Question[];
const typedClaudeCodeQuestions = claudeCodeQuestions as Question[];

const BATTLE_QUESTION_COUNT = 10;

type Props = {
  battle: BattleState;
  createRoom: (config: { category: Category; difficulty?: Difficulty | 'all'; chapter?: ChapterId }) => void;
  joinRoom: (code: string) => void;
  setReady: () => void;
  reportAnswer: (questionIndex: number, isCorrect: boolean, answerTime: number) => void;
  reportFinished: () => void;
  leaveBattle: () => void;
};

export const BattleScreen = ({
  battle,
  createRoom,
  joinRoom,
  setReady,
  reportAnswer,
  reportFinished,
  leaveBattle,
}: Props) => {
  const { play } = useSound();

  // バトル設定に基づいて、seededShuffleで問題を生成
  const battleQuestions = useMemo(() => {
    if (!battle.config) return [];

    let pool: Question[];
    if (battle.config.category === 'general') {
      const diff = battle.config.difficulty;
      pool = diff && diff !== 'all'
        ? typedGeneralQuestions.filter((q) => q.difficulty === diff)
        : typedGeneralQuestions;
    } else {
      const ch = battle.config.chapter;
      pool = ch && ch !== 'all'
        ? typedClaudeCodeQuestions.filter((q) => q.chapter === ch)
        : typedClaudeCodeQuestions;
    }

    return seededShuffle(pool, battle.config.seed).slice(0, BATTLE_QUESTION_COUNT);
  }, [battle.config]);

  const quizOptions = useMemo(
    () => ({
      category: battle.config?.category ?? 'general',
      questionCount: BATTLE_QUESTION_COUNT as 10,
      skipShuffle: true,
    }),
    [battle.config?.category]
  );

  const quizKey = battle.config?.seed ?? 0;

  const {
    state,
    currentQuestion,
    answerReading,
    totalQuestions,
    startQuiz,
    buzz,
    selectChoice,
    nextQuestion,
    cancelBuzz,
  } = useQuiz(battleQuestions, quizKey, quizOptions);

  // バトルが playing に遷移したらクイズを自動開始
  const hasStarted = useRef(false);
  useEffect(() => {
    if (battle.phase === 'playing' && state.phase === 'waiting' && !hasStarted.current) {
      hasStarted.current = true;
      startQuiz();
    }
  }, [battle.phase, state.phase, startQuiz]);

  // バトル離脱時にリセット
  useEffect(() => {
    if (battle.phase === 'idle') {
      hasStarted.current = false;
    }
  }, [battle.phase]);

  // 効果音
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (prevPhase === 'reading' && state.phase === 'answering') {
      play('buzz');
    } else if (prevPhase === 'answering' && state.phase === 'result') {
      play(state.isCorrect ? 'correct' : 'wrong');
    }
  }, [state.phase, state.isCorrect, play]);

  // 回答報告: result フェーズに遷移したら
  const lastReportedRef = useRef(-1);
  useEffect(() => {
    if (state.phase === 'result' && state.currentQuestionIndex > lastReportedRef.current) {
      lastReportedRef.current = state.currentQuestionIndex;
      const answerTime = state.answerTimes[state.answerTimes.length - 1] ?? 0;
      reportAnswer(state.currentQuestionIndex, state.isCorrect ?? false, answerTime);
    }
  }, [state.phase, state.currentQuestionIndex, state.isCorrect, state.answerTimes, reportAnswer]);

  // 全問終了報告
  const hasReportedFinished = useRef(false);
  useEffect(() => {
    if (state.phase === 'finished' && !hasReportedFinished.current) {
      hasReportedFinished.current = true;
      reportFinished();
    }
  }, [state.phase, reportFinished]);

  // キーボード操作
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (battle.phase !== 'playing') return;
      if (state.phase === 'reading' && e.code === 'Space') {
        e.preventDefault();
        buzz();
      } else if (state.phase === 'result' && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        nextQuestion();
      }
    },
    [battle.phase, state.phase, buzz, nextQuestion]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isClaudeCode = battle.config?.category === 'claude-code';

  // Lobby（idle = 初期表示、lobby = ルーム作成後まだゲスト未参加）
  if (battle.phase === 'idle') {
    return <BattleLobby onCreateRoom={createRoom} onJoinRoom={joinRoom} onBack={leaveBattle} />;
  }

  // Waiting（ホスト: ルーム作成後ゲスト待ち、ゲスト: 参加後ホストのスタート待ち）
  if (battle.phase === 'lobby' || battle.phase === 'waiting') {
    return <BattleWaiting battle={battle} onReady={setReady} onLeave={leaveBattle} />;
  }

  // Countdown
  if (battle.phase === 'countdown') {
    return <BattleCountdown value={battle.countdownValue ?? 3} />;
  }

  // Battle finished
  if (battle.phase === 'finished') {
    return (
      <BattleResult
        me={battle.me!}
        opponent={battle.opponent}
        totalQuestions={totalQuestions || BATTLE_QUESTION_COUNT}
        onLeave={leaveBattle}
      />
    );
  }

  // Playing
  return (
    <div>
      {battle.me && (
        <BattleOverlay
          me={battle.me}
          opponent={battle.opponent}
          totalQuestions={totalQuestions || BATTLE_QUESTION_COUNT}
        />
      )}

      {(state.phase === 'reading' || state.phase === 'answering') && currentQuestion && (
        <>
          <Timer isRunning={true} startTime={state.questionStartTime} />
          <QuestionDisplay
            text={state.displayedText}
            questionNumber={state.currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
          />
          {state.phase === 'reading' && (
            <div style={styles.buzzContainer}>
              <button onClick={buzz} style={styles.buzzButton}>
                早押し！
              </button>
            </div>
          )}
          {state.phase === 'answering' && (
            <>
              <AnswerChoices
                choices={state.choices}
                currentAnswer={state.userAnswer}
                onSelect={selectChoice}
                isWordMode={isClaudeCode}
              />
              <div style={styles.cancelContainer}>
                <button onClick={cancelBuzz} style={styles.cancelButton}>
                  再開
                </button>
              </div>
            </>
          )}
        </>
      )}

      {state.phase === 'result' && currentQuestion && (
        <>
          <QuestionDisplay
            text={currentQuestion.text}
            questionNumber={state.currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
          />
          <ResultDisplay
            isCorrect={state.isCorrect!}
            correctAnswer={currentQuestion.answer}
            answerReading={answerReading}
            userAnswer={state.userAnswer}
            explanation={currentQuestion.explanation}
          />
          <div style={styles.nextContainer}>
            <button onClick={nextQuestion} style={styles.nextButton}>
              {state.currentQuestionIndex + 1 >= totalQuestions ? '結果へ' : '次の問題へ'}
            </button>
          </div>
        </>
      )}

      {state.phase === 'waiting' && (
        <div style={styles.loadingText}>問題を準備中...</div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  buzzContainer: {
    textAlign: 'center',
    padding: '32px',
  },
  buzzButton: {
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '32px 48px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: '0 0 30px var(--accent-glow)',
    animation: 'pulse 1.5s ease-in-out infinite',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    minHeight: '160px',
  },
  nextContainer: {
    textAlign: 'center',
    marginTop: '24px',
  },
  nextButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    padding: '16px 40px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cancelContainer: {
    textAlign: 'center',
    marginTop: '16px',
  },
  cancelButton: {
    fontSize: '14px',
    padding: '8px 20px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '16px',
    color: 'var(--text-secondary)',
    padding: '48px 0',
  },
};
