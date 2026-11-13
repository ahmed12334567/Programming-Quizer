export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'true_false';
export type AllowedQuestionCount = number;
export type TimerMode = 'total' | 'per_question';

export interface BaseQuestion {
  id: string;
  question: string;
  code?: string;
  explanation?: string;
  category?: string;
  difficulty?: Difficulty;
  unit?: string;
  unit_key?: string;
  unit_number?: number;
  section?: string;
  answerText?: string;
}

export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[];
  answer: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  options?: string[];
  answer: boolean;
}

export type Question = McqQuestion | TrueFalseQuestion;

export interface QuestionBank {
  title: string;
  passMark: number;
  defaultTimerPerQuestion?: number;
  questions: Question[];
}

export interface ValidationIssueDetail {
  questionIndex: number | null;
  questionId: string | null;
  field: string;
  message: string;
}

export interface PreparedQuestion {
  question: Question;
  /**
   * For MCQ questions when shuffleOptions is enabled:
   * optionOrder[displayedIndex] = originalOptionIndex
   */
  optionOrder: number[];
}

export type UserAnswer = number | boolean;

export interface QuizConfig {
  studentName: string;
  count: AllowedQuestionCount;
  unit?: string; // legacy single unit support
  selectedUnits?: string[]; // multiple selected units
  category: string; // 'all' or specific category
  difficulty: 'all' | Difficulty;
  timerMode: TimerMode;
  totalMinutes: number;
  perQuestionSeconds: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface ActiveQuizSession {
  id: string;
  quizTitle: string;
  passMark: number;
  config: QuizConfig;
  items: PreparedQuestion[];
  answers: Record<string, UserAnswer>;
  flaggedIds: string[];
  currentIndex: number;
  startedAt: number;
  endTimestamp: number;
  questionEndTimestamp: number | null;
}

export interface QuestionReviewItem {
  question: Question;
  optionOrder: number[];
  userAnswer: UserAnswer | undefined;
  isCorrect: boolean;
  isAnswered: boolean;
  isFlagged: boolean;
}

export interface QuizResultSummary {
  id: string;
  studentName: string;
  quizTitle: string;
  passMark: number;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  config: QuizConfig;
  reviews: QuestionReviewItem[];
}

export interface AdminCredentialsConfig {
  email: string;
  passwordHash: string;
  name: string;
}

export interface AdminSession {
  email: string;
  name: string;
  uid: string;
  isAdmin: boolean;
  loggedInAt: string;
}
