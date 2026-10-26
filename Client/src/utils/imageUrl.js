// כתובת תמונה שהשרת שמר (למשל "/uploads/products/x.png") היא יחסית לשרת ה-API, לא לאתר.
// בפיתוח: VITE_API_URL ריק ו-Vite מעביר את /uploads לשרת (vite.config.js).
// בפרודקשן: הכתובת היחסית מקבלת את כתובת ה-API.
export function resolveImageUrl(url, apiBase = import.meta.env.VITE_API_URL ?? "") {
  if (!url) return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith("/uploads/") && apiBase) return apiBase.replace(/\/+$/, "") + url;
  return url;
}
