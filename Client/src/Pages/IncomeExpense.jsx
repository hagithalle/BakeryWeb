// src/Pages/IncomeExpense.jsx
import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import PageHeader from '../Components/Common/PageHeader';
import FilterBar from '../Components/FilterBar';
import EmptyState from '../Components/incomeExpense/EmptyState';
import GenericTable from '../Components/GenericTable';

import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';

import AddMovementDialog from '../Components/incomeExpense/AddMovementDialog';
import MovementDetailsDialog from '../Components/incomeExpense/MovementDetailsDialog';
import SummaryCards from '../Components/incomeExpense/SummaryCards';

export default function IncomeExpense() {
  const [search, setSearch] = useState('');
  const [movements, setMovements] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // עמודות להוצאות
  const expenseColumns = [
    { field: 'date', headerName: 'תאריך' },
    { field: 'category', headerName: 'קטגוריה' },
    { field: 'supplier', headerName: 'ספק' },
    {
      field: 'amount',
      headerName: 'סכום',
      renderCell: row => row.amount?.toLocaleString() + ' ₪'
    },
    { field: 'paymentMethod', headerName: 'אמצעי תשלום' },
    {
      field: 'receipts',
      headerName: 'קבלה',
      renderCell: row =>
        row.receipts && row.receipts.length > 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ReceiptIcon sx={{ color: '#bfa47a' }} />
            <span>{row.receipts.length}</span>
          </Box>
        ) : null
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      renderCell: row => (
        <IconButton
          size="small"
          color="primary"
          onClick={() => {
            setSelectedMovement(row);
            setDetailsOpen(true);
          }}
        >
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  // עמודות להכנסות
  const incomeColumns = [
    { field: 'date', headerName: 'תאריך' },
    { field: 'customer', headerName: 'לקוח' },
    {
      field: 'amount',
      headerName: 'סכום',
      renderCell: row => row.amount?.toLocaleString() + ' ₪'
    },
    { field: 'paymentMethod', headerName: 'אמצעי תשלום' },
    {
      field: 'status',
      headerName: 'סטטוס',
      renderCell: row => {
        let color = 'default';

        if (row.status === 'Paid') color = 'success';
        else if (row.status === 'Pending') color = 'warning';
        else if (row.status === 'Failed') color = 'error';

        const colorValue =
          color === 'success'
            ? 'green'
            : color === 'warning'
            ? '#bfa47a'
            : color === 'error'
            ? 'red'
            : 'inherit';

        return (
          <Box
            component="span"
            sx={{
              color: colorValue,
              fontWeight: 700
            }}
          >
            {row.status}
          </Box>
        );
      }
    },
    {
      field: 'invoice',
      headerName: 'חשבונית',
      renderCell: row =>
        row.invoiceGenerated ? (
          <DescriptionIcon sx={{ color: '#bfa47a' }} />
        ) : null
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      renderCell: row => (
        <IconButton
          size="small"
          color="primary"
          onClick={() => {
            setSelectedMovement(row);
            setDetailsOpen(true);
          }}
        >
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];

  // פילטור לפי טקסט חיפוש
  const filteredMovements = movements.filter(m =>
    !search ||
    JSON.stringify(m).toLowerCase().includes(search.toLowerCase())
  );

  const currentColumns =
    filteredMovements[0]?.type === 'income'
      ? incomeColumns
      : expenseColumns;

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f5f26c', minHeight: '100vh' }}>
      <PageHeader
        title="הכנסות והוצאות"
        subtitle="ניהול התנועות שלך"
        buttonLabel="תנועה חדשה"
        onAdd={() => setAddDialogOpen(true)}
      />

      {/* דיאלוג הוספת תנועה */}
      <AddMovementDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={movement => {
          // אפשר להחליף ל-useCallback ו־prev => [...prev] אם תרצי
          setMovements([movement, ...movements]);
          setAddDialogOpen(false);
        }}
      />

      {/* כרטיסי סיכום */}
      <Box sx={{ mb: 3 }}>
      <SummaryCards
        balance={filteredMovements.reduce((sum, m) => sum + (m.type === 'income' ? m.amount : -m.amount), 0)}
        income={filteredMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0)}
        expense={filteredMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0)}
      />
</Box>
      {/* סרגל חיפוש/פילטרים */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchLabel="חפש תנועה..."
      />

      {/* טבלה / מצב ריק */}
      {(!filteredMovements || filteredMovements.length === 0) ? (
        <EmptyState />
      ) : (
        <GenericTable
          columns={currentColumns}
          rows={filteredMovements}
          direction="rtl"
          actions={[]}
        />
      )}

      {/* דיאלוג פרטי תנועה */}
      <MovementDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        movement={selectedMovement}
      />
    </Box>
  );
}