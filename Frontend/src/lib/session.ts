// Session management for order tracking
// Stores the current order ID in a cookie called "currentOrderId"

const COOKIE_NAME = 'currentOrderId';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Get the current order ID from session cookie
 */
export function getCurrentOrderId(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Set the current order ID in session cookie
 * This replaces any previous order ID (as per requirements)
 */
export function setCurrentOrderId(orderId: string): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(orderId)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  console.log(`📝 Session: Order ID set to ${orderId}`);
}

/**
 * Clear the current order ID from session
 */
export function clearCurrentOrderId(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

/**
 * Generate a unique session ID for guest orders
 */
export function getOrCreateSessionId(): string {
  const SESSION_COOKIE = 'guestSessionId';
  
  if (typeof window === 'undefined') return '';
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === SESSION_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  
  // Create new session ID
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  
  return sessionId;
}
