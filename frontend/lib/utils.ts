import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'MMMM dd, yyyy');
  } catch {
    return dateStr;
  }
}

export function getTotalQuestions(questionTypes: { numberOfQuestions: number }[]): number {
  return questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions, 0);
}

export function getTotalMarks(questionTypes: { numberOfQuestions: number; marks: number }[]): number {
  return questionTypes.reduce((sum, qt) => sum + qt.numberOfQuestions * qt.marks, 0);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'badge-easy';
    case 'medium':
    case 'moderate':
      return 'badge-medium';
    case 'hard':
      return 'badge-hard';
    default:
      return 'badge-medium';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
