'use client';

import { useState } from 'react';
import { X, MapPin, Navigation, Footprints, Bike, Car, Train } from 'lucide-react';
import { Activity } from '@/lib/types';

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
  onAddToDay: (activity: Activity) => void;
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

  // Distribute activities across zones (simulate distances)
  activities.forEach((activity, idx) => {
    const zoneIdx = Math.min(Math.floor(idx / Math.max(1, Math.ceil(activities.length / 4))), 3);
    const zoneActivity = {
      ...activity,
      distanceFromHotel: `${zones[zoneIdx].minKm + Math.random() * (zones[zoneIdx].maxKm - zones[zoneIdx].minKm)}`.slice(0, 3) + ' ק״מ',
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

export default function RadiusExplorer({ hotelName, activities, onAddToDay, onClose }: RadiusExplorerProps) {
  const [activeZone, setActiveZone] = useState(0);
  const zones = generateRadiusZones(activities);

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
            onClick={() => setActiveZone(idx)}
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
        {/* Transport modes for this zone */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted">איך מגיעים:</span>
          {zones[activeZone].transportModes.map((mode) => {
            const Icon = TRANSPORT_ICONS[mode] || Footprints;
            return (
              <div
                key={mode}
                className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
              >
                <Icon className="w-3 h-3" />
                <span>{TRANSPORT_LABELS[mode]}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mb-4">{zones[activeZone].estimatedTime}</p>

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
                {priorityActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-card rounded-2xl border border-card-border p-3 animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{activity.name}</h4>
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
                      <button
                        onClick={() => onAddToDay(activity)}
                        className="shrink-0 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors active:scale-95"
                      >
                        + הוסף
                      </button>
                    </div>
                  </div>
                ))}
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
