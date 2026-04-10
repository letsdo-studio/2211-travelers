'use client';

import { useState } from 'react';
import { X, MapPin, Navigation, Footprints, Bike, Car, Train, Check, ChevronDown, ChevronUp, Calendar, SkipForward, Info } from 'lucide-react';
import { Activity, DayPlan } from '@/lib/types';

const TRANSPORT_ICONS: Record<string, typeof Footprints> = {
  walking: Footprints,
  bike: Bike,
  taxi: Car,
  transit: Train,
};

const TRANSPORT_LABELS: Record<string, string> = {
  walking: 'רגל',
  bike: 'אופניים',
  taxi: 'מונית / רכב',
  transit: 'תחבורה ציבורית',
};

const TRANSPORT_RENTAL_INFO: Record<string, string[]> = {
  walking: [],
  bike: [
    '🚲 השכרת אופניים: חפשו תחנות שיתוף אופניים עירוניות (בדר״כ €1-2/שעה)',
    '🛴 קורקינט חשמלי: אפליקציות Lime, Bolt, Tier (€0.15-0.25/דקה)',
    '📱 טיפ: הורידו את האפליקציה מראש והירשמו לפני הטיול',
  ],
  taxi: [
    '🚕 Uber / Bolt / מונית מקומית',
    '💰 טיפ: השוו מחירים בין אפליקציות - הפרשים של עד 30%',
    '🚗 השכרת רכב: חפשו ב-Rentalcars.com או ב-Discover Cars',
    '📍 שימו לב לאזורי חניה ועלויות חניה במרכז העיר',
  ],
  transit: [
    '🚌 תחבורה ציבורית: חפשו כרטיס יומי/שבועי - משתלם יותר',
    '📱 אפליקציית Google Maps או Moovit למסלולים',
    '🎫 בהרבה ערים יש כרטיסי תייר שכוללים תחבורה + אטרקציות',
  ],
};

interface RadiusZone {
  label: string;
  range: string;
  minKm: number;
  maxKm: number;
  transportModes: string[];
  estimatedTime: string;
  activities: Activity[];
}

interface RadiusExplorerProps {
  hotelName: string;
  activities: Activity[];
  allDays: DayPlan[];
  currentDayIndex: number;
  onAddToDay: (activity: Activity, dayIndex: number) => void;
  onSkipActivity: (activityId: string) => void;
  onClose: () => void;
}

function generateRadiusZones(activities: Activity[]): RadiusZone[] {
  const zones: RadiusZone[] = [
    {
      label: 'סביבת המלון',
      range: '0-3 ק״מ',
      minKm: 0,
      maxKm: 3,
      transportModes: ['walking'],
      estimatedTime: 'עד 30 דקות הליכה',
      activities: [],
    },
    {
      label: 'מרחק בינוני',
      range: '3-6 ק״מ',
      minKm: 3,
      maxKm: 6,
      transportModes: ['walking', 'bike', 'transit'],
      estimatedTime: '15-30 דקות באופניים / תח״צ',
      activities: [],
    },
    {
      label: 'מרחק רחוק',
      range: '6-10 ק״מ',
      minKm: 6,
      maxKm: 10,
      transportModes: ['bike', 'taxi', 'transit'],
      estimatedTime: '20-40 דקות בתח״צ / מונית',
      activities: [],
    },
    {
      label: 'חצי יום טיול',
      range: '10+ ק״מ',
      minKm: 10,
      maxKm: 999,
      transportModes: ['taxi', 'transit'],
      estimatedTime: '30+ דקות ברכב / רכבת',
      activities: [],
    },
  ];

  activities.forEach((activity, idx) => {
    const zoneIdx = Math.min(Math.floor(idx / Math.max(1, Math.ceil(activities.length / 4))), 3);
    const zoneActivity = {
      ...activity,
      distanceFromHotel: `${(zones[zoneIdx].minKm + Math.random() * (zones[zoneIdx].maxKm - zones[zoneIdx].minKm)).toFixed(1)} ק״מ`,
      transportMode: zones[zoneIdx].transportModes[0],
    };
    zones[zoneIdx].activities.push(zoneActivity);
  });

  return zones;
}

const PRIORITY_CONFIG = {
  must: { label: 'חובה', className: 'priority-must' },
  should: { label: 'כדאי', className: 'priority-should' },
  'if-time': { label: 'אם יש זמן', className: 'priority-if-time' },
};

export default function RadiusExplorer({
  hotelName,
  activities,
  allDays,
  currentDayIndex,
  onAddToDay,
  onSkipActivity,
  onClose,
}: RadiusExplorerProps) {
  const [activeZone, setActiveZone] = useState(0);
  const [selectedTransport, setSelectedTransport] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState<string | null>(null);
  const zones = generateRadiusZones(activities);

  // Check if an activity exists in any day (by name match)
  const getActivityDayStatus = (activityName: string): { dayNumber: number; status: string } | null => {
    for (const day of allDays) {
      const found = day.activities.find(
        (a) => a.name === activityName
      );
      if (found) {
        return { dayNumber: day.dayNumber, status: found.status || 'suggested' };
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-card border-b border-card-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-bold">סביבת המלון</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="w-3 h-3" />
          <span>{hotelName}</span>
        </div>
      </div>

      {/* Zone tabs */}
      <div className="flex overflow-x-auto no-scrollbar px-4 gap-2 py-3 bg-card border-b border-card-border">
        {zones.map((zone, idx) => (
          <button
            key={zone.range}
            onClick={() => { setActiveZone(idx); setSelectedTransport(null); }}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
              activeZone === idx
                ? 'bg-primary text-white border-primary'
                : 'bg-card border-card-border text-muted hover:text-foreground'
            }`}
          >
            <div className="font-bold">{zone.range}</div>
            <div className="text-[10px] opacity-80">{zone.label}</div>
          </button>
        ))}
      </div>

      {/* Zone content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Transport modes */}
        <div className="mb-4">
          <span className="text-xs text-muted block mb-2">איך מגיעים:</span>
          <div className="flex flex-wrap items-center gap-2">
            {zones[activeZone].transportModes.map((mode) => {
              const Icon = TRANSPORT_ICONS[mode] || Footprints;
              const isSelected = selectedTransport === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSelectedTransport(isSelected ? null : mode)}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{TRANSPORT_LABELS[mode]}</span>
                  {TRANSPORT_RENTAL_INFO[mode]?.length > 0 && (
                    <Info className="w-3 h-3 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-1">{zones[activeZone].estimatedTime}</p>
        </div>

        {/* Transport rental info */}
        {selectedTransport && TRANSPORT_RENTAL_INFO[selectedTransport]?.length > 0 && (
          <div className="bg-accent/10 rounded-2xl p-3 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="font-bold text-sm">מידע על {TRANSPORT_LABELS[selectedTransport]}</span>
            </div>
            <div className="space-y-1.5">
              {TRANSPORT_RENTAL_INFO[selectedTransport].map((info, i) => (
                <p key={i} className="text-xs">{info}</p>
              ))}
            </div>
          </div>
        )}

        {/* Activities by priority */}
        {(['must', 'should', 'if-time'] as const).map((priority) => {
          const priorityActivities = zones[activeZone].activities.filter(
            (a) => a.priority === priority
          );
          if (priorityActivities.length === 0) return null;

          return (
            <div key={priority} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PRIORITY_CONFIG[priority].className}`}>
                  {PRIORITY_CONFIG[priority].label}
                </span>
                <span className="text-xs text-muted">{priorityActivities.length} פעילויות</span>
              </div>
              <div className="space-y-2">
                {priorityActivities.map((activity) => {
                  const dayStatus = getActivityDayStatus(activity.name);
                  const isSkipped = activity.status === 'skipped';

                  return (
                    <div
                      key={activity.id}
                      className={`bg-card rounded-2xl border border-card-border p-3 animate-fade-in ${isSkipped ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-sm">{activity.name}</h4>
                            {/* Cross-day status indicator */}
                            {dayStatus && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                dayStatus.status === 'done'
                                  ? 'bg-success/10 text-success'
                                  : dayStatus.status === 'confirmed'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted/10 text-muted'
                              }`}>
                                {dayStatus.status === 'done' ? (
                                  <><Check className="w-3 h-3" /> בוצע יום {dayStatus.dayNumber}</>
                                ) : dayStatus.status === 'confirmed' ? (
                                  <><Calendar className="w-3 h-3" /> מאושר יום {dayStatus.dayNumber}</>
                                ) : (
                                  <><Calendar className="w-3 h-3" /> יום {dayStatus.dayNumber}</>
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">{activity.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.distanceFromHotel}
                            </span>
                            <span>{activity.startTime} - {activity.endTime}</span>
                            <span>{activity.cost}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {/* Add to current day */}
                          {!dayStatus && !isSkipped && (
                            <button
                              onClick={() => onAddToDay(activity, currentDayIndex)}
                              className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-medium hover:bg-primary/20 transition-colors active:scale-95"
                            >
                              + יום {allDays[currentDayIndex]?.dayNumber}
                            </button>
                          )}
                          {/* Add to different day */}
                          {!isSkipped && (
                            <div className="relative">
                              <button
                                onClick={() => setShowDayPicker(showDayPicker === activity.id ? null : activity.id)}
                                className="px-2.5 py-1 bg-card border border-card-border rounded-lg text-[10px] font-medium text-muted hover:text-foreground transition-colors active:scale-95 flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                יום אחר
                                {showDayPicker === activity.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              {showDayPicker === activity.id && (
                                <div className="absolute left-0 top-full mt-1 bg-card border border-card-border rounded-xl shadow-lg z-10 p-1 min-w-[100px] animate-fade-in">
                                  {allDays.map((d, idx) => (
                                    <button
                                      key={d.date}
                                      onClick={() => {
                                        onAddToDay(activity, idx);
                                        setShowDayPicker(null);
                                      }}
                                      className="w-full text-right px-3 py-1.5 text-xs rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                      יום {d.dayNumber} - {d.date}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Skip / unskip */}
                          {isSkipped ? (
                            <button
                              onClick={() => onSkipActivity(activity.id)}
                              className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-medium hover:bg-primary/20 transition-colors active:scale-95"
                            >
                              החזר
                            </button>
                          ) : (
                            <button
                              onClick={() => onSkipActivity(activity.id)}
                              className="px-2.5 py-1 bg-danger/10 text-danger rounded-lg text-[10px] font-medium hover:bg-danger/20 transition-colors active:scale-95 flex items-center gap-1"
                            >
                              <SkipForward className="w-3 h-3" />
                              דלג
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {zones[activeZone].activities.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-10 h-10 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">אין פעילויות מוגדרות באזור הזה</p>
            <p className="text-xs text-muted mt-1">נסו לשאול את ה-AI על אטרקציות באזור</p>
          </div>
        )}
      </div>
    </div>
  );
}
