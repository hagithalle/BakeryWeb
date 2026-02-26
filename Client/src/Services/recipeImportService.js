// src/Services/recipeImportService.js

const BASE_URL = "/api/recipes/import";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Detect technical error (stacktrace, exception, etc.)
    const isTechnical =
      !text ||
      text.length > 200 ||
      /Exception|System\.|at |Microsoft\./.test(text);
    if (isTechnical) {
      throw new Error("אירעה שגיאה בשרת. נא לבדוק הגדרות או לפנות לתמיכה.");
    }
    throw new Error(text || "אירעה שגיאה בייבוא המתכון");
  }
  return res.json();
}

export async function importRecipeFromText(text) {
  const res = await fetch(`${BASE_URL}/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  return handleResponse(res);
}

export async function importRecipeFromUrl(url) {
  const res = await fetch(`${BASE_URL}/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  return handleResponse(res);
}

export async function importRecipeFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/file`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}

export async function importRecipeFromImage(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch(`${BASE_URL}/image`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(res);
}