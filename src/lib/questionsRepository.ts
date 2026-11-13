import type { QuestionBank } from '../types/quiz';
import { questionsService } from '../features/admin/questionsService';

export interface SaveResult {
  synced: boolean;
  warning?: string;
}

export interface QuestionsRepository {
  load(): Promise<QuestionBank>;
  save(bank: QuestionBank): Promise<SaveResult>;
}

export class FirestoreQuestionsRepository implements QuestionsRepository {
  async load(): Promise<QuestionBank> {
    return questionsService.loadQuestionBank();
  }

  async save(bank: QuestionBank): Promise<SaveResult> {
    try {
      await questionsService.bulkImportQuestions(bank.questions);
      await questionsService.updateQuizSettings({
        title: bank.title,
        passMark: bank.passMark,
        defaultTimerPerQuestion: bank.defaultTimerPerQuestion ?? 60,
      });
      return { synced: true };
    } catch (err) {
      return {
        synced: false,
        warning: err instanceof Error ? err.message : 'Unknown write error',
      };
    }
  }
}

export const questionsRepository: QuestionsRepository = new FirestoreQuestionsRepository();
