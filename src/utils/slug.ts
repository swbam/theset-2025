// Utility helpers for SEO-friendly slugs used in route paths

/** Convert an arbitrary text string to a URL-safe slug.
 * Example:  "Queens of the Stone Age" → "queens-of-the-stone-age"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD') // strip accents
    .replace(/[^\w\s-]/g, '') // remove non words
    .trim()
    .replace(/\s+/g, '-') // spaces to dash
    .replace(/--+/g, '-'); // collapse multiple
}

/** Very naive inverse of toSlug – turns dashes back into spaces so we can do
 * a case-insensitive lookup in the database. If the original contained
 * punctuation that information is lost, but our ILIKE query tolerates it. */
export function fromSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}

/** Create SEO-friendly show URL with artist, venue, city, state, and date */
export function createShowSlug(artistName: string, venueName: string, city: string, state: string, date: string): string {
  const dateFormatted = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
  const slugText = `${artistName} ${venueName} ${city} ${state} ${dateFormatted}`;
  return toSlug(slugText);
}

