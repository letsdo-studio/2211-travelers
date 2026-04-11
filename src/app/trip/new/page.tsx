'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Utensils,
  Compass,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import Header from '@/components/Header';
import { saveTrip, saveProfile } from '@/lib/storage';
import { TravelerProfile, Trip } from '@/lib/types';

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
  { id: 'wellness', label: 'ספא/רוגע', icon: '🧘' },
  { id: 'local', label: 'חוויה מקומית', icon: '🏘️' },
];

interface FormData {
  // Trip info
  destination: string;
  startDate: string;
  endDate: string;
  tripName: string;
  // Traveler profile
  names: string;
  travelStyle: 'spontaneous' | 'planned' | 'mixed';
  budgetMin: number;
  budgetMax: number;
  accommodationLevel: 'budget' | 'mid' | 'premium' | 'luxury';
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'intensive';
  wakeUpTime: string;
  // Food
  breakfastStyle: string;
  lunchStyle: string;
  dinnerStyle: string;
  coffeeStyle: string;
  specialNeeds: string;
}

const STEPS = [
  { id: 'destination', title: 'לאן טסים?', icon: MapPin },
  { id: 'dates', title: 'מתי?', icon: Calendar },
  { id: 'style', title: 'סגנון טיול', icon: Compass },
  { id: 'budget', title: 'תקציב ולינה', icon: Wallet },
  { id: 'food', title: 'העדפות אוכל', icon: Utensils },
  { id: 'interests', title: 'תחומי עניין', icon: Users },
  { id: 'pace', title: 'קצב ושעות', icon: Clock },
];

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    destination: '',
    startDate: '',
    endDate: '',
    tripName: '',
    names: '',
    travelStyle: 'spontaneous',
    budgetMin: 50,
    budgetMax: 150,
    accommodationLevel: 'mid',
    interests: [],
    pace: 'moderate',
    wakeUpTime: '08:00',
    breakfastStyle: 'בית קפה מקומי',
    lunchStyle: 'אוכל רחוב / מסעדה קלילה',
    dinnerStyle: 'מסעדה מקומית טובה',
    coffeeStyle: 'specialty coffee',
    specialNeeds: '',
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleInterest = (id: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.destination.length > 0;
      case 1: return form.startDate && form.endDate;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return form.interests.length > 0;
      case 6: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const profileId = `profile-${Date.now()}`;
    const tripId = `trip-${Date.now()}`;

    const profile: TravelerProfile = {
      id: profileId,
      names: form.names || 'מטייל',
      travelStyle: form.travelStyle,
      budgetPerNight: { min: form.budgetMin, max: form.budgetMax, currency: 'EUR' },
      accommodationLevel: form.accommodationLevel,
      foodPreferences: {
        breakfast: form.breakfastStyle,
        lunch: form.lunchStyle,
        dinner: form.dinnerStyle,
        coffee: form.coffeeStyle,
        snacks: '',
      },
      interests: form.interests,
      pace: form.pace,
      wakeUpTime: form.wakeUpTime,
      specialNeeds: form.specialNeeds,
    };

    saveProfile(profile);

    // Create trip in 'generating' state immediately and navigate
    const trip: Trip = {
      id: tripId,
      name: form.tripName || `טיול ל${form.destination}`,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      profileId,
      status: 'generating',
      itinerary: [],
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
              <span className="text-4xl mb-3 block">✈️</span>
              <h2 className="text-xl font-bold">לאן טסים?</h2>
              <p className="text-sm text-muted mt-1">הכניסו יעד או כמה יעדים</p>
            </div>
            <input
              type="text"
              placeholder="למשל: ברצלונה, יפן, איטליה..."
              value={form.destination}
              onChange={(e) => updateForm({ destination: e.target.value })}
              className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              autoFocus
            />
            <input
              type="text"
              placeholder="שם לטיול (אופציונלי)"
              value={form.tripName}
              onChange={(e) => updateForm({ tripName: e.target.value })}
              className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <input
              type="text"
              placeholder="שמות המטיילים"
              value={form.names}
              onChange={(e) => updateForm({ names: e.target.value })}
              className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
        );

      case 1:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">📅</span>
              <h2 className="text-xl font-bold">מתי נוסעים?</h2>
              <p className="text-sm text-muted mt-1">גם אם לא בטוחים - אפשר לשנות אחר כך</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תאריך התחלה</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm({ startDate: e.target.value })}
                className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תאריך סיום</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateForm({ endDate: e.target.value })}
                min={form.startDate}
                className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🧭</span>
              <h2 className="text-xl font-bold">סגנון הטיול</h2>
              <p className="text-sm text-muted mt-1">איך אתם אוהבים לטייל?</p>
            </div>
            {[
              { value: 'spontaneous', label: 'ספונטני', desc: 'לא סוגרים מראש, הולכים עם הרגע', icon: '🎲' },
              { value: 'mixed', label: 'משולב', desc: 'קווים מנחים עם מקום לספונטניות', icon: '⚖️' },
              { value: 'planned', label: 'מתוכנן', desc: 'הכל סגור ומתואם מראש', icon: '📋' },
            ].map((style) => (
              <button
                key={style.value}
                onClick={() => updateForm({ travelStyle: style.value as FormData['travelStyle'] })}
                className={`w-full text-right p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  form.travelStyle === style.value
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{style.icon}</span>
                  <div>
                    <div className="font-bold">{style.label}</div>
                    <div className="text-sm text-muted">{style.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">💰</span>
              <h2 className="text-xl font-bold">תקציב ולינה</h2>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                תקציב ללילה (€): {form.budgetMin} - {form.budgetMax}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={form.budgetMin}
                  onChange={(e) => updateForm({ budgetMin: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={form.budgetMax}
                  onChange={(e) => updateForm({ budgetMax: Number(e.target.value) })}
                  className="flex-1 accent-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">רמת לינה</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'budget', label: 'חסכוני', desc: 'הוסטל / Airbnb בסיסי', icon: '🏠' },
                  { value: 'mid', label: 'בינוני', desc: 'מלון 3* / Airbnb טוב', icon: '🏨' },
                  { value: 'premium', label: 'פרימיום', desc: 'מלון 4* / בוטיק', icon: '🏩' },
                  { value: 'luxury', label: 'יוקרה', desc: 'מלון 5* / וילה', icon: '🏰' },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => updateForm({ accommodationLevel: level.value as FormData['accommodationLevel'] })}
                    className={`p-3 rounded-2xl border-2 transition-all text-center active:scale-[0.98] ${
                      form.accommodationLevel === level.value
                        ? 'border-primary bg-primary/5'
                        : 'border-card-border bg-card'
                    }`}
                  >
                    <span className="text-xl">{level.icon}</span>
                    <div className="font-bold text-sm mt-1">{level.label}</div>
                    <div className="text-[10px] text-muted">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🍽️</span>
              <h2 className="text-xl font-bold">העדפות אוכל</h2>
              <p className="text-sm text-muted mt-1">מה אתם אוהבים בכל ארוחה?</p>
            </div>
            {[
              { key: 'breakfastStyle', label: 'ארוחת בוקר', placeholder: 'בית קפה מקומי, בופה במלון...', icon: '🥐' },
              { key: 'lunchStyle', label: 'ארוחת צהריים', placeholder: 'אוכל רחוב, מסעדה...', icon: '🥙' },
              { key: 'dinnerStyle', label: 'ארוחת ערב', placeholder: 'מסעדה מקומית, fine dining...', icon: '🍝' },
              { key: 'coffeeStyle', label: 'קפה / חטיפים', placeholder: 'specialty coffee, מאפייה...', icon: '☕' },
            ].map((meal) => (
              <div key={meal.key}>
                <label className="text-sm font-medium mb-1 flex items-center gap-2">
                  <span>{meal.icon}</span>
                  {meal.label}
                </label>
                <input
                  type="text"
                  placeholder={meal.placeholder}
                  value={form[meal.key as keyof FormData] as string}
                  onChange={(e) => updateForm({ [meal.key]: e.target.value })}
                  className="w-full px-4 py-3 bg-card border border-card-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium mb-1 block">צרכים מיוחדים</label>
              <input
                type="text"
                placeholder="צמחוני, ללא גלוטן, אלרגיות..."
                value={form.specialNeeds}
                onChange={(e) => updateForm({ specialNeeds: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-card-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">❤️</span>
              <h2 className="text-xl font-bold">מה אתם אוהבים?</h2>
              <p className="text-sm text-muted mt-1">בחרו לפחות אחד</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-3 rounded-2xl border-2 transition-all text-center active:scale-[0.98] ${
                    form.interests.includes(interest.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-card-border bg-card'
                  }`}
                >
                  <span className="text-xl block mb-1">{interest.icon}</span>
                  <span className="text-xs font-medium">{interest.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">⏰</span>
              <h2 className="text-xl font-bold">קצב הטיול</h2>
            </div>
            <div className="space-y-3">
              {[
                { value: 'relaxed', label: 'רגוע', desc: '2-3 פעילויות ביום, הרבה זמן חופשי', icon: '🐢' },
                { value: 'moderate', label: 'מאוזן', desc: '3-4 פעילויות ביום, איזון מושלם', icon: '🚶' },
                { value: 'intensive', label: 'אינטנסיבי', desc: '5+ פעילויות, למצות כל רגע', icon: '🏃' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateForm({ pace: p.value as FormData['pace'] })}
                  className={`w-full text-right p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                    form.pace === p.value
                      ? 'border-primary bg-primary/5'
                      : 'border-card-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <div className="font-bold">{p.label}</div>
                      <div className="text-sm text-muted">{p.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שעת השכמה מועדפת</label>
              <input
                type="time"
                value={form.wakeUpTime}
                onChange={(e) => updateForm({ wakeUpTime: e.target.value })}
                className="w-full px-4 py-3.5 bg-card border border-card-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-6">
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
          <span className="text-xs text-muted">
            שלב {step + 1} מתוך {STEPS.length}
          </span>
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
                canProceed()
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'bg-card-border text-muted cursor-not-allowed'
              }`}
            >
              <span>הבא</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI מתכנן את הטיול...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>תכנן את הטיול!</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
