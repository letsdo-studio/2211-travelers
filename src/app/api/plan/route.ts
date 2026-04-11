import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TravelerProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { profile, destination, startDate, numDays, apiKey: clientKey } = await request.json() as {
      profile: TravelerProfile;
      destination: string;
      startDate: string;
      numDays: number;
      apiKey?: string;
    };

    // Server env var takes priority, then client-sent key
    const apiKey = process.env.GEMINI_API_KEY || clientKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const prompt = `אתה מתכנן טיולים מקצועי. תכנן טיול מפורט ל-${destination} למשך ${numDays} ימים.
מתחיל בתאריך: ${startDate}

פרופיל המטיילים:
- שמות: ${profile.names}
- סגנון: ${profile.travelStyle === 'spontaneous' ? 'ספונטני' : profile.travelStyle === 'planned' ? 'מתוכנן' : 'משולב'}
- תקציב ללילה: €${profile.budgetPerNight.min}-${profile.budgetPerNight.max}
- רמת לינה: ${profile.accommodationLevel}
- תחומי עניין: ${profile.interests.join(', ')}
- קצב: ${profile.pace === 'relaxed' ? 'רגוע' : profile.pace === 'moderate' ? 'מאוזן' : 'אינטנסיבי'}
- השכמה: ${profile.wakeUpTime}
- אוכל - בוקר: ${profile.foodPreferences.breakfast}, צהריים: ${profile.foodPreferences.lunch}, ערב: ${profile.foodPreferences.dinner}, קפה: ${profile.foodPreferences.coffee}
- צרכים מיוחדים: ${profile.specialNeeds || 'אין'}

חובה לכלול:
1. לכל יום: פעילויות מחולקות ל-3 עדיפויות: "must" (חובה), "should" (כדאי), "if-time" (אם יש זמן)
2. המלצות אוכל: בוקר, צהריים, ערב, קפה - עם שמות מסעדות אמיתיים ומחירים
3. לינה מומלצת עם חלופות
4. העברות בין מקומות עם זמנים מדויקים
5. טיפים על רמת עומס תיירותי ושעות מומלצות לביקור
6. הערות על נוף מיוחד בדרך, שקיעות, חוויות

החזר JSON תקין בפורמט הבא (בלי markdown, רק JSON):
{
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "location": "שם המקום",
      "accommodation": {
        "name": "שם",
        "type": "סוג",
        "pricePerNight": "€XX",
        "checkIn": "HH:MM",
        "checkOut": "HH:MM",
        "location": "כתובת",
        "rating": "X/5",
        "bookingStatus": "suggested",
        "alternatives": ["חלופה 1", "חלופה 2"]
      },
      "activities": [
        {
          "id": "unique-id",
          "name": "שם",
          "description": "תיאור",
          "priority": "must|should|if-time",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "location": "מיקום",
          "cost": "€XX",
          "tips": "טיפים",
          "crowdLevel": "רמת עומס",
          "bestTimeToVisit": "שעה מומלצת",
          "status": "suggested"
        }
      ],
      "meals": [
        {
          "id": "unique-id",
          "type": "breakfast|lunch|dinner|coffee",
          "restaurant": "שם",
          "description": "תיאור",
          "priceRange": "€XX-XX",
          "location": "מיקום",
          "rating": "X/5",
          "source": "מקור ההמלצה",
          "status": "suggested"
        }
      ],
      "transit": {
        "from": "מוצא",
        "to": "יעד",
        "method": "אמצעי",
        "departureTime": "HH:MM",
        "arrivalTime": "HH:MM",
        "duration": "XX דקות",
        "cost": "€XX",
        "scenicNotes": "הערות על נוף",
        "tips": "טיפים"
      },
      "notes": "הערות ליום"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to extract JSON from response - handle markdown code blocks too
    let jsonText = text.trim();
    // Remove markdown code fences if present
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    // Find first { and last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json(
        { error: `No JSON found in Gemini response. Raw: ${text.slice(0, 200)}` },
        { status: 500 }
      );
    }
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);

    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (parseErr) {
      return NextResponse.json(
        {
          error: `JSON parse error: ${parseErr instanceof Error ? parseErr.message : 'unknown'}. Raw: ${jsonText.slice(0, 200)}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Plan API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Gemini API error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
