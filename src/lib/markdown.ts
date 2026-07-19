export function sanitizeMarkdown(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\r\n/g, "\n")
    .trim();
}
