import mongoose, { Schema, Document } from 'mongoose';

export type ExamStatus =
  | 'pending'
  | 'uploading'
  | 'extracting'
  | 'analyzing'
  | 'mapping'
  | 'grading'
  | 'completed'
  | 'failed';

export interface IExtractedQuestion {
  id: string;       // "q1", "q2a", "q2b"
  number: string;   // display: "1", "2(a)", "2(b)"
  text: string;
  subPart?: string; // "a", "b", or undefined
  parentId?: string;
  marks?: number;
}

export interface IBoundingBox {
  top: number;    // % of page height (0–100)
  left: number;   // % of page width (0–100)
  width: number;  // % of page width
  height: number; // % of page height
}

export interface IMappedAnswer {
  questionId: string;
  pageIndex: number;       // 0-indexed page of answer sheet
  boundingBox: IBoundingBox;
  answerText: string;      // AI-transcribed handwriting
  answered: boolean;
  isOrphan?: boolean;      // answer found but no matching question
  feedback?: string;
  score?: number;
  maxScore?: number;
}

export interface IExam extends Document {
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
  questions: IExtractedQuestion[];
  answers: IMappedAnswer[];
  totalScore?: number;
  totalMaxScore?: number;
  jobId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const BoundingBoxSchema = new Schema<IBoundingBox>(
  {
    top: { type: Number, required: true },
    left: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

const ExtractedQuestionSchema = new Schema<IExtractedQuestion>(
  {
    id: { type: String, required: true },
    number: { type: String, required: true },
    text: { type: String, required: true },
    subPart: String,
    parentId: String,
    marks: Number,
  },
  { _id: false }
);

const MappedAnswerSchema = new Schema<IMappedAnswer>(
  {
    questionId: { type: String, required: true },
    pageIndex: { type: Number, required: true },
    boundingBox: { type: BoundingBoxSchema, required: true },
    answerText: { type: String, default: '' },
    answered: { type: Boolean, default: false },
    isOrphan: { type: Boolean, default: false },
    feedback: String,
    score: Number,
    maxScore: Number,
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    grade: { type: String, trim: true },
    studentName: { type: String, trim: true },
    questionPaperUrl: { type: String, required: true },
    answerSheetUrl: { type: String, required: true },
    questionPaperFileName: { type: String, default: '' },
    answerSheetFileName: { type: String, default: '' },
    questionPaperPages: { type: Number, default: 0 },
    answerSheetPages: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'uploading', 'extracting', 'analyzing', 'mapping', 'grading', 'completed', 'failed'],
      default: 'pending',
    },
    progressStep: { type: String, default: 'Queued...' },
    questions: [ExtractedQuestionSchema],
    answers: [MappedAnswerSchema],
    totalScore: Number,
    totalMaxScore: Number,
    jobId: String,
    errorMessage: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret._id = ret._id.toString();
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

export default mongoose.model<IExam>('Exam', ExamSchema);
