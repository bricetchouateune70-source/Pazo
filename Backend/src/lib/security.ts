/**
 * Security utilities for the backend
 * 
 * SQL Injection Protection:
 * - Prisma ORM automatically uses parameterized queries
 * - All user input is escaped before being sent to the database
 * 
 * XSS Protection:
 * - User input is stored as-is in the database (for data integrity)
 * - Frontend is responsible for escaping when displaying (React does this automatically)
 * - Use escapeHtml() for any server-rendered HTML responses
 */

/**
 * Escape HTML special characters to prevent XSS
 * Use this when rendering user input in HTML responses
 * 
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
  };
  
  return String(str).replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Sanitize user input for storage
 * Trims whitespace and limits length
 * 
 * Note: Prisma handles SQL escaping automatically with parameterized queries
 */
export function sanitizeInput(str: string | null | undefined, maxLength: number = 1000): string {
  if (str == null) return '';
  return String(str).trim().substring(0, maxLength);
}

/**
 * Validate that a string is a valid UUID
 * Prevents injection through ID parameters
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sanitize order notes - allows special characters but limits length
 */
export function sanitizeOrderNotes(str: string | null | undefined): string | null {
  if (str == null || str.trim() === '') return null;
  // Allow all characters including <h1>Te"s't</h1> - Prisma handles SQL escaping
  // Frontend will handle HTML escaping when displaying
  return String(str).trim().substring(0, 500);
}

/**
 * Sanitize delivery address
 */
export function sanitizeAddress(str: string | null | undefined): string | null {
  if (str == null || str.trim() === '') return null;
  return String(str).trim().substring(0, 200);
}
