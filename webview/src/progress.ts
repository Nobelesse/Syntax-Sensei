export interface Lesson {
  id: string;
  language: string;
  title: string;
  level: string;
  duration_minutes: number;
  description: string;
  code: string;
  explanation: string[];
  expected_output: string;
}

export interface Progress {
  completed_ids: string[];
  completed_count: number;
  total_lessons: number;
}

export interface Bootstrap {
  app: string;
  phase: number;
  description: string;
  lessons: Lesson[];
  progress: Progress;
  features: Record<string, string>;
}

export function completionPercentage(progress: Progress): number {
  if (progress.total_lessons <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(100 * progress.completed_count / progress.total_lessons)));
}

export function isLessonComplete(progress: Progress, lessonId: string): boolean {
  return progress.completed_ids.includes(lessonId);
}
