import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TravelerProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { profile, destination, startDate, numDays, apiKey } = await request.json() as {
      profile: TravelerProfile;
      destination: string;
      startDate: string;
      numDays: number;
      apiKey: string;
    };

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
          "bestTimeToVisit": "שעה מומלצת"
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
          "source": "מקור ההמלצה"
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Plan API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
