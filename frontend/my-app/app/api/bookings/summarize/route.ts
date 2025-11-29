import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// AI summary generator using OpenAI
async function generateAISummary(
  booking: {
    title: string;
    attendees: string[];
    duration: string;
    description?: string;
  },
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const prompt = `Based on this meeting information, generate a brief, professional summary (2-3 sentences) of what might have been discussed:

Meeting Title: ${booking.title}
Attendees: ${booking.attendees.join(', ') || 'Not specified'}
Duration: ${booking.duration}
Description: ${booking.description || 'No description provided'}

Generate a plausible summary of what was likely discussed in this meeting. Be concise and professional.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates brief, professional meeting summaries based on available metadata.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  const summary = completion.choices[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error('Failed to generate summary from OpenAI');
  }
  
  return summary;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking, apiKey } = body;

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking data is required' },
        { status: 400 }
      );
    }

    // Check if API key is provided
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'OpenAI API key is required to generate summaries. Please provide your API key in the header.' },
        { status: 400 }
      );
    }

    console.log('[BOOKINGS/SUMMARIZE API] Generating summary for:', booking.title);

    const summary = await generateAISummary(booking, apiKey);

    console.log('[BOOKINGS/SUMMARIZE API] Summary generated:', summary.substring(0, 50) + '...');

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('[BOOKINGS/SUMMARIZE API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

