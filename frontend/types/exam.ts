// ─── Exam Types ───────────────────────────────────────────────────────────────

export type ExamStatus =
  | 'pending'
  | 'uploading'
  | 'extracting'
  | 'analyzing'
  | 'mapping'
  | 'grading'
  | 'completed'
  | 'failed';

export interface BoundingBox {
  top: number;    // % of page height (0–100)
  left: number;   // % of page width (0–100)
  width: number;  // % of page width
  height: number; // % of page height
}

export interface ExtractedQuestion {
  id: string;
  number: string;
  text: string;
  subPart?: string;
  parentId?: string;
  marks?: number;
}

export interface MappedAnswer {
  questionId: string;
  pageIndex: number;
  boundingBox: BoundingBox;
  answerText: string;
  answered: boolean;
  isOrphan?: boolean;
  feedback?: string;
  score?: number;
  maxScore?: number;
}

export interface Exam {
  _id: string;
  title: string;
  subject?: string;
  grade?: string;
  studentName?: string;
  questionPaperUrl: string;
  answerSheetUrl: string;
  questionPaperFileName: string;
  answerSheetFileName: string;
  questionPaperPages: number;
  answerSheetPages: number;
  status: ExamStatus;
  progressStep: string;
  questions: ExtractedQuestion[];
  answers: MappedAnswer[];
  totalScore?: number;
  totalMaxScore?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamListItem extends Omit<Exam, 'questions' | 'answers'> {}

export interface WSExamUpdate {
  examId: string;
  status: ExamStatus;
  progress: number;
  step: string;
  type: 'exam';
}

export interface ExamStore {
  exams: ExamListItem[];
  currentExam: Exam | null;
  selectedQuestionId: string | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  jobStatus: Record<string, { status: ExamStatus; progress: number; step: string }>;

  fetchExams: () => Promise<void>;
  fetchExam: (id: string) => Promise<void>;
  createExam: (formData: FormData) => Promise<ExamListItem>;
  deleteExam: (id: string) => Promise<void>;
  setSelectedQuestion: (id: string | null) => void;
  updateExamFromSocket: (data: WSExamUpdate) => void;
}

export interface ExamUploadState {
  questionPaper: File | null;
  answerSheet: File | null;
  title: string;
  subject: string;
  grade: string;
  studentName: string;
}
