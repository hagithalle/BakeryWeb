import React, { useState } from 'react';
import { Box, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import BaseDialog from '../BaseDialog';
import ExpensesForm from './ExpensesForm';
import IncomeForm from './IncomeForm';
import ReceiptsSection from './ReceiptsSection';

export default function AddMovementDialog({ open, onClose, onSave }) {
  const [addType, setAddType] = useState('expense');
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    supplier: '',
    description: '',
    amount: '',
    paymentMethod: '',
    customer: '',
    status: 'Pending',
    invoiceGenerated: false,
    receipts: []
  });
  const [receiptUrl, setReceiptUrl] = useState("");

  const handleSave = () => {
    const newMovement = {
      ...addForm,
      type: addType,
      id: Date.now(),
      amount: Number(addForm.amount)
    };
    onSave(newMovement);
    setAddForm({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      supplier: '',
      description: '',
      amount: '',
      paymentMethod: '',
      customer: '',
      status: 'Pending',
      invoiceGenerated: false,
      receipts: []
    });
    setAddType('expense');
    setReceiptUrl("");
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title="הוספת תנועה חדשה"
      isValid={addType === 'expense' ? addForm.amount && addForm.category : addForm.amount && addForm.customer}
    >
      <RadioGroup
        row
        value={addType}
        onChange={e => setAddType(e.target.value)}
        sx={{ mb: 2, justifyContent: 'center' }}
      >
        <FormControlLabel value="expense" control={<Radio />} label="הוצאה" />
        <FormControlLabel value="income" control={<Radio />} label="הכנסה" />
      </RadioGroup>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {addType === 'expense' ? (
          <ExpensesForm
            form={addForm}
            setForm={setAddForm}
            receiptUrl={receiptUrl}
            setReceiptUrl={setReceiptUrl}
          />
        ) : (
          <IncomeForm form={addForm} setForm={setAddForm} />
        )}
      </Box>
    </BaseDialog>
  );
}

