import { z } from 'zod';
import type { QuestionBank, ValidationIssueDetail } from '../types/quiz';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

const McqQuestionBaseSchema = z.object({
  id: z.string().trim().min(1, 'Question ID cannot be empty'),
  type: z.literal('mcq'),
  question: z.string().trim().min(1, 'Question text is required'),
  code: z.string().optional().nullable().transform((v) => v || undefined),
  options: z
    .array(z.string().trim().min(1, 'Option text cannot be empty'))
    .min(2, 'MCQ must have at least 2 options')
    .max(6, 'MCQ can have at most 6 options'),
  answer: z.union([z.number().int(), z.string()]),
  answerText: z.string().optional(),
  explanation: z.string().optional(),
  category: z.string().trim().min(1).optional(),
  difficulty: DifficultySchema.optional(),
  unit: z.string().optional(),
  unit_key: z.string().optional(),
  unit_number: z.number().optional(),
  section: z.string().optional(),
}).transform((data) => {
  let numericAnswer = 0;
  let textAnswer = data.answerText;
  if (typeof data.answer === 'number') {
    numericAnswer = data.answer;
    textAnswer = textAnswer || data.options[numericAnswer];
  } else {
    const found = data.options.indexOf(data.answer);
    numericAnswer = found !== -1 ? found : 0;
    textAnswer = textAnswer || data.answer;
  }
  return {
    ...data,
    answer: numericAnswer,
    answerText: textAnswer,
    category: data.category || data.unit,
  };
});

export const McqQuestionSchema = McqQuestionBaseSchema;

export const TrueFalseQuestionSchema = z.object({
  id: z.string().trim().min(1, 'Question ID cannot be empty'),
  type: z.literal('true_false'),
  question: z.string().trim().min(1, 'Question text is required'),
  code: z.string().optional().nullable().transform((v) => v || undefined),
  options: z.array(z.string()).optional(),
  answer: z.union([z.boolean(), z.string()]),
  answerText: z.string().optional(),
  explanation: z.string().optional(),
  category: z.string().trim().min(1).optional(),
  difficulty: DifficultySchema.optional(),
  unit: z.string().optional(),
  unit_key: z.string().optional(),
  unit_number: z.number().optional(),
  section: z.string().optional(),
}).transform((data) => {
  let boolAnswer = false;
  let textAnswer = data.answerText;
  if (typeof data.answer === 'boolean') {
    boolAnswer = data.answer;
    textAnswer = textAnswer || (boolAnswer ? 'True' : 'False');
  } else {
    boolAnswer = String(data.answer).trim().toLowerCase() === 'true';
    textAnswer = textAnswer || String(data.answer);
  }
  return {
    ...data,
    answer: boolAnswer,
    answerText: textAnswer,
    category: data.category || data.unit,
  };
});

export const QuestionSchema = z.union([
  McqQuestionSchema,
  TrueFalseQuestionSchema,
]);

export const QuestionBankSchema = z
  .object({
    title: z.string().trim().min(1, 'Quiz title is required'),
    passMark: z
      .number()
      .min(1, 'Pass mark must be between 1 and 100')
      .max(100, 'Pass mark must be between 1 and 100')
      .default(60),
    defaultTimerPerQuestion: z.number().int().min(10).max(600).optional(),
    questions: z
      .array(QuestionSchema)
      .min(1, 'Questions array cannot be empty; add at least 1 question'),
  })
  .superRefine((bank, ctx) => {
    const seenIds = new Map<string, number>();
    bank.questions.forEach((q, idx) => {
      // Validate MCQ answer index is within options range
      if (q.type === 'mcq') {
        if (q.answer < 0 || q.answer >= q.options.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['questions', idx, 'answer'],
            message: `Answer index ${q.answer} is out of range for options length ${q.options.length} (valid: 0..${Math.max(0, q.options.length - 1)})`,
          });
        }
      }

      const firstSeen = seenIds.get(q.id);
      if (firstSeen !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['questions', idx, 'id'],
          message: `Duplicate question id "${q.id}" (already used at index ${firstSeen})`,
        });
      } else {
        seenIds.set(q.id, idx);
      }
    });
  });

export type ValidationResult =
  | { ok: true; data: QuestionBank }
  | { ok: false; summary: string; issues: ValidationIssueDetail[] };

/**
 * Validates raw JSON string or parsed object against QuestionBankSchema.
 * Handles array format [...], empty file, malformed JSON, duplicate IDs, and answer index out of range.
 */
export function validateQuestionBankJson(rawInput: string | unknown): ValidationResult {
  let parsed: unknown = rawInput;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        ok: false,
        summary: 'The questions JSON input is empty.',
        issues: [
          {
            questionIndex: null,
            questionId: null,
            field: 'root',
            message: 'Input is empty (0 bytes or whitespace only).',
          },
        ],
      };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
      return {
        ok: false,
        summary: 'Malformed JSON syntax.',
        issues: [
          {
            questionIndex: null,
            questionId: null,
            field: 'JSON.parse',
            message: msg,
          },
        ],
      };
    }
  }

  // If a direct questions array is passed, wrap it in a bank envelope
  if (Array.isArray(parsed)) {
    parsed = {
      title: 'Programming Fundamentals & Web Engineering',
      passMark: 60,
      defaultTimerPerQuestion: 60,
      questions: parsed,
    };
  }

  const rawQuestionsArray =
    parsed !== null &&
    typeof parsed === 'object' &&
    'questions' in parsed &&
    Array.isArray((parsed as { questions?: unknown }).questions)
      ? ((parsed as { questions: unknown[] }).questions ?? [])
      : [];

  const result = QuestionBankSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, data: result.data as QuestionBank };
  }

  const issues: ValidationIssueDetail[] = result.error.issues.map((issue) => {
    const path = issue.path;
    let questionIndex: number | null = null;
    let questionId: string | null = null;
    let field = path.join('.') || 'root';

    if (path[0] === 'questions' && typeof path[1] === 'number') {
      questionIndex = path[1];
      const rawQ = rawQuestionsArray[questionIndex];
      if (rawQ && typeof rawQ === 'object' && 'id' in rawQ && typeof (rawQ as { id?: unknown }).id === 'string') {
        questionId = (rawQ as { id: string }).id;
      }
      field = path.slice(2).join('.') || 'question';
    }

    return {
      questionIndex,
      questionId,
      field,
      message: issue.message,
    };
  });

  return {
    ok: false,
    summary: `Found ${issues.length} validation error${issues.length === 1 ? '' : 's'} in questions JSON.`,
    issues,
  };
}
