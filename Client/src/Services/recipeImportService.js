// src/Services/recipeImportService.js
import api from './api';

const BASE_PATH = '/api/recipes/import';

// Uses the shared api client so every request carries the Clerk session token.
function toImportError(err) {
  const data = err.response?.data;
  const text = typeof data === 'string' ? data : (data?.message || data?.error || '');
  // Detect technical error (stacktrace, exception, etc.)
  const isTechnical =
    !text ||
    text.length > 200 ||
    /Exception|System\.|at |Microsoft\./.test(text);
  if (isTechnical) {
    return new Error("אירעה שגיאה בשרת. נא לבדוק הגדרות או לפנות לתמיכה.");
  }
  return new Error(text || "אירעה שגיאה בייבוא המתכון");
}

async function post(path, body) {
  try {
    const { data } = await api.post(`${BASE_PATH}${path}`, body);
    return data;
  } catch (err) {
    throw toImportError(err);
  }
}

export async function importRecipeFromText(text) {
  return post('/text', { text });
}

export async function importRecipeFromUrl(url) {
  return post('/url', { url });
}

export async function importRecipeFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return post('/file', formData);
}

export async function importRecipeFromImage(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);
  return post('/image', formData);
}
