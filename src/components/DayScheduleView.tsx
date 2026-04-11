'use client';

import { useState } from 'react';
import {
  Clock, MapPin, Hotel, Train, Lightbulb, Sparkles, X as XIcon,
  CheckCircle, Check, AlertTriangle, Loader2, MessageSquare, Plus,
} from 'lucide-react';
import { DayPlan, RecommendationPool, Activity, Meal, Accommodation, Conflict } from '@/lib/types';

interface DayScheduleViewProps {
  day: DayPlan;
  pool: RecommendationPool;
  onRemoveItem: (itemType: 'attraction' | 'meal' | 'accommodation', itemId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onRequestAIInsights: () => Promise<string>;
  onSwitchToPool: () => void;
}

function mealToTime(type: Meal['type']): string {
  return ({
    breakfast: '08:00',
    coffee: '10:30',
    lunch: '13:00',
    snack: '16:00',
    dinner: '19:30',
  } as Record<Meal['type'], string>)[type] || '12:00';
}

function detectConflicts(items: ScheduleItem[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Time overlap detection (only for activities with times)
  const timed = items.filter((i) => i.kind === 'activity' && (i.data as Activity).startTime);
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i].data as Activity;
      const b = timed[j].data as Activity;
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        conflicts.push({
          type: 'time-overlap',
          message: `${a.name} ו-${b.name} חופפים בזמן`,
          affectedIds: [a.id, b.id],
          severity: 'warning',
        });
      }
    }
  }

  // Too many activities warning
  const activityCount = items.filter((i) => i.kind === 'activity').length;
  if (activityCount > 6) {
    conflicts.push({
      type: 'too-much',
      message: `יום עמוס מאוד - ${activityCount} פעילויות. שקלו לדחות חלק ליום אחר`,
      affectedIds: [],
      severity: 'warning',
    });
  }

  return conflicts;
}

type ScheduleItem =
  | { kind: 'activity'; time: string; data: Activity }
  | { kind: 'meal'; time: string; data: Meal };

export default function DayScheduleView({
  day,
  pool,
  onRemoveItem,
  onUpdateNotes,
  onRequestAIInsights,
  onSwitchToPool,
}: DayScheduleViewProps) {
  const [aiInsights, setAiInsights] = useState<string>(day.aiInsights || '');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Resolve IDs to actual items from pool
  const dayActivities = day.activityIds
    .map((id) => pool.attractions.find((a) => a.id === id))
    .filter((a): a is Activity => Boolean(a));
  const dayMeals = day.mealIds
    .map((id) => pool.meals.find((m) => m.id === id))
    .filter((m): m is Meal => Boolean(m));
  const accommodation = day.accommodationId
    ? pool.accommodations.find((a) => a.id === day.accommodationId)
    : null;

  // Build schedule sorted by time
  const scheduleItems: ScheduleItem[] = [
    ...dayActivities.map((a) => ({ kind: 'activity' as const, time: a.startTime || '12:00', data: a })),
    ...dayMeals.map((m) => ({ kind: 'meal' as const, time: mealToTime(m.type), data: m })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const conflicts = detectConflicts(scheduleItems);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const insights = await onRequestAIInsights();
    setAiInsights(insights);
    setLoadingInsights(false);
  };

  return (
    <div className="animate-slide-up">
      {/* Day header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-bold text-lg">יום {day.dayNumber}</h3>
            <p className="text-xs text-muted">{day.date} · {day.location}</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-xl transition-colors ${showNotes ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-card'}`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={handleGetInsights}
              disabled={loadingInsights}
              className="p-2 rounded-xl text-accent hover:bg-accent/10 transition-colors"
              title="קבל תובנות AI"
            >
              {loadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Notes editor */}
        {showNotes && (
          <textarea
            value={day.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="הערות אישיות ליום..."
            rows={2}
            className="w-full px-3 py-2 bg-card border border-card-border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none animate-fade-in"
          />
        )}

        {/* AI insights */}
        {aiInsights && (
          <div className="bg-accent/10 rounded-2xl p-3 animate-fade-in">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-accent mb-1">תובנת AI ליום:</p>
                <p className="text-xs whitespace-pre-line">{aiInsights}</p>
              </div>
              <button onClick={() => setAiInsights('')} className="p-0.5">
                <XIcon className="w-3 h-3 text-muted" />
              </button>
            </div>
          </div>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="bg-warning/10 rounded-2xl p-3 space-y-1.5">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs">{c.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Accommodation */}
        {accommodation && (
          <div className="bg-primary/5 rounded-2xl p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Hotel className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">לינה</span>
            </div>
            <h4 className="font-bold text-sm">{accommodation.name}</h4>
            <p className="text-xs text-muted">
              {accommodation.type} · {accommodation.pricePerNight}/לילה · ⭐ {accommodation.rating}
            </p>
          </div>
        )}

        {/* Schedule */}
        {scheduleItems.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-card-border border-dashed text-center">
            <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-2" />
            <p className="text-sm font-medium mb-1">אין פעילויות ביום הזה</p>
            <p className="text-xs text-muted mb-3">
              עברו לטאב המלצות והוסיפו פעילויות, מסעדות ולינה ליום
            </p>
            <button
              onClick={onSwitchToPool}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              עבור להמלצות
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduleItems.map((item, idx) => {
              const isConflict = conflicts.some((c) => c.affectedIds.includes(item.data.id));
              return (
                <div key={`${item.kind}-${item.data.id}-${idx}`} className="relative">
                  <div className="text-[10px] text-success font-mono mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.kind === 'activity'
                      ? `${(item.data as Activity).startTime} - ${(item.data as Activity).endTime}`
                      : item.time}
                    {isConflict && <AlertTriangle className="w-3 h-3 text-warning" />}
                  </div>
                  <div className={`bg-card rounded-2xl border p-3 ${isConflict ? 'border-warning/50' : 'border-card-border'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">
                          {item.kind === 'activity'
                            ? (item.data as Activity).name
                            : `${(item.data as Meal).type === 'breakfast' ? '🥐' : (item.data as Meal).type === 'lunch' ? '🥙' : (item.data as Meal).type === 'dinner' ? '🍝' : '☕'} ${(item.data as Meal).restaurant}`}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          {item.kind === 'activity'
                            ? (item.data as Activity).description
                            : (item.data as Meal).description}
                        </p>
                        <p className="text-[10px] text-muted mt-1">
                          <MapPin className="inline w-3 h-3 ml-1" />
                          {item.kind === 'activity'
                            ? (item.data as Activity).location
                            : (item.data as Meal).location}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          onRemoveItem(
                            item.kind === 'activity' ? 'attraction' : 'meal',
                            item.data.id
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-danger shrink-0"
                        title="הסר מהיום"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
