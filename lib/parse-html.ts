export interface ParsedHtml {
  headContent: string;
  bodyContent: string;
  bodyAttributes: string;
}

export function parseFullHtml(html: string): ParsedHtml {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);

  if (!headMatch && !bodyMatch) {
    return { headContent: "", bodyContent: html, bodyAttributes: "" };
  }

  return {
    headContent: headMatch?.[1]?.trim() || "",
    bodyContent: bodyMatch?.[2]?.trim() || html,
    bodyAttributes: bodyMatch?.[1]?.trim() || "",
  };
}

export function parseBodyAttributes(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let match;
  while ((match = regex.exec(attrs)) !== null) {
    result[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return result;
}
