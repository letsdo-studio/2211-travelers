'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, MessageCircle, Sparkles, Ticket, Navigation, Calendar,
  Loader2, AlertCircle, Lightbulb, Compass, Layers, Users,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatPanel from '@/components/ChatPanel';
import EditModal from '@/components/EditModal';
import BookingPanel from '@/components/BookingPanel';
import RecommendationsPool from '@/components/RecommendationsPool';
import DayScheduleView from '@/components/DayScheduleView';
import { getTrip, saveTrip, getSettings } from '@/lib/storage';
import { generatePoolForTrip } from '@/lib/trip-generator';
import { Trip, Activity, Meal, Accommodation, TransportRecommendation, Booking } from '@/lib/types';

type Tab = 'recommendations' | 'days';

const ACTIVITY_FIELDS = [
  { key: 'name', label: 'שם הפעילות', type: 'text' as const },
  { key: 'description', label: 'תיאור', type: 'textarea' as const },
  {
    key: 'priority', label: 'עדיפות', type: 'select' as const,
    options: [
      { value: 'must', label: 'חובה' },
      { value: 'should', label: 'כדאי' },
      { value: 'if-time', label: 'אם יש זמן' },
    ],
  },
  { key: 'startTime', label: 'שעת התחלה', type: 'time' as const },
  { key: 'endTime', label: 'שעת סיום', type: 'time' as const },
  { key: 'duration', label: 'משך', type: 'text' as const },
  { key: 'location', label: 'מיקום', type: 'text' as const },
  { key: 'cost', label: 'עלות', type: 'text' as const },
  { key: 'tips', label: 'טיפים', type: 'textarea' as const },
  { key: 'crowdLevel', label: 'רמת עומס', type: 'text' as const },
  { key: 'bestTimeToVisit', label: 'זמן מומלץ לביקור', type: 'text' as const },
];

const MEAL_FIELDS = [
  { key: 'restaurant', label: 'שם המסעדה', type: 'text' as const },
  {
    key: 'type', label: 'סוג ארוחה', type: 'select' as const,
    options: [
      { value: 'breakfast', label: 'בוקר' },
      { value: 'lunch', label: 'צהריים' },
      { value: 'dinner', label: 'ערב' },
      { value: 'coffee', label: 'קפה' },
      { value: 'snack', label: 'חטיף' },
    ],
  },
  { key: 'description', label: 'תיאור', type: 'textarea' as const },
  { key: 'priceRange', label: 'טווח מחירים', type: 'text' as const },
  { key: 'location', label: 'מיקום', type: 'text' as const },
  { key: 'rating', label: 'דירוג', type: 'text' as const },
  { key: 'cuisine', label: 'סוג מטבח', type: 'text' as const },
];

const ACCOMMODATION_FIELDS = [
  { key: 'name', label: 'שם', type: 'text' as const },
  { key: 'type', label: 'סוג', type: 'text' as const },
  { key: 'pricePerNight', label: 'מחיר ללילה', type: 'text' as const },
  { key: 'checkIn', label: 'צ׳ק-אין', type: 'time' as const },
  { key: 'checkOut', label: 'צ׳ק-אאוט', type: 'time' as const },
  { key: 'location', label: 'מיקום', type: 'text' as const },
  { key: 'rating', label: 'דירוג', type: 'text' as const },
];

const TRANSPORT_FIELDS = [
  { key: 'from', label: 'מאיפה', type: 'text' as const },
  { key: 'to', label: 'לאן', type: 'text' as const },
  { key: 'mode', label: 'אמצעי תחבורה', type: 'text' as const },
  { key: 'duration', label: 'משך', type: 'text' as const },
  { key: 'cost', label: 'עלות', type: 'text' as const },
  { key: 'notes', label: 'הערות', type: 'textarea' as const },
];

function TripPlanContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('recommendations');
  const [activeDay, setActiveDay] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showAreaInfo, setShowAreaInfo] = useState(false);
  const [generationStarted, setGenerationStarted] = useState(false);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<{
    type: 'attraction' | 'meal' | 'accommodation' | 'transport';
    data: Activity | Meal | Accommodation | TransportRecommendation;
  } | null>(null);

  useEffect(() => {
    if (tripId) {
      const loaded = getTrip(tripId);
      if (loaded) {
        if (!loaded.bookings) loaded.bookings = [];
        if (!loaded.recommendationPool) {
          loaded.recommendationPool = { attractions: [], meals: [], accommodations: [], transports: [] };
        }
        setTrip(loaded);
      }
    }
  }, [tripId]);

  // Auto-generate pool if trip is in 'generating' state
  useEffect(() => {
    if (!trip || trip.status !== 'generating' || generationStarted) return;
    setGenerationStarted(true);

    (async () => {
      const settings = getSettings();
      const result = await generatePoolForTrip(trip, settings.geminiApiKey, settings.aiProvider === 'demo');

      const updatedTrip: Trip = {
        ...trip,
        status: 'planning',
        recommendationPool: result.pool,
        destinations: result.destinationsWithDescriptions,
        generationError: result.error,
      };
      setTrip(updatedTrip);
      saveTrip(updatedTrip);
    })();
  }, [trip, generationStarted]);

  const updateTrip = useCallback((updated: Trip) => {
    setTrip(updated);
    saveTrip(updated);
  }, []);

  const handleAddToDay = useCallback(
    (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string, dayIndex: number) => {
      if (!trip) return;
      const newItinerary = [...trip.itinerary];
      const day = { ...newItinerary[dayIndex] };

      if (itemType === 'attraction' && !day.activityIds.includes(itemId)) {
        day.activityIds = [...day.activityIds, itemId];
      } else if (itemType === 'meal' && !day.mealIds.includes(itemId)) {
        day.mealIds = [...day.mealIds, itemId];
      } else if (itemType === 'accommodation') {
        day.accommodationId = itemId;
      } else if (itemType === 'transport') {
        day.transitId = itemId;
      }

      newItinerary[dayIndex] = day;
      updateTrip({ ...trip, itinerary: newItinerary });
    },
    [trip, updateTrip]
  );

  const handleRemoveFromDay = useCallback(
    (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string, dayIndex: number) => {
      if (!trip) return;
      const newItinerary = [...trip.itinerary];
      const day = { ...newItinerary[dayIndex] };

      if (itemType === 'attraction') {
        day.activityIds = day.activityIds.filter((id) => id !== itemId);
      } else if (itemType === 'meal') {
        day.mealIds = day.mealIds.filter((id) => id !== itemId);
      } else if (itemType === 'accommodation' && day.accommodationId === itemId) {
        day.accommodationId = null;
      } else if (itemType === 'transport' && day.transitId === itemId) {
        day.transitId = null;
      }

      newItinerary[dayIndex] = day;
      updateTrip({ ...trip, itinerary: newItinerary });
    },
    [trip, updateTrip]
  );

  const handleSkipPoolItem = useCallback(
    (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string) => {
      if (!trip) return;
      const newPool = { ...trip.recommendationPool };

      if (itemType === 'attraction') {
        newPool.attractions = newPool.attractions.map((a) =>
          a.id === itemId ? { ...a, status: 'skipped' as const } : a
        );
      } else if (itemType === 'meal') {
        newPool.meals = newPool.meals.map((m) =>
          m.id === itemId ? { ...m, status: 'skipped' as const } : m
        );
      } else if (itemType === 'accommodation') {
        newPool.accommodations = newPool.accommodations.map((a) =>
          a.id === itemId ? { ...a, bookingStatus: 'skipped' as const } : a
        );
      } else if (itemType === 'transport') {
        newPool.transports = newPool.transports.map((t) =>
          t.id === itemId ? { ...t, status: 'skipped' as const } : t
        );
      }

      updateTrip({ ...trip, recommendationPool: newPool });
    },
    [trip, updateTrip]
  );

  const handleEditItem = useCallback(
    (
      itemType: 'attraction' | 'meal' | 'accommodation' | 'transport',
      item: Activity | Meal | Accommodation | TransportRecommendation
    ) => {
      setEditingItem({ type: itemType, data: item });
    },
    []
  );

  const handleSaveEditedItem = (data: Record<string, string>) => {
    if (!trip || !editingItem) return;
    const newPool = { ...trip.recommendationPool };

    if (editingItem.type === 'attraction') {
      newPool.attractions = newPool.attractions.map((a) =>
        a.id === editingItem.data.id ? { ...a, ...data, priority: data.priority as Activity['priority'] } : a
      );
    } else if (editingItem.type === 'meal') {
      newPool.meals = newPool.meals.map((m) =>
        m.id === editingItem.data.id ? { ...m, ...data, type: data.type as Meal['type'] } : m
      );
    } else if (editingItem.type === 'accommodation') {
      newPool.accommodations = newPool.accommodations.map((a) =>
        a.id === editingItem.data.id ? { ...a, ...data } : a
      );
    } else if (editingItem.type === 'transport') {
      newPool.transports = newPool.transports.map((t) =>
        t.id === editingItem.data.id ? { ...t, ...data } : t
      );
    }

    updateTrip({ ...trip, recommendationPool: newPool });
    setEditingItem(null);
  };

  const handleUpdateBookings = (bookings: Booking[]) => {
    if (!trip) return;
    updateTrip({ ...trip, bookings });
  };

  const handleUpdateDayNotes = (dayIndex: number, notes: string) => {
    if (!trip) return;
    const newItinerary = [...trip.itinerary];
    newItinerary[dayIndex] = { ...newItinerary[dayIndex], notes };
    updateTrip({ ...trip, itinerary: newItinerary });
  };

  const handleRequestAIInsights = async (dayIndex: number): Promise<string> => {
    if (!trip) return '';
    const day = trip.itinerary[dayIndex];
    const settings = getSettings();

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `תן לי תובנות ועצות ליום ${day.dayNumber} שלי ב${day.location}. הפעילויות המתוכננות הן: ${day.activityIds.length} פעילויות. תציע אופטימיזציות, התאמות זמן, או דברים שכדאי לשים לב אליהם.`,
          trip,
          apiKey: settings.geminiApiKey,
        }),
      });
      const data = await response.json();
      const insights = data.response || 'לא ניתן היה לקבל תובנות';

      // Save insights to day
      const newItinerary = [...trip.itinerary];
      newItinerary[dayIndex] = { ...newItinerary[dayIndex], aiInsights: insights };
      updateTrip({ ...trip, itinerary: newItinerary });

      return insights;
    } catch {
      return 'שגיאה בקבלת תובנות';
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  // Loading screen during generation
  if (trip.status === 'generating') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={trip.name} showBack />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 gradient-primary rounded-full animate-pulse opacity-30" />
              <div className="absolute inset-2 gradient-primary rounded-full animate-pulse opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Gemini אוסף המלצות</h2>
            <p className="text-sm text-muted mb-6">
              מחפש את הדברים הטובים ביותר ב{trip.destinations.map((d) => d.name).join(', ')}.
              לאחר מכן תוכלו לבחור ולשבץ אותם לימים.
            </p>
            <div className="space-y-2">
              {[
                { icon: '🗺️', text: 'מנתח את היעדים' },
                { icon: '🏨', text: 'מחפש מלונות מתאימים' },
                { icon: '🎯', text: 'אוסף אטרקציות וחוויות' },
                { icon: '🍕', text: 'בודק המלצות אוכל' },
                { icon: '🚂', text: 'מתכנן מסלולי תחבורה' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-3 animate-fade-in"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm flex-1 text-right">{item.text}</span>
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentDestination = trip.destinations[0];
  const totalRecsConfirmed = trip.itinerary.reduce(
    (sum, d) => sum + d.activityIds.length + d.mealIds.length,
    0
  );

  return (
    <div className="min-h-screen pb-20">
      <Header title={trip.name} showBack />

      {/* Trip summary */}
      <div className="bg-card border-b border-card-border px-4 py-2">
        <div className="flex items-center justify-between max-w-lg mx-auto text-xs text-muted">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {trip.destinations.map((d) => d.name).join(' → ')}
          </div>
          <div>{trip.itinerary.length} ימים</div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {trip.travelers.length}
          </div>
        </div>
      </div>

      {/* Generation error */}
      {trip.generationError && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2">
          <div className="max-w-lg mx-auto flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-warning">Gemini נכשל - הוצגו נתוני דמו</p>
              <p className="text-muted">{trip.generationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Area description */}
      {currentDestination?.description && (
        <div className="px-4 pt-3 max-w-lg mx-auto">
          <button
            onClick={() => setShowAreaInfo(!showAreaInfo)}
            className="w-full bg-accent/10 rounded-2xl p-3 text-right"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-accent">על {currentDestination.name}</p>
                <p className={`text-xs mt-1 ${showAreaInfo ? '' : 'line-clamp-2'}`}>
                  {currentDestination.description}
                </p>
                {showAreaInfo && currentDestination.highlights && (
                  <div className="mt-2 space-y-1">
                    {currentDestination.highlights.map((h, i) => (
                      <p key={i} className="text-xs">• {h}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Action bar */}
      <div className="bg-card border-b border-card-border px-4 py-2 mt-3">
        <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowBookings(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium"
          >
            <Ticket className="w-3.5 h-3.5" />
            הזמנות
            {trip.bookings.length > 0 && (
              <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {trip.bookings.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-card-border">
        <div className="flex max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'recommendations' ? 'text-primary border-b-2 border-primary' : 'text-muted'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>המלצות</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {trip.recommendationPool.attractions.filter(a => a.status !== 'skipped').length +
               trip.recommendationPool.meals.filter(m => m.status !== 'skipped').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'days' ? 'text-primary border-b-2 border-primary' : 'text-muted'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>הימים שלי</span>
            <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">
              {totalRecsConfirmed}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'recommendations' && (
        <RecommendationsPool
          pool={trip.recommendationPool}
          days={trip.itinerary}
          onAddToDay={handleAddToDay}
          onRemoveFromDay={handleRemoveFromDay}
          onSkip={handleSkipPoolItem}
          onEdit={handleEditItem}
        />
      )}

      {activeTab === 'days' && (
        <>
          {/* Day selector */}
          <div className="sticky top-[105px] z-30 bg-background border-b border-card-border">
            <div className="flex overflow-x-auto no-scrollbar px-4 gap-1.5 py-2 max-w-lg mx-auto">
              {trip.itinerary.map((day, idx) => {
                const itemCount = day.activityIds.length + day.mealIds.length;
                return (
                  <button
                    key={day.date}
                    onClick={() => setActiveDay(idx)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      activeDay === idx
                        ? 'bg-primary text-white'
                        : 'bg-card border border-card-border text-muted'
                    }`}
                  >
                    יום {day.dayNumber}
                    {itemCount > 0 && (
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                        activeDay === idx ? 'bg-white/20' : 'bg-success/10 text-success'
                      }`}>
                        {itemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            {trip.itinerary[activeDay] && (
              <DayScheduleView
                day={trip.itinerary[activeDay]}
                pool={trip.recommendationPool}
                onRemoveItem={(itemType, itemId) => handleRemoveFromDay(itemType, itemId, activeDay)}
                onUpdateNotes={(notes) => handleUpdateDayNotes(activeDay, notes)}
                onRequestAIInsights={() => handleRequestAIInsights(activeDay)}
                onSwitchToPool={() => setActiveTab('recommendations')}
              />
            )}
          </div>
        </>
      )}

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-20 left-4 z-50 w-14 h-14 gradient-primary rounded-full shadow-lg flex items-center justify-center active:scale-95"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Panels */}
      {showChat && <ChatPanel trip={trip} onClose={() => setShowChat(false)} />}
      {showBookings && (
        <BookingPanel
          bookings={trip.bookings}
          onUpdate={handleUpdateBookings}
          onClose={() => setShowBookings(false)}
        />
      )}
      {editingItem && (
        <EditModal
          title="עריכה"
          fields={
            editingItem.type === 'attraction' ? ACTIVITY_FIELDS :
            editingItem.type === 'meal' ? MEAL_FIELDS :
            editingItem.type === 'accommodation' ? ACCOMMODATION_FIELDS :
            TRANSPORT_FIELDS
          }
          data={editingItem.data as unknown as Record<string, string>}
          onSave={handleSaveEditedItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function TripPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    }>
      <TripPlanContent />
    </Suspense>
  );
}
