import axios from 'axios';

// קבלת הגדרות עבודה
export async function getLaborSettings() {
  const response = await axios.get('/api/laborsettings');
  return response.data;
}

// שמירה/עדכון הגדרות עבודה
export async function saveLaborSettings(settings) {
  const response = await axios.post('/api/laborsettings', settings);
  return response.data;
}
