export function generateDemoSuggestions(destination: string) {
  return [
    {
      id: 'sug-1',
      type: 'activity' as const,
      title: `סיור אוכל מודרך ב${destination}`,
      description: `סיור של 3 שעות שכולל טעימות ב-6 מקומות מקומיים. מומלץ מאוד על ידי מטיילים!`,
      reason: 'מתאים לסגנון הטיול שלכם',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'sug-2',
      type: 'accommodation' as const,
      title: `Airbnb מיוחד עם נוף`,
      description: `דירה עם מרפסת ונוף פנורמי, €90 ללילה. ביקורות מעולות.`,
      reason: 'זמין להזמנה מיידית, מתאים לתקציב שלכם',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'sug-3',
      type: 'general' as const,
      title: `מחר צפוי מזג אוויר מעולה`,
      description: `כדאי לתכנן את הפעילויות החיצוניות למחר. 22°C עם שמש`,
      reason: 'התאמה דינמית לתנאי מזג אוויר',
      source: 'demo' as const,
      timestamp: new Date().toISOString(),
    },
  ];
}
