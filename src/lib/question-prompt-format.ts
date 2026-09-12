/** Restore sentence spacing from PDF extraction without changing words or URLs. */
export function formatQuestionPrompt(text: string): string[] {
  const spaced = text.split(/(https?:\/\/\S+|www\.\S+)/g).map((part, index) =>
    index % 2 ? part : part.replace(/([a-zÀ-ÿ]{2,}[”"’']?[.!?][”"’']?)(?=[A-ZÀ-Ý“"])/g, '$1\n\n'),
  ).join('');
  return spaced.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}
