// Assignment types
export type QuestionType =
  | 'Multiple Choice Questions'
  | 'Short Questions'
  | 'Diagram/Graph-Based Questions'
  | 'Numerical Problems'
  | 'Long Answer Questions'
  | 'True/False'
  | 'Fill in the Blanks';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type AssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionTypeConfig {
  id: string;
  type: QuestionType;
  numberOfQuestions: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  fileUrl?: string;
  fileName?: string;
  status: AssignmentStatus;
  result?: QuestionPaper;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
  type: QuestionType;
  options?: string[]; // for MCQ
  answer?: string;
}

export interface Section {
  id: string;
  title: string; // e.g., "Section A"
  instruction: string; // e.g., "Attempt all questions"
  questions: Question[];
  totalMarks: number;
}

export interface QuestionPaper {
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  maximumMarks: number;
  date: string;
  sections: Section[];
  totalQuestions: number;
  totalMarks: number;
}

// Store types
export interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  jobStatus: Record<string, { status: string; progress: number }>;

  fetchAssignments: () => Promise<void>;
  createAssignment: (data: CreateAssignmentPayload) => Promise<Assignment>;
  fetchAssignment: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updateJobStatus: (assignmentId: string, status: string, progress: number) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
}

export interface CreateAssignmentPayload {
  title: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions?: string;
  file?: File;
}

// Form step state
export interface AssignmentFormState {
  step: number;
  title: string;
  subject: string;
  grade: string;
  chapter: string;
  dueDate: string;
  file: File | null;
  fileName: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
}

// WebSocket event types
export interface WSJobUpdate {
  assignmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: QuestionPaper;
}
