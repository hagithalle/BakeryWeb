import React, { useState } from 'react';
import { TextField, MenuItem, Box, Button } from '@mui/material';
import SoftDialog from '../ui/SoftDialog';
import FormSection from '../ui/FormSection';
import { fieldSx, primaryBtnSx, secondaryBtnSx } from '../ui/dialogStyles';
import financeIcon from '../../assets/decor/page-headers/finance-header-icon.svg';

const expenseCategories = [
  { value: 0, label: 'הוצאות תפעול' },
  { value: 1, label: 'שכירות' },
  { value: 2, label: 'רואה חשבון' },
  { value: 3, label: 'ביטוח' },
  { value: 4, label: 'שונות' },
];

const expenseTypes = [
  { value: 1, label: 'הוצאה קבועה' },
  { value: 0, label: 'הוצאה עקיפה' },
];

export default function AddExpenseDialog({ open, onClose, onSave, initialData }) {
  const getTypeValue = (type) => {
    if (typeof type === 'number') return type;
    if (type === 'הוצאה קבועה') return 1;
    if (type === 'הוצאה עקיפה') return 0;
    return 1;
  };

  const getCategoryValue = (cat) => {
    if (typeof cat === 'number') return cat;
    const found = expenseCategories.find((c) => c.label === cat);
    return found ? found.value : 4;
  };

  const getInitialForm = (data) => {
    if (!data) return { title: '', category: 0, amount: '', type: 1 };
    return { ...data, type: getTypeValue(data.type), category: getCategoryValue(data.category) };
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
    <SoftDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'עריכת הוצאה' : 'הוספת הוצאה חדשה'}
      maxWidth="xs"
      dir="rtl"
      showActions={false}
    >
      <FormSection icon={financeIcon}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="שם ההוצאה"
            value={form.title}
            onChange={handleChange('title')}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            select
            label="קטגוריה"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
            sx={fieldSx}
          >
            {expenseCategories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="סכום חודשי (₪)"
            type="number"
            value={form.amount}
            onChange={handleChange('amount')}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            select
            label="סוג הוצאה"
            value={form.type}
            onChange={handleChange('type')}
            fullWidth
            sx={fieldSx}
          >
            {expenseTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </FormSection>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} sx={secondaryBtnSx}>ביטול</Button>
        <Button onClick={handleSave} disabled={!form.title || !form.amount} sx={primaryBtnSx}>
          {initialData ? 'שמור' : 'הוסף'}
        </Button>
      </Box>
    </SoftDialog>
  );
}
