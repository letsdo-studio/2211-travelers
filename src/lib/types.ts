export interface TravelerProfile {
  id: string;
  name: string;
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
  importantThings: string;
}

export interface Destination {
  id: string;
  name: string;
  country?: string;
  startDate: string;
  endDate: string;
  description?: string;
  highlights?: string[];
}

export interface TransportInfo {
  type: 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
  number: string;
  from: string;
  to: string;
  date: string;
  time: string;
  notes: string;
}

export interface Trip {
  id: string;
  name: string;
  purpose: string;
  customInstructions: string;
  destinations: Destination[];
  startDate: string;
  endDate: string;
  travelers: TravelerProfile[];
  arrival: TransportInfo | null;
  departure: TransportInfo | null;
  status: 'planning' | 'active' | 'completed' | 'generating';
  recommendationPool: RecommendationPool;
  itinerary: DayPlan[];
  bookings: Booking[];
  createdAt: string;
  generationError?: string;
}

export interface RecommendationPool {
  attractions: Activity[];
  meals: Meal[];
  accommodations: Accommodation[];
  transports: TransportRecommendation[];
}

export interface DayPlan {
  date: string;
  dayNumber: number;
  location: string;
  destinationId?: string;
  accommodationId: string | null;
  activityIds: string[];
  mealIds: string[];
  transitId: string | null;
  notes: string;
  aiInsights?: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  priority: 'must' | 'should' | 'if-time';
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  cost: string;
  tips: string;
  crowdLevel: string;
  bestTimeToVisit: string;
  status: 'suggested' | 'confirmed' | 'done' | 'skipped';
  destinationName?: string;
  category?: string;
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
  destinationName?: string;
  cuisine?: string;
}

export interface Accommodation {
  id: string;
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
  destinationName?: string;
  pros?: string[];
  cons?: string[];
}

export interface TransportRecommendation {
  id: string;
  from: string;
  to: string;
  mode: string;
  alternativeModes?: string[];
  duration: string;
  cost: string;
  notes: string;
  status: 'suggested' | 'confirmed' | 'skipped';
  scenic?: boolean;
  category: 'inter-city' | 'intra-city' | 'point-to-point';
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

export interface Conflict {
  type: 'time-overlap' | 'too-much' | 'tight-schedule';
  message: string;
  affectedIds: string[];
  severity: 'warning' | 'error';
}
