import { DayPlan } from './types';

export function generateDemoItinerary(
  destination: string,
  startDate: string,
  numDays: number
): DayPlan[] {
  const destinations: Record<string, DayPlan[]> = {
    default: generateGenericItinerary(destination, startDate, numDays),
  };

  return destinations.default;
}

function generateGenericItinerary(
  destination: string,
  startDate: string,
  numDays: number
): DayPlan[] {
  const days: DayPlan[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < numDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayNumber: i + 1,
      location: destination,
      accommodation: {
        name: `מלון ${destination} סנטרל`,
        type: i % 2 === 0 ? 'בוטיק' : 'Airbnb',
        pricePerNight: '€80-120',
        checkIn: '15:00',
        checkOut: '11:00',
        location: `מרכז ${destination}`,
        rating: '4.5/5',
        bookingStatus: 'suggested',
        alternatives: [`הוסטל ${destination}`, `Airbnb ברובע הישן`],
      },
      activities: [
        {
          id: `act-${i}-1`,
          name: `סיור ברובע ההיסטורי של ${destination}`,
          description: `סיור רגלי במרכז ההיסטורי, ארכיטקטורה מדהימה ואטמוספירה מקומית`,
          priority: 'must',
          startTime: '09:00',
          endTime: '12:00',
          location: `הרובע ההיסטורי, ${destination}`,
          cost: 'חינם',
          tips: 'כדאי להתחיל מוקדם לפני הקהל. מומלץ לקחת מדריך מקומי',
          crowdLevel: 'בינוני - עמוס מ-11:00',
          bestTimeToVisit: '08:00-10:00 בבוקר',
          status: 'suggested',
        },
        {
          id: `act-${i}-2`,
          name: `שוק מקומי`,
          description: `שוק אוכל ומוצרים מקומיים - חוויה אותנטית`,
          priority: 'must',
          startTime: '12:00',
          endTime: '14:00',
          location: `השוק המרכזי, ${destination}`,
          cost: '€10-30',
          tips: 'להביא מזומן, לטעום הכל! לשאול את המוכרים להמלצות',
          crowdLevel: 'עמוס בצהריים',
          bestTimeToVisit: '08:00-10:00 או 16:00-18:00',
          status: 'suggested',
        },
        {
          id: `act-${i}-3`,
          name: `נקודת תצפית`,
          description: `נוף פנורמי מרהיב של העיר - מושלם לשקיעה`,
          priority: 'should',
          startTime: '17:00',
          endTime: '19:00',
          location: `הגבעה המערבית, ${destination}`,
          cost: '€5',
          tips: 'להגיע 30 דקות לפני השקיעה. לקחת שכבה חמה',
          crowdLevel: 'נמוך בימי חול',
          bestTimeToVisit: 'שעה לפני השקיעה',
          status: 'suggested',
        },
        {
          id: `act-${i}-4`,
          name: `מוזיאון מקומי`,
          description: `מוזיאון עם אוספים מרתקים של אמנות מקומית`,
          priority: 'if-time',
          startTime: '14:00',
          endTime: '16:00',
          location: `רחוב התרבות, ${destination}`,
          cost: '€12',
          tips: 'יום שלישי כניסה חינם. יש אודיו גייד בעברית',
          crowdLevel: 'נמוך',
          bestTimeToVisit: 'אחרי הצהריים',
          status: 'suggested',
        },
      ],
      meals: [
        {
          id: `meal-${i}-1`,
          type: 'breakfast',
          restaurant: `Café ${destination}`,
          description: 'בית קפה מקומי מקסים עם ארוחות בוקר מעולות',
          priceRange: '€8-15',
          location: 'ליד הכיכר המרכזית',
          rating: '4.7/5',
          source: 'המלצות מטיילים + Google Reviews',
          status: 'suggested',
        },
        {
          id: `meal-${i}-2`,
          type: 'lunch',
          restaurant: 'מסעדה מקומית בשוק',
          description: 'אוכל רחוב מעולה ומנות מסורתיות',
          priceRange: '€5-15',
          location: 'בתוך השוק',
          rating: '4.5/5',
          source: 'TripAdvisor Top 10',
          status: 'suggested',
        },
        {
          id: `meal-${i}-3`,
          type: 'dinner',
          restaurant: `Trattoria ${destination}`,
          description: 'מסעדה מקומית אותנטית עם אווירה נהדרת',
          priceRange: '€15-30',
          location: 'ברובע הישן',
          rating: '4.6/5',
          source: 'המלצת מקומיים',
          status: 'suggested',
        },
        {
          id: `meal-${i}-4`,
          type: 'coffee',
          restaurant: 'Specialty Coffee Shop',
          description: 'קפה מעולה ועוגות טריות',
          priceRange: '€3-6',
          location: 'ליד נקודת התצפית',
          rating: '4.8/5',
          source: 'Google Maps',
          status: 'suggested',
        },
      ],
      transit:
        i < numDays - 1
          ? {
              from: destination,
              to: destination,
              method: 'הליכה רגלית + תחבורה ציבורית',
              departureTime: '09:00',
              arrivalTime: '09:15',
              duration: '15 דקות',
              cost: '€2',
              scenicNotes: 'מסלול יפה דרך הפארק המרכזי',
              tips: 'לקנות כרטיס יומי - משתלם יותר',
            }
          : null,
      notes: i === 0
        ? `יום ראשון ב${destination}! כדאי להתחיל בסיור כללי כדי להתמצא`
        : i === numDays - 1
          ? 'יום אחרון - לארוז בבוקר, לנצל את הזמן שנשאר'
          : `יום ${i + 1} - אפשר להיות ספונטניים ולשנות את התוכנית`,
    });
  }

  return days;
}

export function generateDemoSuggestions(destination: string) {
  return [
    {
      id: 'sug-1',
      type: 'activity' as const,
      title: `סיור אוכל מודרך ב${destination}`,
      description: `סיור של 3 שעות שכולל טעימות ב-6 מקומות מקומיים. מומלץ מאוד על ידי מטיילים!`,
      reason: 'מתאים לסגנון הטיול שלכם - ספונטני ואוהבי אוכל',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'sug-2',
      type: 'accommodation' as const,
      title: `Airbnb מיוחד עם נוף`,
      description: `דירה עם מרפסת ונוף פנורמי, €90 ללילה. ביקורות מעולות.`,
      reason: 'זמין להזמנה מיידית, מתאים לתקציב שלכם',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'sug-3',
      type: 'general' as const,
      title: `מחר צפוי מזג אוויר מעולה`,
      description: `כדאי לתכנן את הפעילויות החיצוניות למחר. 22°C עם שמש`,
      reason: 'התאמה דינמית לתנאי מזג אוויר',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
  ];
}
