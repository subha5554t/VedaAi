import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { IExtractedQuestion, IMappedAnswer } from '../models/Exam';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.5 Flash — free tier, multimodal (reads images)
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ─── Step A: Extract Questions from Question Paper ────────────────────────────

export async function extractQuestionsFromImages(
  pageBase64Images: string[]
): Promise<IExtractedQuestion[]> {
  const imageParts: Part[] = pageBase64Images
    .filter(Boolean)
    .map((b64) => ({
      inlineData: { mimeType: 'image/png' as const, data: b64 },
    }));

  const prompt = `You are an expert OCR AI system specialized in educational assessment extraction.
Your task is to analyze the provided question paper image and extract ALL questions in exact chronological order.

### EXTRACTION RULES
1. Sub-parts Handling: Split nested sub-parts (e.g., "Q2(a)", "Q2(b)", "11a") into SEPARATE, distinct entries.
2. Parent Mapping: For sub-parts, assign the \`parentId\` field to the parent question's ID (e.g., ID "q2" for sub-part "q2a").
3. Text Preservation: Preserve the exact original question text, including any math formulas, symbols, or diagram descriptions. Do NOT summarize.
4. Marks: If marks or point values are visible next to a question, extract them as a number.
5. Numbering: Retain the original question numbering exactly as it appears in the text in the \`number\` field (e.g., "1", "2(a)", "11").

### OUTPUT FORMAT
You MUST return ONLY a valid, minified JSON array matching the schema below. Do not include markdown code fences (\`\`\`json), backticks, or any conversational text.

[
  {
    "id": "q1",
    "number": "1",
    "text": "Which blood vessel carries blood away from the heart?",
    "subPart": null,
    "parentId": null,
    "marks": 1
  },
  {
    "id": "q2a",
    "number": "2(a)",
    "text": "Name the process by which plants make food.",
    "subPart": "a",
    "parentId": "q2",
    "marks": 2
  }
]`;

  const result = await visionModel.generateContent([prompt, ...imageParts]);
  const text = result.response.text().trim();

  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions: IExtractedQuestion[] = JSON.parse(clean);
    return questions.map((q) => ({
      ...q,
      subPart: q.subPart || undefined,
      parentId: q.parentId || undefined,
    }));
  } catch (err: any) {
    console.error('Failed to parse question extraction response:', text);
    throw new Error(`Question extraction parse failed: ${err.message}`);
  }
}

// ─── Step B: Map Answers to Questions ────────────────────────────────────────

export async function mapAnswersFromImages(
  answerPageBase64Images: string[],
  questions: IExtractedQuestion[]
): Promise<IMappedAnswer[]> {
  const questionList = questions
    .map((q) => `- ID: "${q.id}" | Number: "${q.number}" | Text: "${q.text.slice(0, 150)}"`)
    .join('\n');

  const allAnswers: IMappedAnswer[] = [];

  // Process each page individually for better accuracy
  for (let pageIndex = 0; pageIndex < answerPageBase64Images.length; pageIndex++) {
    const b64 = answerPageBase64Images[pageIndex];
    if (!b64) continue;

    const imagePart: Part = {
      inlineData: { mimeType: 'image/png' as const, data: b64 },
    };

    const prompt = `You are an expert AI vision system specialized in grading student handwritten answer sheets.
You are currently analyzing Page ${pageIndex + 1} of a handwritten answer sheet.

### TARGET QUESTIONS
The following questions need to be mapped to the answers on this page:
${questionList}

### EXTRACTION RULES
For each question that has a corresponding answer visible on THIS PAGE:
1. Bounding Box: Locate the exact answer region (handwritten text, diagrams, or both). Calculate the bounding box as a PERCENTAGE of the total image dimensions (0-100 for top, left, width, height).
2. Transcription: Transcribe the handwritten text as accurately as possible. Preserve line breaks if relevant.
3. Status: Mark \`answered: true\` if the answer is found. If the answer is NOT on this specific page, do NOT include the question in the output.

### OUTPUT FORMAT
You MUST return ONLY a valid, minified JSON array matching the schema below. Do not include markdown code fences (\`\`\`json), backticks, or any conversational text.

[
  {
    "questionId": "q1",
    "pageIndex": ${pageIndex},
    "boundingBox": { "top": 12.5, "left": 5.0, "width": 90.0, "height": 18.2 },
    "answerText": "The aorta carries blood away from the heart.",
    "answered": true
  }
]

IMPORTANT: Only include questions that are explicitly answered on THIS specific page.`;

    try {
      const result = await visionModel.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      if (!clean || clean === '[]') continue;

      const pageAnswers: IMappedAnswer[] = JSON.parse(clean);
      allAnswers.push(...pageAnswers.filter((a) => a.answered));
    } catch (err: any) {
      console.error(`Failed to parse answer mapping for page ${pageIndex}:`, err.message);
    }
  }

  // Mark unanswered questions
  const answeredIds = new Set(allAnswers.map((a) => a.questionId));
  for (const q of questions) {
    if (!answeredIds.has(q.id)) {
      allAnswers.push({
        questionId: q.id,
        pageIndex: 0,
        boundingBox: { top: 0, left: 0, width: 0, height: 0 },
        answerText: '',
        answered: false,
      });
    }
  }

  return allAnswers;
}

// ─── Step C: Grade Answers + Generate Feedback (Groq — text only) ────────────

export async function gradeAnswersWithGroq(
  questions: IExtractedQuestion[],
  answers: IMappedAnswer[]
): Promise<IMappedAnswer[]> {
  const gradedAnswers = [...answers];

  // Batch questions for efficiency — grade up to 5 at a time
  const batchSize = 5;
  const answeredPairs = questions
    .map((q) => ({ q, a: answers.find((a) => a.questionId === q.id) }))
    .filter((pair) => pair.a?.answered);

  for (let i = 0; i < answeredPairs.length; i += batchSize) {
    const batch = answeredPairs.slice(i, i + batchSize);
    const batchInput = batch
      .map(
        ({ q, a }) =>
          `Q_ID: ${q.id} | Question: "${q.text}" | Max Marks: ${q.marks || 'unspecified'} | Student Answer: "${a!.answerText}"`
      )
      .join('\n\n');

    const prompt = `You are an expert educational grader and teacher.
Your task is to fairly and accurately grade the following batch of student answers.

### ANSWERS TO GRADE
${batchInput}

### GRADING RULES
1. Accuracy: Evaluate the student's answer against standard educational knowledge for the specific question.
2. Scoring: Assign a \`score\` (number) up to the specified \`maxScore\`. You may assign partial marks if the answer is partially correct.
3. Feedback: Provide constructive, encouraging, and clear feedback. Explain what the student did right and where they can improve.

### OUTPUT FORMAT
You MUST return ONLY a valid, minified JSON array matching the schema below. Do not include markdown code fences (\`\`\`json), backticks, or any conversational text.

[
  {
    "questionId": "q1",
    "score": 1,
    "maxScore": 1,
    "feedback": "Correct! The aorta is indeed the main artery carrying oxygenated blood away from the heart."
  }
]`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an expert teacher. Respond with valid JSON only. No markdown, no backticks.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2048,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        console.error('Groq grading error:', response.status);
        continue;
      }

      const data = await response.json() as any;
      const rawText = data.choices?.[0]?.message?.content || '[]';
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Groq returns json_object — might be { grades: [...] } or directly [...]
      let grades: any[] = [];
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) grades = parsed;
      else if (parsed.grades) grades = parsed.grades;
      else grades = Object.values(parsed).find(Array.isArray) || [];

      for (const grade of grades) {
        const idx = gradedAnswers.findIndex((a) => a.questionId === grade.questionId);
        if (idx !== -1) {
          gradedAnswers[idx] = {
            ...gradedAnswers[idx],
            score: grade.score,
            maxScore: grade.maxScore,
            feedback: grade.feedback,
          };
        }
      }
    } catch (err: any) {
      console.error('Grading batch failed:', err.message);
    }
  }

  return gradedAnswers;
}
