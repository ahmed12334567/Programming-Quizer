import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Question, QuestionBank } from '../../types/quiz';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { QuestionSchema } from '../../lib/questionSchema';

export interface QuizSettings {
  title: string;
  passMark: number;
  defaultTimerPerQuestion: number;
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  title: 'Programming Fundamentals & Modern Web Engineering',
  passMark: 60,
  defaultTimerPerQuestion: 60,
};

const QUESTIONS_COLLECTION = 'questions';
const SETTINGS_COLLECTION = 'settings';
const QUIZ_SETTINGS_DOC = 'quiz';

/**
 * Strips the 'id' field from a Question object before writing to Firestore,
 * since Firestore uses doc.id as the question id.
 */
function prepareQuestionForFirestore(question: Question): Record<string, unknown> {
  const { id: _id, ...data } = question;
  // Ensure undefined fields are not passed to Firestore if not needed
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

export class QuestionsService {
  /**
   * Fetches all questions from the `questions` collection in Firestore.
   * Maps doc.id back to question.id: { id: doc.id, ...doc.data() }.
   */
  async getAllQuestions(): Promise<Question[]> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing or incomplete in .env.');
    }

    const colRef = collection(db, QUESTIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    const questions: Question[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const candidate = {
        id: docSnap.id,
        ...data,
      };

      const parseResult = QuestionSchema.safeParse(candidate);
      if (parseResult.success) {
        questions.push(parseResult.data);
      } else {
        console.warn(`Question "${docSnap.id}" failed schema validation:`, parseResult.error.message);
        // Still include if minimally valid or skip if corrupted
      }
    });

    // Natural sort by ID (e.g. q1, q2, ... q10, q20...)
    questions.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ''), 10);
      const numB = parseInt(b.id.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.id.localeCompare(b.id);
    });

    return questions;
  }

  /**
   * Fetches a single question by its document ID.
   */
  async getQuestionById(id: string): Promise<Question | null> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const docRef = doc(db, QUESTIONS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }

    const parsed = QuestionSchema.safeParse({
      id: snap.id,
      ...snap.data(),
    });

    return parsed.success ? parsed.data : null;
  }

  /**
   * Creates or overwrites a question in Firestore.
   * Uses setDoc with doc ID = question.id.
   */
  async createQuestion(question: Question): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const parsed = QuestionSchema.parse(question);
    const docRef = doc(db, QUESTIONS_COLLECTION, parsed.id);
    const data = prepareQuestionForFirestore(parsed);
    await setDoc(docRef, data);
  }

  /**
   * Updates an existing question in Firestore.
   */
  async updateQuestion(question: Question): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const parsed = QuestionSchema.parse(question);
    const docRef = doc(db, QUESTIONS_COLLECTION, parsed.id);
    const data = prepareQuestionForFirestore(parsed);
    await setDoc(docRef, data, { merge: true });
  }

  /**
   * Deletes a question document from Firestore by ID.
   */
  async deleteQuestion(id: string): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const docRef = doc(db, QUESTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  }

  /**
   * Bulk imports questions using writeBatch in chunks of max 500 documents.
   * Uses setDoc so re-importing updates existing documents without duplicating.
   */
  async bulkImportQuestions(questions: Question[]): Promise<{ importedCount: number }> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const BATCH_SIZE = 500;
    let totalImported = 0;

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const chunk = questions.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const q of chunk) {
        const parsed = QuestionSchema.parse(q);
        const docRef = doc(db, QUESTIONS_COLLECTION, parsed.id);
        const data = prepareQuestionForFirestore(parsed);
        batch.set(docRef, data);
      }

      await batch.commit();
      totalImported += chunk.length;
    }

    return { importedCount: totalImported };
  }

  /**
   * Loads global quiz settings from settings/quiz document.
   * Falls back to DEFAULT_QUIZ_SETTINGS if document is absent.
   */
  async getQuizSettings(): Promise<QuizSettings> {
    if (!isFirebaseConfigured) {
      return DEFAULT_QUIZ_SETTINGS;
    }

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, QUIZ_SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          title: typeof data.title === 'string' ? data.title : DEFAULT_QUIZ_SETTINGS.title,
          passMark: typeof data.passMark === 'number' ? data.passMark : DEFAULT_QUIZ_SETTINGS.passMark,
          defaultTimerPerQuestion:
            typeof data.defaultTimerPerQuestion === 'number'
              ? data.defaultTimerPerQuestion
              : DEFAULT_QUIZ_SETTINGS.defaultTimerPerQuestion,
        };
      }
    } catch (err) {
      console.warn('Failed to load settings from Firestore, using defaults:', err);
    }

    return DEFAULT_QUIZ_SETTINGS;
  }

  /**
   * Persists global quiz settings to settings/quiz in Firestore.
   */
  async updateQuizSettings(settings: QuizSettings): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase configuration is missing in .env.');
    }

    const docRef = doc(db, SETTINGS_COLLECTION, QUIZ_SETTINGS_DOC);
    await setDoc(docRef, {
      title: settings.title.trim() || DEFAULT_QUIZ_SETTINGS.title,
      passMark: Math.min(100, Math.max(1, settings.passMark)),
      defaultTimerPerQuestion: Math.min(600, Math.max(10, settings.defaultTimerPerQuestion)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  /**
   * Loads the complete QuestionBank (settings + all questions) from Firestore.
   */
  async loadQuestionBank(): Promise<QuestionBank> {
    const [settings, questions] = await Promise.all([
      this.getQuizSettings(),
      this.getAllQuestions(),
    ]);

    return {
      title: settings.title,
      passMark: settings.passMark,
      defaultTimerPerQuestion: settings.defaultTimerPerQuestion,
      questions,
    };
  }
}

export const questionsService = new QuestionsService();
