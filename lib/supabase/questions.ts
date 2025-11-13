import { supabase } from './client';
import type { DBQuestion } from '@/types/db';

export async function getQuestionsForTest(testId: number) {
  return supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('module_number', { ascending: true })
    .order('question_number', { ascending: true });
}

export async function getQuestionsByModule(testId: number, moduleNumber: number) {
  return supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .eq('module_number', moduleNumber)
    .order('question_number', { ascending: true });
}
