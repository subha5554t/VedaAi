import { IQuestionTypeConfig, IQuestionPaper, ISection, IQuestion } from '../models/Assignment';
import { v4 as uuidv4 } from 'uuid';

export interface GenerationInput {
  title: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  questionTypes: IQuestionTypeConfig[];
  additionalInstructions?: string;
  schoolName?: string;
}

export function buildPrompt(input: GenerationInput): string {
  const {
    title,
    subject = 'General',
    grade = 'Class 10',
    chapter = '',
    questionTypes,
    additionalInstructions = '',
    schoolName = 'Delhi Public School, Bokaro',
  } = input;

  const totalQuestions = questionTypes.reduce((s, qt) => s + qt.numberOfQuestions, 0);
  const totalMarks = questionTypes.reduce((s, qt) => s + qt.numberOfQuestions * qt.marks, 0);

  const questionConfig = questionTypes
    .map(
      (qt) =>
        `- ${qt.numberOfQuestions} ${qt.type} (${qt.marks} mark${qt.marks > 1 ? 's' : ''} each)`
    )
    .join('\n');

  return `You are an expert teacher creating a formal examination question paper.

ASSIGNMENT DETAILS:
- Title: ${title}
- Subject: ${subject}
- Grade/Class: ${grade}
- Chapter/Topic: ${chapter || 'General curriculum'}
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}
- School: ${schoolName}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}

QUESTION CONFIGURATION:
${questionConfig}

TASK: Generate a complete, structured question paper in strict JSON format.

IMPORTANT RULES:
1. Group questions into sections based on question type (Section A for MCQ, Section B for Short, etc.)
2. Each question MUST have a difficulty level: "Easy", "Medium", or "Hard"
3. Distribute difficulty: ~30% Easy, ~50% Medium, ~20% Hard
4. For Multiple Choice Questions, provide exactly 4 options (a, b, c, d)
5. Provide a brief answer/hint for each question in the "answer" field
6. Questions must be specific, educational, and appropriate for the grade level
7. Make questions contextually relevant to the subject and chapter

RESPOND WITH ONLY VALID JSON (no markdown, no backticks, no explanation):

{
  "schoolName": "${schoolName}",
  "subject": "${subject}",
  "grade": "${grade}",
  "timeAllowed": "3 Hours",
  "maximumMarks": ${totalMarks},
  "date": "${new Date().toISOString().split('T')[0]}",
  "totalQuestions": ${totalQuestions},
  "totalMarks": ${totalMarks},
  "sections": [
    {
      "id": "section-uuid",
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "totalMarks": 10,
      "questions": [
        {
          "id": "q-uuid",
          "text": "Question text here?",
          "difficulty": "Easy",
          "marks": 1,
          "type": "Multiple Choice Questions",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "The correct answer is Option A because..."
        }
      ]
    }
  ]
}`;
}

export function parseAIResponse(rawResponse: string, input: GenerationInput): IQuestionPaper {
  let jsonStr = rawResponse.trim();

  // Strip markdown code blocks if present
  jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  jsonStr = jsonStr.replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  // Find the JSON object
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI response as JSON:', err);
    // Return a fallback paper
    return generateFallbackPaper(input);
  }

  // Validate and normalize
  return normalizePaper(parsed, input);
}

function normalizePaper(raw: any, input: GenerationInput): IQuestionPaper {
  const totalQuestions = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions, 0);
  const totalMarks = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions * qt.marks, 0);

  const sections: ISection[] = (raw.sections || []).map((s: any) => {
    const questions: IQuestion[] = (s.questions || []).map((q: any) => ({
      id: q.id || uuidv4(),
      text: q.text || 'Question not available',
      difficulty: validateDifficulty(q.difficulty),
      marks: typeof q.marks === 'number' ? q.marks : 1,
      type: q.type || 'Short Questions',
      options: Array.isArray(q.options) ? q.options : undefined,
      answer: q.answer || undefined,
    }));

    const sectionMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return {
      id: s.id || uuidv4(),
      title: s.title || 'Section',
      instruction: s.instruction || 'Attempt all questions.',
      questions,
      totalMarks: sectionMarks,
    };
  });

  return {
    schoolName: raw.schoolName || input.schoolName || 'Delhi Public School',
    subject: raw.subject || input.subject || 'General',
    grade: raw.grade || input.grade || 'Class 10',
    timeAllowed: raw.timeAllowed || '3 Hours',
    maximumMarks: raw.maximumMarks || totalMarks,
    date: raw.date || new Date().toISOString().split('T')[0],
    sections,
    totalQuestions: raw.totalQuestions || totalQuestions,
    totalMarks: raw.totalMarks || totalMarks,
  };
}

function validateDifficulty(val: unknown): 'Easy' | 'Medium' | 'Hard' {
  if (val === 'Easy' || val === 'Medium' || val === 'Hard') return val;
  return 'Medium';
}

function generateFallbackPaper(input: GenerationInput): IQuestionPaper {
  const subject = input.subject || 'General';
  const grade = input.grade || 'Class 10';
  const chapter = input.chapter || 'General';

  const sections: ISection[] = [];

  const sectionLetters = ['A', 'B', 'C', 'D', 'E'];
  const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Medium', 'Hard', 'Easy'];

  let sectionIdx = 0;
  for (const qt of input.questionTypes) {
    const letter = sectionLetters[sectionIdx] || `${sectionIdx + 1}`;
    const questions: IQuestion[] = [];

    for (let i = 0; i < qt.numberOfQuestions; i++) {
      const diff = difficulties[i % difficulties.length];
      const q: IQuestion = {
        id: uuidv4(),
        text: `${qt.type} question ${i + 1} on ${chapter}: Please answer the following question related to ${subject}.`,
        difficulty: diff,
        marks: qt.marks,
        type: qt.type,
        answer: `This is a sample answer for question ${i + 1}.`,
      };

      if (qt.type === 'Multiple Choice Questions') {
        q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      questions.push(q);
    }

    sections.push({
      id: uuidv4(),
      title: `Section ${letter}`,
      instruction: `Attempt all questions. Each question carries ${qt.marks} mark${qt.marks > 1 ? 's' : ''}.`,
      questions,
      totalMarks: qt.numberOfQuestions * qt.marks,
    });

    sectionIdx++;
  }

  const totalQ = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions, 0);
  const totalM = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions * qt.marks, 0);

  return {
    schoolName: input.schoolName || 'Delhi Public School, Bokaro',
    subject,
    grade,
    timeAllowed: '3 Hours',
    maximumMarks: totalM,
    date: new Date().toISOString().split('T')[0],
    sections,
    totalQuestions: totalQ,
    totalMarks: totalM,
  };
}
