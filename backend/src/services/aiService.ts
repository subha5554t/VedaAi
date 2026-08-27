import { buildPrompt, parseAIResponse, GenerationInput } from './promptBuilder';
import { IQuestionPaper } from '../models/Assignment';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const aiModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  systemInstruction: 'You are an expert teacher. You always respond with valid minified JSON only. No markdown, no explanation, no backticks — just raw JSON.'
});

async function generateWithGroq(prompt: string): Promise<string> {
  const result = await aiModel.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return text;
}

export async function generateQuestionPaper(
  input: GenerationInput
): Promise<IQuestionPaper> {
  const prompt = buildPrompt(input);

  console.log('Calling Groq LLM API...');

  let rawResponse = '';
  try {
    rawResponse = await generateWithGroq(prompt);
    console.log('Groq response received');
  } catch (err: any) {
    console.error('Groq generation failed:', err.message);
    throw new Error(`AI generation failed: ${err.message}`);
  }

  return parseAIResponse(rawResponse, input);
}
