import type { QuestionBank } from '../types/quiz';
import { questionsService } from '../features/admin/questionsService';
import { validateQuestionBankJson, type ValidationResult } from './questionSchema';

// In-memory session cache to avoid repeatedly fetching all questions
let cachedBank: QuestionBank | null = null;

export interface LoadQuestionBankResponse {
  result: ValidationResult;
  isFallback: boolean;
  fallbackNotice?: string;
}

/**
 * Loads the question bank from Cloud Firestore (`questions` collection + `settings/quiz`).
 * Caches in memory for the duration of the session unless forceRefresh = true.
 */
export async function loadQuestionBank(
  forceRefresh = false
): Promise<LoadQuestionBankResponse> {
  if (cachedBank && !forceRefresh) {
    return {
      result: {
        ok: true,
        data: cachedBank,
      },
      isFallback: false,
    };
  }

  // 1. Primary: Load from Cloud Firestore
  try {
    const bank = await questionsService.loadQuestionBank();
    cachedBank = bank;

    return {
      result: {
        ok: true,
        data: bank,
      },
      isFallback: false,
    };
  } catch (firestoreErr) {
    const rawMsg =
      firestoreErr instanceof Error ? firestoreErr.message : 'Firestore read error';

    let readableReason = rawMsg;
    if (rawMsg.includes('permission-denied') || rawMsg.includes('PERMISSION_DENIED')) {
      readableReason = 'Firestore permission denied: verify security rules allow public read access on `questions` and `settings`.';
    } else if (rawMsg.includes('unavailable') || rawMsg.includes('failed-precondition')) {
      readableReason = 'Firestore service temporarily unavailable or network offline.';
    }

    console.warn('Firestore load failed:', readableReason);

    // 2. Fallback to public/questions.json if Firestore fails (e.g. offline/network blocked)
    try {
      const baseUrl = import.meta.env.BASE_URL || './';
      const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const res = await fetch(`${normalizedBase}questions.json`);
      if (!res.ok) {
        throw new Error(`Failed to fetch baseline questions.json (HTTP ${res.status})`);
      }
      const rawText = await res.text();
      const validation = validateQuestionBankJson(rawText);
      if (validation.ok) {
        cachedBank = validation.data;
        return {
          result: validation,
          isFallback: true,
          fallbackNotice: `Using offline baseline questions.json (${readableReason})`,
        };
      }
      return {
        result: validation,
        isFallback: false,
      };
    } catch {
      return {
        result: {
          ok: false,
          summary: `Unable to load questions from Cloud Firestore: ${readableReason}`,
          issues: [
            {
              questionIndex: null,
              questionId: null,
              field: 'firestore',
              message: readableReason,
            },
          ],
        },
        isFallback: false,
      };
    }
  }
}

export function setCachedBank(bank: QuestionBank): void {
  cachedBank = bank;
}

export function clearBankCache(): void {
  cachedBank = null;
}
