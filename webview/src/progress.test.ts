import { describe, expect, it } from 'vitest';
import { completionPercentage, isLessonComplete } from './progress';

describe('lesson progress', () => {
  it('avoids division by zero', () => {
    expect(completionPercentage({ completed_ids: [], completed_count: 0, total_lessons: 0 })).toBe(0);
  });
  it('calculates preview completion', () => {
    expect(completionPercentage({ completed_ids: ['python-hello'], completed_count: 1, total_lessons: 3 })).toBe(33);
  });
  it('looks up completed lessons correctly', () => {
    expect(isLessonComplete({ completed_ids: ['python-hello'], completed_count: 1, total_lessons: 3 }, 'python-hello')).toBe(true);
    expect(isLessonComplete({ completed_ids: [], completed_count: 0, total_lessons: 3 }, 'python-hello')).toBe(false);
  });
});
