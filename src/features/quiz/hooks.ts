import { useEffect, useRef, useState } from 'react';
import type { ActiveQuizSession, UserAnswer } from '../../types/quiz';

export interface DriftFreeTimerState {
  secondsLeft: number;
  totalSeconds: number;
  fractionRemaining: number;
  status: 'normal' | 'warning' | 'critical';
  announcement: string;
}

/**
 * Drift-free countdown hook computed strictly from `endTimestamp - Date.now()`.
 * Survives tab throttling and full page refreshes.
 */
export function useDriftFreeTimer(
  endTimestamp: number,
  totalSeconds: number,
  onExpire: () => void
): DriftFreeTimerState {
  const [now, setNow] = useState<number>(() => Date.now());
  const expiredCalledRef = useRef(false);
  const announced25Ref = useRef(false);
  const announced10Ref = useRef(false);
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    expiredCalledRef.current = false;
  }, [endTimestamp]);

  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= endTimestamp && !expiredCalledRef.current) {
        expiredCalledRef.current = true;
        onExpire();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endTimestamp, onExpire]);

  const secondsLeft = Math.max(0, Math.ceil((endTimestamp - now) / 1000));
  const safeTotal = Math.max(1, totalSeconds);
  const fractionRemaining = Math.min(1, Math.max(0, secondsLeft / safeTotal));

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (fractionRemaining <= 0.1 || secondsLeft <= 30) {
    status = 'critical';
  } else if (fractionRemaining <= 0.25) {
    status = 'warning';
  }

  useEffect(() => {
    if (fractionRemaining <= 0.1 && !announced10Ref.current && secondsLeft > 0) {
      announced10Ref.current = true;
      setAnnouncement(
        `Critical warning: 10 percent of quiz time remaining (${secondsLeft} seconds left).`
      );
    } else if (
      fractionRemaining <= 0.25 &&
      !announced25Ref.current &&
      secondsLeft > 0
    ) {
      announced25Ref.current = true;
      setAnnouncement(
        `Time warning: 25 percent of quiz time remaining.`
      );
    }
  }, [fractionRemaining, secondsLeft]);

  return {
    secondsLeft,
    totalSeconds: safeTotal,
    fractionRemaining,
    status,
    announcement,
  };
}

/**
 * Keyboard shortcuts for the active quiz screen:
 * - 1-4 or A-D: select MCQ option
 * - T / F: select True / False
 * - ArrowLeft / ArrowRight: previous / next question
 * - Enter: next question
 */
export function useQuizKeyboardShortcuts(params: {
  session: ActiveQuizSession | null;
  disabled: boolean;
  onSelectAnswer: (questionId: string, answer: UserAnswer) => void;
  onNext: () => void;
  onPrev: () => void;
}): void {
  const { session, disabled, onSelectAnswer, onNext, onPrev } = params;

  useEffect(() => {
    if (!session || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const currentItem = session.items[session.currentIndex];
      if (!currentItem) return;
      const { question, optionOrder } = currentItem;

      const key = e.key.toLowerCase();

      if (question.type === 'mcq') {
        const keyMap: Record<string, number> = {
          '1': 0,
          a: 0,
          '2': 1,
          b: 1,
          '3': 2,
          c: 2,
          '4': 3,
          d: 3,
        };
        const displayedIdx = keyMap[key];
        if (
          displayedIdx !== undefined &&
          displayedIdx < optionOrder.length
        ) {
          e.preventDefault();
          const originalIdx = optionOrder[displayedIdx]!;
          onSelectAnswer(question.id, originalIdx);
          return;
        }
      } else if (question.type === 'true_false') {
        if (key === 't' || key === '1') {
          e.preventDefault();
          onSelectAnswer(question.id, true);
          return;
        }
        if (key === 'f' || key === '2') {
          e.preventDefault();
          onSelectAnswer(question.id, false);
          return;
        }
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, disabled, onSelectAnswer, onNext, onPrev]);
}
