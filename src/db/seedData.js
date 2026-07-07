// ============================================================
// נתוני המקור — הועתקו אחד-לאחד מקובץ האקסל "תכנית-אימון-ותזונה"
// אין לשנות קובץ זה; עריכות המשתמש נשמרות ב-IndexedDB בלבד.
// ============================================================

export const WORKOUT_DAYS = [
  { id: 'upper',  name: 'עליון',                order: 1 },
  { id: 'lower',  name: 'תחתון',                order: 2 },
  { id: 'push',   name: 'חזה-כתף-יד אחורית',    order: 3 },
  { id: 'pull',   name: 'גב-כתף-יד קדמית',      order: 4 },
  { id: 'legs',   name: 'רגליים',               order: 5 },
];

// עמודות המקור: תרגיל | שריר מטרה | סטים | חזרות | משקל (ק"ג) | מנוחה | RIR | קצב עבודה | הערות
export const PROGRAM_ENTRIES = [
  // ——— עליון ———
  { id: 'upper-1', dayId: 'upper', order: 1, name: 'משיכת פולי עליון צר',            muscle: 'גב - רוחב',      sets: 3, reps: '10-12', weight: 63,   rest: "1-3 דק'",   rir: '1',        tempo: 'מבוקר', notes: '' },
  { id: 'upper-2', dayId: 'upper', order: 2, name: 'חתירה בהאמר עם תמיכה על החזה',  muscle: 'גב - טרפז',      sets: 3, reps: '8-10',  weight: 60,   rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'upper-3', dayId: 'upper', order: 3, name: 'לחיצת חזה בשיפוע חיובי',          muscle: 'חזה - עליון',    sets: 3, reps: '10-12', weight: 10,   rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'upper-4', dayId: 'upper', order: 4, name: 'הרחקות כתף במכונה',               muscle: 'כתף - מדיאלית',  sets: 3, reps: '10-12', weight: 30,   rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: '2-1-3', notes: '' },
  { id: 'upper-5', dayId: 'upper', order: 5, name: 'לחיצת חזה במכונה',                muscle: 'חזה - אמצע',     sets: 3, reps: '10-12', weight: 65,   rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'upper-6', dayId: 'upper', order: 6, name: 'פשיטות מרפק בכבל עליון',           muscle: 'יד אחורית',      sets: 3, reps: '10-12', weight: 26,   rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'upper-7', dayId: 'upper', order: 7, name: 'מקבילים',                          muscle: 'יד אחורית',      sets: 4, reps: '10-12', weight: null, rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'upper-8', dayId: 'upper', order: 8, name: 'כפיפות מרפק בכיסא כומר',           muscle: 'יד קדמית',       sets: 4, reps: '10-12', weight: 5,    rest: "1-3 דק'",   rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },

  // ——— תחתון ———
  { id: 'lower-1', dayId: 'lower', order: 1, name: 'לג פרס',                           muscle: 'ארבע ראשי',      sets: 3, reps: '8-10',  weight: 155,  rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-2', dayId: 'lower', order: 2, name: "היפ טראסט בסמית' מאשין",           muscle: 'ישבן',           sets: 2, reps: '8-10',  weight: null, rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-3', dayId: 'lower', order: 3, name: 'פשיטת ברך במכונה ייעודית',         muscle: 'ארבע ראשי',      sets: 3, reps: '8-10',  weight: 55,   rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-4', dayId: 'lower', order: 4, name: 'כפיפת ברך במכונה ייעודית',         muscle: 'האמסטרינג',      sets: 3, reps: '10-12', weight: 52.5, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-5', dayId: 'lower', order: 5, name: 'פייס פול',                          muscle: 'כתף אחורית',     sets: 4, reps: '10-12', weight: 35,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-6', dayId: 'lower', order: 6, name: 'כפיפת תאומים בישיבה',              muscle: 'תאומים - עמידה', sets: 2, reps: '10-12', weight: 30,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'lower-7', dayId: 'lower', order: 7, name: 'בחר תרגיל',                         muscle: 'אמות',           sets: 3, reps: '10-12', weight: null, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },

  // ——— חזה-כתף-יד אחורית ———
  { id: 'push-1', dayId: 'push', order: 1, name: 'לחיצות כתף במכונה',                  muscle: 'כתף - קדמית',    sets: 3, reps: '10-12', weight: 25,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-2', dayId: 'push', order: 2, name: 'לחיצת חזה בשיפוע חיובי',              muscle: 'חזה - עליון',    sets: 3, reps: '8-10',  weight: 15,   rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-3', dayId: 'push', order: 3, name: 'לחיצת חזה במכונה',                    muscle: 'חזה - אמצע',     sets: 3, reps: '10-12', weight: 50,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-4', dayId: 'push', order: 4, name: 'פרפר במכונה',                         muscle: 'חזה - אמצע',     sets: 2, reps: '8-10',  weight: 45,   rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-5', dayId: 'push', order: 5, name: 'הרחקות כתף במשקולת יד',               muscle: 'כתף - מדיאלית',  sets: 3, reps: '10-12', weight: 7,    rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-6', dayId: 'push', order: 6, name: 'פשיטות מרפק בכבל עליון',              muscle: 'יד אחורית',      sets: 3, reps: '8-10',  weight: null, rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'push-7', dayId: 'push', order: 7, name: 'בחר תרגיל',                            muscle: 'יד אחורית',      sets: 3, reps: '10-12', weight: null, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },

  // ——— גב-כתף-יד קדמית ———
  { id: 'pull-1', dayId: 'pull', order: 1, name: 'משיכת פולי עליון רחב',                muscle: 'גב - רוחב',      sets: 4, reps: '10-12', weight: 56,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-2', dayId: 'pull', order: 2, name: 'חתירה בהאמר עם תמיכה על החזה',       muscle: 'גב - טרפז',      sets: 4, reps: '8-10',  weight: 47.5, rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-3', dayId: 'pull', order: 3, name: 'פול אובר עם משקולת',                  muscle: 'גב - רוחב',      sets: 3, reps: '8-10',  weight: 12,   rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-4', dayId: 'pull', order: 4, name: 'הרחקות כתף בהטיית גו',                muscle: 'כתף אחורית',     sets: 3, reps: '10-12', weight: 33,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-5', dayId: 'pull', order: 5, name: 'בחר תרגיל',                            muscle: 'כתף אחורית',     sets: 3, reps: '10-12', weight: null, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-6', dayId: 'pull', order: 6, name: 'כפיפות מרפק בכיסא כומר',              muscle: 'יד קדמית',       sets: 3, reps: '10-12', weight: 5,    rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'pull-7', dayId: 'pull', order: 7, name: 'בחר תרגיל',                            muscle: 'יד קדמית',       sets: 2, reps: '10-12', weight: null, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },

  // ——— רגליים ———
  { id: 'legs-1', dayId: 'legs', order: 1, name: 'לחיצת רגליים',                        muscle: 'ארבע ראשי',      sets: 3, reps: '8-10',  weight: 160,  rest: "8-10 דק'",  rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'legs-2', dayId: 'legs', order: 2, name: 'כפיפת ברך במכונה ייעודית',            muscle: 'האמסטרינג',      sets: 3, reps: '10-12', weight: 60,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'legs-3', dayId: 'legs', order: 3, name: 'פשיטת ברך במכונה ייעודית',            muscle: 'ארבע ראשי',      sets: 3, reps: '10-12', weight: 50,   rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'legs-4', dayId: 'legs', order: 4, name: 'קירוב ירך במכונה',                    muscle: 'מקרבים',         sets: 2, reps: '12-15', weight: 25,   rest: "12-15 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'legs-5', dayId: 'legs', order: 5, name: 'כפיפת תאומים בישיבה',                 muscle: 'תאומים - ישיבה', sets: 3, reps: '10-12', weight: null, rest: "10-12 דק'", rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
  { id: 'legs-6', dayId: 'legs', order: 6, name: 'כפיפת תאומים בעמידה',                 muscle: 'תאומים - עמידה', sets: 2, reps: '20',    weight: null, rest: "20 דק'",    rir: 'בחר RIR',  tempo: 'מבוקר', notes: '' },
];

// ——— תפריט תזונה יומי ———
export const MEALS = [
  {
    id: 'breakfast', order: 1, name: 'ארוחת בוקר',
    macros: '220 קלוריות | חלבון 40 | שומן 9 | פחמימה 12',
    options: [
      "2 יוגורטים + עד 20 גרם חלבון / 120 גרם קוטג' לגביע - מולר אקטיב לייט / גו חדש או לייט בטעמים / פרו טבעי",
      "או זוג קופסאות קוטג' 9% / גבינה לבנה (תפוח/בננה/זוג תמרים)",
      'או 400 גרם תותים',
      'או 400 גרם אבטיח',
      'או 5 פריכיות + 40 גרם חמאת בוטנים',
      'או 8 קוביות שוקולד',
    ],
  },
  {
    id: 'lunch', order: 2, name: 'ארוחת צהריים',
    macros: '577 קלוריות | חלבון 90 | שומן 26 | פחמימה 10',
    options: [
      '280 גרם בשר רזה (חזה עוף/פילה/רוסטביף/הודו/פסטרמה דלת שומן)',
      'או 220 גרם בשר שמן (המבורגר/קציצות/נתח בקר/שווארמה/פרגיות/בשר טחון)',
      'או 240 גרם דג רזה - כל דג מלבד סלמון ודניס, או טונה במים בשימורים',
      'או 180 גרם דג שמן - סלמון או דניס, או טונה בשמן מסוננת',
      'או 4 ביצים (עד 3 חלבוני ביצה אפשר להוריד 2 צהובים)',
      'או 4 כפות אורז לבן (לא בסמטי) / 100 גרם (4 כפות) תפו"א / 4 כפיות פתיתים / 4 כפות פסטה עם מעט רוטב עגבניות / 4 כפות קוסקוס / 2 פרוסות לחם לבן',
    ],
  },
  {
    id: 'snack', order: 3, name: 'ארוחת ביניים',
    macros: '220 קלוריות | חלבון 40 | שומן 9 | פחמימה 12',
    options: [
      "2 יוגורטים + עד 20 גרם חלבון / 120 גרם קוטג' לגביע - מולר אקטיב לייט / גו חדש או לייט בטעמים / פרו טבעי",
      "או זוג קופסאות קוטג' 9% / גבינה לבנה (תפוח/בננה/זוג תמרים)",
      'או 400 גרם תותים',
      'או 400 גרם אבטיח',
      'או 5 פריכיות + 40 גרם חמאת בוטנים',
      'או 8 קוביות שוקולד',
    ],
  },
  {
    id: 'dinner', order: 4, name: 'ארוחת ערב',
    macros: '480 קלוריות | חלבון 70 | שומן 8 | פחמימה 26',
    options: [
      '220 גרם בשר רזה (חזה עוף/פילה/הודו/רוסטביף/סטייק ללא שומן)',
      'או 160 גרם בשר שמן (המבורגר/קציצות/נתח בקר/שווארמה/פרגיות/בשר טחון)',
      'או 200 גרם דג רזה - כל דג מלבד סלמון ודניס, או טונה במים בשימורים',
      'או 140 גרם דג שמן - סלמון או דניס, בשמן מסוננת',
      'או 4 ביצים (עד 3 חלבוני ביצה אפשר להוריד 2 צהובים)',
      'או עד 350 גרם ירקות (חסה, מלפפון, פלפל ירוק, שעועית ירוקה, בצל, תרד, קישוא, אספרגוס, נבטים)',
      'או 4 כפות אורז לבן / 100 גרם (4 כפות) תפו"א / 4 כפיות פתיתים / 4 כפות פסטה עם מעט רוטב עגבניות / 4 כפות קוסקוס / 2 פרוסות לחם לבן',
    ],
  },
];

export const NUTRITION_NOTES = [
  '• ניתן להוסיף עד 4 יחידות ירקות לכל ארוחה שתבחר.',
  '• אפשר 2 קפה ביום (ללא סוכר) ושתייה חופשית (ללא סוכר).',
  '• במידה ואינך מסיימת את הפחמימות המצוינות, אין חובה לסיים את החלבונים.',
  '• יש לך 250 קלוריות חופשיות ביום.',
  '• במידה ואתה סוטה מהתפריט יש ליידע אותי כדי לדעת איך לסדר את זה עם הארוחות.',
  '• לשתות מים במהלך היום ומומלץ גם בין הארוחות.',
  '• בשבוע יש לך פעם אחת חופשית לפי ההנחיות שקיבלת ממך — ראה פירוט מלא בתפריט המקורי.',
];

export const DAILY_TOTALS = {
  headers: ['קלוריות', 'חלבון', 'שומן', 'פחמימה'],
  grams:   [1800, 220, 33, 89],
  percent: ['100%', '60%', '20%', '20%'],
};

// ——— מעקב מדדים — מדידת הבסיס מהאקסל (06.06.24) ———
// שדות המקור: תאריך, משקל, שומן %, חזה, בטן, אגן, ירך ימין, ירך שמאל, יד ימין, יד שמאל
export const BASELINE_MEASUREMENT = {
  date: '2024-06-06',
  weight: 90, fatPct: null,
  chest: 106, belly: null, pelvis: 108,
  thighR: 101, thighL: 100,
  armR: 60, armL: 61,
  shoulders: null, waist: null, calfR: null, calfL: null, // שדות שנוספו לפי הדרישה
};

// הגדרת שדות המדידה לתצוגה (המקוריים + שביקשת להוסיף)
export const MEASUREMENT_FIELDS = [
  { key: 'weight',    label: 'משקל',      unit: 'ק"ג' },
  { key: 'fatPct',    label: 'שומן %',    unit: '%' },
  { key: 'chest',     label: 'חזה',       unit: 'ס"מ' },
  { key: 'shoulders', label: 'כתפיים',    unit: 'ס"מ' },
  { key: 'armR',      label: 'זרוע ימין', unit: 'ס"מ' },
  { key: 'armL',      label: 'זרוע שמאל', unit: 'ס"מ' },
  { key: 'waist',     label: 'מותניים',   unit: 'ס"מ' },
  { key: 'belly',     label: 'בטן',       unit: 'ס"מ' },
  { key: 'pelvis',    label: 'אגן',       unit: 'ס"מ' },
  { key: 'thighR',    label: 'ירך ימין',  unit: 'ס"מ' },
  { key: 'thighL',    label: 'ירך שמאל',  unit: 'ס"מ' },
  { key: 'calfR',     label: 'שוק ימין',  unit: 'ס"מ' },
  { key: 'calfL',     label: 'שוק שמאל',  unit: 'ס"מ' },
];
