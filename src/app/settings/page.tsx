'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Globe, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import Header from '@/components/Header';
import { getSettings, saveSettings, AppSettings } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: '',
    openaiApiKey: '',
    language: 'he',
    aiProvider: 'gemini',
  });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'תגיד שלום בקצרה',
          trip: { destination: 'בדיקה', startDate: '', endDate: '', itinerary: [] },
          apiKey: settings.geminiApiKey,
        }),
      });
      const data = await response.json();
      if (response.ok && data.response) {
        setTestResult({ ok: true, message: `Gemini עובד! תשובה: ${data.response.slice(0, 100)}` });
      } else {
        setTestResult({ ok: false, message: data.error || 'שגיאה לא ידועה' });
      }
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'שגיאת רשת' });
    }
    setTesting(false);
  };

  return (
    <div className="min-h-screen pb-6">
      <Header title="הגדרות" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Current status */}
        <div className={`rounded-2xl p-4 border-2 ${
          settings.aiProvider === 'gemini'
            ? 'bg-success/5 border-success/30'
            : 'bg-warning/5 border-warning/30'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {settings.aiProvider === 'gemini' ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-warning" />
            )}
            <h3 className="font-bold">
              {settings.aiProvider === 'gemini' ? 'Gemini פעיל' : 'מצב דמו'}
            </h3>
          </div>
          <p className="text-xs text-muted">
            {settings.aiProvider === 'gemini'
              ? 'המערכת משתמשת ב-Google Gemini ליצירת תוכניות אמיתיות'
              : 'המערכת משתמשת בנתוני דמו בלבד - לא תקבלו המלצות אמיתיות'}
          </p>
        </div>

        {/* AI Provider */}
        <div className="bg-card rounded-2xl p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-bold">ספק AI</h2>
          </div>
          <div className="space-y-2">
            {[
              { value: 'gemini', label: 'Google Gemini', desc: 'מומלץ - חינמי, AI אמיתי', icon: '✨' },
              { value: 'demo', label: 'מצב דמו', desc: 'נתונים לדוגמה לבדיקות בלבד', icon: '🎭' },
            ].map((provider) => (
              <button
                key={provider.value}
                onClick={() =>
                  setSettings((s) => ({ ...s, aiProvider: provider.value as AppSettings['aiProvider'] }))
                }
                className={`w-full text-right p-3 rounded-xl border-2 transition-all ${
                  settings.aiProvider === provider.value
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{provider.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{provider.label}</div>
                    <div className="text-xs text-muted">{provider.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-2xl p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-bold">API Key (אופציונלי)</h2>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-muted">
              אם הוגדר GEMINI_API_KEY ב-Vercel, אין צורך להזין כאן.
              ההזנה כאן היא לבדיקות מקומיות בלבד.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, geminiApiKey: e.target.value }))
                }
                placeholder="AIzaSy... (אופציונלי)"
                className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={handleTest}
              disabled={testing}
              className="w-full py-2.5 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>בודק חיבור...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>בדוק חיבור ל-Gemini</span>
                </>
              )}
            </button>
            {testResult && (
              <div className={`rounded-xl p-3 text-xs ${
                testResult.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {testResult.ok ? '✅ ' : '❌ '}{testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-3 gradient-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>נשמר!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>שמור הגדרות</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="text-center text-xs text-muted space-y-1">
          <p>TripAI v0.2.0 - MVP</p>
          <p>ההגדרות נשמרות מקומית במכשיר שלכם</p>
        </div>
      </div>
    </div>
  );
}
