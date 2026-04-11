import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { TravelerProfile, Destination, TransportInfo } from '@/lib/types';

interface PlanRequest {
  travelers: TravelerProfile[];
  destinations: Destination[];
  startDate: string;
  endDate: string;
  numDays: number;
  purpose: string;
  customInstructions: string;
  arrival: TransportInfo | null;
  departure: TransportInfo | null;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PlanRequest;
    const {
      travelers, destinations, startDate, endDate, numDays,
      purpose, customInstructions, arrival, departure,
      apiKey: clientKey,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || clientKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const travelersDesc = travelers.map((t, i) => `
מטייל ${i + 1}: ${t.name}
- סגנון: ${t.travelStyle === 'spontaneous' ? 'ספונטני' : t.travelStyle === 'planned' ? 'מתוכנן' : 'משולב'}
- תקציב ללילה: €${t.budgetPerNight.min}-${t.budgetPerNight.max}
- רמת לינה: ${t.accommodationLevel}
- תחומי עניין: ${t.interests.join(', ')}
- קצב: ${t.pace === 'relaxed' ? 'רגוע' : t.pace === 'moderate' ? 'מאוזן' : 'אינטנסיבי'}
- שעת השכמה: ${t.wakeUpTime}
- העדפות אוכל: בוקר=${t.foodPreferences.breakfast}, צהריים=${t.foodPreferences.lunch}, ערב=${t.foodPreferences.dinner}, קפה=${t.foodPreferences.coffee}
- חשוב למטייל הזה: ${t.importantThings || 'כללי'}
- צרכים מיוחדים: ${t.specialNeeds || 'אין'}
`).join('\n');

    const destinationsDesc = destinations.map((d, i) =>
      `יעד ${i + 1}: ${d.name}${d.country ? `, ${d.country}` : ''} (${d.startDate} עד ${d.endDate})`
    ).join('\n');

    const prompt = `אתה מתכנן טיולים מקצועי. יוצרים מאגר המלצות עשיר עבור הטיול הבא.

**חשוב מאוד**: אתה לא משבץ פעילויות לימים ספציפיים! אתה רק מספק מאגר המלצות שהמטייל יבחר מהן ויסדר בעצמו.

## פרטי הטיול:
- שם: ${purpose ? `מטרה - ${purpose}` : 'טיול כללי'}
- תאריכים: ${startDate} עד ${endDate} (${numDays} ימים)
- מספר מטיילים: ${travelers.length}

## יעדים:
${destinationsDesc}

## מטיילים:
${travelersDesc}

## הגעה ועזיבה:
${arrival ? `הגעה: ${arrival.type} ${arrival.number || ''} מ-${arrival.from} ב-${arrival.date} בשעה ${arrival.time}` : 'לא צוין'}
${departure ? `עזיבה: ${departure.type} ${departure.number || ''} ל-${departure.to} ב-${departure.date} בשעה ${departure.time}` : 'לא צוין'}

## הנחיות מיוחדות מהמטייל:
${customInstructions || 'אין'}

## משימה:
החזר מאגר המלצות עשיר ומפורט שמתחשב בהעדפות **של כל המטיילים** (גם אם הן שונות). אם מטייל אחד אוהב יוגה ואחר אוהב שווקי לילה - תכלול שניהם.

חשוב לכלול:
1. **אטרקציות מגוונות** - 12-20 אטרקציות מחולקות ל"חובה", "כדאי", "אם יש זמן" (לכל יעד)
2. **תיאור איזורי** - הסבר קצר על כל יעד ומה החוויה העיקרית בו
3. **מלונות מומלצים** - 3-5 לכל יעד (תקציב/בינוני/פרימיום) עם יתרונות וחסרונות
4. **מסעדות לכל ארוחה** - בוקר, צהריים, ערב, קפה - עם שמות אמיתיים
5. **המלצות תחבורה**:
   - בין יעדים (אם יש כמה) - רכבת/אוטובוס/טיסה עם זמנים
   - בתוך העיר - תחבורה ציבורית, אופניים, הליכה
   - נקודה לנקודה - איך הכי טוב להגיע מאטרקציה אחת לאחרת
6. **טיפים על עומס תיירותי** ושעות מומלצות לביקור

החזר JSON תקין בלבד בפורמט המדויק:
{
  "destinations": [
    {
      "id": "dest-1",
      "name": "שם היעד",
      "description": "תיאור קצר של 2-3 משפטים על היעד",
      "highlights": ["דבר מרכזי 1", "דבר מרכזי 2", "דבר מרכזי 3"]
    }
  ],
  "attractions": [
    {
      "id": "att-1",
      "name": "שם",
      "description": "תיאור קצר",
      "priority": "must",
      "duration": "X שעות",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "location": "מיקום",
      "cost": "€X",
      "tips": "טיפים פרקטיים",
      "crowdLevel": "רמת עומס וזמנים",
      "bestTimeToVisit": "המלצה לזמן ביקור",
      "destinationName": "שם היעד",
      "category": "history|nature|food|art|nightlife|shopping|adventure|beach|culture|local"
    }
  ],
  "meals": [
    {
      "id": "meal-1",
      "type": "breakfast",
      "restaurant": "שם",
      "description": "תיאור",
      "priceRange": "€XX-XX",
      "location": "כתובת/אזור",
      "rating": "X.X/5",
      "source": "מקור ההמלצה",
      "destinationName": "שם היעד",
      "cuisine": "סוג מטבח"
    }
  ],
  "accommodations": [
    {
      "id": "acc-1",
      "name": "שם",
      "type": "מלון/Airbnb/הוסטל",
      "pricePerNight": "€XX",
      "checkIn": "15:00",
      "checkOut": "11:00",
      "location": "אזור",
      "rating": "X.X/5",
      "bookingStatus": "suggested",
      "alternatives": [],
      "destinationName": "שם היעד",
      "pros": ["יתרון 1"],
      "cons": ["חסרון 1"]
    }
  ],
  "transports": [
    {
      "id": "trans-1",
      "from": "מאיפה",
      "to": "לאן",
      "mode": "אופנוע/אופניים/הליכה/רכבת/אוטובוס",
      "alternativeModes": ["חלופה 1", "חלופה 2"],
      "duration": "X דקות",
      "cost": "€X",
      "notes": "טיפים והערות",
      "status": "suggested",
      "scenic": true,
      "category": "inter-city"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '';
    let jsonText = text.trim();
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      return NextResponse.json(
        { error: `No JSON found in Gemini response. Raw: ${text.slice(0, 300)}` },
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
          error: `JSON parse error: ${parseErr instanceof Error ? parseErr.message : 'unknown'}. Raw: ${jsonText.slice(0, 300)}`,
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
