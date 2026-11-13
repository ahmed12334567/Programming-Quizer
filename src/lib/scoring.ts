import type {
  ActiveQuizSession,
  QuestionReviewItem,
  QuizResultSummary,
  UserAnswer,
} from '../types/quiz';

/**
 * Pure evaluation of a single question against a user's answer.
 * Note: For MCQ, userAnswer stores the ORIGINAL option index (or we map from displayed index),
 * making grading invariant to option order.
 */
export function isAnswerCorrect(
  correctAnswer: number | boolean,
  userAnswer: UserAnswer | undefined
): boolean {
  if (userAnswer === undefined) return false;
  return correctAnswer === userAnswer;
}

/**
 * Pure function that scores an ActiveQuizSession and produces a complete QuizResultSummary.
 */
export function gradeQuizSession(
  session: ActiveQuizSession,
  nowTimestamp: number = Date.now()
): QuizResultSummary {
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const flaggedSet = new Set(session.flaggedIds);

  const reviews: QuestionReviewItem[] = session.items.map(({ question, optionOrder }) => {
    const userAnswer = session.answers[question.id];
    const isAnswered = userAnswer !== undefined;
    const isCorrect = isAnswerCorrect(question.answer, userAnswer);

    if (!isAnswered) {
      unansweredCount += 1;
    } else if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    return {
      question,
      optionOrder,
      userAnswer,
      isCorrect,
      isAnswered,
      isFlagged: flaggedSet.has(question.id),
    };
  });

  const totalQuestions = session.items.length;
  const scorePercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercentage >= session.passMark;

  const elapsedMs = Math.max(0, nowTimestamp - session.startedAt);
  const timeTakenSeconds = Math.max(1, Math.round(elapsedMs / 1000));

  return {
    id: session.id,
    studentName: session.config.studentName.trim(),
    quizTitle: session.quizTitle,
    passMark: session.passMark,
    completedAt: new Date(nowTimestamp).toISOString(),
    totalQuestions,
    correctCount,
    wrongCount,
    unansweredCount,
    scorePercentage,
    passed,
    timeTakenSeconds,
    config: session.config,
    reviews,
  };
}

/**
 * Formats seconds into MM:SS or HH:MM:SS (if >= 3600 seconds).
 */
export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
