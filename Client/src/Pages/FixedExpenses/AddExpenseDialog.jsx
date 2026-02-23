import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';

const expenseTypes = [
  { value: 'קבועה', label: 'הוצאה קבועה' },
  { value: 'עקיפה', label: 'הוצאה עקיפה' },
];

export default function AddExpenseDialog({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(initialData || {
    title: '',
    category: '',
    amount: '',
    type: 'קבועה',
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSave = () => {
    if (!form.title || !form.amount) return;
    onSave({ ...form, amount: parseFloat(form.amount) });
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
            label="קטגוריה"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
          />
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
