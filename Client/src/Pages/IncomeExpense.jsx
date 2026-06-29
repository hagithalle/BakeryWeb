import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import PageHeader from '../Components/Common/PageHeader';
import PageContainer from '../Components/Common/PageContainer';
import FilterBar from '../Components/FilterBar';
import EmptyState from '../Components/IncomeExpense/EmptyState';
import GenericTable from '../Components/GenericTable';
import AddButton from '../Components/AddButton';

import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';

import AddMovementDialog from '../Components/IncomeExpense/AddMovementDialog';
import MovementDetailsDialog from '../Components/IncomeExpense/MovementDetailsDialog';
import SummaryCards from '../Components/IncomeExpense/SummaryCards';

import financeHeaderIcon from '../assets/decor/page-headers/finance-header-icon.svg';
import incomeIcon from '../assets/decor/income-icon.svg';
import expenseIcon from '../assets/decor/expense-icon.svg';

export default function IncomeExpense() {
  const [search, setSearch] = useState('');
  const [movements, setMovements] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('expense');

  const openAdd = (type) => {
    setDialogType(type);
    setAddDialogOpen(true);
  };

  const expenseColumns = [
    { field: 'date', headerName: 'תאריך' },
    { field: 'category', headerName: 'קטגוריה' },
    { field: 'supplier', headerName: 'ספק' },
    { field: 'amount', headerName: 'סכום', renderCell: row => row.amount?.toLocaleString() + ' ₪' },
    { field: 'paymentMethod', headerName: 'אמצעי תשלום' },
    {
      field: 'receipts',
      headerName: 'קבלה',
      renderCell: row =>
        row.receipts?.length > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ReceiptIcon sx={{ color: '#bfa47a' }} />
            <span>{row.receipts.length}</span>
          </Box>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      renderCell: row => (
        <IconButton size="small" color="primary" onClick={() => { setSelectedMovement(row); setDetailsOpen(true); }}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const incomeColumns = [
    { field: 'date', headerName: 'תאריך' },
    { field: 'customer', headerName: 'לקוח' },
    { field: 'amount', headerName: 'סכום', renderCell: row => row.amount?.toLocaleString() + ' ₪' },
    { field: 'paymentMethod', headerName: 'אמצעי תשלום' },
    {
      field: 'status',
      headerName: 'סטטוס',
      renderCell: row => {
        const colorMap = { Paid: 'green', Pending: '#bfa47a', Failed: 'red' };
        return (
          <Box component="span" sx={{ color: colorMap[row.status] || 'inherit', fontWeight: 700 }}>
            {row.status}
          </Box>
        );
      },
    },
    {
      field: 'invoice',
      headerName: 'חשבונית',
      renderCell: row => row.invoiceGenerated ? <DescriptionIcon sx={{ color: '#bfa47a' }} /> : null,
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      renderCell: row => (
        <IconButton size="small" color="primary" onClick={() => { setSelectedMovement(row); setDetailsOpen(true); }}>
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  const filteredMovements = movements.filter(
    m => !search || JSON.stringify(m).toLowerCase().includes(search.toLowerCase())
  );

  const currentColumns = filteredMovements[0]?.type === 'income' ? incomeColumns : expenseColumns;

  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
      <AddButton
        label="הוסף הכנסה"
        icon={incomeIcon}
        onClick={() => openAdd('income')}
        sx={{
          minWidth: 180,
          height: 56,
          px: 3,
          fontSize: '16px',
          background: '#E8F5E9',
          color: '#1A7A47',
          '&:hover': { background: '#D0EDD7', transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(26,122,71,0.15)' },
        }}
      />
      <AddButton
        label="הוסף הוצאה"
        icon={expenseIcon}
        onClick={() => openAdd('expense')}
        sx={{
          minWidth: 180,
          height: 56,
          px: 3,
          fontSize: '16px',
          background: '#FCE5E5',
          color: '#C0392B',
          '&:hover': { background: '#F9CFCF', transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(192,57,43,0.15)' },
        }}
      />
    </Box>
  );

  return (
    <PageContainer>
      <PageHeader
        title="הכנסות והוצאות"
        subtitle="ניהול התנועות הכספיות שלך"
        illustration={financeHeaderIcon}
        actionNode={actionButtons}
      />

      <SummaryCards
        balance={filteredMovements.reduce((s, m) => s + (m.type === 'income' ? m.amount : -m.amount), 0)}
        income={filteredMovements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0)}
        expense={filteredMovements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0)}
      />

      <Box sx={{ mt: 3 }}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchLabel="חפש תנועה..."
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        {filteredMovements.length === 0 ? (
          <EmptyState />
        ) : (
          <GenericTable
            columns={currentColumns}
            rows={filteredMovements}
            direction="rtl"
            actions={[]}
          />
        )}
      </Box>

      <AddMovementDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        initialType={dialogType}
        onSave={movement => {
          setMovements([movement, ...movements]);
          setAddDialogOpen(false);
        }}
      />

      <MovementDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        movement={selectedMovement}
      />
    </PageContainer>
  );
}
