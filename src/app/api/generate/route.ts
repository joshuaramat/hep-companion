import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a physical therapy assistant. Given a clinical scenario, respond with 3-5 exercise suggestions in JSON format. Each item must include:
- exercise_name (string)
- sets (integer)
- reps (integer)
- frequency (string)
- citations (array of objects with title, authors, journal, year, doi, and url)

For each exercise, include 1-2 relevant peer-reviewed research citations from PubMed, JOSPT, or other reputable physical therapy journals. The citations should directly support the exercise parameters (sets, reps, frequency) you're recommending.

Example format:
{
  "exercise_name": "Squat",
  "sets": 3,
  "reps": 12,
  "frequency": "3 times per week",
  "citations": [
    {
      "title": "The Effect of Squat Depth on Lower Extremity Joint Kinematics and Kinetics",
      "authors": "Hartmann H, Wirth K, Klusemann M",
      "journal": "Journal of Strength and Conditioning Research",
      "year": "2013",
      "doi": "10.1519/JSC.0b013e31826d9d7a",
      "url": "https://pubmed.ncbi.nlm.nih.gov/22820210/"
    }
  ]
}

Do not explain the exercises. Do not include instructions. Only output a valid JSON array of suggestions with citations.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Remove markdown code block syntax if present
    const cleanResponse = response.replace(/```json\n|\n```/g, '').trim();
    
    // Parse the response to ensure it's valid JSON
    const suggestions = JSON.parse(cleanResponse);

    // Validate the suggestions format
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid response format: expected an array of suggestions');
    }

    // Validate each suggestion
    const validatedSuggestions = suggestions.map(suggestion => {
      if (!suggestion.exercise_name || typeof suggestion.exercise_name !== 'string') {
        throw new Error('Invalid suggestion: missing or invalid exercise_name');
      }
      if (!suggestion.sets || typeof suggestion.sets !== 'number') {
        throw new Error('Invalid suggestion: missing or invalid sets');
      }
      if (!suggestion.reps || typeof suggestion.reps !== 'number') {
        throw new Error('Invalid suggestion: missing or invalid reps');
      }
      if (!suggestion.frequency || typeof suggestion.frequency !== 'string') {
        throw new Error('Invalid suggestion: missing or invalid frequency');
      }
      if (!suggestion.citations || !Array.isArray(suggestion.citations)) {
        throw new Error('Invalid suggestion: missing or invalid citations');
      }
      return {
        ...suggestion,
        id: nanoid(8)
      };
    });

    // Generate a short ID for the suggestions
    const suggestionId = nanoid(8);

    return NextResponse.json({ 
      id: suggestionId,
      suggestions: validatedSuggestions
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        code: 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
} 