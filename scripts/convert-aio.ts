/**
 * AI王データセット変換スクリプト
 *
 * AI王（クイズAI日本一決定戦）のデータセットをhayaoshi-quiz形式に変換
 * データソース: https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json
 * ライセンス: CC BY-SA 4.0
 *
 * 使い方:
 *   curl -O https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json
 *   bun scripts/convert-aio.ts train_questions.json
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import type { Question, Genre, Difficulty } from '../src/types';

// kuromoji を動的にインポート（CommonJS モジュール）
// @ts-expect-error kuromoji has no type declarations
import kuromoji from 'kuromoji';

type AioQuestion = {
  qid: string;
  question: string;
  answer_entity: string;
  answer_candidates?: string[];
  original_answer?: string;
};

type KuromojiToken = {
  reading: string;
  surface_form: string;
};

type KuromojiTokenizer = {
  tokenize: (text: string) => KuromojiToken[];
};

const GENRE_KEYWORDS: Partial<Record<Genre, string[]>> = {
  language: ['ことわざ', '四字熟語', '慣用句', '言葉', '漢字', '俳句', '短歌', '文学', '小説', '作家'],
  entertainment: ['漫画', 'アニメ', '映画', 'ドラマ', '音楽', 'ゲーム', '芸能', '歌手', 'バンド', 'アイドル'],
  food: ['料理', '食べ物', '野菜', '果物', '飲み物', '酒', 'スイーツ', '魚', '肉', 'ラーメン'],
  history: ['歴史', '戦国', '江戸', '明治', '昭和', '平成', '天皇', '武将', '幕府', '戦争', '革命'],
  science: ['元素', '化学', '物理', '生物', '動物', '植物', '宇宙', '星', '惑星', '数学', '医学'],
  sports: ['野球', 'サッカー', 'オリンピック', 'スポーツ', '柔道', '相撲', 'テニス', 'ゴルフ', 'ボクシング'],
};

const guessGenre = (question: string): Genre => {
  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords!.some((kw: string) => question.includes(kw))) {
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

const hasKanji = (str: string): boolean => /[\u4E00-\u9FAF]/.test(str);

// カタカナ→ひらがな変換
const katakanaToHiragana = (str: string): string =>
  str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

// kuromoji で漢字→カタカナ読みを取得
const toReading = (tokenizer: KuromojiTokenizer, text: string): string => {
  const tokens = tokenizer.tokenize(text);
  return tokens.map((t: KuromojiToken) => t.reading || t.surface_form).join('');
};

// kuromoji tokenizer を初期化
const initTokenizer = (): Promise<KuromojiTokenizer> =>
  new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.join('node_modules', 'kuromoji', 'dict') })
      .build((err: Error | null, tokenizer: KuromojiTokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
  });

const convert = async (inputPath: string, outputPath: string, limit?: number) => {
  console.log('kuromoji 辞書を読み込み中...');
  const tokenizer = await initTokenizer();
  console.log('辞書読み込み完了');

  const content = readFileSync(inputPath, 'utf-8');
  const lines = content.trim().split('\n');

  const questions: Question[] = [];
  let skipped = 0;

  for (const line of lines) {
    if (limit && questions.length >= limit) break;

    try {
      const aio: AioQuestion = JSON.parse(line);

      if (!aio.question || !aio.answer_entity) continue;

      const answer = aio.answer_entity;
      const alternativeAnswers: string[] = [];

      if (hasKanji(answer)) {
        // kuromoji でカタカナ読みを生成
        const katakana = toReading(tokenizer, answer);
        const hiragana = katakanaToHiragana(katakana);

        // 読みが元の文字列と同じ（変換できなかった）場合はスキップ
        if (katakana === answer) {
          skipped++;
          continue;
        }

        alternativeAnswers.push(katakana);
        if (hiragana !== katakana) {
          alternativeAnswers.push(hiragana);
        }
      }

      // original_answer が answer_entity と異なる場合、alternativeAnswers に追加
      if (aio.original_answer && aio.original_answer !== answer && !alternativeAnswers.includes(aio.original_answer)) {
        alternativeAnswers.push(aio.original_answer);
      }

      const question: Question = {
        id: aio.qid || `aio-${questions.length + 1}`,
        text: aio.question,
        answer,
        ...(alternativeAnswers.length > 0 ? { alternativeAnswers } : {}),
        genre: guessGenre(aio.question),
        difficulty: guessDifficulty(aio.question),
      };

      questions.push(question);
    } catch {
      console.error(`Failed to parse: ${line.slice(0, 50)}...`);
    }
  }

  writeFileSync(outputPath, JSON.stringify(questions, null, 2));
  console.log(`Converted ${questions.length} questions (skipped ${skipped}) to ${outputPath}`);
};

// CLI
const [inputPath] = process.argv.slice(2);

if (!inputPath) {
  console.log('Usage: bun scripts/convert-aio.ts <input.json> [--limit=100]');
  console.log('');
  console.log('Example:');
  console.log('  curl -O https://jaqket.s3.ap-northeast-1.amazonaws.com/data/aio_01/train_questions.json');
  console.log('  bun scripts/convert-aio.ts train_questions.json');
  process.exit(1);
}

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

convert(inputPath, 'src/data/questions.json', limit);
