import React, { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  IconButton,
  Typography,
  Paper as MuiPaper
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import FixedExpensesHeader from '../Components/FixedExpenses/FixedExpensesHeader';
import FixedExpensesSummary from '../Components/FixedExpenses/FixedExpensesSummary';
import FixedExpensesList from '../Components/FixedExpenses/FixedExpensesList';
import AddExpenseDialog from '../Components/FixedExpenses/AddExpenseDialog';

import AddButton from '../Components/AddButton';
import FilterBar from '../Components/FilterBar';
import GenericTable from '../Components/GenericTable';

import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../Services/fixedExpenseService';
import { getLaborSettings } from '../Services/laborSettingsService';

// מיפוי קטגוריה (int) ל-label, אייקון, צבע וכו'
const CATEGORY_ENUM_LABEL = {
  0: 'הוצאות תפעול',
  1: 'שכירות',
  2: 'ראה חשבון',
  3: 'ביטוח',
  4: 'שונות',
};
const CATEGORY_ICON_COLOR = {
  0: { icon: BuildIcon, color: '#9B5A25', bg: '#f3ede7', type: 1 }, // הוצאות תפעול
  1: { icon: HomeIcon, color: '#7c5c3b', bg: '#f6ede2', type: 1 }, // שכירות
  2: { icon: CalculateIcon, color: '#7c5c3b', bg: '#f6ede2', type: 0 }, // ראה חשבון
  3: { icon: ShieldIcon, color: '#7c5cfa', bg: '#eafaea', type: 0 }, // ביטוח
  4: { icon: BoltIcon, color: '#d4b03a', bg: '#faeaea', type: 1 }, // שונות
};

// מיפוי enum לערך תצוגה
const EXPENSE_TYPE_LABEL = {
  0: 'עקיפה',
  1: 'קבועה',
};

export default function FixedExpensesPage() {
  console.log('[LOG] FixedExpensesPage component mounted');

  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [laborSettings, setLaborSettings] = useState({
    workingDaysPerMonth: 22,
    workingHoursPerDay: 8,
  });
  const [displayMode, setDisplayMode] = useState('cards'); // 'cards' | 'table'

  const fetchExpenses = async () => {
    try {
      const data = await getAllExpenses();
      console.log('fetchExpenses - raw server response:', data);

      const mapped = data.map((item) => {
        // category is int (enum)
        const categoryInt = typeof item.category === 'number' ? item.category : Number(item.category);
        const cat = CATEGORY_ICON_COLOR[categoryInt] || {};
        let typeValue = item.type;
        if (typeof typeValue === 'string') {
          typeValue = typeValue === 'עקיפה' ? 0 : typeValue === 'קבועה' ? 1 : 1;
        }
        if (typeValue !== 0 && typeValue !== 1) typeValue = 1;
        return {
          title: item.name,
          category: categoryInt,
          categoryLabel: CATEGORY_ENUM_LABEL[categoryInt] || 'שונות',
          amount: item.monthlyCost,
          icon: cat.icon,
          color: cat.color,
          bg: cat.bg,
          type: typeValue,
          isActive: item.isActive,
          id: item.id,
        };
      });

      console.log('fetchExpenses - processed expenses:', mapped);
      setExpenses(mapped);
    } catch (err) {
      console.error('fetchExpenses error:', err);
      setExpenses([]);
    }
  };

  useEffect(() => {
    console.log('[LOG] useEffect: about to call fetchExpenses');
    fetchExpenses();

    console.log('[LOG] useEffect: after fetchExpenses, about to call fetchLabor');

    const fetchLabor = () => {
      getLaborSettings().then((data) => {
        setLaborSettings({
          workingDaysPerMonth: data.workingDaysPerMonth || 22,
          workingHoursPerDay: data.workingHoursPerDay || 8,
        });
      });
    };

    fetchLabor();

    const handler = () => fetchLabor();
    window.addEventListener('laborSettingsUpdated', handler);

    return () => window.removeEventListener('laborSettingsUpdated', handler);
  }, []);

  const handleAddExpense = () => {
    setEditExpense(null);
    setAddDialogOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditExpense(expense);
    setAddDialogOpen(true);
  };

  const handleDeleteExpense = async (expense) => {
    if (window.confirm(`האם למחוק את "${expense.title}"?`)) {
      try {
        await deleteExpense(expense.id);
        setSnackbar({
          open: true,
          message: 'ההוצאה נמחקה בהצלחה',
          severity: 'success',
        });
        fetchExpenses();
      } catch (err) {
        console.error('Error deleting expense:', err);
        setSnackbar({
          open: true,
          message: 'שגיאה במחיקה',
          severity: 'error',
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setEditExpense(null);
  };

  const handleSaveExpense = async (expense) => {
    try {
      console.log('handleSaveExpense called with (raw form):', expense);

      const categoryValue = expense.category ?? '';
      let typeValue = expense.type;

      if (typeof typeValue !== 'number') {
        const labelToNumber = { עקיפה: 0, קבועה: 1 };
        typeValue = labelToNumber[typeValue] ?? 0;
      }

      if (editExpense) {
        const updatePayload = {
          id: editExpense.id,
          name: expense.title,
          monthlyCost: expense.amount,
          isActive: true,
          type: typeValue,
          category: expense.category, // always take from form
        };

        console.log(
          'handleSaveExpense updatePayload (sent to server):',
          updatePayload
        );
        await updateExpense(editExpense.id, updatePayload);
        await fetchExpenses();
        setSnackbar({
          open: true,
          message: 'ההוצאה עודכנה בהצלחה',
          severity: 'success',
        });
      } else {
        const createPayload = {
          name: expense.title,
          monthlyCost: expense.amount,
          isActive: true,
          type: typeValue,
          category: categoryValue,
        };

        console.log(
          'handleSaveExpense createPayload (sent to server):',
          createPayload
        );
        await createExpense(createPayload);
        await fetchExpenses();
        setSnackbar({
          open: true,
          message: 'ההוצאה נוספה בהצלחה',
          severity: 'success',
        });
      }

      setAddDialogOpen(false);
      setEditExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      setSnackbar({
        open: true,
        message: 'שגיאה בשמירה',
        severity: 'error',
      });
    }
  };

  const handleDisplayMode = (_event, newMode) => {
    if (!newMode) return;
    setDisplayMode(newMode);
  };

  const categories = Array.from(new Set(expenses.map((e) => e.category))).map((c) => ({ value: c, label: CATEGORY_ENUM_LABEL[c] || 'שונות' }));
  const types = Array.from(
    new Set(expenses.map((e) => EXPENSE_TYPE_LABEL[e.type]))
  );

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.includes(search) || (CATEGORY_ENUM_LABEL[e.category] || '').includes(search);
    const matchesCategory = category === 'all' || e.category === Number(category);
    const matchesType =
      type === 'all' || EXPENSE_TYPE_LABEL[e.type] === type;
    return matchesSearch && matchesCategory && matchesType;
  });

  console.log(
    '[LOG] FixedExpensesPage: filteredExpenses before render:',
    filteredExpenses
  );

  const totalOverhead = expenses
    .filter((e) => e.type === 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyHours =
    (laborSettings.workingDaysPerMonth || 0) *
    (laborSettings.workingHoursPerDay || 0);

  const overheadPerHour =
    monthlyHours === 0 ? 0 : totalOverhead / monthlyHours;

  return (
    <Box sx={{ p: 3, bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* כותרת ודשבורד */}
      <FixedExpensesHeader onAdd={handleAddExpense} />
      <FixedExpensesSummary expenses={expenses} />

      {/* סרגל חיפוש וסינון */}
      <Box sx={{ my: 2 }}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchLabel="חפש לפי שם או קטגוריה"
          filters={[
            {
              label: 'קטגוריה',
              value: category,
              onChange: setCategory,
              options: categories.map((c) => ({ value: c, label: c })),
            },
            {
              label: 'סוג עלות',
              value: type,
              onChange: setType,
              options: types.map((t) => ({ value: t, label: t })),
            },
          ]}
        />
      </Box>

      {/* כפתור הוספה וטוגל תצוגה */}
     
      {/* סיכום עלות עקיפה לשעה */}
      

      
             
            <MuiPaper sx={{ p: 2, mb: 2, bgcolor: '#f8f5f2' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                עלות עקיפה לשעת עבודה: ₪{overheadPerHour.toFixed(2)}
              </Typography>
            </MuiPaper>



       <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          flexDirection: 'row-reverse',
          justifyContent: 'center',
        }}
      >
  
        <ToggleButtonGroup
          value={displayMode}
      
          exclusive
          onChange={handleDisplayMode}
          aria-label="display mode"
          sx={{ direction: 'ltr',  alignItems: 'center', }}
        >
          <ToggleButton
            value="table"
            aria-label="table"
            sx={{ borderRadius: '50%', px: 2, mx: 0.5 }}
          >
            טבלה
          </ToggleButton>
          <ToggleButton
            value="cards"
            aria-label="cards"
            sx={{ borderRadius: '50%', px: 2, mx: 0.5 }}
          >
            כרטיסיות
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>


      {/* תצוגה: כרטיסיות או טבלה */}
      
      {displayMode === 'cards' ? (
        <FixedExpensesList
          expenses={filteredExpenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      ) : (
        <GenericTable
          rows={filteredExpenses}
          columns={[
            {
              field: 'title',
              headerName: 'שם ההוצאה',
              align: 'right',
              flex: 1,
            },
            {
              field: 'category',
              headerName: 'קטגוריה',
              align: 'right',
              flex: 1,
              renderCell: (row) => CATEGORY_ENUM_LABEL[row.category] || 'שונות',
            },
            {
              field: 'amount',
              headerName: 'סכום חודשי (₪)',
              align: 'right',
              flex: 1,
              renderCell: (row) => `₪${row.amount.toLocaleString()}`,
            },
            {
              field: 'type',
              headerName: 'סוג',
              align: 'right',
              flex: 1,
              renderCell: (row) => (
                <Chip
                  label={
                    row.type === 1 || row.type === 'קבועה'
                      ? 'קבועה'
                      : 'עקיפה'
                  }
                  size="small"
                  sx={{
                    bgcolor:
                      row.type === 1 || row.type === 'קבועה'
                        ? '#C98929'
                        : '#e0e0e0',
                    color:
                      row.type === 1 || row.type === 'קבועה'
                        ? 'white'
                        : 'black',
                    fontWeight: 600,
                  }}
                />
              ),
            },
            {
              field: 'actions',
              headerName: 'פעולות',
              align: 'right',
              flex: 1,
              renderCell: (row) => (
                <>
                  <IconButton
                    size="small"
                    onClick={() => handleEditExpense(row)}
                    aria-label="ערוך"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteExpense(row)}
                    aria-label="מחק"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              ),
            },
          ]}
          noRowsMessage="אין הוצאות קבועות או עקיפות."
        />
      )}

      {/* דיאלוג הוספה/עריכה */}
      <AddExpenseDialog
        open={addDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveExpense}
        initialData={editExpense}
      />

      {/* סנאקבר להודעות */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}