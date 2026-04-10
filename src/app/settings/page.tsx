'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Globe, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import { getSettings, saveSettings, AppSettings } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: '',
    openaiApiKey: '',
    language: 'he',
    aiProvider: 'demo',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pb-6">
      <Header title="הגדרות" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* AI Provider */}
        <div className="bg-card rounded-2xl p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-bold">ספק AI</h2>
          </div>
          <div className="space-y-2">
            {[
              { value: 'demo', label: 'מצב דמו', desc: 'בלי API - נתונים לדוגמה' },
              { value: 'gemini', label: 'Google Gemini', desc: 'חינם עד 15 בקשות/דקה' },
              { value: 'openai', label: 'OpenAI (ChatGPT)', desc: 'דורש API key בתשלום' },
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
                <div className="font-medium text-sm">{provider.label}</div>
                <div className="text-xs text-muted">{provider.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-2xl p-4 border border-card-border">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-bold">API Keys</h2>
          </div>
          <div className="space-y-4">
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
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <p className="text-xs text-muted mt-1">
                ניתן להשיג בחינם מ-Google AI Studio
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-card rounded-2xl p-4 border border-card-border">
          <h2 className="font-bold mb-3">שפה</h2>
          <div className="flex gap-2">
            {[
              { value: 'he', label: 'עברית 🇮🇱' },
              { value: 'en', label: 'English 🇺🇸' },
            ].map((lang) => (
              <button
                key={lang.value}
                onClick={() =>
                  setSettings((s) => ({ ...s, language: lang.value as 'he' | 'en' }))
                }
                className={`flex-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  settings.language === lang.value
                    ? 'border-primary bg-primary/5'
                    : 'border-card-border'
                }`}
              >
                {lang.label}
              </button>
            ))}
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
          <p>TripAI v0.1.0 - MVP</p>
          <p>ה-API keys נשמרים מקומית במכשיר שלכם בלבד</p>
        </div>
      </div>
    </div>
  );
}
