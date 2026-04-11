'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Trip, ChatMessage } from '@/lib/types';
import { getSettings } from '@/lib/storage';
import { generateDemoSuggestions } from '@/lib/demo-data';

interface ChatPanelProps {
  trip: Trip;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  'מה כדאי לעשות הערב?',
  'איפה אוכלים ארוחת ערב?',
  'שווה להאריך עוד יום?',
  'חלופות למלון?',
  'מה מזג האוויר מחר?',
  'איפה הקפה הכי טוב?',
];

function generateDemoResponse(question: string, trip: Trip): string {
  const dest = trip.destinations?.[0]?.name || 'היעד';
  const suggestions = generateDemoSuggestions(dest);

  if (question.includes('ערב') || question.includes('לילה')) {
    return `🌙 הנה כמה אפשרויות להערב ב${dest}:\n\n1. **סיור ערב ברובע הישן** - אווירה מדהימה בתאורת לילה, חינם\n2. **בר גגות** - נוף פנורמי של העיר עם קוקטיילים מקומיים (€8-15)\n3. **הופעה מקומית** - בדקתי ויש הופעת ג'אז בקלאב הקטן ברחוב הראשי\n\n💡 *טיפ: הרובע הישן הכי יפה בין 20:00-22:00 כשיש תאורה אבל עדיין יש חיים*`;
  }

  if (question.includes('אוכל') || question.includes('מסעדה') || question.includes('ארוחת')) {
    return `🍽️ המלצות אוכל ב${dest}:\n\n1. **${suggestions[0].title}** - ⭐ 4.8 - מומלץ מאוד!\n2. **Trattoria Locale** - מטבח מקומי אותנטי, €15-25 לזוג\n3. **Street Food Market** - פתוח עד 22:00, אוכל רחוב מעולה\n\n🔥 *המון ביקורות טובות על Trattoria - מומלץ להזמין מקום*`;
  }

  if (question.includes('להאריך') || question.includes('עוד יום')) {
    return `🤔 שווה להאריך ב${dest}?\n\n**בעד:**\n- יש עוד אטרקציות שלא הספקתם\n- מחר צפוי מזג אוויר מעולה\n- מצאתי Airbnb ב-€75 ללילה עם ביקורות מעולות\n\n**נגד:**\n- היעד הבא שווה זמן\n- חיסכון בלילה נוסף\n\n💡 *אם תחליטו להישאר, כדאי לנצל את הבוקר לשוק המקומי שפתוח רק ביום שלישי*`;
  }

  if (question.includes('מלון') || question.includes('לינה') || question.includes('חלופ')) {
    return `🏨 חלופות לינה ב${dest} (זמין עכשיו):\n\n1. **Boutique Hotel Centro** - €95/לילה, ⭐4.7, מיקום מעולה\n2. **Airbnb עם מרפסת** - €80/לילה, ⭐4.8, נוף לעיר\n3. **Hostel Premium** - €35/לילה, חדר פרטי, ⭐4.3\n\n📍 *כולם במרחק הליכה מהמרכז. ה-Airbnb הכי מומלץ לפי סגנון הטיול שלכם*`;
  }

  if (question.includes('קפה')) {
    return `☕ הקפה הכי טוב ב${dest}:\n\n1. **Specialty Coffee Lab** - ⭐4.9 - הכי מומלץ! flat white מושלם\n2. **Café de la Plaza** - אווירה מדהימה בכיכר, עוגות ביתיות\n3. **Roastery ${dest}** - קולים קפה במקום, חוויה!\n\n💡 *ב-Specialty Coffee Lab תגיעו לפני 09:00, אחר כך יש תור*`;
  }

  return `✨ הנה מה שמצאתי בנוגע ל${dest}:\n\n${suggestions.map((s, i) => `${i + 1}. **${s.title}** - ${s.description}`).join('\n')}\n\n💡 *רוצים שאחפש משהו ספציפי?*`;
}

export default function ChatPanel({ trip, onClose }: ChatPanelProps) {
  const tripDest = trip.destinations?.[0]?.name || 'היעד';
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `שלום! 👋 אני העוזר החכם שלכם לטיול ב**${tripDest}**.\n\nאפשר לשאול אותי על:\n- 🍕 המלצות אוכל\n- 🏨 חלופות לינה\n- 🎯 פעילויות ואטרקציות\n- 🚂 העברות ותחבורה\n- 🔄 שינויים בתוכנית\n\nמה תרצו לדעת?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const settings = getSettings();

    let responseText: string;

    if (settings.aiProvider !== 'demo') {
      try {
        const response = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            trip,
            apiKey: settings.geminiApiKey,
          }),
        });
        const data = await response.json();
        responseText = data.response;
      } catch {
        responseText = generateDemoResponse(text, trip);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
      responseText = generateDemoResponse(text, trip);
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-reply`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-slide-up">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">עוזר הטיול</h3>
            <p className="text-[10px] text-muted">{tripDest}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-card border border-card-border rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-card border border-card-border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div className="px-4 py-2 border-t border-card-border overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-card border border-card-border text-muted hover:text-primary hover:border-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-card-border bg-card safe-bottom">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="שאלו אותי משהו..."
            className="flex-1 px-4 py-2.5 bg-background border border-card-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            autoFocus
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 gradient-primary rounded-xl text-white disabled:opacity-50 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
