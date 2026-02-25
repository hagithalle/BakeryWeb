import React from 'react';
import { TextField, MenuItem } from '@mui/material';

export default function IncomeForm({ form, setForm }) {
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
        label="לקוח"
        value={form.customer}
        onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
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
      <TextField
        label="סטטוס"
        value={form.status}
        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
        select
      >
        <MenuItem value="Pending">ממתין</MenuItem>
        <MenuItem value="Paid">שולם</MenuItem>
        <MenuItem value="Failed">נכשל</MenuItem>
      </TextField>
    </>
  );
}
