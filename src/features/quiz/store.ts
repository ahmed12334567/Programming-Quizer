import { create } from 'zustand';
import type {
  ActiveQuizSession,
  Question,
  QuestionBank,
  QuizConfig,
  QuizResultSummary,
  UserAnswer,
  ValidationIssueDetail,
} from '../../types/quiz';
import {
  safeGetLocal,
  safeRemoveLocal,
  safeSetLocal,
  STORAGE_KEYS,
} from '../../lib/storage';
import { prepareQuizQuestions } from '../../lib/shuffle';
import { gradeQuizSession } from '../../lib/scoring';
import { loadQuestionBank, setCachedBank } from '../../lib/loadQuestions';
import { questionsService, type QuizSettings } from '../admin/questionsService';
import { validateQuestionBankJson } from '../../lib/questionSchema';

export interface QuizAppState {
  bank: QuestionBank | null;
  isLoadingBank: boolean;
  isSavingBank: boolean;
  isFallbackMode: boolean;
  fallbackNotice: string | null;
  saveError: string | null;
  saveSuccessNotice: string | null;
  validationSummary: string | null;
  validationIssues: ValidationIssueDetail[];

  studentName: string;
  activeSession: ActiveQuizSession | null;
  lastResult: QuizResultSummary | null;
  attemptHistory: QuizResultSummary[];

  initializeApp: (forceRefresh?: boolean) => Promise<void>;
  loadFallbackQuestions: () => Promise<void>;
  clearSaveNotice: () => void;
  setStudentName: (name: string) => void;
  startQuiz: (config: QuizConfig, customPool?: readonly Question[]) => void;
  selectAnswer: (questionId: string, answer: UserAnswer) => void;
  toggleFlag: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitQuiz: () => QuizResultSummary | null;
  discardActiveQuiz: () => void;
  clearHistory: () => void;

  // Admin Firestore granular actions
  saveQuestion: (question: Question) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  saveSettings: (settings: QuizSettings) => Promise<void>;
  updateBank: (nextBank: QuestionBank) => Promise<void>;
}

const isValidSession = (val: unknown): val is ActiveQuizSession => {
  if (!val || typeof val !== 'object') return false;
  const s = val as Partial<ActiveQuizSession>;
  return (
    typeof s.id === 'string' &&
    Array.isArray(s.items) &&
    s.items.length > 0 &&
    typeof s.endTimestamp === 'number' &&
    typeof s.currentIndex === 'number'
  );
};

export const useQuizStore = create<QuizAppState>((set, get) => ({
  bank: null,
  isLoadingBank: true,
  isSavingBank: false,
  isFallbackMode: false,
  fallbackNotice: null,
  saveError: null,
  saveSuccessNotice: null,
  validationSummary: null,
  validationIssues: [],

  studentName: safeGetLocal<string>(STORAGE_KEYS.STUDENT_NAME, ''),
  activeSession: safeGetLocal<ActiveQuizSession | null>(
    STORAGE_KEYS.ACTIVE_QUIZ,
    null,
    isValidSession
  ),
  lastResult: null,
  attemptHistory: safeGetLocal<QuizResultSummary[]>(
    STORAGE_KEYS.ATTEMPT_HISTORY,
    []
  ),

  clearSaveNotice: () => set({ saveError: null, saveSuccessNotice: null }),

  initializeApp: async (forceRefresh = false) => {
    set({ isLoadingBank: true, validationSummary: null, validationIssues: [] });
    try {
      const { result, isFallback, fallbackNotice } =
        await loadQuestionBank(forceRefresh);
      if (result.ok) {
        set({
          bank: result.data,
          isFallbackMode: isFallback,
          fallbackNotice: fallbackNotice ?? null,
          isLoadingBank: false,
          validationSummary: null,
          validationIssues: [],
        });
      } else {
        set({
          bank: null,
          isFallbackMode: false,
          fallbackNotice: null,
          isLoadingBank: false,
          validationSummary: result.summary,
          validationIssues: result.issues,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected initialization error';
      set({
        bank: null,
        isFallbackMode: false,
        fallbackNotice: null,
        isLoadingBank: false,
        validationSummary: message,
        validationIssues: [
          {
            questionIndex: null,
            questionId: null,
            field: 'init',
            message,
          },
        ],
      });
    }
  },

  loadFallbackQuestions: async () => {
    set({ isLoadingBank: true, validationSummary: null, validationIssues: [] });
    try {
      const baseUrl = import.meta.env.BASE_URL || './';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const res = await fetch(`${normalizedBase}questions.json`);
      if (!res.ok) {
        throw new Error(`Failed to load fallback questions.json (HTTP ${res.status})`);
      }
      const raw = await res.text();
      const validation = validateQuestionBankJson(raw);
      if (validation.ok) {
        setCachedBank(validation.data);
        set({
          bank: validation.data,
          isFallbackMode: true,
          fallbackNotice: 'Loaded from local questions.json',
          isLoadingBank: false,
          validationSummary: null,
          validationIssues: [],
        });
      } else {
        set({
          bank: null,
          isLoadingBank: false,
          validationSummary: validation.summary,
          validationIssues: validation.issues,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load fallback questions.json';
      set({
        bank: null,
        isLoadingBank: false,
        validationSummary: message,
        validationIssues: [
          {
            questionIndex: null,
            questionId: null,
            field: 'fallback',
            message,
          },
        ],
      });
    }
  },

  setStudentName: (name: string) => {
    safeSetLocal(STORAGE_KEYS.STUDENT_NAME, name);
    set({ studentName: name });
  },

  startQuiz: (config: QuizConfig, customPool?: readonly Question[]) => {
    const { bank } = get();
    if (!bank) return;

    const basePool =
      customPool ??
      bank.questions.filter((q) => {
        const matchUnit =
          config.selectedUnits && config.selectedUnits.length > 0
            ? Boolean(q.unit && config.selectedUnits.includes(q.unit))
            : !config.unit || config.unit === 'all' || q.unit === config.unit;
        const matchCat =
          config.category === 'all' || q.category === config.category;
        const matchDiff =
          config.difficulty === 'all' || q.difficulty === config.difficulty;
        return matchUnit && matchCat && matchDiff;
      });

    const targetCount = customPool
      ? customPool.length
      : Math.min(config.count, basePool.length);

    const items = prepareQuizQuestions(
      basePool,
      targetCount,
      config.shuffleQuestions,
      config.shuffleOptions
    );

    const now = Date.now();
    const totalSeconds =
      config.timerMode === 'total'
        ? Math.max(1, config.totalMinutes) * 60
        : items.length * Math.max(5, config.perQuestionSeconds);

    const session: ActiveQuizSession = {
      id: `attempt_${now}`,
      quizTitle: bank.title,
      passMark: bank.passMark,
      config,
      items,
      answers: {},
      flaggedIds: [],
      currentIndex: 0,
      startedAt: now,
      endTimestamp: now + totalSeconds * 1000,
      questionEndTimestamp:
        config.timerMode === 'per_question'
          ? now + Math.max(5, config.perQuestionSeconds) * 1000
          : null,
    };

    safeSetLocal(STORAGE_KEYS.STUDENT_NAME, config.studentName);
    safeSetLocal(STORAGE_KEYS.ACTIVE_QUIZ, session);
    set({
      studentName: config.studentName,
      activeSession: session,
      lastResult: null,
    });
  },

  selectAnswer: (questionId: string, answer: UserAnswer) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const updated: ActiveQuizSession = {
      ...activeSession,
      answers: {
        ...activeSession.answers,
        [questionId]: answer,
      },
    };
    safeSetLocal(STORAGE_KEYS.ACTIVE_QUIZ, updated);
    set({ activeSession: updated });
  },

  toggleFlag: (questionId: string) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const exists = activeSession.flaggedIds.includes(questionId);
    const flaggedIds = exists
      ? activeSession.flaggedIds.filter((id) => id !== questionId)
      : [...activeSession.flaggedIds, questionId];

    const updated: ActiveQuizSession = {
      ...activeSession,
      flaggedIds,
    };
    safeSetLocal(STORAGE_KEYS.ACTIVE_QUIZ, updated);
    set({ activeSession: updated });
  },

  goToQuestion: (index: number) => {
    const { activeSession } = get();
    if (!activeSession) return;
    if (index < 0 || index >= activeSession.items.length) return;

    const now = Date.now();
    const updated: ActiveQuizSession = {
      ...activeSession,
      currentIndex: index,
      questionEndTimestamp:
        activeSession.config.timerMode === 'per_question'
          ? Math.min(
              activeSession.endTimestamp,
              now + activeSession.config.perQuestionSeconds * 1000
            )
          : null,
    };
    safeSetLocal(STORAGE_KEYS.ACTIVE_QUIZ, updated);
    set({ activeSession: updated });
  },

  nextQuestion: () => {
    const { activeSession } = get();
    if (!activeSession) return;
    if (activeSession.currentIndex < activeSession.items.length - 1) {
      get().goToQuestion(activeSession.currentIndex + 1);
    }
  },

  prevQuestion: () => {
    const { activeSession } = get();
    if (!activeSession) return;
    if (activeSession.currentIndex > 0) {
      get().goToQuestion(activeSession.currentIndex - 1);
    }
  },

  submitQuiz: () => {
    const { activeSession, attemptHistory } = get();
    if (!activeSession) return null;

    const summary = gradeQuizSession(activeSession, Date.now());
    const nextHistory = [summary, ...attemptHistory].slice(0, 30);

    safeRemoveLocal(STORAGE_KEYS.ACTIVE_QUIZ);
    safeSetLocal(STORAGE_KEYS.ATTEMPT_HISTORY, nextHistory);

    set({
      activeSession: null,
      lastResult: summary,
      attemptHistory: nextHistory,
    });
    return summary;
  },

  discardActiveQuiz: () => {
    safeRemoveLocal(STORAGE_KEYS.ACTIVE_QUIZ);
    set({ activeSession: null });
  },

  clearHistory: () => {
    safeRemoveLocal(STORAGE_KEYS.ATTEMPT_HISTORY);
    set({ attemptHistory: [] });
  },

  saveQuestion: async (question: Question): Promise<void> => {
    const { bank } = get();
    if (!bank) return;

    set({ isSavingBank: true, saveError: null, saveSuccessNotice: null });

    try {
      await questionsService.createQuestion(question);

      const exists = bank.questions.some((q) => q.id === question.id);
      const nextQuestions = exists
        ? bank.questions.map((q) => (q.id === question.id ? question : q))
        : [question, ...bank.questions];
      const nextBank = { ...bank, questions: nextQuestions };

      setCachedBank(nextBank);
      set({
        bank: nextBank,
        isSavingBank: false,
        saveSuccessNotice: `Question "${question.id}" saved to Firestore.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save question';
      set({
        isSavingBank: false,
        saveError: msg,
      });
      throw err;
    }
  },

  deleteQuestion: async (id: string): Promise<void> => {
    const { bank } = get();
    if (!bank) return;

    set({ isSavingBank: true, saveError: null, saveSuccessNotice: null });

    try {
      await questionsService.deleteQuestion(id);

      const nextQuestions = bank.questions.filter((q) => q.id !== id);
      const nextBank = { ...bank, questions: nextQuestions };

      setCachedBank(nextBank);
      set({
        bank: nextBank,
        isSavingBank: false,
        saveSuccessNotice: `Question "${id}" deleted from Firestore.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete question';
      set({
        isSavingBank: false,
        saveError: msg,
      });
      throw err;
    }
  },

  saveSettings: async (settings: QuizSettings): Promise<void> => {
    const { bank } = get();
    if (!bank) return;

    set({ isSavingBank: true, saveError: null, saveSuccessNotice: null });

    try {
      await questionsService.updateQuizSettings(settings);

      const nextBank: QuestionBank = {
        ...bank,
        title: settings.title,
        passMark: settings.passMark,
        defaultTimerPerQuestion: settings.defaultTimerPerQuestion,
      };

      setCachedBank(nextBank);
      set({
        bank: nextBank,
        isSavingBank: false,
        saveSuccessNotice: 'Quiz settings updated in Firestore.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      set({
        isSavingBank: false,
        saveError: msg,
      });
      throw err;
    }
  },

  updateBank: async (nextBank: QuestionBank): Promise<void> => {
    set({
      isSavingBank: true,
      saveError: null,
      saveSuccessNotice: null,
    });

    try {
      await questionsService.bulkImportQuestions(nextBank.questions);
      await questionsService.updateQuizSettings({
        title: nextBank.title,
        passMark: nextBank.passMark,
        defaultTimerPerQuestion: nextBank.defaultTimerPerQuestion ?? 60,
      });

      setCachedBank(nextBank);
      set({
        bank: nextBank,
        isSavingBank: false,
        saveSuccessNotice: `Successfully synced ${nextBank.questions.length} questions to Firestore.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sync with Firestore';
      set({
        isSavingBank: false,
        saveError: msg,
      });
      throw err;
    }
  },
}));
