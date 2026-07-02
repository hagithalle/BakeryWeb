import api from './api';

// קבלת הגדרות עבודה
export async function getLaborSettings() {
  const response = await api.get('/api/laborsettings');
  return response.data;
}

// שמירה/עדכון הגדרות עבודה
export async function saveLaborSettings(settings) {
  const response = await api.post('/api/laborsettings', settings);
  return response.data;
}
