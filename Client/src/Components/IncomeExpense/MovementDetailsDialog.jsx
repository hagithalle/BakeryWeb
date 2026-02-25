import React from 'react';
import { Box } from '@mui/material';
import BaseDialog from '../BaseDialog';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import { useLanguage } from '../../context/LanguageContext';
import useLocaleStrings from '../../hooks/useLocaleStrings';

export default function MovementDetailsDialog({ open, onClose, movement }) {
  if (!movement) return null;
  const { t } = useLanguage();
  const { amount, date, customer, paymentMethod, status, category, supplier, receipts, invoiceGenerated } = movement;
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={movement.type === 'income' ? (strings.incomeExpense?.incomeDetailsTitle || 'פרטי הכנסה') : (strings.incomeExpense?.expenseDetailsTitle || 'פרטי הוצאה')}
      showActions={false}
      maxWidth="sm"
    >
      <Box>
        <Box sx={{ mb: 2 }}>
          <strong>{strings.incomeExpense?.date || 'תאריך'}:</strong> {movement.date}
        </Box>
        {movement.type === 'income' ? (
          <>
            <Box sx={{ mb: 2 }}><strong>{strings.income?.customer || 'לקוח'}:</strong> {movement.customer}</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.income?.amount || 'סכום'}:</strong> {movement.amount?.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US')} ₪</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.income?.paymentMethod || 'אמצעי תשלום'}:</strong> {movement.paymentMethod}</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.income?.status || 'סטטוס'}:</strong> {movement.status}</Box>
            {movement.invoiceGenerated && <Box sx={{ mb: 2 }}><DescriptionIcon sx={{ color: '#bfa47a', mr: 1 }} />{strings.incomeExpense?.invoiceGenerated || 'חשבונית הופקה'}</Box>}
          </>
        ) : (
          <>
            <Box sx={{ mb: 2 }}><strong>{strings.expense?.category || 'קטגוריה'}:</strong> {movement.category}</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.expense?.supplier || 'ספק'}:</strong> {movement.supplier}</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.expense?.amount || 'סכום'}:</strong> {movement.amount?.toLocaleString(lang === 'he' ? 'he-IL' : 'en-US')} ₪</Box>
            <Box sx={{ mb: 2 }}><strong>{strings.expense?.paymentMethod || 'אמצעי תשלום'}:</strong> {movement.paymentMethod}</Box>
            {movement.receipts && movement.receipts.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <ReceiptIcon sx={{ color: '#bfa47a', mr: 1 }} />
                {movement.receipts.length} {strings.expense?.receipts || 'קבלות/מסמכים'}
              </Box>
            )}
          </>
        )}
      </Box>
    </BaseDialog>
  );
}
