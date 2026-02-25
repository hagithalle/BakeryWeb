
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';

// קטגוריות קבועות (int enum, תואם backend)
const expenseCategories = [
  { value: 0, label: 'הוצאות תפעול' }, // Operational
  { value: 1, label: 'שכירות' },       // Rent
  { value: 2, label: 'רואה חשבון' },    // Accountant
  { value: 3, label: 'ביטוח' },        // Insurance
  { value: 4, label: 'שונות' },        // Other
];

const expenseTypes = [
  { value: 1, label: 'הוצאה קבועה' },
  { value: 0, label: 'הוצאה עקיפה' },
];

export default function AddExpenseDialog({ open, onClose, onSave, initialData }) {


  // Helper to convert label to value if needed
  const getTypeValue = (type) => {
    if (typeof type === 'number') return type;
    if (type === 'הוצאה קבועה') return 1;
    if (type === 'הוצאה עקיפה') return 0;
    return 1;
  };

  // Helper to convert category to int value
  const getCategoryValue = (cat) => {
    if (typeof cat === 'number') return cat;
    const found = expenseCategories.find((c) => c.label === cat);
    return found ? found.value : 4; // default Other
  };

  const getInitialForm = (data) => {
    if (!data) return { title: '', category: 0, amount: '', type: 1 };
    return {
      ...data,
      type: getTypeValue(data.type),
      category: getCategoryValue(data.category)
    };
  };

  const [form, setForm] = useState(getInitialForm(initialData));

  React.useEffect(() => {
    setForm(getInitialForm(initialData));
  }, [initialData, open]);

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'type' || field === 'category') value = Number(value);
    setForm({ ...form, [field]: value });
  };

  const handleSave = () => {
    if (!form.title || !form.amount) return;
    const payload = { ...form, amount: parseFloat(form.amount), category: Number(form.category) };
    console.log('AddExpenseDialog onSave payload:', payload);
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
      <DialogTitle>{initialData ? 'עריכת הוצאה' : 'הוספת הוצאה חדשה'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="שם ההוצאה"
            value={form.title}
            onChange={handleChange('title')}
            fullWidth
          />
          <TextField
            select
            label="קטגוריה"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
          >
            {expenseCategories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="סכום חודשי (₪)"
            type="number"
            value={form.amount}
            onChange={handleChange('amount')}
            fullWidth
          />
          <TextField
            select
            label="סוג הוצאה"
            value={form.type}
            onChange={handleChange('type')}
            fullWidth
          >
            {expenseTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button variant="contained" onClick={handleSave}>
          {initialData ? 'שמור' : 'הוסף'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
