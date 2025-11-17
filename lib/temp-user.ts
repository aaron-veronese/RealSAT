/**
 * Temporary user utilities for anonymous test-taking
 * Allows users to take tests without account creation
 */

const TEMP_USER_KEY = 'skoon._temp_user_id';
const TEMP_USER_PREFIX = '00000000-0000-4000-8000-';

/**
 * Generate a new temporary user ID
 * Format: UUID v4 format with special prefix to identify temp users
 * Example: 00000000-0000-4000-8000-xxxxxxxxxxxx
 * The prefix makes it easy to identify temp users while maintaining UUID format
 */
export function generateTempUserId(): string {
  // Generate 12 random hex characters for the last part
  const random = Array.from({ length: 12 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${TEMP_USER_PREFIX}${random}`;
}

/**
 * Check if a user ID is temporary
 * Checks for the special temp user UUID prefix (00000000-0000-4000-8000-*)
 */
export function isTempUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return userId.startsWith(TEMP_USER_PREFIX);
}

/**
 * Get the current temporary user ID from localStorage
 * Creates one if it doesn't exist
 * Automatically migrates old format (temp_*) to new UUID format
 */
export function getTempUserId(): string {
  if (typeof window === 'undefined') {
    // SSR - return a placeholder
    return generateTempUserId();
  }

  let tempId = localStorage.getItem(TEMP_USER_KEY);
  
  // Check if we have an old format temp ID (temp_timestamp_random)
  if (tempId && tempId.startsWith('temp_') && !tempId.startsWith(TEMP_USER_PREFIX)) {
    console.log('Migrating old temp user ID format to UUID format');
    // Generate new UUID-format temp ID
    tempId = generateTempUserId();
    localStorage.setItem(TEMP_USER_KEY, tempId);
  }
  
  if (!tempId) {
    tempId = generateTempUserId();
    localStorage.setItem(TEMP_USER_KEY, tempId);
  }
  
  return tempId;
}

/**
 * Clear the temporary user ID from localStorage
 * Called after successful signup/conversion
 */
export function clearTempUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TEMP_USER_KEY);
}

/**
 * Set the user ID in localStorage (replaces temp ID with real ID after signup)
 */
export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMP_USER_KEY, userId);
  console.log('[AUTH] User ID updated in localStorage:', userId);
}

/**
 * Convert temporary user's test_results to a real user
 * Updates all test_results entries with the new user_id
 */
export async function convertTempToRealUser(tempUserId: string, realUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isTempUser(tempUserId)) {
      return { success: false, error: 'Provided user ID is not a temporary user' };
    }

    // Import supabase client
    const { supabase } = await import('@/lib/supabase/client');

    // Update all test_results entries from temp user to real user
    const { data, error } = await supabase
      .from('test_results')
      .update({ user_id: realUserId })
      .eq('user_id', tempUserId)
      .select();

    if (error) {
      console.error('Error converting temp user:', error);
      return { success: false, error: error.message };
    }

    // Clear the temp user ID from localStorage
    clearTempUserId();

    return { success: true };
  } catch (err: any) {
    console.error('Error in convertTempToRealUser:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Check if user has any test progress (completed modules)
 */
export async function hasTestProgress(userId: string): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase/client');

    const { data, error } = await supabase
      .from('test_results')
      .select('id, modules')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data) return false;

    // Check if any modules are completed
    const modules = data.modules as any;
    if (!modules) return false;

    return Object.values(modules).some((m: any) => m?.completed === true);
  } catch {
    return false;
  }
}

/**
 * Get current user ID (temp or real)
 * Returns temp user ID if no real user is authenticated
 */
export function getCurrentUserIdOrTemp(): string {
  if (typeof window === 'undefined') {
    return getTempUserId();
  }

  // Check for real authenticated user first
  const { getCurrentUserId } = require('@/lib/auth');
  return getCurrentUserId();
}

/**
 * Check if user needs to sign up to continue
 * Returns true if user is temp and has completed at least one module
 */
export async function shouldPromptSignup(userId: string): Promise<boolean> {
  if (!isTempUser(userId)) return false;
  return await hasTestProgress(userId);
}
