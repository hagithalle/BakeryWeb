import api from './api';

// קבלת כל העלויות העקיפות
export async function getAllOverheadItems() {
  const response = await api.get('/api/overheaditem');
  return response.data;
}

// קבלת עלות עקיפה אחת
export async function getOverheadItem(id) {
  const response = await api.get(`/api/overheaditem/${id}`);
  return response.data;
}

// יצירת עלות עקיפה חדשה
export async function createOverheadItem(item) {
  const response = await api.post('/api/overheaditem', item);
  return response.data;
}

// עדכון עלות עקיפה
export async function updateOverheadItem(id, item) {
  await api.put(`/api/overheaditem/${id}`, item);
}

// מחיקת עלות עקיפה
export async function deleteOverheadItem(id) {
  await api.delete(`/api/overheaditem/${id}`);
}
