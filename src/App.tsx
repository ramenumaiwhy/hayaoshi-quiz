import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useQuiz } from './hooks/useQuiz';
import { useSound } from './hooks/useSound';
import { useHighScore } from './hooks/useHighScore';
import { useChapterProgress } from './hooks/useChapterProgress';
import { useMasterScore } from './hooks/useMasterScore';
import { useUser } from './hooks/useUser';
import { useFriends } from './hooks/useFriends';
import { useBattle } from './hooks/useBattle';
import { QuestionDisplay } from './components/QuestionDisplay';
import { AnswerChoices } from './components/AnswerChoices';
import { ResultDisplay } from './components/ResultDisplay';
import { ScoreDisplay } from './components/ScoreDisplay';
import { CategorySelect } from './components/CategorySelect';
import { ChapterSelect } from './components/ChapterSelect';
import { FriendPanel } from './components/FriendPanel';
import { QuestionCountSelect } from './components/QuestionCountSelect';
import { DifficultySelect } from './components/DifficultySelect';
import { Timer } from './components/Timer';
import { BattleScreen } from './components/BattleScreen';
import generalQuestions from './data/questions.json';
import claudeCodeQuestions from './data/claude-code-questions.json';
import type { Question, Category, Difficulty, ChapterId, QuestionCount, GameSettings, MasterRanking } from './types';

const typedGeneralQuestions = generalQuestions as Question[];
const typedClaudeCodeQuestions = claudeCodeQuestions as Question[];

function App() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [quizKey, setQuizKey] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all' | undefined>(undefined);
  const [showBattle, setShowBattle] = useState(false);

  const category = settings?.category ?? null;
  const mode = settings?.mode ?? 'practice';
  const chapter = settings?.chapter;
  const questionCount = settings?.questionCount;
  const isMasterMode = mode === 'master';

  const questions = useMemo(() => {
    if (category === 'general') {
      if (selectedDifficulty && selectedDifficulty !== 'all') {
        return typedGeneralQuestions.filter((q) => q.difficulty === selectedDifficulty);
      }
      return typedGeneralQuestions;
    }
    if (category === 'claude-code') return typedClaudeCodeQuestions;
    return [];
  }, [category, selectedDifficulty]);

  const quizOptions = useMemo(
    () => ({
      category: category ?? 'general',
      mode,
      chapter,
      questionCount,
    }),
    [category, mode, chapter, questionCount]
  );

  const {
    state,
    currentQuestion,
    answerReading,
    totalQuestions,
    averageTime,
    startQuiz,
    buzz,
    selectChoice,
    nextQuestion,
    restart,
    cancelBuzz,
  } = useQuiz(questions, quizKey, quizOptions);

  const { play } = useSound();
  const { highScore, updateHighScore } = useHighScore(category);
  const { isCleared, markCleared } = useChapterProgress();
  const { user, isLoading: isUserLoading, createUser } = useUser();
  const { friends, addFriend, removeFriend } = useFriends(user?.id ?? null);
  const { battle, createRoom, joinRoom, setReady, reportAnswer, reportFinished, leaveBattle } = useBattle(user);
  const { ranking, bestScore: masterBestScore, checkRankPosition, addToRanking, fetchFriendRanking } =
    useMasterScore();
  const prevPhaseRef = useRef(state.phase);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [pendingRankPosition, setPendingRankPosition] = useState<number | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [friendRanking, setFriendRanking] = useState<MasterRanking>([]);
  const [registerName, setRegisterName] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (prevPhase === 'reading' && state.phase === 'answering') {
      play('buzz');
    } else if (prevPhase === 'answering' && state.phase === 'result') {
      play(state.isCorrect ? 'correct' : 'wrong');
    } else if (prevPhase === 'result' && state.phase === 'finished') {
      if (isMasterMode) {
        const rankPosition = checkRankPosition(state.score, averageTime);
        if (rankPosition !== null) {
          setPendingRankPosition(rankPosition);
          setShowNameInput(true);
          setIsNewRecord(rankPosition === 1);
        } else {
          setIsNewRecord(false);
        }
      } else {
        const newRecord = updateHighScore(state.score, totalQuestions);
        setIsNewRecord(newRecord);

        if (
          category === 'claude-code' &&
          chapter &&
          chapter !== 'all' &&
          state.score === totalQuestions
        ) {
          markCleared(chapter);
        }
      }
    }
  }, [
    state.phase,
    state.isCorrect,
    state.score,
    totalQuestions,
    averageTime,
    play,
    updateHighScore,
    checkRankPosition,
    isMasterMode,
    category,
    chapter,
    markCleared,
  ]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!user || friends.length === 0) {
        setFriendRanking([]);
        return;
      }
      const data = await fetchFriendRanking(friends.map((friend) => friend.userId));
      if (isActive) {
        setFriendRanking(data);
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [user, friends, fetchFriendRanking]);

  const handleBattleStart = useCallback(() => {
    setShowBattle(true);
    setSettings(null);
  }, []);

  const handleLeaveBattle = useCallback(() => {
    leaveBattle();
    setShowBattle(false);
  }, [leaveBattle]);

  const handleCategorySelect = useCallback((selectedCategory: Category) => {
    if (selectedCategory === 'general') {
      setSettings({ category: 'general' });
      setSelectedDifficulty(undefined);
    } else {
      setSettings({ category: 'claude-code' });
    }
    setIsNewRecord(false);
  }, []);

  const handleDifficultySelect = useCallback((difficulty: Difficulty | 'all') => {
    setSelectedDifficulty(difficulty);
    setQuizKey((prev) => prev + 1);
  }, []);

  const handleBackToCategoryFromDifficulty = useCallback(() => {
    setSettings(null);
    setSelectedDifficulty(undefined);
  }, []);

  const handleChapterSelect = useCallback((selectedChapter: ChapterId) => {
    setSettings((prev) => ({
      ...prev!,
      mode: 'practice',
      chapter: selectedChapter,
    }));
  }, []);

  const handleMasterSelect = useCallback(() => {
    setSettings((prev) => ({
      ...prev!,
      mode: 'master',
      chapter: 'all',
      questionCount: undefined,
    }));
    setQuizKey((prev) => prev + 1);
  }, []);

  const handleQuestionCountSelect = useCallback((count: QuestionCount) => {
    setSettings((prev) => ({
      ...prev!,
      questionCount: count,
    }));
    setQuizKey((prev) => prev + 1);
  }, []);

  const handleBackToChapterSelect = useCallback(() => {
    setSettings((prev) => ({
      ...prev!,
      mode: undefined,
      chapter: undefined,
      questionCount: undefined,
    }));
  }, []);

  const handleRestart = useCallback(() => {
    setIsNewRecord(false);
    setPendingRankPosition(null);
    setShowNameInput(false);
    restart();
  }, [restart]);

  const handleBackToCategory = useCallback(() => {
    setSettings(null);
    setSelectedDifficulty(undefined);
    setIsNewRecord(false);
    setPendingRankPosition(null);
    setShowNameInput(false);
  }, []);

  const handleNameSubmit = useCallback(
    async (name: string) => {
      await addToRanking(name, state.score, totalQuestions, averageTime, user?.id);
      setShowNameInput(false);
    },
    [addToRanking, state.score, totalQuestions, averageTime, user]
  );

  const handleRegister = useCallback(async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await createUser(registerName);
      setRegisterName('');
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : '登録に失敗した');
    } finally {
      setIsRegistering(false);
    }
  }, [createUser, registerName, isRegistering]);

  const handleRegisterKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        void handleRegister();
      }
    },
    [handleRegister]
  );

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

  const generalQuestionCounts = useMemo(() => ({
    S: typedGeneralQuestions.filter((q) => q.difficulty === 'S').length,
    A: typedGeneralQuestions.filter((q) => q.difficulty === 'A').length,
    B: typedGeneralQuestions.filter((q) => q.difficulty === 'B').length,
    C: typedGeneralQuestions.filter((q) => q.difficulty === 'C').length,
    all: typedGeneralQuestions.length,
  }), []);

  const isBattleActive = showBattle || battle.phase !== 'idle';

  const categoryLabel = category === 'claude-code' ? 'Claude Code 学習' : '一般クイズ';
  const isGeneralSetupComplete = category === 'general' && selectedDifficulty !== undefined;
  const isClaudeCodeSetupComplete =
    category === 'claude-code' &&
    (isMasterMode || (chapter !== undefined && questionCount !== undefined));
  const isReadyToPlay = isGeneralSetupComplete || isClaudeCodeSetupComplete;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          早押しクイズ
          {isBattleActive && <span style={styles.battleBadge}>⚔️ 対戦</span>}
          {!isBattleActive && category && <span style={styles.categoryBadge}>{categoryLabel}</span>}
          {!isBattleActive && isMasterMode && <span style={styles.masterBadge}>Master</span>}
        </h1>
      </header>

      <main style={styles.main}>
        {isUserLoading && <div style={styles.loadingText}>読み込み中...</div>}

        {!isUserLoading && !user && (
          <div style={styles.registerCard}>
            <div style={styles.registerTitle}>名前を入力してね</div>
            <div style={styles.registerRow}>
              <input
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                onKeyDown={handleRegisterKeyDown}
                placeholder="ニックネーム"
                style={styles.registerInput}
                maxLength={20}
              />
              <button
                onClick={handleRegister}
                style={styles.registerButton}
                disabled={isRegistering || !registerName.trim()}
              >
                始める
              </button>
            </div>
            {registerError && <div style={styles.registerError}>{registerError}</div>}
          </div>
        )}

        {!isUserLoading && user && isBattleActive && (
          <BattleScreen
            battle={battle}
            createRoom={createRoom}
            joinRoom={joinRoom}
            setReady={setReady}
            reportAnswer={reportAnswer}
            reportFinished={reportFinished}
            leaveBattle={handleLeaveBattle}
          />
        )}

        {!isUserLoading && user && !isBattleActive && (
          <>
            {!settings && <CategorySelect onSelect={handleCategorySelect} onBattle={handleBattleStart} />}

            {category === 'general' && selectedDifficulty === undefined && (
              <DifficultySelect
                onSelect={handleDifficultySelect}
                onBack={handleBackToCategoryFromDifficulty}
                questionCounts={generalQuestionCounts}
              />
            )}

            {category === 'claude-code' && !settings?.mode && (
              <>
                <ChapterSelect
                  onSelectChapter={handleChapterSelect}
                  onSelectMaster={handleMasterSelect}
                  onBack={handleBackToCategory}
                  isChapterCleared={isCleared}
                  ranking={ranking}
                />
                <FriendPanel
                  user={user}
                  friends={friends}
                  onAddFriend={addFriend}
                  onRemoveFriend={removeFriend}
                  friendRanking={friendRanking}
                />
              </>
            )}

            {category === 'claude-code' && mode === 'practice' && chapter && !questionCount && (
              <QuestionCountSelect
                chapter={chapter}
                onSelect={handleQuestionCountSelect}
                onBack={handleBackToChapterSelect}
              />
            )}

            {isReadyToPlay && state.phase === 'waiting' && (
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

            {isReadyToPlay &&
              (state.phase === 'reading' || state.phase === 'answering') &&
              currentQuestion && (
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
                        isWordMode={category === 'claude-code'}
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

            {isReadyToPlay && state.phase === 'result' && currentQuestion && (
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

            {isReadyToPlay && state.phase === 'finished' && (
              <ScoreDisplay
                score={state.score}
                totalQuestions={totalQuestions}
                highScore={highScore}
                isNewRecord={isNewRecord}
                onRestart={handleRestart}
                onBackToCategory={handleBackToCategory}
                isMasterMode={isMasterMode}
                averageTime={averageTime}
                masterBestScore={masterBestScore}
                ranking={ranking}
                showNameInput={showNameInput}
                pendingRankPosition={pendingRankPosition}
                onNameSubmit={handleNameSubmit}
              />
            )}
          </>
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
  masterBadge: {
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: 'var(--success)',
    color: 'white',
  },
  battleBadge: {
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  registerCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px 28px',
    borderRadius: '18px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    maxWidth: '420px',
    margin: '48px auto',
  },
  registerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  registerRow: {
    display: 'flex',
    gap: '10px',
  },
  registerInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  registerButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 700,
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: 'white',
    cursor: 'pointer',
  },
  registerError: {
    fontSize: '12px',
    color: 'var(--accent)',
    fontWeight: 600,
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
};

export default App;
