import { supabase } from './supabase/client';
import { getTempUserId, isTempUser } from './temp-user';

/**
 * Get current authenticated user from Supabase Auth
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Don't log AuthSessionMissingError as it's expected for temp users
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Error getting authenticated user:', error);
      }
      return null;
    }
    return user;
  } catch (err) {
    console.error('Error in getAuthenticatedUser:', err);
    return null;
  }
}

/**
 * Get current authenticated user synchronously from session
 * Returns null if not authenticated
 */
export function getAuthenticatedUserSync() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get session from Supabase's storage
    // The key format is: sb-{project-ref}-auth-token
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    
    if (!authKey) {
      return null;
    }
    
    const sessionStr = localStorage.getItem(authKey);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    // Check both possible structures
    const user = session?.user || session?.currentSession?.user;
    return user || null;
  } catch (err) {
    // Silent fail for temp users
    return null;
  }
}

/**
 * Get current user ID (authenticated user or temp user)
 * This is the main function to use throughout the app
 * Returns authenticated user ID if available, otherwise temp user ID
 */
export function getCurrentUserId(): string {
  // Try to get authenticated user first (synchronously)
  const authUser = getAuthenticatedUserSync();
  if (authUser && authUser.id) {
    return authUser.id;
  }
  
  // Fall back to temp user
  return getTempUserId();
}

/**
 * Check if current user is a temporary (unauthenticated) user
 */
export function isCurrentUserTemp(): boolean {
  const userId = getCurrentUserId();
  return isTempUser(userId);
}

/**
 * Get current user name (for now, returns hardcoded dev user name)
 * In production, this should query users.name field from Supabase
 */
export async function getCurrentUserName(): Promise<string> {
  const authUser = await getAuthenticatedUser();
  if (authUser) {
    // Try to get name from users table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, username')
        .eq('id', authUser.id)
        .single();
      
      if (!error && data) {
        return data.name || data.username || 'User';
      }
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
  }
  
  return 'Guest';
}

/**
 * Get current user name synchronously
 */
export function getCurrentUserNameSync(): string {
  const authUser = getAuthenticatedUserSync();
  if (authUser) {
    // Return email username as fallback
    return authUser.email?.split('@')[0] || 'User';
  }
  return 'Guest';
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error in signOut:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthenticatedUserSync() !== null;
}
