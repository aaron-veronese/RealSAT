import { supabase } from './client';
import type { DBTestAttempt, TestAttemptModules, TestStatus } from '@/types/db';

/**
 * Get a specific test attempt by user_id and test_id
 */
export async function getTestAttempt(userId: string, testId: number) {
  return await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('test_id', testId)
    .single()
}

export async function getLeaderboard(testId: number) {
  return await supabase
    .from('test_attempts')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: false })
}

/**
 * Get all test attempts for a user
 */
export async function getUserTestAttempts(userId: string) {
  return supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('last_modified', { ascending: false });
}

/**
 * Get all completed test attempts for a user
 */
export async function getUserCompletedTests(userId: string) {
  return supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('test_status', 'COMPLETE')
    .order('last_modified', { ascending: false });
}

/**
 * Create a new test attempt
 */
export async function createTestAttempt(
  userId: string,
  testId: number,
  modules: TestAttemptModules = {}
) {
  return supabase
    .from('test_attempts')
    .insert({
      user_id: userId,
      test_id: testId,
      modules,
      test_status: 'IN_PROGRESS',
      total_time: 0,
    })
    .select()
    .single();
}

/**
 * Validate and update module data for a test attempt
 * This function fetches correct answers from the questions table and validates user answers
 */
export async function validateAndUpdateModule(
  attemptId: string,
  testId: number,
  moduleNumber: number,
  modules: TestAttemptModules
) {
  // Get correct answers from questions table
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('question_number, correct_answer, answers, section')
    .eq('test_id', testId)
    .eq('module_number', moduleNumber)
    .order('question_number');

  if (questionsError || !questions) {
    return { data: null, error: questionsError || new Error('Questions not found') };
  }

  // Create a map of correct answers
  const correctAnswers = new Map<number, { answer: string; answers: any; section: string }>(
    questions.map((q: any) => [q.question_number, { answer: q.correct_answer, answers: q.answers, section: q.section }])
  );

  // Validate answers and update status
  const moduleKey = `module_${moduleNumber}` as keyof TestAttemptModules;
  const currentModule = modules[moduleKey];

  if (!currentModule) {
    return { data: null, error: new Error('Module not found in submission') };
  }

  const validatedQuestions = currentModule.questions.map(q => {
    const correctData = correctAnswers.get(q.question_number);
    if (!correctData) {
      return { ...q, status: 'UNANSWERED' as const };
    }

    const userAnswer = q.user_answer;
    const correctAnswer = correctData.answer;
    
    // Determine if it's free response based on answers array
    // If answers array has only 1 item and section is MATH, it's free response
    const isFreeResponse = correctData.section === 'MATH' && 
                          correctData.answers && 
                          correctData.answers.length === 1;

    let status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED';

    if (!userAnswer || userAnswer.trim() === '') {
      status = 'UNANSWERED';
    } else if (isFreeResponse) {
      // For free response, try to evaluate mathematically
      status = evaluateMathAnswer(userAnswer, correctAnswer) ? 'CORRECT' : 'INCORRECT';
    } else {
      // For multiple choice, exact string match
      status = userAnswer === correctAnswer ? 'CORRECT' : 'INCORRECT';
    }

    return {
      ...q,
      status,
      correct_answer: correctAnswer // Store the correct answer in the database
    };
  });

  // Update the modules object with validated data
  const updatedModules = {
    ...modules,
    [moduleKey]: {
      ...currentModule,
      questions: validatedQuestions
    }
  };

  // Update in database
  return supabase
    .from('test_attempts')
    .update({
      modules: updatedModules,
      last_modified: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single();
}

/**
 * Helper function to evaluate math answers
 */
function evaluateMathAnswer(userAnswer: string, correctAnswer: string): boolean {
  try {
    const userVal = evaluateMathExpression(userAnswer);
    const correctVal = evaluateMathExpression(correctAnswer);
    
    if (userVal === null || correctVal === null) {
      return userAnswer.trim() === correctAnswer.trim();
    }
    
    const tolerance = 0.0001;
    return Math.abs(userVal - correctVal) < tolerance;
  } catch {
    return userAnswer.trim() === correctAnswer.trim();
  }
}

/**
 * Helper function to evaluate basic math expressions
 */
function evaluateMathExpression(expression: string): number | null {
  try {
    const expr = expression.replace(/\s+/g, '');
    
    // Handle fractions
    if (expr.includes('/')) {
      const parts = expr.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return numerator / denominator;
        }
      }
      return null;
    }
    
    const num = parseFloat(expr);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

/**
 * Update module data for a test attempt (without validation)
 */
export async function updateModuleData(
  attemptId: string,
  modules: TestAttemptModules
) {
  return supabase
    .from('test_attempts')
    .update({
      modules,
      last_modified: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single();
}

/**
 * Complete a test and set final scores
 */
export async function completeTest(
  attemptId: string,
  totalTime: number,
  readingScore: number,
  mathScore: number,
  totalScore: number,
  modules: TestAttemptModules
) {
  return supabase
    .from('test_attempts')
    .update({
      modules,
      test_status: 'COMPLETE',
      total_time: totalTime,
      reading_score: readingScore,
      math_score: mathScore,
      total_score: totalScore,
      last_modified: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single();
}

/**
 * Get leaderboard for a specific test
 */
export async function getTestLeaderboard(testId: number) {
  return supabase
    .from('test_attempts')
    .select('*, users(username)')
    .eq('test_id', testId)
    .eq('test_status', 'COMPLETE')
    .order('total_score', { ascending: false });
}

/**
 * Get global leaderboard (highest score per user across all tests)
 * Note: This requires a more complex query - may need to be done client-side
 */
export async function getGlobalLeaderboard(timeFilter?: 'week' | 'month' | 'all') {
  let query = supabase
    .from('test_attempts')
    .select('*, users(username)')
    .eq('test_status', 'COMPLETE');

  if (timeFilter === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query = query.gte('last_modified', weekAgo.toISOString());
  } else if (timeFilter === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    query = query.gte('last_modified', monthAgo.toISOString());
  }

  return query.order('total_score', { ascending: false });
}

/**
 * Get unique test IDs from questions table
 */
export async function getAvailableTests() {
  const { data, error } = await supabase
    .from('questions')
    .select('test_id')
    .order('test_id', { ascending: true });

  if (error) return { data: null, error };

  // Get unique test IDs
  const uniqueTestIds = [...new Set(data?.map((q: { test_id: number }) => q.test_id) || [])];
  return { data: uniqueTestIds, error: null };
}

/**
 * Count correct answers in a module from modules JSONB
 */
export function countCorrectInModule(moduleData: any): number {
  if (!moduleData?.questions) return 0;
  return moduleData.questions.filter((q: any) => q.status === 'CORRECT').length;
}
