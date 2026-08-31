/**
 * Turns free text into a URL-safe slug: lowercase, alphanumeric words
 * joined by single hyphens, no leading/trailing hyphens.
 *
 *   slugify('GODDYS Oversized Tee') -> 'goddys-oversized-tee'
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}
