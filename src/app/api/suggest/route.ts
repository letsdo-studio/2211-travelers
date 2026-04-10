import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Trip } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { message, trip, apiKey } = await request.json() as {
      message: string;
      trip: Trip;
      apiKey: string;
    };

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    );
  }
}
