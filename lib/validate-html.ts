export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const REFUSAL_PHRASES = [
  "i can't",
  "i cannot",
  "i'm sorry",
  "i am sorry",
  "as an ai",
  "as a language model",
  "i'm unable",
];

export function validateHtmlResponse(html: string): ValidationResult {
  const trimmed = html.trim();

  if (trimmed.length < 50) {
    return { valid: false, error: "Response too short to be valid HTML." };
  }

  if (trimmed.startsWith("```")) {
    return { valid: false, error: "Response contained markdown fences instead of raw HTML." };
  }

  const hasHtmlStructure =
    trimmed.includes("<html") ||
    trimmed.includes("<body") ||
    trimmed.includes("<!DOCTYPE") ||
    trimmed.includes("<!doctype");

  if (!hasHtmlStructure) {
    const lower = trimmed.toLowerCase();
    const isRefusal = REFUSAL_PHRASES.some((phrase) => lower.includes(phrase));
    if (isRefusal) {
      return { valid: false, error: "The model refused the request." };
    }
    return { valid: false, error: "Response doesn't look like an HTML document." };
  }

  return { valid: true };
}

export function stripMarkdownFences(html: string): string {
  let result = html.trim();
  if (result.startsWith("```html")) {
    result = result.slice(7);
  } else if (result.startsWith("```")) {
    result = result.slice(3);
  }
  if (result.endsWith("```")) {
    result = result.slice(0, -3);
  }
  return result.trim();
}
