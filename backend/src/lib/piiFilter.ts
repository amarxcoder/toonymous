// F2.3 — scans free-text fields for identity-leaking patterns before publish.
// Regex-only for MVP (specs/04-conventions.md flags a future NER pass as a
// follow-up); matches are redacted, not silently allowed.
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const HANDLE_RE = /(?<![\w@])@[a-z0-9_]{2,30}(?![\w@])/gi;
const URL_RE = /\bhttps?:\/\/\S+/gi;

export function scrubPii(text: string): string {
  return text
    .replace(EMAIL_RE, "[redacted]")
    .replace(URL_RE, "[redacted]")
    .replace(HANDLE_RE, "[redacted]")
    .replace(PHONE_RE, "[redacted]");
}
