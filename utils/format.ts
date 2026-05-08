// Subsection labels in the xlsx are SHOUTY (e.g. "BRAND NAMES THAT ARE SPANISH WORDS").
// Sentence-case them for display: first letter capital, rest lower. Verbatim text
// stays in the data file so the source remains the source of truth.
export function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
