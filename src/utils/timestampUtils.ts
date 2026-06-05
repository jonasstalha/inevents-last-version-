/**
 * Safely converts a Firestore field value to its string representation.
 * Handles Firestore Timestamp objects ({ seconds, nanoseconds }),
 * native Date objects, and plain strings.
 */
export function toTimestampString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}
