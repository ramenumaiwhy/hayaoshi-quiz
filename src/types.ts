export type Genre =
  | 'language'      // 言葉・ことわざ
  | 'entertainment' // 漫画・アニメ・映画
  | 'food'          // 食べ物
  | 'history'       // 日本史・世界史
  | 'science'       // 生き物・自然科学
  | 'sports';       // スポーツ

export type Difficulty = 'S' | 'A' | 'B' | 'C';

export type Question = {
  id: string;
  text: string;
  answer: string;
  alternativeAnswers?: string[];
  genre: Genre;
  difficulty: Difficulty;
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
  score: number; // 正解数
};
