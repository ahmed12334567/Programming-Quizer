import type { PreparedQuestion, Question } from '../types/quiz';

/**
 * Pure Fisher-Yates (Knuth) shuffle.
 * Returns a new shuffled array in O(n) time without mutating the input array.
 * Never uses Array.prototype.sort(() => Math.random() - 0.5).
 */
export function fisherYatesShuffle<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

/**
 * Prepares the selected pool of questions for an active attempt,
 * applying optional question order shuffling and MCQ option shuffling.
 */
export function prepareQuizQuestions(
  pool: readonly Question[],
  count: number,
  shuffleQuestions: boolean,
  shuffleOptions: boolean,
  rng: () => number = Math.random
): PreparedQuestion[] {
  const orderedQuestions = shuffleQuestions
    ? fisherYatesShuffle(pool, rng).slice(0, count)
    : pool.slice(0, count);

  return orderedQuestions.map((question) => {
    if (question.type === 'mcq') {
      const indices = question.options.map((_, idx) => idx);
      return {
        question,
        optionOrder: shuffleOptions ? fisherYatesShuffle(indices, rng) : indices,
      };
    }
    return {
      question,
      optionOrder: [],
    };
  });
}
