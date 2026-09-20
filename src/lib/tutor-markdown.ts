/** Normalize model delimiters, preserving code and TeX commands such as \nu. */
export function normalizeTutorMarkdown(content: string): string {
  return content.split(/(```[\s\S]*?```|`[^`\n]*`)/g).map((part, index) => {
    if (index % 2) return part;
    return part
      .replace(/\r\n?/g, '\n')
      .replace(/\\r\\n|\\n(?=$|\s|\\n|[#*\d-])/g, '\n')
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n\n$$\n${math.trim()}\n$$\n\n`)
      .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`);
  }).join('');
}
