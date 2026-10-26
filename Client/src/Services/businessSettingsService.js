import api from './api';

// הגדרות העסק של המשתמש המחובר: סטטוס מע"מ ואחוז תוספת ברירת מחדל
export async function getBusinessSettings() {
  const response = await api.get('/api/business-settings');
  return response.data;
}

export async function saveBusinessSettings(settings) {
  const response = await api.put('/api/business-settings', settings);
  return response.data;
}
