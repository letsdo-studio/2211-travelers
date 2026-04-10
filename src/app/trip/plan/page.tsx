'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, Clock, Star, ChevronDown, ChevronUp, Train, Utensils,
  Hotel, MessageCircle, Lightbulb, Eye, Users, Sparkles, Edit3,
  Navigation, Ticket, CheckCircle, Plus, Check, X as XIcon, SkipForward,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatPanel from '@/components/ChatPanel';
import EditModal from '@/components/EditModal';
import BookingPanel from '@/components/BookingPanel';
import RadiusExplorer from '@/components/RadiusExplorer';
import { getTrip, saveTrip } from '@/lib/storage';
import { Trip, DayPlan, Activity, Meal, Booking } from '@/lib/types';

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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    suggested: { label: 'הצעה', className: 'bg-primary/10 text-primary' },
    confirmed: { label: 'מאושר', className: 'bg-success/10 text-success' },
    done: { label: 'בוצע', className: 'bg-muted/10 text-muted' },
    skipped: { label: 'דילוג', className: 'bg-danger/10 text-danger' },
  };
  const c = config[status] || config.suggested;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

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
  { key: 'location', label: 'מיקום', type: 'text' as const },
  { key: 'cost', label: 'עלות', type: 'text' as const },
  { key: 'tips', label: 'טיפים', type: 'textarea' as const },
  { key: 'crowdLevel', label: 'רמת עומס', type: 'text' as const },
  { key: 'bestTimeToVisit', label: 'זמן מומלץ לביקור', type: 'text' as const },
  {
    key: 'status', label: 'סטטוס', type: 'select' as const,
    options: [
      { value: 'suggested', label: 'הצעה' },
      { value: 'confirmed', label: 'מאושר' },
      { value: 'done', label: 'בוצע' },
      { value: 'skipped', label: 'דילוג' },
    ],
  },
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
  { key: 'source', label: 'מקור ההמלצה', type: 'text' as const },
  {
    key: 'status', label: 'סטטוס', type: 'select' as const,
    options: [
      { value: 'suggested', label: 'הצעה' },
      { value: 'confirmed', label: 'מאושר' },
      { value: 'done', label: 'בוצע' },
      { value: 'skipped', label: 'דילוג' },
    ],
  },
];

const ACCOMMODATION_FIELDS = [
  { key: 'name', label: 'שם', type: 'text' as const },
  { key: 'type', label: 'סוג', type: 'text' as const },
  { key: 'pricePerNight', label: 'מחיר ללילה', type: 'text' as const },
  { key: 'checkIn', label: 'צ׳ק-אין', type: 'time' as const },
  { key: 'checkOut', label: 'צ׳ק-אאוט', type: 'time' as const },
  { key: 'location', label: 'מיקום', type: 'text' as const },
  { key: 'rating', label: 'דירוג', type: 'text' as const },
  { key: 'confirmationNumber', label: 'מספר אישור', type: 'text' as const },
  {
    key: 'bookingStatus', label: 'סטטוס', type: 'select' as const,
    options: [
      { value: 'suggested', label: 'הצעה' },
      { value: 'booked', label: 'הוזמן' },
      { value: 'skipped', label: 'דילוג' },
    ],
  },
];

function ActivityCard({
  activity,
  onEdit,
  onStatusChange,
}: {
  activity: Activity;
  onEdit: () => void;
  onStatusChange: (status: Activity['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = activity.status || 'suggested';

  return (
    <div className={`bg-card rounded-2xl border border-card-border p-3 animate-fade-in ${status === 'done' ? 'opacity-60' : ''} ${status === 'skipped' ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={activity.priority} />
            <StatusBadge status={status} />
            <span className="text-[10px] text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.startTime} - {activity.endTime}
            </span>
          </div>
          <h4 className="font-bold text-sm">{activity.name}</h4>
          <p className="text-xs text-muted mt-0.5">{activity.description}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Status quick actions - with undo support */}
          {status === 'suggested' && (
            <button
              onClick={() => onStatusChange('confirmed')}
              className="p-1.5 rounded-lg hover:bg-success/10 transition-colors"
              title="אשר"
            >
              <Check className="w-4 h-4 text-success" />
            </button>
          )}
          {status === 'confirmed' && (
            <>
              <button
                onClick={() => onStatusChange('suggested')}
                className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors"
                title="בטל אישור"
              >
                <XIcon className="w-3.5 h-3.5 text-warning" />
              </button>
              <button
                onClick={() => onStatusChange('done')}
                className="p-1.5 rounded-lg hover:bg-success/10 transition-colors"
                title="בוצע"
              >
                <CheckCircle className="w-4 h-4 text-success" />
              </button>
            </>
          )}
          {status === 'done' && (
            <button
              onClick={() => onStatusChange('confirmed')}
              className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors"
              title="בטל ביצוע"
            >
              <XIcon className="w-3.5 h-3.5 text-warning" />
            </button>
          )}
          {status === 'skipped' && (
            <button
              onClick={() => onStatusChange('suggested')}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              title="החזר לרשימה"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
            </button>
          )}
          {(status === 'suggested' || status === 'confirmed') && (
            <button
              onClick={() => onStatusChange('skipped')}
              className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
              title="דלג"
            >
              <SkipForward className="w-3.5 h-3.5 text-muted" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>
        </div>
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

function DayView({
  day,
  onUpdateDay,
}: {
  day: DayPlan;
  onUpdateDay: (updated: DayPlan) => void;
}) {
  const [showMeals, setShowMeals] = useState(false);
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  const priorityOrder = { must: 0, should: 1, 'if-time': 2 };
  const sortedActivities = [...day.activities].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const handleActivityStatusChange = (activityId: string, status: Activity['status']) => {
    onUpdateDay({
      ...day,
      activities: day.activities.map((a) =>
        a.id === activityId ? { ...a, status } : a
      ),
    });
  };

  const handleSaveActivity = (data: Record<string, string>) => {
    if (isAddingActivity) {
      const newActivity: Activity = {
        id: `act-new-${Date.now()}`,
        name: data.name || '',
        description: data.description || '',
        priority: (data.priority as Activity['priority']) || 'should',
        startTime: data.startTime || '10:00',
        endTime: data.endTime || '12:00',
        location: data.location || '',
        cost: data.cost || '',
        tips: data.tips || '',
        crowdLevel: data.crowdLevel || '',
        bestTimeToVisit: data.bestTimeToVisit || '',
        status: 'confirmed',
      };
      onUpdateDay({ ...day, activities: [...day.activities, newActivity] });
    } else if (editingActivity) {
      onUpdateDay({
        ...day,
        activities: day.activities.map((a) =>
          a.id === editingActivity.id ? { ...a, ...data, priority: data.priority as Activity['priority'], status: (data.status as Activity['status']) || a.status } : a
        ),
      });
    }
    setEditingActivity(null);
    setIsAddingActivity(false);
  };

  const handleDeleteActivity = () => {
    if (editingActivity) {
      onUpdateDay({
        ...day,
        activities: day.activities.filter((a) => a.id !== editingActivity.id),
      });
      setEditingActivity(null);
    }
  };

  const handleSaveMeal = (data: Record<string, string>) => {
    if (editingMeal) {
      onUpdateDay({
        ...day,
        meals: day.meals.map((m) =>
          m.id === editingMeal.id ? { ...m, ...data, type: data.type as Meal['type'] } : m
        ),
      });
      setEditingMeal(null);
    }
  };

  const handleSaveAccommodation = (data: Record<string, string>) => {
    onUpdateDay({
      ...day,
      accommodation: day.accommodation
        ? { ...day.accommodation, ...data, bookingStatus: data.bookingStatus as 'suggested' | 'booked' | 'skipped' }
        : null,
    });
    setEditingAccommodation(false);
  };

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
              className={`p-2 rounded-xl transition-colors ${showAccommodation ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-card'}`}
            >
              <Hotel className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMeals(!showMeals)}
              className={`p-2 rounded-xl transition-colors ${showMeals ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-card'}`}
            >
              <Utensils className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsAddingActivity(true);
                setEditingActivity({
                  id: '', name: '', description: '', priority: 'should',
                  startTime: '10:00', endTime: '12:00', location: '', cost: '',
                  tips: '', crowdLevel: '', bestTimeToVisit: '', status: 'confirmed',
                });
              }}
              className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">לינה</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  day.accommodation.bookingStatus === 'booked' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {day.accommodation.bookingStatus === 'booked' ? 'הוזמן' : 'הצעה'}
                </span>
              </div>
              <button
                onClick={() => setEditingAccommodation(true)}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-muted" />
              </button>
            </div>
            <h4 className="font-bold text-sm">{day.accommodation.name}</h4>
            <div className="text-xs text-muted mt-1 space-y-0.5">
              <p>{day.accommodation.type} · {day.accommodation.pricePerNight} ללילה</p>
              <p>צ׳ק-אין: {day.accommodation.checkIn} · צ׳ק-אאוט: {day.accommodation.checkOut}</p>
              <p>דירוג: {day.accommodation.rating}</p>
              {day.accommodation.confirmationNumber && (
                <p className="text-success font-mono">אישור: {day.accommodation.confirmationNumber}</p>
              )}
              {day.accommodation.alternatives.length > 0 && (
                <p className="text-primary">חלופות: {day.accommodation.alternatives.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Activities */}
        <div className="space-y-2">
          {sortedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={() => {
                setIsAddingActivity(false);
                setEditingActivity(activity);
              }}
              onStatusChange={(status) => handleActivityStatusChange(activity.id, status)}
            />
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">
                        {meal.type === 'breakfast' ? '🥐' : meal.type === 'lunch' ? '🥙' : meal.type === 'dinner' ? '🍝' : '☕'}
                      </span>
                      <span className="font-bold text-xs">
                        {meal.type === 'breakfast' ? 'בוקר' : meal.type === 'lunch' ? 'צהריים' : meal.type === 'dinner' ? 'ערב' : 'קפה'}
                      </span>
                      <span className="text-[10px] text-muted">{meal.priceRange}</span>
                      {meal.status && <StatusBadge status={meal.status} />}
                    </div>
                    <h4 className="text-sm font-medium">{meal.restaurant}</h4>
                    <p className="text-xs text-muted">{meal.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                      <span>⭐ {meal.rating}</span>
                      <span>· {meal.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {(!meal.status || meal.status === 'suggested') && (
                      <button
                        onClick={() => {
                          onUpdateDay({
                            ...day,
                            meals: day.meals.map((m) =>
                              m.id === meal.id ? { ...m, status: 'confirmed' as const } : m
                            ),
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-success/10 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-success" />
                      </button>
                    )}
                    {meal.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          onUpdateDay({
                            ...day,
                            meals: day.meals.map((m) =>
                              m.id === meal.id ? { ...m, status: 'suggested' as const } : m
                            ),
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors"
                        title="בטל אישור"
                      >
                        <XIcon className="w-3.5 h-3.5 text-warning" />
                      </button>
                    )}
                    {meal.status === 'done' && (
                      <button
                        onClick={() => {
                          onUpdateDay({
                            ...day,
                            meals: day.meals.map((m) =>
                              m.id === meal.id ? { ...m, status: 'confirmed' as const } : m
                            ),
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors"
                        title="בטל ביצוע"
                      >
                        <XIcon className="w-3.5 h-3.5 text-warning" />
                      </button>
                    )}
                    {meal.status === 'skipped' && (
                      <button
                        onClick={() => {
                          onUpdateDay({
                            ...day,
                            meals: day.meals.map((m) =>
                              m.id === meal.id ? { ...m, status: 'suggested' as const } : m
                            ),
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        title="החזר"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingMeal(meal)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>
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
              <p className="font-medium">{day.transit.from} → {day.transit.to}</p>
              <p>{day.transit.method} · {day.transit.departureTime} - {day.transit.arrivalTime} ({day.transit.duration})</p>
              <p className="text-muted">עלות: {day.transit.cost}</p>
              {day.transit.scenicNotes && <p className="text-primary">🌅 {day.transit.scenicNotes}</p>}
              {day.transit.tips && <p className="text-accent">💡 {day.transit.tips}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Edit modals */}
      {editingActivity && (
        <EditModal
          title={isAddingActivity ? 'פעילות חדשה' : 'עריכת פעילות'}
          fields={ACTIVITY_FIELDS}
          data={editingActivity as unknown as Record<string, string>}
          onSave={handleSaveActivity}
          onDelete={isAddingActivity ? undefined : handleDeleteActivity}
          onClose={() => { setEditingActivity(null); setIsAddingActivity(false); }}
        />
      )}
      {editingMeal && (
        <EditModal
          title="עריכת ארוחה"
          fields={MEAL_FIELDS}
          data={editingMeal as unknown as Record<string, string>}
          onSave={handleSaveMeal}
          onClose={() => setEditingMeal(null)}
        />
      )}
      {editingAccommodation && day.accommodation && (
        <EditModal
          title="עריכת לינה"
          fields={ACCOMMODATION_FIELDS}
          data={day.accommodation as unknown as Record<string, string>}
          onSave={handleSaveAccommodation}
          onClose={() => setEditingAccommodation(false)}
        />
      )}
    </div>
  );
}

function TripPlanContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('id');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showRadius, setShowRadius] = useState(false);

  useEffect(() => {
    if (tripId) {
      const loaded = getTrip(tripId);
      if (loaded) {
        // Ensure bookings array exists (backward compat)
        if (!loaded.bookings) loaded.bookings = [];
        // Ensure activity status exists
        loaded.itinerary.forEach((day) => {
          day.activities.forEach((a) => {
            if (!a.status) a.status = 'suggested';
          });
          day.meals.forEach((m) => {
            if (!m.status) m.status = 'suggested';
          });
        });
        setTrip(loaded);
      }
    }
  }, [tripId]);

  const updateTrip = (updated: Trip) => {
    setTrip(updated);
    saveTrip(updated);
  };

  const handleUpdateDay = (dayIndex: number, updatedDay: DayPlan) => {
    if (!trip) return;
    const newItinerary = [...trip.itinerary];
    newItinerary[dayIndex] = updatedDay;
    updateTrip({ ...trip, itinerary: newItinerary });
  };

  const handleUpdateBookings = (bookings: Booking[]) => {
    if (!trip) return;
    updateTrip({ ...trip, bookings });
  };

  const handleAddActivityFromRadius = (activity: Activity) => {
    if (!trip) return;
    const day = trip.itinerary[activeDay];
    const newActivity = { ...activity, id: `act-radius-${Date.now()}`, status: 'confirmed' as const };
    handleUpdateDay(activeDay, { ...day, activities: [...day.activities, newActivity] });
    setShowRadius(false);
  };

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

  const currentDay = trip.itinerary[activeDay];

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

      {/* Action bar */}
      <div className="bg-card border-b border-card-border px-4 py-2">
        <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowBookings(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors active:scale-95"
          >
            <Ticket className="w-3.5 h-3.5" />
            הזמנות
            {trip.bookings.length > 0 && (
              <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {trip.bookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowRadius(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            רדיוס מהמלון
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-card-border">
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-1.5 py-2 max-w-lg mx-auto">
          {trip.itinerary.map((day, idx) => {
            const confirmedCount = day.activities.filter((a) => a.status === 'confirmed' || a.status === 'done').length;
            return (
              <button
                key={day.date}
                onClick={() => setActiveDay(idx)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  activeDay === idx
                    ? 'bg-primary text-white'
                    : 'bg-card border border-card-border text-muted hover:text-foreground'
                }`}
              >
                יום {day.dayNumber}
                {confirmedCount > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                    activeDay === idx ? 'bg-white/20' : 'bg-success/10 text-success'
                  }`}>
                    {confirmedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <div className="max-w-lg mx-auto py-3">
        {currentDay && (
          <DayView
            day={currentDay}
            onUpdateDay={(updated) => handleUpdateDay(activeDay, updated)}
          />
        )}
      </div>

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-20 left-4 z-50 w-14 h-14 gradient-primary rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
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
      {showRadius && currentDay && (
        <RadiusExplorer
          hotelName={currentDay.accommodation?.name || trip.destination}
          activities={currentDay.activities}
          allDays={trip.itinerary}
          currentDayIndex={activeDay}
          onAddToDay={(activity, dayIndex) => {
            const day = trip.itinerary[dayIndex];
            const newActivity = { ...activity, id: `act-radius-${Date.now()}`, status: 'confirmed' as const };
            handleUpdateDay(dayIndex, { ...day, activities: [...day.activities, newActivity] });
          }}
          onSkipActivity={(activityId) => {
            const day = trip.itinerary[activeDay];
            handleUpdateDay(activeDay, {
              ...day,
              activities: day.activities.map((a) =>
                a.id === activityId
                  ? { ...a, status: a.status === 'skipped' ? 'suggested' as const : 'skipped' as const }
                  : a
              ),
            });
          }}
          onClose={() => setShowRadius(false)}
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
