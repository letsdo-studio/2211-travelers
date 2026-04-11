'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Calendar, Users, Wallet, Utensils, Compass,
  Clock, Sparkles, Loader2, Plus, Trash2, Plane, Target, MessageSquare,
} from 'lucide-react';
import Header from '@/components/Header';
import { saveTrip } from '@/lib/storage';
import { TravelerProfile, Trip, Destination, TransportInfo } from '@/lib/types';
import { generateEmptyDays } from '@/lib/trip-generator';

const INTERESTS = [
  { id: 'history', label: 'היסטוריה', icon: '🏛️' },
  { id: 'nature', label: 'טבע', icon: '🌿' },
  { id: 'food', label: 'אוכל', icon: '🍕' },
  { id: 'art', label: 'אמנות', icon: '🎨' },
  { id: 'nightlife', label: 'חיי לילה', icon: '🌙' },
  { id: 'shopping', label: 'שופינג', icon: '🛍️' },
  { id: 'adventure', label: 'אדרנלין', icon: '🧗' },
  { id: 'beach', label: 'חוף', icon: '🏖️' },
  { id: 'culture', label: 'תרבות', icon: '🎭' },
  { id: 'photography', label: 'צילום', icon: '📸' },
  { id: 'wellness', label: 'ספא/יוגה', icon: '🧘' },
  { id: 'sports', label: 'ספורט/כושר', icon: '💪' },
  { id: 'local', label: 'חוויה מקומית', icon: '🏘️' },
  { id: 'markets', label: 'שווקים', icon: '🏪' },
];

const STEPS = [
  { id: 'brief', title: 'בריף ומטרה', icon: Target },
  { id: 'destinations', title: 'יעדים', icon: MapPin },
  { id: 'dates', title: 'תאריכים', icon: Calendar },
  { id: 'travelers', title: 'מטיילים', icon: Users },
  { id: 'transport', title: 'הגעה ועזיבה', icon: Plane },
  { id: 'instructions', title: 'הנחיות', icon: MessageSquare },
];

function emptyTraveler(idx: number): TravelerProfile {
  return {
    id: `trav-${Date.now()}-${idx}`,
    name: '',
    travelStyle: 'mixed',
    budgetPerNight: { min: 50, max: 150, currency: 'EUR' },
    accommodationLevel: 'mid',
    foodPreferences: {
      breakfast: 'בית קפה מקומי',
      lunch: 'מסעדה קלילה',
      dinner: 'מסעדה מקומית',
      coffee: 'specialty coffee',
      snacks: '',
    },
    interests: [],
    pace: 'moderate',
    wakeUpTime: '08:00',
    specialNeeds: '',
    importantThings: '',
  };
}

function emptyDestination(idx: number): Destination {
  return {
    id: `dest-${Date.now()}-${idx}`,
    name: '',
    country: '',
    startDate: '',
    endDate: '',
  };
}

function emptyTransport(): TransportInfo {
  return {
    type: 'flight',
    number: '',
    from: '',
    to: '',
    date: '',
    time: '',
    notes: '',
  };
}

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [tripName, setTripName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([emptyDestination(0)]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState<TravelerProfile[]>([emptyTraveler(0)]);
  const [arrival, setArrival] = useState<TransportInfo | null>(null);
  const [departure, setDeparture] = useState<TransportInfo | null>(null);
  const [editingTravelerIdx, setEditingTravelerIdx] = useState<number | null>(null);

  const updateDestination = (idx: number, updates: Partial<Destination>) => {
    setDestinations((prev) => prev.map((d, i) => i === idx ? { ...d, ...updates } : d));
  };

  const updateTraveler = (idx: number, updates: Partial<TravelerProfile>) => {
    setTravelers((prev) => prev.map((t, i) => i === idx ? { ...t, ...updates } : t));
  };

  const toggleInterest = (idx: number, id: string) => {
    setTravelers((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      return {
        ...t,
        interests: t.interests.includes(id) ? t.interests.filter((x) => x !== id) : [...t.interests, id],
      };
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return purpose.length > 0 || tripName.length > 0;
      case 1: return destinations.every((d) => d.name.length > 0);
      case 2: return startDate && endDate;
      case 3: return travelers.every((t) => t.name.length > 0 && t.interests.length > 0);
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const handleSubmit = () => {
    const tripId = `trip-${Date.now()}`;

    // Auto-distribute destinations across dates if not specified
    const destsWithDates = destinations.map((d, i) => {
      if (d.startDate && d.endDate) return d;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysPerDest = Math.ceil(totalDays / destinations.length);
      const destStart = new Date(start);
      destStart.setDate(destStart.getDate() + i * daysPerDest);
      const destEnd = new Date(destStart);
      destEnd.setDate(destEnd.getDate() + daysPerDest - 1);
      if (destEnd > end) destEnd.setTime(end.getTime());
      return {
        ...d,
        startDate: destStart.toISOString().split('T')[0],
        endDate: destEnd.toISOString().split('T')[0],
      };
    });

    const itinerary = generateEmptyDays(startDate, endDate, destsWithDates);

    const trip: Trip = {
      id: tripId,
      name: tripName || `טיול ל${destinations[0].name}`,
      purpose,
      customInstructions,
      destinations: destsWithDates,
      startDate,
      endDate,
      travelers,
      arrival,
      departure,
      status: 'generating',
      recommendationPool: { attractions: [], meals: [], accommodations: [], transports: [] },
      itinerary,
      bookings: [],
      createdAt: new Date().toISOString(),
    };

    saveTrip(trip);
    router.push(`/trip/plan?id=${tripId}`);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🎯</span>
              <h2 className="text-xl font-bold">בריף הטיול</h2>
              <p className="text-sm text-muted mt-1">מה המטרה? מה מיוחד בו?</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שם לטיול</label>
              <input
                type="text"
                placeholder="טיול קסום באיטליה"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מטרת הטיול</label>
              <textarea
                placeholder="חופשה רומנטית, מסע גילוי, ירח דבש, חופשת משפחה..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
              <p className="text-xs text-muted mt-1">המטרה תעזור ל-AI להמליץ פעילויות מתאימות</p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🗺️</span>
              <h2 className="text-xl font-bold">יעדים</h2>
              <p className="text-sm text-muted mt-1">אפשר להוסיף כמה יעדים</p>
            </div>
            {destinations.map((dest, idx) => (
              <div key={dest.id} className="bg-card border border-card-border rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">יעד {idx + 1}</span>
                  {destinations.length > 1 && (
                    <button
                      onClick={() => setDestinations((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded-lg hover:bg-danger/10 text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="עיר (לדוגמה: רומא)"
                  value={dest.name}
                  onChange={(e) => updateDestination(idx, { name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="מדינה (אופציונלי)"
                  value={dest.country || ''}
                  onChange={(e) => updateDestination(idx, { country: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
            <button
              onClick={() => setDestinations((prev) => [...prev, emptyDestination(prev.length)])}
              className="w-full py-3 border-2 border-dashed border-primary/30 text-primary rounded-2xl text-sm font-medium hover:bg-primary/5 transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף יעד נוסף
            </button>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">📅</span>
              <h2 className="text-xl font-bold">מתי?</h2>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תאריך התחלה</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תאריך סיום</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">👥</span>
              <h2 className="text-xl font-bold">מטיילים</h2>
              <p className="text-sm text-muted mt-1">לכל מטייל העדפות משלו</p>
            </div>
            {travelers.map((t, idx) => (
              <div key={t.id} className="bg-card border border-card-border rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder={`שם המטייל ${idx + 1}`}
                    value={t.name}
                    onChange={(e) => updateTraveler(idx, { name: e.target.value })}
                    className="flex-1 px-3 py-2 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {travelers.length > 1 && (
                    <button
                      onClick={() => setTravelers((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg hover:bg-danger/10 text-danger ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setEditingTravelerIdx(editingTravelerIdx === idx ? null : idx)}
                  className="w-full px-3 py-2 bg-primary/5 text-primary rounded-xl text-xs font-medium"
                >
                  {editingTravelerIdx === idx ? 'סגור' : t.interests.length > 0 ? `${t.interests.length} תחומי עניין נבחרו` : 'הגדר תחומי עניין והעדפות'}
                </button>

                {editingTravelerIdx === idx && (
                  <div className="space-y-3 pt-2 animate-fade-in">
                    <div>
                      <label className="text-xs font-medium block mb-1">תחומי עניין:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {INTERESTS.map((interest) => (
                          <button
                            key={interest.id}
                            onClick={() => toggleInterest(idx, interest.id)}
                            className={`p-2 rounded-xl border transition-all text-center ${
                              t.interests.includes(interest.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-card-border'
                            }`}
                          >
                            <span className="text-sm block">{interest.icon}</span>
                            <span className="text-[10px] font-medium">{interest.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">מה חשוב למטייל הזה?</label>
                      <textarea
                        placeholder="לי חשוב יוגה בבוקר, חדר כושר במלון..."
                        value={t.importantThings}
                        onChange={(e) => updateTraveler(idx, { importantThings: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-card-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">קצב מועדף:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { value: 'relaxed', label: 'רגוע 🐢' },
                          { value: 'moderate', label: 'מאוזן 🚶' },
                          { value: 'intensive', label: 'אינטנסיבי 🏃' },
                        ].map((p) => (
                          <button
                            key={p.value}
                            onClick={() => updateTraveler(idx, { pace: p.value as TravelerProfile['pace'] })}
                            className={`p-2 rounded-xl border text-xs ${
                              t.pace === p.value ? 'border-primary bg-primary/5' : 'border-card-border'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => setTravelers((prev) => [...prev, emptyTraveler(prev.length)])}
              className="w-full py-3 border-2 border-dashed border-primary/30 text-primary rounded-2xl text-sm font-medium active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף מטייל
            </button>
          </div>
        );

      case 4:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">✈️</span>
              <h2 className="text-xl font-bold">הגעה ועזיבה</h2>
              <p className="text-sm text-muted mt-1">אופציונלי - יעזור לתכנון</p>
            </div>

            {/* Arrival */}
            <div className="bg-card border border-card-border rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">🛬 הגעה</span>
                {arrival ? (
                  <button onClick={() => setArrival(null)} className="text-xs text-danger">הסר</button>
                ) : (
                  <button
                    onClick={() => setArrival(emptyTransport())}
                    className="text-xs text-primary font-medium"
                  >
                    הוסף
                  </button>
                )}
              </div>
              {arrival && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={arrival.type}
                      onChange={(e) => setArrival({ ...arrival, type: e.target.value as TransportInfo['type'] })}
                      className="px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                    >
                      <option value="flight">טיסה</option>
                      <option value="train">רכבת</option>
                      <option value="bus">אוטובוס</option>
                      <option value="car">רכב</option>
                      <option value="ferry">מעבורת</option>
                      <option value="other">אחר</option>
                    </select>
                    <input
                      type="text"
                      placeholder="מספר טיסה/רכבת"
                      value={arrival.number}
                      onChange={(e) => setArrival({ ...arrival, number: e.target.value })}
                      className="px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="מאיפה (תל אביב)"
                    value={arrival.from}
                    onChange={(e) => setArrival({ ...arrival, from: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="לאן (רומא נמל תעופה)"
                    value={arrival.to}
                    onChange={(e) => setArrival({ ...arrival, to: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={arrival.date}
                      onChange={(e) => setArrival({ ...arrival, date: e.target.value })}
                      className="px-3 bg-background border border-card-border rounded-xl text-xs"
                    />
                    <input
                      type="time"
                      value={arrival.time}
                      onChange={(e) => setArrival({ ...arrival, time: e.target.value })}
                      className="px-3 bg-background border border-card-border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Departure */}
            <div className="bg-card border border-card-border rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">🛫 עזיבה</span>
                {departure ? (
                  <button onClick={() => setDeparture(null)} className="text-xs text-danger">הסר</button>
                ) : (
                  <button
                    onClick={() => setDeparture(emptyTransport())}
                    className="text-xs text-primary font-medium"
                  >
                    הוסף
                  </button>
                )}
              </div>
              {departure && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={departure.type}
                      onChange={(e) => setDeparture({ ...departure, type: e.target.value as TransportInfo['type'] })}
                      className="px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                    >
                      <option value="flight">טיסה</option>
                      <option value="train">רכבת</option>
                      <option value="bus">אוטובוס</option>
                      <option value="car">רכב</option>
                      <option value="ferry">מעבורת</option>
                      <option value="other">אחר</option>
                    </select>
                    <input
                      type="text"
                      placeholder="מספר"
                      value={departure.number}
                      onChange={(e) => setDeparture({ ...departure, number: e.target.value })}
                      className="px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="מאיפה"
                    value={departure.from}
                    onChange={(e) => setDeparture({ ...departure, from: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="לאן"
                    value={departure.to}
                    onChange={(e) => setDeparture({ ...departure, to: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-xl text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={departure.date}
                      onChange={(e) => setDeparture({ ...departure, date: e.target.value })}
                      className="px-3 bg-background border border-card-border rounded-xl text-xs"
                    />
                    <input
                      type="time"
                      value={departure.time}
                      onChange={(e) => setDeparture({ ...departure, time: e.target.value })}
                      className="px-3 bg-background border border-card-border rounded-xl text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">💬</span>
              <h2 className="text-xl font-bold">הנחיות ל-AI</h2>
              <p className="text-sm text-muted mt-1">הכל שעוזר לתכנון מותאם</p>
            </div>
            <textarea
              placeholder="לדוגמה:&#10;- חובה לראות את הקולוסיאום&#10;- אנחנו לא אוהבים מקומות תיירותיים&#10;- רוצים לחוות את החיים המקומיים&#10;- מעדיפים מסעדות לא יקרות אבל איכותיות&#10;- חשוב לי שיהיה זמן ספונטני בכל יום"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-card border border-card-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
            <p className="text-xs text-muted">כל מה שתכתבו כאן יעזור ל-AI להבין מה אתם מחפשים</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <Header title="טיול חדש" showBack />

      {/* Progress bar */}
      <div className="px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-1 mb-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-card-border'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">שלב {step + 1} מתוך {STEPS.length}</span>
          <span className="text-xs text-muted">{STEPS[step].title}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="px-4 max-w-lg mx-auto">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-card-border p-4 safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-3 rounded-2xl border border-card-border text-sm font-medium hover:bg-card transition-colors active:scale-95"
            >
              הקודם
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                canProceed() ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-card-border text-muted cursor-not-allowed'
              }`}
            >
              <span>הבא</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>צור טיול וקבל המלצות</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
