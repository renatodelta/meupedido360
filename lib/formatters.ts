/**
 * Utility functions for masking and formatting input values throughout MeuPedido360
 */

/**
 * Formats a phone string into standard Brazilian format:
 * - 10 digits: (XX) XXXX-XXXX
 * - 11 digits: (XX) XXXXX-XXXX (ex: (12) 99153-0244)
 * Formats progressively as the user types.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';

  // Remove any non-numeric characters
  const digits = value.replace(/\D/g, '');

  // Strip international prefix '55' if present with 12 or 13 digits
  const clean = (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
    ? digits.substring(2)
    : digits;

  // Max 11 digits for Brazilian phone numbers (DDD + 9 digits)
  const trimmed = clean.slice(0, 11);

  if (trimmed.length === 0) return '';
  if (trimmed.length <= 2) return `(${trimmed}`;
  if (trimmed.length <= 6) return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`;
  if (trimmed.length <= 10) return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2, 6)}-${trimmed.slice(6)}`;
  
  return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2, 7)}-${trimmed.slice(7, 11)}`;
}
