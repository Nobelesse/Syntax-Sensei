/** Minimal, session-only question navigation. No chat is written to disk. */
export type ConversationTurn = { role: 'user' | 'assistant'; content: string };
export type QuestionEntry = { turnIndex: number; number: number; preview: string };

export function buildQuestionIndex(turns: ReadonlyArray<ConversationTurn>): QuestionEntry[] {
  const result: QuestionEntry[] = [];
  for (let index = 0; index < turns.length; index++) {
    if (turns[index].role !== 'user') continue;
    const firstLine = turns[index].content.split(/\r?\n/).map(s => s.trim()).find(Boolean) ?? '';
    const normalized = firstLine.replace(/\s+/g, ' ');
    const preview = normalized.length > 120 ? `${normalized.slice(0, 117)}...` : (normalized || 'Code question');
    result.push({ turnIndex: index, number: result.length + 1, preview });
  }
  return result;
}
