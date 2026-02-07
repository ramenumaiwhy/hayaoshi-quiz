/**
 * AI王データセット変換スクリプト
 *
 * AI王（クイズAI日本一決定戦）のデータセットをhayaoshi-quiz形式に変換
 * データソース: https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json
 * ライセンス: CC BY-SA 4.0
 *
 * 使い方:
 *   curl -O https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json
 *   bun scripts/convert-aio.ts train_questions.json --limit=100
 */

import { readFileSync, writeFileSync } from 'fs';
import type { Question, Genre, Difficulty } from '../src/types';

// AI王のデータ形式
type AioQuestion = {
  qid: string;
  question: string;
  answer_entity: string;
  answer_candidates?: string[];
};

const GENRE_KEYWORDS: Record<Genre, string[]> = {
  language: ['ことわざ', '四字熟語', '慣用句', '言葉', '漢字', '俳句', '短歌', '文学', '小説', '作家'],
  entertainment: ['漫画', 'アニメ', '映画', 'ドラマ', '音楽', 'ゲーム', '芸能', '歌手', 'バンド', 'アイドル'],
  food: ['料理', '食べ物', '野菜', '果物', '飲み物', '酒', 'スイーツ', '魚', '肉', 'ラーメン'],
  history: ['歴史', '戦国', '江戸', '明治', '昭和', '平成', '天皇', '武将', '幕府', '戦争', '革命'],
  science: ['元素', '化学', '物理', '生物', '動物', '植物', '宇宙', '星', '惑星', '数学', '医学'],
  sports: ['野球', 'サッカー', 'オリンピック', 'スポーツ', '柔道', '相撲', 'テニス', 'ゴルフ', 'ボクシング'],
};

const guessGenre = (question: string): Genre => {
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((kw) => question.includes(kw))) {
      return genre as Genre;
    }
  }
  return 'language';
};

const guessDifficulty = (question: string): Difficulty => {
  const length = question.length;
  if (length > 100) return 'A';
  if (length > 70) return 'B';
  return 'C';
};

// ひらがな/カタカナかどうか判定
const isKana = (str: string): boolean => /^[\u3041-\u3096\u30A1-\u30FC]+$/.test(str);

// 漢字を含むかどうか
const hasKanji = (str: string): boolean => /[\u4E00-\u9FAF]/.test(str);

const convert = (inputPath: string, outputPath: string, limit?: number) => {
  const content = readFileSync(inputPath, 'utf-8');
  const lines = content.trim().split('\n');

  const questions: Question[] = [];

  for (const line of lines) {
    if (limit && questions.length >= limit) break;

    try {
      const aio: AioQuestion = JSON.parse(line);

      if (!aio.question || !aio.answer_entity) continue;

      const answer = aio.answer_entity;

      // ひらがな/カタカナの読みがなければ、漢字を含む答えはスキップ
      // （4択UIでひらがな/カタカナが必要なため）
      if (hasKanji(answer) && !isKana(answer)) {
        // TODO: 将来的にはふりがな辞書を使って読みを生成
        continue;
      }

      const question: Question = {
        id: aio.qid || `aio-${questions.length + 1}`,
        text: aio.question,
        answer: answer,
        genre: guessGenre(aio.question),
        difficulty: guessDifficulty(aio.question),
      };

      questions.push(question);
    } catch {
      console.error(`Failed to parse: ${line.slice(0, 50)}...`);
    }
  }

  writeFileSync(outputPath, JSON.stringify(questions, null, 2));
  console.log(`Converted ${questions.length} questions to ${outputPath}`);
};

// CLI
const [inputPath] = process.argv.slice(2);

if (!inputPath) {
  console.log('Usage: bun scripts/convert-aio.ts <input.json> [--limit=100]');
  console.log('');
  console.log('Example:');
  console.log('  curl -O https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json');
  console.log('  bun scripts/convert-aio.ts train_questions.json --limit=100');
  process.exit(1);
}

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

convert(inputPath, 'src/data/questions.json', limit);
