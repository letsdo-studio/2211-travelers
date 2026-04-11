'use client';

import { useState } from 'react';
import {
  MapPin, Hotel, Utensils, Train, Sparkles, Plus, Check, X as XIcon,
  Edit3, Star, Clock, ChevronDown, Calendar, SkipForward,
} from 'lucide-react';
import { RecommendationPool, Activity, Meal, Accommodation, TransportRecommendation, DayPlan } from '@/lib/types';

interface RecommendationsPoolProps {
  pool: RecommendationPool;
  days: DayPlan[];
  onAddToDay: (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string, dayIndex: number) => void;
  onRemoveFromDay: (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string, dayIndex: number) => void;
  onSkip: (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string) => void;
  onEdit: (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', item: Activity | Meal | Accommodation | TransportRecommendation) => void;
}

type Tab = 'attractions' | 'meals' | 'accommodations' | 'transports';

const PRIORITY_CONFIG = {
  must: { label: 'חובה', className: 'priority-must' },
  should: { label: 'כדאי', className: 'priority-should' },
  'if-time': { label: 'אם יש זמן', className: 'priority-if-time' },
};

export default function RecommendationsPool({
  pool,
  days,
  onAddToDay,
  onRemoveFromDay,
  onSkip,
  onEdit,
}: RecommendationsPoolProps) {
  const [activeTab, setActiveTab] = useState<Tab>('attractions');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState<string | null>(null);

  // Helper to find which days an item is in
  const findDaysForItem = (itemType: 'attraction' | 'meal' | 'accommodation' | 'transport', itemId: string): number[] => {
    const result: number[] = [];
    days.forEach((day, idx) => {
      if (itemType === 'attraction' && day.activityIds.includes(itemId)) result.push(idx);
      if (itemType === 'meal' && day.mealIds.includes(itemId)) result.push(idx);
      if (itemType === 'accommodation' && day.accommodationId === itemId) result.push(idx);
      if (itemType === 'transport' && day.transitId === itemId) result.push(idx);
    });
    return result;
  };

  const tabs: { id: Tab; label: string; icon: typeof MapPin; count: number }[] = [
    { id: 'attractions', label: 'אטרקציות', icon: MapPin, count: pool.attractions.filter(a => a.status !== 'skipped').length },
    { id: 'meals', label: 'מסעדות', icon: Utensils, count: pool.meals.filter(m => m.status !== 'skipped').length },
    { id: 'accommodations', label: 'לינה', icon: Hotel, count: pool.accommodations.filter(a => a.bookingStatus !== 'skipped').length },
    { id: 'transports', label: 'תחבורה', icon: Train, count: pool.transports.filter(t => t.status !== 'skipped').length },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="sticky top-[57px] z-30 bg-background border-b border-card-border">
        <div className="flex overflow-x-auto no-scrollbar gap-1 px-4 py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-card border border-card-border text-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 space-y-2 max-w-lg mx-auto">
        {/* Attractions tab */}
        {activeTab === 'attractions' && (
          <>
            {(['must', 'should', 'if-time'] as const).map((priority) => {
              const items = pool.attractions.filter((a) => a.priority === priority && a.status !== 'skipped');
              if (items.length === 0) return null;
              return (
                <div key={priority} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIORITY_CONFIG[priority].className}`}>
                      {PRIORITY_CONFIG[priority].label}
                    </span>
                    <span className="text-xs text-muted">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((activity) => {
                      const daysIn = findDaysForItem('attraction', activity.id);
                      const isExpanded = expandedItem === activity.id;
                      return (
                        <div key={activity.id} className="bg-card rounded-2xl border border-card-border p-3 animate-fade-in">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0" onClick={() => setExpandedItem(isExpanded ? null : activity.id)}>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {activity.destinationName && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activity.destinationName}</span>
                                )}
                                {daysIn.length > 0 && (
                                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    יום {daysIn.map(i => days[i].dayNumber).join(', ')}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-sm">{activity.name}</h4>
                              <p className="text-xs text-muted mt-0.5 line-clamp-2">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                                {activity.duration && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{activity.duration}</span>}
                                {activity.cost && <span>{activity.cost}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => onEdit('attraction', activity)}
                                className="p-1.5 rounded-lg hover:bg-primary/10"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-muted" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setShowDayPicker(showDayPicker === activity.id ? null : activity.id)}
                                  className="px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  ליום
                                </button>
                                {showDayPicker === activity.id && (
                                  <div className="absolute left-0 top-full mt-1 bg-card border border-card-border rounded-xl shadow-lg z-50 p-1 min-w-[120px] animate-fade-in">
                                    {days.map((d, idx) => {
                                      const inThisDay = daysIn.includes(idx);
                                      return (
                                        <button
                                          key={d.date}
                                          onClick={() => {
                                            if (inThisDay) {
                                              onRemoveFromDay('attraction', activity.id, idx);
                                            } else {
                                              onAddToDay('attraction', activity.id, idx);
                                            }
                                            setShowDayPicker(null);
                                          }}
                                          className={`w-full text-right px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                                            inThisDay ? 'bg-success/10 text-success' : 'hover:bg-primary/10'
                                          }`}
                                        >
                                          <span>יום {d.dayNumber}</span>
                                          {inThisDay && <Check className="w-3 h-3" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-card-border space-y-1 text-xs animate-fade-in">
                              <p><MapPin className="inline w-3 h-3 ml-1 text-primary" />{activity.location}</p>
                              {activity.tips && <p><Star className="inline w-3 h-3 ml-1 text-accent" />{activity.tips}</p>}
                              {activity.crowdLevel && <p>👥 {activity.crowdLevel}</p>}
                              {activity.bestTimeToVisit && <p>⏰ {activity.bestTimeToVisit}</p>}
                              <button
                                onClick={() => onSkip('attraction', activity.id)}
                                className="mt-2 text-[10px] text-danger flex items-center gap-1"
                              >
                                <SkipForward className="w-3 h-3" /> דלג על המלצה זו
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Meals tab */}
        {activeTab === 'meals' && (
          <>
            {(['breakfast', 'lunch', 'dinner', 'coffee', 'snack'] as const).map((mealType) => {
              const items = pool.meals.filter((m) => m.type === mealType && m.status !== 'skipped');
              if (items.length === 0) return null;
              const labels = { breakfast: '🥐 בוקר', lunch: '🥙 צהריים', dinner: '🍝 ערב', coffee: '☕ קפה', snack: '🍿 חטיפים' };
              return (
                <div key={mealType} className="mb-3">
                  <h3 className="text-sm font-bold mb-2">{labels[mealType]}</h3>
                  <div className="space-y-2">
                    {items.map((meal) => {
                      const daysIn = findDaysForItem('meal', meal.id);
                      return (
                        <div key={meal.id} className="bg-card rounded-2xl border border-card-border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {daysIn.length > 0 && (
                                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> יום {daysIn.map(i => days[i].dayNumber).join(', ')}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted">{meal.priceRange}</span>
                              </div>
                              <h4 className="font-bold text-sm">{meal.restaurant}</h4>
                              <p className="text-xs text-muted">{meal.description}</p>
                              <p className="text-[10px] text-muted mt-1">⭐ {meal.rating} · {meal.location}</p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button onClick={() => onEdit('meal', meal)} className="p-1.5 rounded-lg hover:bg-primary/10">
                                <Edit3 className="w-3.5 h-3.5 text-muted" />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => setShowDayPicker(showDayPicker === meal.id ? null : meal.id)}
                                  className="px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />ליום
                                </button>
                                {showDayPicker === meal.id && (
                                  <div className="absolute left-0 top-full mt-1 bg-card border border-card-border rounded-xl shadow-lg z-50 p-1 min-w-[120px] animate-fade-in">
                                    {days.map((d, idx) => {
                                      const inThisDay = daysIn.includes(idx);
                                      return (
                                        <button
                                          key={d.date}
                                          onClick={() => {
                                            if (inThisDay) onRemoveFromDay('meal', meal.id, idx);
                                            else onAddToDay('meal', meal.id, idx);
                                            setShowDayPicker(null);
                                          }}
                                          className={`w-full text-right px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                                            inThisDay ? 'bg-success/10 text-success' : 'hover:bg-primary/10'
                                          }`}
                                        >
                                          <span>יום {d.dayNumber}</span>
                                          {inThisDay && <Check className="w-3 h-3" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Accommodations tab */}
        {activeTab === 'accommodations' && (
          <div className="space-y-2">
            {pool.accommodations.filter((a) => a.bookingStatus !== 'skipped').map((acc) => {
              const daysIn = findDaysForItem('accommodation', acc.id);
              return (
                <div key={acc.id} className="bg-card rounded-2xl border border-card-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {acc.destinationName && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{acc.destinationName}</span>
                        )}
                        {daysIn.length > 0 && (
                          <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> {daysIn.length} לילות
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm">{acc.name}</h4>
                      <p className="text-xs text-muted">{acc.type} · {acc.pricePerNight}/לילה · ⭐ {acc.rating}</p>
                      {acc.pros && acc.pros.length > 0 && (
                        <p className="text-[10px] text-success mt-1">✓ {acc.pros.join(' · ')}</p>
                      )}
                      {acc.cons && acc.cons.length > 0 && (
                        <p className="text-[10px] text-warning">✗ {acc.cons.join(' · ')}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => onEdit('accommodation', acc)} className="p-1.5 rounded-lg hover:bg-primary/10">
                        <Edit3 className="w-3.5 h-3.5 text-muted" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowDayPicker(showDayPicker === acc.id ? null : acc.id)}
                          className="px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-bold"
                        >
                          <Plus className="w-3 h-3 inline" />ימים
                        </button>
                        {showDayPicker === acc.id && (
                          <div className="absolute left-0 top-full mt-1 bg-card border border-card-border rounded-xl shadow-lg z-50 p-1 min-w-[120px] animate-fade-in">
                            {days.map((d, idx) => {
                              const inThisDay = daysIn.includes(idx);
                              return (
                                <button
                                  key={d.date}
                                  onClick={() => {
                                    if (inThisDay) onRemoveFromDay('accommodation', acc.id, idx);
                                    else onAddToDay('accommodation', acc.id, idx);
                                  }}
                                  className={`w-full text-right px-3 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                                    inThisDay ? 'bg-success/10 text-success' : 'hover:bg-primary/10'
                                  }`}
                                >
                                  <span>יום {d.dayNumber}</span>
                                  {inThisDay && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transports tab */}
        {activeTab === 'transports' && (
          <div className="space-y-2">
            {(['inter-city', 'intra-city', 'point-to-point'] as const).map((cat) => {
              const items = pool.transports.filter((t) => t.category === cat && t.status !== 'skipped');
              if (items.length === 0) return null;
              const labels = {
                'inter-city': '🚂 בין יעדים',
                'intra-city': '🚌 בתוך העיר',
                'point-to-point': '📍 נקודה לנקודה',
              };
              return (
                <div key={cat} className="mb-3">
                  <h3 className="text-sm font-bold mb-2">{labels[cat]}</h3>
                  <div className="space-y-2">
                    {items.map((trans) => (
                      <div key={trans.id} className="bg-card rounded-2xl border border-card-border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold">{trans.from} → {trans.to}</span>
                              {trans.scenic && <span className="text-[10px]">🌅</span>}
                            </div>
                            <p className="text-xs text-muted">
                              <span className="font-medium">{trans.mode}</span> · {trans.duration} · {trans.cost}
                            </p>
                            {trans.alternativeModes && trans.alternativeModes.length > 0 && (
                              <p className="text-[10px] text-muted">חלופות: {trans.alternativeModes.join(', ')}</p>
                            )}
                            {trans.notes && <p className="text-[10px] mt-1">{trans.notes}</p>}
                          </div>
                          <button onClick={() => onEdit('transport', trans)} className="p-1.5 rounded-lg hover:bg-primary/10">
                            <Edit3 className="w-3.5 h-3.5 text-muted" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {((activeTab === 'attractions' && pool.attractions.length === 0) ||
          (activeTab === 'meals' && pool.meals.length === 0) ||
          (activeTab === 'accommodations' && pool.accommodations.length === 0) ||
          (activeTab === 'transports' && pool.transports.length === 0)) && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-muted">אין המלצות באזור הזה עדיין</p>
          </div>
        )}
      </div>
    </div>
  );
}
