import api from './api';

// קבלת כל ההוצאות (עלויות עקיפות)
export async function getAllExpenses() {
  const response = await api.get('/api/overheaditem');
  return response.data.$values ?? response.data;
}

// קבלת הוצאה בודדת
export async function getExpense(id) {
  const response = await api.get(`/api/overheaditem/${id}`);
  return response.data;
}

// יצירת הוצאה חדשה
export async function createExpense(item) {
  // Ensure type is sent as number (enum)
  console.log('createExpense - sending to server:', {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
  });
  const response = await api.post('/api/overheaditem', {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
  });
  console.log('createExpense - server response:', response.data);
  return response.data;
}

// עדכון הוצאה
export async function updateExpense(id, item) {
  // Ensure type is sent as number (enum)
  console.log('updateExpense - sending to server:', {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
    category: item.category,
  });
  await api.put(`/api/overheaditem/${id}`, {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
    category: item.category,
  });
  console.log('updateExpense - sent to server');
}

// מחיקת הוצאה
export async function deleteExpense(id) {
  await api.delete(`/api/overheaditem/${id}`);
}
