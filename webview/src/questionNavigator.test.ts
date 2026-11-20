import { describe, expect, it } from 'vitest';
import { buildQuestionIndex } from './questionNavigator';

describe('AI question navigation', () => {
  it('indexes only user turns with their original positions', () => {
    const turns = [
      { role: 'user' as const, content: 'What are operators in Python?' },
      { role: 'assistant' as const, content: 'Seven types.' },
      { role: 'user' as const, content: 'Explain bitwise.\n\nprint(1 & 2)' },
      { role: 'assistant' as const, content: 'Bitwise example.' },
    ];
    expect(buildQuestionIndex(turns)).toEqual([
      { turnIndex: 0, number: 1, preview: 'What are operators in Python?' },
      { turnIndex: 2, number: 2, preview: 'Explain bitwise.' },
    ]);
  });
  it('returns no entries for an empty or assistant-only session', () => {
    expect(buildQuestionIndex([])).toEqual([]);
    expect(buildQuestionIndex([{ role: 'assistant', content: 'Hello' }])).toEqual([]);
  });
  it('shortens long question previews without losing the full conversation', () => {
    const full = 'A'.repeat(240);
    const nav = buildQuestionIndex([{ role: 'user', content: full }]);
    expect(nav[0].preview.length).toBeLessThanOrEqual(120);
    expect(nav[0].preview.endsWith('...')).toBe(true);
    expect(full.length).toBe(240);
  });
});
