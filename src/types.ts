export type Genre =
  | 'language'      // 言葉・ことわざ
  | 'entertainment' // 漫画・アニメ・映画
  | 'food'          // 食べ物
  | 'history'       // 日本史・世界史
  | 'science'       // 生き物・自然科学
  | 'sports'        // スポーツ
  | 'slash-command' // Claude Code: スラッシュコマンド
  | 'shortcut'      // Claude Code: キーボードショートカット
  | 'tool'          // Claude Code: 基本ツール
  | 'mcp'           // Claude Code: MCP サーバー設定
  | 'hooks'         // Claude Code: Hooks
  | 'memory'        // Claude Code: メモリ・コンテキスト管理
  | 'plugin'        // Claude Code: プラグイン開発
  | 'settings'      // Claude Code: カスタム設定
  | 'agent-sdk';    // Claude Code: Agent SDK

export type GeneralGenre = 'language' | 'entertainment' | 'food' | 'history' | 'science' | 'sports';

export type ClaudeCodeGenre = 'slash-command' | 'shortcut' | 'tool' | 'mcp' | 'hooks' | 'memory' | 'plugin' | 'settings' | 'agent-sdk';

export type Category = 'general' | 'claude-code';

export type Difficulty = 'S' | 'A' | 'B' | 'C';

export type ChapterId = '1-1' | '1-2' | '1-3' | '2-1' | '2-2' | '2-3' | '3-1' | '3-2' | '3-3' | 'all';

export type Chapter = {
  id: ChapterId;
  title: string;
  phase: number;
  genre: ClaudeCodeGenre | null;
};

export type QuestionCount = 10 | 20 | 'all';

export type GameMode = 'practice' | 'master';

export type Question = {
  id: string;
  text: string;
  answer: string;
  alternativeAnswers?: string[];
  explanation?: string;
  genre: Genre;
  difficulty: Difficulty;
  chapter?: ChapterId;
};

export type GameSettings = {
  category: Category;
  mode?: GameMode;
  chapter?: ChapterId;
  questionCount?: QuestionCount;
};

export type Phase = 'waiting' | 'reading' | 'answering' | 'result' | 'finished';

export type QuizState = {
  phase: Phase;
  currentQuestionIndex: number;
  displayedText: string;
  userAnswer: string;
  isCorrect: boolean | null;
  currentCharIndex: number;
  choices: string[];
  score: number;
  answerTimes: number[];
  currentAnswerStartTime: number | null;
  questionStartTime: number | null;
};

export type MasterScore = {
  name: string;
  score: number;
  totalQuestions: number;
  averageTime: number;
  date: string;
};

export type MasterRanking = MasterScore[];

export type User = {
  id: string;
  friendId: string;
  displayName: string;
};

export type Friend = {
  id: string;
  userId: string;
  displayName: string;
  friendId: string;
};

// Battle types

export type BattlePhase =
  | 'idle'
  | 'lobby'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'finished';

export type BattleRole = 'host' | 'guest';

export type BattleRoomConfig = {
  category: Category;
  genre?: GeneralGenre | 'all';
  difficulty?: Difficulty | 'all';
  chapter?: ChapterId;
  seed: number;
};

export type BattlePlayer = {
  userId: string;
  displayName: string;
  score: number;
  currentQuestion: number;
  finished: boolean;
  answerTimes: number[];
};

export type BattleState = {
  phase: BattlePhase;
  role: BattleRole | null;
  roomCode: string | null;
  config: BattleRoomConfig | null;
  me: BattlePlayer | null;
  opponent: BattlePlayer | null;
  countdownValue: number | null;
};
