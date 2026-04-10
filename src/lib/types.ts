export interface TravelerProfile {
  id: string;
  names: string;
  travelStyle: 'spontaneous' | 'planned' | 'mixed';
  budgetPerNight: { min: number; max: number; currency: string };
  accommodationLevel: 'budget' | 'mid' | 'premium' | 'luxury';
  foodPreferences: {
    breakfast: string;
    lunch: string;
    dinner: string;
    coffee: string;
    snacks: string;
  };
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'intensive';
  wakeUpTime: string;
  specialNeeds: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  profileId: string;
  status: 'planning' | 'active' | 'completed';
  itinerary: DayPlan[];
  bookings: Booking[];
  createdAt: string;
}

export interface DayPlan {
  date: string;
  dayNumber: number;
  location: string;
  accommodation: Accommodation | null;
  activities: Activity[];
  meals: Meal[];
  transit: Transit | null;
  notes: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'if-time';
  startTime: string;
  endTime: string;
  location: string;
  cost: string;
  tips: string;
  crowdLevel: string;
  bestTimeToVisit: string;
  status: 'suggested' | 'confirmed' | 'done' | 'skipped';
  distanceFromHotel?: string;
  transportMode?: string;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'coffee' | 'snack';
  restaurant: string;
  description: string;
  priceRange: string;
  location: string;
  rating: string;
  source: string;
  status: 'suggested' | 'confirmed' | 'done' | 'skipped';
}

export interface Accommodation {
  name: string;
  type: string;
  pricePerNight: string;
  checkIn: string;
  checkOut: string;
  location: string;
  rating: string;
  bookingStatus: 'suggested' | 'booked' | 'skipped';
  confirmationNumber?: string;
  alternatives: string[];
}

export interface Transit {
  from: string;
  to: string;
  method: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cost: string;
  scenicNotes: string;
  tips: string;
}

export interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'transport' | 'activity' | 'restaurant';
  title: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmationNumber: string;
  date: string;
  time: string;
  location: string;
  details: string;
  cost: string;
  notes: string;
}

export interface RadiusZone {
  label: string;
  minKm: number;
  maxKm: number;
  transportModes: string[];
  activities: Activity[];
}

export interface AISuggestion {
  id: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'transit' | 'general';
  title: string;
  description: string;
  reason: string;
  source: 'gemini' | 'demo';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
