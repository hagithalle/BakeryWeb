import axios from 'axios';

// קבלת כל ההוצאות (עלויות עקיפות)
export async function getAllExpenses() {
  const response = await axios.get('/api/overheaditem');
  return response.data;
}

// קבלת הוצאה בודדת
export async function getExpense(id) {
  const response = await axios.get(`/api/overheaditem/${id}`);
  return response.data;
}

// יצירת הוצאה חדשה
export async function createExpense(item) {
  // Ensure type is sent as number (enum)
  console.log('createExpense - sending to server:', {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
  });
  const response = await axios.post('/api/overheaditem', {
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
  await axios.put(`/api/overheaditem/${id}`, {
    ...item,
    type: typeof item.type === 'number' ? item.type : 0,
    category: item.category,
  });
  console.log('updateExpense - sent to server');
}

// מחיקת הוצאה
export async function deleteExpense(id) {
  await axios.delete(`/api/overheaditem/${id}`);
}
