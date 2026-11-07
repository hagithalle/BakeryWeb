import { heIL } from '@clerk/localizations';

// Hebrew strings for Clerk's <SignIn>/<SignUp>, via Clerk's supported `localization` prop.
// 1. Product name: Clerk fills {{applicationName}} from the Clerk dashboard (currently "BakeryWeb").
//    We show BakeryManager on every screen instead; the dashboard name still appears in Clerk's emails.
// 2. Wording: the stock Hebrew uses masculine imperatives ("התחבר", "צור את החשבון שלך");
//    the screens people see most use neutral noun forms instead.
export const PRODUCT_NAME = 'BakeryManager';

const replaceAppName = (value) => {
  if (typeof value === 'string') return value.replaceAll('{{applicationName}}', PRODUCT_NAME);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceAppName(v)]));
  }
  return value;
};

const deepMerge = (base, overrides) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base?.[k] ?? {}, v) : v;
  }
  return out;
};

const neutralHebrew = {
  backButton: 'חזרה',
  formFieldInputPlaceholder__password: 'סיסמה',
  formFieldInputPlaceholder__phoneNumber: 'מספר טלפון',
  signIn: {
    start: {
      title: 'התחברות',
      subtitle: `ברוכים השבים ל־${PRODUCT_NAME}`,
    },
    password: { title: 'הזנת סיסמה', actionLink: 'שימוש בשיטה אחרת' },
    alternativeMethods: { title: 'שימוש בשיטה אחרת', blockButton__password: 'התחברות עם סיסמה' },
    emailCode: { title: 'קוד אימות נשלח לדוא"ל' },
    forgotPassword: { formTitle: 'איפוס סיסמה' },
    resetPassword: { title: 'איפוס סיסמה' },
  },
  signUp: {
    start: {
      title: 'יצירת חשבון',
      titleCombined: 'יצירת חשבון',
      subtitle: `הצטרפות ל־${PRODUCT_NAME}`,
      subtitleCombined: `הצטרפות ל־${PRODUCT_NAME}`,
      actionLink: 'התחברות',
    },
    emailCode: { title: 'אימות כתובת הדוא"ל' },
    continue: { title: 'השלמת פרטים' },
  },
};

export const clerkLocalization = deepMerge(replaceAppName(heIL), neutralHebrew);
