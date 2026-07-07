# Fit Plan — תוכנית אימון ותזונה 🏋️

אפליקציית PWA אישית שנבנתה מקובץ האקסל שלך. כל הנתונים המקוריים נשמרו במלואם.
עובדת offline, שומרת הכל מקומית על האייפון, ללא שרת וללא משתמשים.

## התקנה על האייפון — 5 דקות

### שלב 1: העלאה ל-GitHub Pages (חד-פעמי)
```bash
# בתוך תיקיית הפרויקט:
git init && git add . && git commit -m "Fit Plan v1"
git branch -M main
git remote add origin https://github.com/Michaelnogh/fit-plan.git
git push -u origin main
```
1. צור repo חדש בשם `fit-plan` (יכול להיות Private? לא — Pages בחינם דורש Public, או Private עם GitHub Pro).
2. אחרי ה-push: **Settings → Pages → Source: GitHub Actions**.
3. ה-workflow שכבר כלול בפרויקט (`.github/workflows/deploy.yml`) יבנה ויפרוס אוטומטית.
4. תוך דקה-שתיים תקבל כתובת: `https://michaelnogh.github.io/fit-plan/`

### שלב 2: הוספה למסך הבית
1. פתח את הכתובת ב-**Safari** באייפון.
2. לחץ על כפתור השיתוף (הריבוע עם החץ).
3. **הוסף למסך הבית** (Add to Home Screen).
4. זהו — האפליקציה על המסך עם אייקון, splash, ועובדת גם בלי אינטרנט.

> חלופה מהירה בלי GitHub: גרור את תיקיית `dist/` ל-[Netlify Drop](https://app.netlify.com/drop) וקבל כתובת מיידית.

## פיתוח מקומי
```bash
npm install
npm run dev      # שרת פיתוח
npm run build    # בנייה ל-dist/
```

## חשוב לדעת
- **גיבוי**: הנתונים נשמרים ב-IndexedDB על המכשיר. iOS עלול לנקות אחסון של אפליקציה שלא נפתחה כשבועיים — פתח את האפליקציה באופן קבוע, וייצא גיבוי JSON מדי פעם ממסך **הגדרות → ייצוא גיבוי**.
- **עדכונים**: כל push ל-main מתפרס אוטומטית; האפליקציה מתעדכנת לבד בפתיחה הבאה.

## מבנה הקוד
```
src/
├── db/seedData.js    # נתוני האקסל המקוריים (אחד לאחד)
├── db/db.js          # סכמת Dexie/IndexedDB + לוגיקת נתונים
├── components/       # Dashboard, Workouts, Nutrition, Weight, Measurements, History, Settings, ui
├── App.jsx           # ניווט Tab Bar
└── styles.css        # מערכת עיצוב iOS, RTL, Dark Mode
```
