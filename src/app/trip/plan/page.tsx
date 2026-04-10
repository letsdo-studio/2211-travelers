'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Train,
  Utensils,
  Hotel,
  MessageCircle,
  Lightbulb,
  Eye,
  Users,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatPanel from '@/components/ChatPanel';
import { getTrip } from '@/lib/storage';
import { Trip, DayPlan, Activity } from '@/lib/types';

function PriorityBadge({ priority }: { priority: Activity['priority'] }) {
  const config = {
    must: { label: 'חובה', className: 'priority-must' },
    should: { label: 'כדאי', className: 'priority-should' },
    'if-time': { label: 'אם יש זמן', className: 'priority-if-time' },
  };
  const { label, className } = config[priority];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${className}`}>
      {label}
    </span>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-2xl border border-card-border p-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={activity.priority} />
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.startTime} - {activity.endTime}
            </span>
          </div>
          <h4 className="font-bold text-sm">{activity.name}</h4>
          <p className="text-xs text-muted mt-0.5">{activity.description}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-card-border space-y-2 text-xs animate-fade-in">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{activity.location}</span>
          </div>
          <div className="flex items-start gap-2">
            <Star className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>{activity.tips}</span>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
            <span>עומס: {activity.crowdLevel}</span>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
            <span>זמן מומלץ: {activity.bestTimeToVisit}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">עלות:</span>
            <span>{activity.cost}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DayView({ day }: { day: DayPlan }) {
  const [showMeals, setShowMeals] = useState(false);
  const [showAccommodation, setShowAccommodation] = useState(false);

  const priorityOrder = { must: 0, should: 1, 'if-time': 2 };
  const sortedActivities = [...day.activities].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="animate-slide-up">
      {/* Day header */}
      <div className="sticky top-[57px] z-40 bg-background/90 backdrop-blur-lg py-2 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">יום {day.dayNumber}</h3>
            <span className="text-xs text-muted">{day.date} · {day.location}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowAccommodation(!showAccommodation)}
              className={`p-2 rounded-xl transition-colors ${
                showAccommodation ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-card'
              }`}
            >
              <Hotel className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMeals(!showMeals)}
              className={`p-2 rounded-xl transition-colors ${
                showMeals ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-card'
              }`}
            >
              <Utensils className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Notes */}
        {day.notes && (
          <div className="bg-accent/10 rounded-2xl p-3 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs">{day.notes}</p>
          </div>
        )}

        {/* Accommodation */}
        {showAccommodation && day.accommodation && (
          <div className="bg-primary/5 rounded-2xl p-3 border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">לינה</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                day.accommodation.bookingStatus === 'booked'
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning'
              }`}>
                {day.accommodation.bookingStatus === 'booked' ? 'הוזמן' : 'הצעה'}
              </span>
            </div>
            <h4 className="font-bold text-sm">{day.accommodation.name}</h4>
            <div className="text-xs text-muted mt-1 space-y-0.5">
              <p>{day.accommodation.type} · {day.accommodation.pricePerNight} ללילה</p>
              <p>צ׳ק-אין: {day.accommodation.checkIn} · צ׳ק-אאוט: {day.accommodation.checkOut}</p>
              <p>דירוג: {day.accommodation.rating}</p>
              {day.accommodation.alternatives.length > 0 && (
                <p className="text-primary">
                  חלופות: {day.accommodation.alternatives.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Activities */}
        <div className="space-y-2">
          {sortedActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>

        {/* Meals */}
        {showMeals && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 mt-2">
              <Utensils className="w-4 h-4 text-accent" />
              <span className="font-bold text-sm">ארוחות</span>
            </div>
            {day.meals.map((meal) => (
              <div key={meal.id} className="bg-card rounded-2xl p-3 border border-card-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">
                    {meal.type === 'breakfast' ? '🥐' : meal.type === 'lunch' ? '🥙' : meal.type === 'dinner' ? '🍝' : '☕'}
                  </span>
                  <span className="font-bold text-xs">
                    {meal.type === 'breakfast' ? 'בוקר' : meal.type === 'lunch' ? 'צהריים' : meal.type === 'dinner' ? 'ערב' : 'קפה'}
                  </span>
                  <span className="text-[10px] text-muted">{meal.priceRange}</span>
                </div>
                <h4 className="text-sm font-medium">{meal.restaurant}</h4>
                <p className="text-xs text-muted">{meal.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                  <span>⭐ {meal.rating}</span>
                  <span>· {meal.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transit */}
        {day.transit && (
          <div className="bg-card rounded-2xl p-3 border border-card-border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <Train className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">העברה ליום הבא</span>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-medium">
                {day.transit.from} → {day.transit.to}
              </p>
              <p>
                {day.transit.method} · {day.transit.departureTime} - {day.transit.arrivalTime} ({day.transit.duration})
              </p>
              <p className="text-muted">עלות: {day.transit.cost}</p>
              {day.transit.scenicNotes && (
                <p className="text-primary">🌅 {day.transit.scenicNotes}</p>
              )}
              {day.transit.tips && (
                <p className="text-accent">💡 {day.transit.tips}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripPlanContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (tripId) {
      const loaded = getTrip(tripId);
      setTrip(loaded);
    }
  }, [tripId]);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse mx-auto mb-3" />
          <p className="text-muted">טוען את הטיול...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title={trip.name} showBack />

      {/* Trip summary bar */}
      <div className="bg-card border-b border-card-border px-4 py-2">
        <div className="flex items-center justify-between max-w-lg mx-auto text-xs text-muted">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {trip.destination}
          </div>
          <div>{trip.startDate} — {trip.endDate}</div>
          <div>{trip.itinerary.length} ימים</div>
        </div>
      </div>

      {/* Day tabs */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-card-border">
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-1.5 py-2 max-w-lg mx-auto">
          {trip.itinerary.map((day, idx) => (
            <button
              key={day.date}
              onClick={() => setActiveDay(idx)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeDay === idx
                  ? 'bg-primary text-white'
                  : 'bg-card border border-card-border text-muted hover:text-foreground'
              }`}
            >
              יום {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Day content */}
      <div className="max-w-lg mx-auto py-3">
        {trip.itinerary[activeDay] && (
          <DayView day={trip.itinerary[activeDay]} />
        )}
      </div>

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-20 left-4 z-50 w-14 h-14 gradient-primary rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel
          trip={trip}
          onClose={() => setShowChat(false)}
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
