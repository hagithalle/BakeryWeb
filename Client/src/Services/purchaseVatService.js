import api from './api';

// בדיקה מרוכזת של מע"מ במחירי קנייה
export async function getPurchaseVatReview() {
  const response = await api.get('/api/purchase-vat/review');
  return response.data;
}

// העלות בפועל לפי הבחירות (לא נשמר דבר)
export async function previewPurchaseVat(items) {
  const response = await api.post('/api/purchase-vat/review/preview', { items });
  return response.data;
}

// שמירה של הפריטים שנבחרו בלבד, אחרי אישור מפורש
export async function applyPurchaseVat(items) {
  const response = await api.put('/api/purchase-vat/review', { items, confirmed: true });
  return response.data;
}
