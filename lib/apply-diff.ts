export interface DiffChange {
  search: string;
  replace: string;
}

export interface DiffResult {
  html: string;
  applied: number;
  failed: string[];
}

export function applyDiff(html: string, changes: DiffChange[]): DiffResult {
  let result = html;
  let applied = 0;
  const failed: string[] = [];

  for (const change of changes) {
    const idx = result.indexOf(change.search);
    if (idx === -1) {
      failed.push(change.search.slice(0, 80));
      continue;
    }

    const secondIdx = result.indexOf(change.search, idx + 1);
    if (secondIdx !== -1) {
      failed.push(`[ambiguous] ${change.search.slice(0, 80)}`);
      continue;
    }

    result = result.slice(0, idx) + change.replace + result.slice(idx + change.search.length);
    applied++;
  }

  return { html: result, applied, failed };
}

export function validateDiffResult(html: string): { valid: boolean; error?: string } {
  if (!html.includes('id="vibe-chat"')) {
    return { valid: false, error: "Diff removed the #vibe-chat element." };
  }
  if (!html.includes("cdn.tailwindcss.com")) {
    return { valid: false, error: "Diff removed the Tailwind CDN script." };
  }
  return { valid: true };
}
