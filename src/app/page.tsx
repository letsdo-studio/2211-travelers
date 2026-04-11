'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, MapPin, Calendar, ChevronLeft, Sparkles, Plane, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getTrips, getSettings } from '@/lib/storage';
import { Trip } from '@/lib/types';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setTrips(getTrips());
    const settings = getSettings();
    setIsDemoMode(settings.aiProvider === 'demo');
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <Header />

      {/* Hero Section */}
      <div className="gradient-primary px-4 py-8 text-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm opacity-90">מופעל על ידי AI</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            תכנן את הטיול המושלם
          </h1>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">
            AI חכם שמתכנן, מתאים ומציע - לפני ובמהלך הטיול.
            ספונטני? מתוכנן? אנחנו מתאימים את עצמנו אליך.
          </p>
          <Link
            href="/trip/new"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>טיול חדש</span>
          </Link>
        </div>
      </div>

      {/* Demo mode warning */}
      {isDemoMode && (
        <div className="px-4 pt-4 max-w-lg mx-auto">
          <Link
            href="/settings"
            className="block bg-warning/10 border border-warning/30 rounded-2xl p-3 animate-fade-in"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-warning">המערכת במצב דמו</p>
                <p className="text-xs text-muted mt-0.5">
                  לחץ כאן כדי להפעיל את Gemini ולקבל המלצות אמיתיות
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Features */}
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: '🎯', title: 'תעדוף חכם', desc: 'חובה / כדאי / אם יש זמן' },
            { icon: '🚂', title: 'העברות חכמות', desc: 'זמנים, נוף, חיסכון' },
            { icon: '🍕', title: 'איפה אוכלים?', desc: 'בוקר, צהריים, ערב, קפה' },
            { icon: '🎲', title: 'ספונטני', desc: 'שינויים דינמיים תוך כדי' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-4 border border-card-border"
            >
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* My Trips */}
        <div id="trips">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">הטיולים שלי</h2>
            <Link
              href="/trip/new"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              חדש
              <PlusCircle className="w-4 h-4" />
            </Link>
          </div>

          {trips.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 border border-card-border text-center">
              <Plane className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted text-sm mb-4">
                עדיין אין טיולים. בואו נתכנן את הטיול הראשון!
              </p>
              <Link
                href="/trip/new"
                className="inline-flex items-center gap-2 bg-primary text-white font-medium px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>צור טיול חדש</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/plan?id=${trip.id}`}
                  className="block bg-card rounded-2xl p-4 border border-card-border card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{trip.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {trip.startDate} — {trip.endDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          trip.status === 'active'
                            ? 'bg-success/10 text-success'
                            : trip.status === 'planning'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/10 text-muted'
                        }`}
                      >
                        {trip.status === 'active'
                          ? 'פעיל'
                          : trip.status === 'planning'
                            ? 'בתכנון'
                            : 'הושלם'}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
