import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Tabs, Tab, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LaborSettingsPanel from "../Components/CostsManagement/LaborSettingsPanel";
import OverheadItemsPanel from "../Components/CostsManagement/OverheadItemsPanel";
import FixedExpensesList from '../Components/FixedExpenses/FixedExpensesList';
import FixedExpensesSummary from '../Components/FixedExpenses/FixedExpensesSummary';
import AddIcon from '@mui/icons-material/Add';
import AddButton from '../Components/AddButton';
import AddExpenseDialog from '../Components/FixedExpenses/AddExpenseDialog';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiPaper, Chip, IconButton, Snackbar, Alert } from '@mui/material';
import FixedExpensesPage from './FixedExpensesPage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '../Services/fixedExpenseService';
import { getLaborSettings } from '../Services/laborSettingsService';

export default function CostsManagementPage() {


  const [currentTab, setCurrentTab] = useState(0);
  const [displayMode, setDisplayMode] = useState('cards');
  const [expenses, setExpenses] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [laborSettings, setLaborSettings] = useState({ workingDaysPerMonth: 22, workingHoursPerDay: 8 });

  // מיפוי קטגוריה לאייקון וצבע (אפשר להרחיב)
  const CATEGORY_ICON_COLOR = {
    'שכירות': { type: 'קבועה' },
    'ראה חשבון': { type: 'עקיפה' },
    'חשמל': { type: 'קבועה' },
    'ביטוח': { type: 'עקיפה' },
  };

  const fetchExpenses = async () => {
    try {
      const data = await getAllExpenses();
      const mapped = data.map(item => {
        const cat = CATEGORY_ICON_COLOR[item.name] || {};
        return {
          title: item.name,
          category: item.name,
          amount: item.monthlyCost,
          type: cat.type || 'קבועה',
          isActive: item.isActive,
          id: item.id,
        };
      });
      setExpenses(mapped);
    } catch (err) {
      setExpenses([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const fetchLabor = () => {
      getLaborSettings().then(data => {
        setLaborSettings({
          workingDaysPerMonth: data.workingDaysPerMonth || 22,
          workingHoursPerDay: data.workingHoursPerDay || 8
        });
      });
    };
    fetchLabor();
    // Listen for labor settings update event
    const handler = () => fetchLabor();
    window.addEventListener('laborSettingsUpdated', handler);
    return () => window.removeEventListener('laborSettingsUpdated', handler);
  }, []);

  // חישוב עלות עקיפה לשעה לפי הגדרות מהשרת
  const totalOverhead = expenses.filter(e => e.type === 'עקיפה').reduce((sum, e) => sum + e.amount, 0);
  const monthlyHours = (laborSettings.workingDaysPerMonth || 0) * (laborSettings.workingHoursPerDay || 0);
  const overheadPerHour = monthlyHours === 0 ? 0 : totalOverhead / monthlyHours;

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);
    // Fetch expenses when switching to tab 1
    useEffect(() => {
      if (currentTab === 1) {
        fetchExpenses();
      }
    }, [currentTab]);
  const handleDisplayMode = (event, newMode) => { if (newMode) setDisplayMode(newMode); };
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
        setSnackbar({ open: true, message: 'ההוצאה נמחקה בהצלחה', severity: 'success' });
        fetchExpenses();
      } catch (err) {
        setSnackbar({ open: true, message: 'שגיאה במחיקה', severity: 'error' });
      }
    }
  };
  const handleSaveExpense = async (expense) => {
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, {
          id: editExpense.id,
          name: expense.title,
          monthlyCost: expense.amount,
          isActive: true
        });
        setSnackbar({ open: true, message: 'ההוצאה עודכנה בהצלחה', severity: 'success' });
      } else {
        await createExpense({
          name: expense.title,
          monthlyCost: expense.amount,
          isActive: true
        });
        setSnackbar({ open: true, message: 'ההוצאה נוספה בהצלחה', severity: 'success' });
      }
      setAddDialogOpen(false);
      setEditExpense(null);
      fetchExpenses();
    } catch (err) {
      setSnackbar({ open: true, message: 'שגיאה בשמירה', severity: 'error' });
    }
  };
  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setEditExpense(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* טאבים */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem',
              color: '#9B5A25',
              '&.Mui-selected': {
                color: '#971936'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#C98929'
            }
          }}
        >
          <Tab label="הגדרות שכר ועבודה" />
          <Tab label="הוצאות קבועות + עקיפות" />
        </Tabs>
      </Paper>

      {/* תוכן */}
      <Box sx={{ mt: 3, flexGrow: 1, overflow: 'auto' }}>
        {currentTab === 0 && <LaborSettingsPanel />}
        {currentTab === 1 && <FixedExpensesPage />}
      </Box>
    </Box>
  );
}
