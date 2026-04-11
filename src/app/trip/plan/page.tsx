'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, Clock, Star, ChevronDown, ChevronUp, Train, Utensils,
  Hotel, MessageCircle, Lightbulb, Eye, Users, Sparkles, Edit3,
  Navigation, Ticket, CheckCircle, Plus, Check, X as XIcon, SkipForward,
  CalendarClock, Loader2, AlertCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChatPanel from '@/components/ChatPanel';
import EditModal from '@/components/EditModal';
import BookingPanel from '@/components/BookingPanel';
import RadiusExplorer from '@/components/RadiusExplorer';
import { getTrip, saveTrip, getProfile, getSettings } from '@/lib/storage';
import { generateItineraryForTrip } from '@/lib/trip-generator';
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

function MealCard({
  meal,
  onEdit,
  onStatusChange,
}: {
  meal: Meal;
  onEdit: () => void;
  onStatusChange: (status: Meal['status']) => void;
}) {
  const status = meal.status || 'suggested';
  return (
    <div className={`bg-card rounded-2xl p-3 border border-card-border ${status === 'done' ? 'opacity-60' : ''} ${status === 'skipped' ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm">
              {meal.type === 'breakfast' ? '🥐' : meal.type === 'lunch' ? '🥙' : meal.type === 'dinner' ? '🍝' : '☕'}
            </span>
            <span className="font-bold text-xs">
              {meal.type === 'breakfast' ? 'בוקר' : meal.type === 'lunch' ? 'צהריים' : meal.type === 'dinner' ? 'ערב' : 'קפה'}
            </span>
            <span className="text-[10px] text-muted">{meal.priceRange}</span>
            {status && <StatusBadge status={status} />}
          </div>
          <h4 className="text-sm font-medium">{meal.restaurant}</h4>
          <p className="text-xs text-muted">{meal.description}</p>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
            <span>⭐ {meal.rating}</span>
            <span>· {meal.source}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {(status === 'suggested') && (
            <button onClick={() => onStatusChange('confirmed')} className="p-1.5 rounded-lg hover:bg-success/10 transition-colors" title="אשר">
              <Check className="w-3.5 h-3.5 text-success" />
            </button>
          )}
          {status === 'confirmed' && (
            <>
              <button onClick={() => onStatusChange('suggested')} className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors" title="החזר להצעה">
                <XIcon className="w-3.5 h-3.5 text-warning" />
              </button>
              <button onClick={() => onStatusChange('done')} className="p-1.5 rounded-lg hover:bg-success/10 transition-colors" title="בוצע">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              </button>
            </>
          )}
          {status === 'done' && (
            <button onClick={() => onStatusChange('confirmed')} className="p-1.5 rounded-lg hover:bg-warning/10 transition-colors" title="בטל ביצוע">
              <XIcon className="w-3.5 h-3.5 text-warning" />
            </button>
          )}
          {status === 'skipped' && (
            <button onClick={() => onStatusChange('suggested')} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="החזר">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
            <Edit3 className="w-3.5 h-3.5 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Convert meal type to numeric time for sorting
function mealToTime(type: Meal['type']): string {
  return ({
    breakfast: '08:00',
    coffee: '10:30',
    lunch: '13:00',
    snack: '16:00',
    dinner: '19:30',
  } as Record<Meal['type'], string>)[type] || '12:00';
}

type ScheduleItem =
  | { kind: 'activity'; time: string; data: Activity }
  | { kind: 'meal'; time: string; data: Meal };

function DayView({
  day,
  onUpdateDay,
}: {
  day: DayPlan;
  onUpdateDay: (updated: DayPlan) => void;
}) {
  const [showAccommodation, setShowAccommodation] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Schedule = confirmed/done activities + meals, sorted by time
  const scheduleItems: ScheduleItem[] = [
    ...day.activities
      .filter((a) => a.status === 'confirmed' || a.status === 'done')
      .map((a) => ({ kind: 'activity' as const, time: a.startTime, data: a })),
    ...day.meals
      .filter((m) => m.status === 'confirmed' || m.status === 'done')
      .map((m) => ({ kind: 'meal' as const, time: mealToTime(m.type), data: m })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  // Recommendations = suggested activities + meals, by priority
  const priorityOrder = { must: 0, should: 1, 'if-time': 2 };
  const suggestedActivities = day.activities
    .filter((a) => a.status === 'suggested' || !a.status)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const suggestedMeals = day.meals.filter((m) => m.status === 'suggested' || !m.status);

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

        {/* Schedule (confirmed) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-success" />
              <span className="font-bold text-sm">לוח זמנים יומי</span>
              <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full">
                {scheduleItems.length} פריטים
              </span>
            </div>
          </div>
          {scheduleItems.length === 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-card-border border-dashed text-center">
              <p className="text-xs text-muted">
                אין פריטים בלוח עדיין. אשר המלצות מהרשימה למטה כדי להוסיף ליום.
              </p>
            </div>
          ) : (
            scheduleItems.map((item, idx) => (
              <div key={`${item.kind}-${item.data.id}-${idx}`} className="relative">
                {/* Timeline indicator */}
                <div className="absolute right-0 top-3 w-1 h-1 bg-success rounded-full" />
                <div className="text-[10px] text-success font-mono mb-0.5 pr-3">
                  {item.kind === 'activity'
                    ? `${(item.data as Activity).startTime} - ${(item.data as Activity).endTime}`
                    : item.time}
                </div>
                {item.kind === 'activity' ? (
                  <ActivityCard
                    activity={item.data as Activity}
                    onEdit={() => {
                      setIsAddingActivity(false);
                      setEditingActivity(item.data as Activity);
                    }}
                    onStatusChange={(status) => handleActivityStatusChange((item.data as Activity).id, status)}
                  />
                ) : (
                  <MealCard
                    meal={item.data as Meal}
                    onEdit={() => setEditingMeal(item.data as Meal)}
                    onStatusChange={(status) => {
                      const m = item.data as Meal;
                      onUpdateDay({
                        ...day,
                        meals: day.meals.map((x) => x.id === m.id ? { ...x, status } : x),
                      });
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Recommendations */}
        {(suggestedActivities.length > 0 || suggestedMeals.length > 0) && (
          <div className="space-y-2 mt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">המלצות AI</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {suggestedActivities.length + suggestedMeals.length} הצעות
              </span>
            </div>
            {suggestedActivities.map((activity) => (
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
            {suggestedMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onEdit={() => setEditingMeal(meal)}
                onStatusChange={(status) => {
                  onUpdateDay({
                    ...day,
                    meals: day.meals.map((x) => x.id === meal.id ? { ...x, status } : x),
                  });
                }}
              />
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
  const [generationStarted, setGenerationStarted] = useState(false);

  useEffect(() => {
    if (tripId) {
      const loaded = getTrip(tripId);
      if (loaded) {
        if (!loaded.bookings) loaded.bookings = [];
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

  // Auto-generate itinerary if trip is in 'generating' state
  useEffect(() => {
    if (!trip || trip.status !== 'generating' || generationStarted) return;
    setGenerationStarted(true);

    (async () => {
      const profile = getProfile(trip.profileId);
      if (!profile) {
        const errorTrip = { ...trip, status: 'planning' as const, generationError: 'לא נמצא פרופיל' };
        setTrip(errorTrip);
        saveTrip(errorTrip);
        return;
      }

      const settings = getSettings();
      const result = await generateItineraryForTrip(trip, profile, settings.geminiApiKey, settings.aiProvider === 'demo');

      const updatedTrip: Trip = {
        ...trip,
        status: 'planning',
        itinerary: result.itinerary,
        generationError: result.error,
      };
      setTrip(updatedTrip);
      saveTrip(updatedTrip);

      if (result.error) {
        console.error('Generation error:', result.error);
      }
    })();
  }, [trip, generationStarted]);

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

  // Generating state - show loading screen
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
            <h2 className="text-xl font-bold mb-2">Gemini בונה את הטיול שלכם</h2>
            <p className="text-sm text-muted mb-6">
              מחפש את הפעילויות הטובות ביותר ב{trip.destination},
              ומתכנן לוח זמנים מותאם אישית...
            </p>
            <div className="space-y-2">
              {[
                { icon: '🗺️', text: 'מנתח את היעד' },
                { icon: '🏨', text: 'מחפש לינה מתאימה' },
                { icon: '🎯', text: 'מתאים פעילויות לסגנון שלכם' },
                { icon: '🍕', text: 'בודק המלצות אוכל' },
                { icon: '🚂', text: 'מתכנן העברות' },
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

      {/* Generation error banner */}
      {trip.generationError && (
        <div className="bg-warning/10 border-b border-warning/30 px-4 py-2">
          <div className="max-w-lg mx-auto flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-warning">תכנון AI נכשל - הוצגו נתוני דמו</p>
              <p className="text-muted">{trip.generationError}</p>
            </div>
          </div>
        </div>
      )}

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
      {showRadius && currentDay && (() => {
        // Pool activities from all days at the same location (to dedupe by name)
        const sameLocationDays = trip.itinerary.filter((d) => d.location === currentDay.location);
        const seenNames = new Set<string>();
        const pooledActivities: Activity[] = [];
        sameLocationDays.forEach((d) => {
          d.activities.forEach((a) => {
            if (!seenNames.has(a.name)) {
              seenNames.add(a.name);
              pooledActivities.push(a);
            }
          });
        });

        return (
          <RadiusExplorer
            hotelName={currentDay.accommodation?.name || trip.destination}
            activities={pooledActivities}
            allDays={trip.itinerary}
            currentDayIndex={activeDay}
            onAddToDay={(activity, dayIndex) => {
              const day = trip.itinerary[dayIndex];
              // If activity already exists (suggested), just confirm it
              const existing = day.activities.find((a) => a.name === activity.name);
              if (existing) {
                handleUpdateDay(dayIndex, {
                  ...day,
                  activities: day.activities.map((a) =>
                    a.id === existing.id ? { ...a, status: 'confirmed' as const } : a
                  ),
                });
              } else {
                const newActivity = { ...activity, id: `act-radius-${Date.now()}`, status: 'confirmed' as const };
                handleUpdateDay(dayIndex, { ...day, activities: [...day.activities, newActivity] });
              }
            }}
            onSkipActivity={(activityId) => {
              // Skip on all days where this activity exists
              const activity = pooledActivities.find((a) => a.id === activityId);
              if (!activity) return;
              const newItinerary = trip.itinerary.map((d) => ({
                ...d,
                activities: d.activities.map((a) =>
                  a.name === activity.name
                    ? { ...a, status: a.status === 'skipped' ? 'suggested' as const : 'skipped' as const }
                    : a
                ),
              }));
              updateTrip({ ...trip, itinerary: newItinerary });
            }}
            onClose={() => setShowRadius(false)}
          />
        );
      })()}

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
