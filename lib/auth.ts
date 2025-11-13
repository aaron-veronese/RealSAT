/**
 * Temporary hardcoded user ID for development
 * TODO: Replace with actual authentication
 */
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEV_USER_NAME = 'Test User';

/**
 * Get current user ID (for now, returns hardcoded dev user)
 */
export function getCurrentUserId(): string {
  return DEV_USER_ID;
}

/**
 * Get current user name (for now, returns hardcoded dev user name)
 */
export function getCurrentUserName(): string {
  return DEV_USER_NAME;
}
