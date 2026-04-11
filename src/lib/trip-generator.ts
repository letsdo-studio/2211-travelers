import { Trip, TravelerProfile, DayPlan } from './types';
import { generateDemoItinerary } from './demo-data';

export async function generateItineraryForTrip(
  trip: Trip,
  profile: TravelerProfile,
  apiKey: string,
  useDemo: boolean = false
): Promise<{ itinerary: DayPlan[]; source: 'gemini' | 'demo'; error?: string }> {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (useDemo) {
    return {
      itinerary: generateDemoItinerary(trip.destination, trip.startDate, numDays),
      source: 'demo',
    };
  }

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        destination: trip.destination,
        startDate: trip.startDate,
        numDays,
        apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        itinerary: generateDemoItinerary(trip.destination, trip.startDate, numDays),
        source: 'demo',
        error: data.error || 'API error',
      };
    }

    if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
      return {
        itinerary: generateDemoItinerary(trip.destination, trip.startDate, numDays),
        source: 'demo',
        error: 'Invalid AI response',
      };
    }

    // Ensure all activities have status field
    data.itinerary.forEach((day: DayPlan) => {
      day.activities?.forEach((a) => {
        if (!a.status) a.status = 'suggested';
      });
      day.meals?.forEach((m) => {
        if (!m.status) m.status = 'suggested';
      });
    });

    return { itinerary: data.itinerary, source: 'gemini' };
  } catch (err) {
    return {
      itinerary: generateDemoItinerary(trip.destination, trip.startDate, numDays),
      source: 'demo',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
