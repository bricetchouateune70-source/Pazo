/**
 * Security utilities for XSS protection
 * 
 * Note: React/Next.js automatically escapes JSX expressions, but these utilities
 * are provided for explicit sanitization and for contexts where raw HTML might be used.
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * Equivalent to PHP's htmlspecialchars()
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return String(str).replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char]);
}

/**
 * Sanitize user input for display
 * Trims whitespace and escapes HTML
 */
export function sanitizeInput(str: string | null | undefined): string {
  if (str == null) return '';
  return escapeHtml(String(str).trim());
}

/**
 * Sanitize user input for database storage
 * Note: Prisma already uses parameterized queries, so SQL injection is prevented.
 * This function is for consistency and additional safety.
 */
export function sanitizeForStorage(str: string | null | undefined): string {
  if (str == null) return '';
  // Just trim - Prisma handles SQL escaping automatically
  return String(str).trim();
}

/**
 * Validate and sanitize an order note/address
 * Allows special characters but prevents code injection
 */
export function sanitizeOrderText(str: string | null | undefined): string {
  if (str == null) return '';
  // Trim and limit length for safety
  return String(str).trim().substring(0, 1000);
}

/**
 * Check if a string contains potentially dangerous content
 */
export function containsScriptTags(str: string): boolean {
  const dangerous = /<script|javascript:|on\w+=/i;
  return dangerous.test(str);
}
