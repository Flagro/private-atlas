/**
 * Utility for merging class names (e.g. for Tailwind).
 * Add clsx + tailwind-merge later for full support.
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
