/**
 * Safe, schema-versioned wrapper around localStorage & sessionStorage.
 * Never crashes in private browsing, quota overflow, or corrupted JSON.
 */

export interface VersionedEnvelope<T> {
  version: number;
  updatedAt: number;
  data: T;
}

export const STORAGE_KEYS = {
  THEME: 'codepulse_theme_v1',
  STUDENT_NAME: 'codepulse_student_name_v1',
  ACTIVE_QUIZ: 'codepulse_active_quiz_v1',
  ATTEMPT_HISTORY: 'codepulse_attempt_history_v1',
  ADMIN_DRAFT_BANK: 'codepulse_admin_draft_bank_v1',
  ADMIN_SESSION: 'codepulse_admin_session_v1',
} as const;

const CURRENT_SCHEMA_VERSION = 1;

export function safeGetLocal<T>(
  key: string,
  fallback: T,
  validator?: (val: unknown) => val is T
): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      'data' in parsed
    ) {
      const env = parsed as VersionedEnvelope<unknown>;
      if (env.version !== CURRENT_SCHEMA_VERSION) {
        window.localStorage.removeItem(key);
        return fallback;
      }
      if (validator && !validator(env.data)) {
        window.localStorage.removeItem(key);
        return fallback;
      }
      return env.data as T;
    }
    return fallback;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage removal errors
    }
    return fallback;
  }
}

export function safeSetLocal<T>(key: string, data: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const envelope: VersionedEnvelope<T> = {
      version: CURRENT_SCHEMA_VERSION,
      updatedAt: Date.now(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveLocal(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

export function safeGetSession<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return fallback;
    }
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetSession<T>(key: string, data: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    window.sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveSession(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}
