import { Trip, RecommendationPool, DayPlan, Activity, Meal, Accommodation, TransportRecommendation, Destination } from './types';

export function generateEmptyDays(startDate: string, endDate: string, destinations: Destination[]): DayPlan[] {
  const days: DayPlan[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < numDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Find which destination this day belongs to
    const dest = destinations.find((d) => {
      return dateStr >= d.startDate && dateStr <= d.endDate;
    });

    days.push({
      date: dateStr,
      dayNumber: i + 1,
      location: dest?.name || destinations[0]?.name || '',
      destinationId: dest?.id,
      accommodationId: null,
      activityIds: [],
      mealIds: [],
      transitId: null,
      notes: '',
    });
  }

  return days;
}

export function generateDemoPool(destinations: Destination[]): RecommendationPool {
  const dest = destinations[0]?.name || 'יעד';

  const attractions: Activity[] = [
    {
      id: 'att-demo-1',
      name: `סיור ברובע ההיסטורי של ${dest}`,
      description: 'סיור רגלי במרכז ההיסטורי עם ארכיטקטורה מדהימה',
      priority: 'must',
      startTime: '09:00',
      endTime: '12:00',
      duration: '3 שעות',
      location: `הרובע ההיסטורי, ${dest}`,
      cost: 'חינם',
      tips: 'כדאי להתחיל מוקדם לפני הקהל',
      crowdLevel: 'בינוני - עמוס מ-11:00',
      bestTimeToVisit: '08:00-10:00',
      status: 'suggested',
      destinationName: dest,
      category: 'history',
    },
    {
      id: 'att-demo-2',
      name: 'שוק מקומי מרכזי',
      description: 'שוק אוכל ומוצרים מקומיים - חוויה אותנטית',
      priority: 'must',
      startTime: '10:00',
      endTime: '12:00',
      duration: '2 שעות',
      location: `השוק המרכזי, ${dest}`,
      cost: '€10-30',
      tips: 'להביא מזומן ולטעום הכל',
      crowdLevel: 'עמוס בצהריים',
      bestTimeToVisit: '08:00-10:00',
      status: 'suggested',
      destinationName: dest,
      category: 'food',
    },
    {
      id: 'att-demo-3',
      name: 'נקודת תצפית פנורמית',
      description: 'נוף מרהיב של העיר - מושלם לשקיעה',
      priority: 'should',
      startTime: '17:00',
      endTime: '19:00',
      duration: '2 שעות',
      location: `הגבעה המערבית, ${dest}`,
      cost: '€5',
      tips: 'להגיע 30 דקות לפני השקיעה',
      crowdLevel: 'נמוך בימי חול',
      bestTimeToVisit: 'שעה לפני השקיעה',
      status: 'suggested',
      destinationName: dest,
      category: 'nature',
    },
  ];

  const meals: Meal[] = [
    {
      id: 'meal-demo-1',
      type: 'breakfast',
      restaurant: `Café ${dest}`,
      description: 'בית קפה מקומי מקסים',
      priceRange: '€8-15',
      location: 'מרכז העיר',
      rating: '4.7/5',
      source: 'המלצות מטיילים',
      status: 'suggested',
      destinationName: dest,
    },
    {
      id: 'meal-demo-2',
      type: 'dinner',
      restaurant: `Trattoria ${dest}`,
      description: 'מטבח מקומי אותנטי',
      priceRange: '€20-35',
      location: 'הרובע הישן',
      rating: '4.6/5',
      source: 'TripAdvisor',
      status: 'suggested',
      destinationName: dest,
    },
  ];

  const accommodations: Accommodation[] = [
    {
      id: 'acc-demo-1',
      name: `Boutique Hotel ${dest}`,
      type: 'מלון בוטיק',
      pricePerNight: '€95',
      checkIn: '15:00',
      checkOut: '11:00',
      location: 'מרכז העיר',
      rating: '4.5/5',
      bookingStatus: 'suggested',
      alternatives: [],
      destinationName: dest,
      pros: ['מיקום מרכזי', 'אווירה מקסימה'],
      cons: ['קצת רועש בלילה'],
    },
  ];

  const transports: TransportRecommendation[] = [
    {
      id: 'trans-demo-1',
      from: 'נמל התעופה',
      to: dest,
      mode: 'רכבת',
      alternativeModes: ['מונית', 'אוטובוס'],
      duration: '30 דקות',
      cost: '€8',
      notes: 'הרכבת היא הדרך המהירה והזולה ביותר',
      status: 'suggested',
      scenic: false,
      category: 'inter-city',
    },
    {
      id: 'trans-demo-2',
      from: 'מרכז העיר',
      to: 'אזור התיירות',
      mode: 'אופניים',
      alternativeModes: ['הליכה', 'מטרו'],
      duration: '15 דקות',
      cost: '€2',
      notes: 'יש מסלולי אופניים נעימים',
      status: 'suggested',
      scenic: true,
      category: 'intra-city',
    },
  ];

  return { attractions, meals, accommodations, transports };
}

export async function generatePoolForTrip(
  trip: Trip,
  apiKey: string,
  useDemo: boolean = false
): Promise<{ pool: RecommendationPool; destinationsWithDescriptions: Destination[]; source: 'gemini' | 'demo'; error?: string }> {
  const numDays = trip.itinerary.length;

  if (useDemo) {
    return {
      pool: generateDemoPool(trip.destinations),
      destinationsWithDescriptions: trip.destinations,
      source: 'demo',
    };
  }

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        travelers: trip.travelers,
        destinations: trip.destinations,
        startDate: trip.startDate,
        endDate: trip.endDate,
        numDays,
        purpose: trip.purpose,
        customInstructions: trip.customInstructions,
        arrival: trip.arrival,
        departure: trip.departure,
        apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        pool: generateDemoPool(trip.destinations),
        destinationsWithDescriptions: trip.destinations,
        source: 'demo',
        error: data.error || 'API error',
      };
    }

    // Ensure all items have IDs and statuses
    const pool: RecommendationPool = {
      attractions: (data.attractions || []).map((a: Activity, i: number) => ({
        ...a,
        id: a.id || `att-${Date.now()}-${i}`,
        status: a.status || 'suggested',
      })),
      meals: (data.meals || []).map((m: Meal, i: number) => ({
        ...m,
        id: m.id || `meal-${Date.now()}-${i}`,
        status: m.status || 'suggested',
      })),
      accommodations: (data.accommodations || []).map((a: Accommodation, i: number) => ({
        ...a,
        id: a.id || `acc-${Date.now()}-${i}`,
        bookingStatus: a.bookingStatus || 'suggested',
        alternatives: a.alternatives || [],
      })),
      transports: (data.transports || []).map((t: TransportRecommendation, i: number) => ({
        ...t,
        id: t.id || `trans-${Date.now()}-${i}`,
        status: t.status || 'suggested',
      })),
    };

    // Merge destinations with descriptions from AI
    const destinationsWithDescriptions = trip.destinations.map((d) => {
      const aiDest = (data.destinations || []).find((ad: Destination) => ad.name === d.name);
      return aiDest ? { ...d, description: aiDest.description, highlights: aiDest.highlights } : d;
    });

    return { pool, destinationsWithDescriptions, source: 'gemini' };
  } catch (err) {
    return {
      pool: generateDemoPool(trip.destinations),
      destinationsWithDescriptions: trip.destinations,
      source: 'demo',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
