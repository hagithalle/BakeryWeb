import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';
import ReceiptsSection from './ReceiptsSection';

export default function ExpensesForm({ form, setForm, receiptUrl, setReceiptUrl }) {
  return (
    <>
      <TextField
        label="תאריך"
        type="date"
        value={form.date}
        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="קטגוריה"
        value={form.category}
        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        select
      >
        <MenuItem value="חומרי גלם">חומרי גלם</MenuItem>
        <MenuItem value="אריזות">אריזות</MenuItem>
        <MenuItem value="עבודה">עבודה</MenuItem>
        <MenuItem value="ציוד">ציוד</MenuItem>
        <MenuItem value="שיווק">שיווק</MenuItem>
        <MenuItem value="כללי">כללי</MenuItem>
      </TextField>
      <TextField
        label="ספק"
        value={form.supplier}
        onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
      />
      <TextField
        label="תיאור"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />
      <TextField
        label="סכום"
        type="number"
        value={form.amount}
        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
      />
      <TextField
        label="אמצעי תשלום"
        value={form.paymentMethod}
        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
        select
      >
        <MenuItem value="מזומן">מזומן</MenuItem>
        <MenuItem value="כרטיס">כרטיס</MenuItem>
        <MenuItem value="העברה">העברה</MenuItem>
        <MenuItem value="הוראת קבע">הוראת קבע</MenuItem>
      </TextField>
      <ReceiptsSection
        receipts={form.receipts}
        setReceipts={receipts => setForm(f => ({ ...f, receipts }))}
        receiptUrl={receiptUrl}
        setReceiptUrl={setReceiptUrl}
      />
    </>
  );
}
