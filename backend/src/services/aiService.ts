import { buildPrompt, parseAIResponse, GenerationInput } from './promptBuilder';
import { IQuestionPaper } from '../models/Assignment';

async function generateWithGroq(prompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert teacher. You always respond with valid JSON only. No markdown, no explanation, no backticks — just raw JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return (data as any).choices?.[0]?.message?.content || '';
}

export async function generateQuestionPaper(
  input: GenerationInput
): Promise<IQuestionPaper> {
  const prompt = buildPrompt(input);

  console.log('🤖 Calling Groq llama-3.3-70b-versatile...');

  let rawResponse = '';
  try {
    rawResponse = await generateWithGroq(prompt);
    console.log('✅ Groq response received');
  } catch (err: any) {
    console.error('Groq generation failed:', err.message);
    throw new Error(`AI generation failed: ${err.message}`);
  }

  return parseAIResponse(rawResponse, input);
}
