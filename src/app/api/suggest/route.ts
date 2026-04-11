import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Trip } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { message, trip, apiKey: clientKey } = await request.json() as {
      message: string;
      trip: Trip;
      apiKey?: string;
    };

    const apiKey = process.env.GEMINI_API_KEY || clientKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `אתה עוזר טיולים חכם ואישי. המטייל נמצא ב${trip.destination}.

פרטי הטיול:
- יעד: ${trip.destination}
- תאריכים: ${trip.startDate} עד ${trip.endDate}
- מספר ימים: ${trip.itinerary.length}

שאלת המטייל: ${message}

ענה בעברית, בצורה חמה וידידותית. תן המלצות ספציפיות עם:
- שמות מקומות אמיתיים
- מחירים משוערים
- טיפים פרקטיים
- אימוג'ים לקריאות נוחה
- הצעות חלופיות

אם המטייל שואל על שינוי בתוכנית, הצע אפשרויות ושאל שאלות שיעזרו לו להחליט.
ענה בקצרה וממוקד (עד 200 מילים).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ response: response.text || '' });
  } catch (error) {
    console.error('Suggest API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Gemini API error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
