/**
 * ひらがなをカタカナに変換
 */
const hiraganaToKatakana = (str: string): string =>
  str.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );

/**
 * 全角英数字を半角に変換
 */
const fullWidthToHalfWidth = (str: string): string =>
  str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );

/**
 * 回答文字列を正規化
 * - 空白・句読点を除去
 * - ひらがな→カタカナ変換
 * - 全角英数字→半角変換
 * - 小文字化
 */
export const normalizeAnswer = (answer: string): string => {
  let normalized = answer;
  normalized = normalized.replace(/[\s\u3000・、。,.!?！？]/g, ''); // 空白・句読点除去
  normalized = hiraganaToKatakana(normalized);
  normalized = fullWidthToHalfWidth(normalized);
  normalized = normalized.toLowerCase();
  return normalized;
};

/**
 * ユーザーの回答が正解かどうかを判定
 */
export const checkAnswer = (
  userAnswer: string,
  correctAnswer: string,
  alternativeAnswers?: string[]
): boolean => {
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  if (alternativeAnswers) {
    return alternativeAnswers.some(
      (alt) => normalizeAnswer(alt) === normalizedUser
    );
  }

  return false;
};
