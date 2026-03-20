import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionTypeConfig {
  id: string;
  type: string;
  numberOfQuestions: number;
  marks: number;
}

export interface IQuestion {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  type: string;
  options?: string[];
  answer?: string;
}

export interface ISection {
  id: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
  totalMarks: number;
}

export interface IQuestionPaper {
  schoolName: string;
  subject: string;
  grade: string;
  timeAllowed: string;
  maximumMarks: number;
  date: string;
  sections: ISection[];
  totalQuestions: number;
  totalMarks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  dueDate: Date;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: IQuestionPaper;
  jobId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
  options: [String],
  answer: String,
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
  totalMarks: { type: Number, required: true },
});

const QuestionPaperSchema = new Schema<IQuestionPaper>({
  schoolName: String,
  subject: String,
  grade: String,
  timeAllowed: String,
  maximumMarks: Number,
  date: String,
  sections: [SectionSchema],
  totalQuestions: Number,
  totalMarks: Number,
});

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  id: { type: String },
  type: { type: String, required: true },
  numberOfQuestions: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    grade: { type: String, trim: true },
    chapter: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: { type: [QuestionTypeConfigSchema], required: true },
    additionalInstructions: String,
    fileUrl: String,
    fileName: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    result: QuestionPaperSchema,
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

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);