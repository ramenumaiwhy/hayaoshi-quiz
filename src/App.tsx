import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useQuiz } from './hooks/useQuiz';
import { useSound } from './hooks/useSound';
import { useHighScore } from './hooks/useHighScore';
import { QuestionDisplay } from './components/QuestionDisplay';
import { AnswerChoices } from './components/AnswerChoices';
import { ResultDisplay } from './components/ResultDisplay';
import { ScoreDisplay } from './components/ScoreDisplay';
import { CategorySelect } from './components/CategorySelect';
import generalQuestions from './data/questions.json';
import claudeCodeQuestions from './data/claude-code-questions.json';
import type { Question, Category } from './types';

const typedGeneralQuestions = generalQuestions as Question[];
const typedClaudeCodeQuestions = claudeCodeQuestions as Question[];

function App() {
  const [category, setCategory] = useState<Category | null>(null);
  const [quizKey, setQuizKey] = useState(0);

  const questions = useMemo(() => {
    if (category === 'general') return typedGeneralQuestions;
    if (category === 'claude-code') return typedClaudeCodeQuestions;
    return [];
  }, [category]);

  const {
    state,
    currentQuestion,
    answerReading,
    totalQuestions,
    startQuiz,
    buzz,
    selectChoice,
    nextQuestion,
    restart,
  } = useQuiz(questions, quizKey);

  const { play } = useSound();
  const { highScore, updateHighScore } = useHighScore(category);
  const prevPhaseRef = useRef(state.phase);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (prevPhase === 'reading' && state.phase === 'answering') {
      play('buzz');
    } else if (prevPhase === 'answering' && state.phase === 'result') {
      play(state.isCorrect ? 'correct' : 'wrong');
    } else if (prevPhase === 'result' && state.phase === 'finished') {
      const newRecord = updateHighScore(state.score, totalQuestions);
      setIsNewRecord(newRecord);
    }
  }, [state.phase, state.isCorrect, state.score, totalQuestions, play, updateHighScore]);

  const handleCategorySelect = useCallback((selectedCategory: Category) => {
    setCategory(selectedCategory);
    setQuizKey((prev) => prev + 1);
    setIsNewRecord(false);
  }, []);

  const handleRestart = useCallback(() => {
    setIsNewRecord(false);
    restart();
  }, [restart]);

  const handleBackToCategory = useCallback(() => {
    setCategory(null);
    setIsNewRecord(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state.phase === 'waiting' && e.code === 'Space') {
        e.preventDefault();
        startQuiz();
      } else if (state.phase === 'reading' && e.code === 'Space') {
        e.preventDefault();
        buzz();
      } else if (state.phase === 'result' && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        nextQuestion();
      } else if (state.phase === 'finished' && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleRestart();
      }
    },
    [state.phase, startQuiz, buzz, nextQuestion, handleRestart]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const categoryLabel = category === 'claude-code' ? 'Claude Code 学習' : '一般クイズ';

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          早押しクイズ
          {category && <span style={styles.categoryBadge}>{categoryLabel}</span>}
        </h1>
      </header>

      <main style={styles.main}>
        {!category && <CategorySelect onSelect={handleCategorySelect} />}

        {category && state.phase === 'waiting' && (
          <div style={styles.startScreen}>
            <button onClick={startQuiz} style={styles.startButton}>
              スタート
            </button>
            <div style={styles.hint}>またはスペースキー</div>
            <button onClick={handleBackToCategory} style={styles.backButton}>
              ← カテゴリ選択に戻る
            </button>
          </div>
        )}

        {category &&
          (state.phase === 'reading' || state.phase === 'answering') &&
          currentQuestion && (
            <>
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
                <AnswerChoices
                  choices={state.choices}
                  currentAnswer={state.userAnswer}
                  onSelect={selectChoice}
                />
              )}
            </>
          )}

        {category && state.phase === 'result' && currentQuestion && (
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
            />
            <div style={styles.nextContainer}>
              <button onClick={nextQuestion} style={styles.nextButton}>
                次の問題へ
              </button>
            </div>
          </>
        )}

        {category && state.phase === 'finished' && (
          <ScoreDisplay
            score={state.score}
            totalQuestions={totalQuestions}
            highScore={highScore}
            isNewRecord={isNewRecord}
            onRestart={handleRestart}
            onBackToCategory={handleBackToCategory}
          />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categoryBadge: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: 'var(--accent)',
    color: 'white',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  },
  startScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '24px',
  },
  startButton: {
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '24px 56px',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    boxShadow: '0 4px 24px var(--accent-glow)',
    transition: 'all 0.2s ease',
    animation: 'pulse 2s ease-in-out infinite',
  },
  hint: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  backButton: {
    fontSize: '14px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
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
};

export default App;
