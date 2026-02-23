import React, { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LaborSettingsPanel from "../Components/CostsManagement/LaborSettingsPanel";
import OverheadItemsPanel from "../Components/CostsManagement/OverheadItemsPanel";
import FixedExpensesList from './FixedExpenses/FixedExpensesList';
import FixedExpensesSummary from './FixedExpenses/FixedExpensesSummary';
import AddIcon from '@mui/icons-material/Add';
import AddButton from '../Components/AddButton';
import AddExpenseDialog from './FixedExpenses/AddExpenseDialog';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper as MuiPaper, Chip } from '@mui/material';

export default function CostsManagementPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [displayMode, setDisplayMode] = useState('cards');
  const [expenses, setExpenses] = useState([
    { title: 'שכירות סדנה', category: 'שכירות', amount: 3500, type: 'קבועה' },
    { title: 'ראה חשבון חודשי', category: 'ראה חשבון', amount: 800, type: 'קבועה' },
    { title: 'חשמל', category: 'חשמל', amount: 1200, type: 'קבועה' },
    { title: 'ביטוח עסק', category: 'ביטוח', amount: 350, type: 'קבועה' },
    { title: 'ארנונה', category: 'עלויות עקיפות', amount: 900, type: 'עקיפה' },
    { title: 'תחזוקה', category: 'עלויות עקיפות', amount: 400, type: 'עקיפה' },
  ]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // דמו: ערכים קבועים לחישוב עבודה עקיפה
  const laborSettings = { workingDaysPerMonth: 22, workingHoursPerDay: 8 };
  const totalOverhead = expenses.filter(e => e.type === 'עקיפה').reduce((sum, e) => sum + e.amount, 0);
  const monthlyHours = (laborSettings.workingDaysPerMonth || 0) * (laborSettings.workingHoursPerDay || 0);
  const overheadPerHour = monthlyHours === 0 ? 0 : totalOverhead / monthlyHours;

  const handleTabChange = (event, newValue) => setCurrentTab(newValue);
  const handleDisplayMode = (event, newMode) => { if (newMode) setDisplayMode(newMode); };
  const handleAddExpense = () => setAddDialogOpen(true);
  const handleSaveExpense = (expense) => {
    setExpenses([...expenses, expense]);
    setAddDialogOpen(false);
  };
  const handleCloseDialog = () => setAddDialogOpen(false);

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
        {currentTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              {/* Add button on right */}
              <AddButton onClick={handleAddExpense}>
                הוצאה חדשה
              </AddButton>
              {/* Toggle on left */}
              <ToggleButtonGroup
                value={displayMode}
                exclusive
                onChange={handleDisplayMode}
                aria-label="display mode"
                sx={{ direction: 'ltr' }}
              >
                <ToggleButton value="table" aria-label="table" sx={{ borderRadius: '50%', px: 2, mx: 0.5 }}>
                  טבלה
                </ToggleButton>
                <ToggleButton value="cards" aria-label="cards" sx={{ borderRadius: '50%', px: 2, mx: 0.5 }}>
                  כרטיסיות
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <FixedExpensesSummary expenses={expenses} />
            <MuiPaper sx={{ p: 2, mb: 2, bgcolor: '#f8f5f2' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                עלות עקיפה לשעת עבודה: ₪{overheadPerHour.toFixed(2)}
              </Typography>
            </MuiPaper>
            {displayMode === 'cards' ? (
              <FixedExpensesList expenses={expenses} />
            ) : (
              <TableContainer component={MuiPaper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#FFF7F2' }}>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>שם ההוצאה</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>קטגוריה</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>סכום חודשי (₪)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>סוג</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            אין הוצאות קבועות או עקיפות.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e, idx) => (
                        <TableRow key={e.title + idx} hover>
                          <TableCell align="right">{e.title}</TableCell>
                          <TableCell align="right">{e.category}</TableCell>
                          <TableCell align="right">₪{e.amount.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={e.type === 'קבועה' ? 'קבועה' : 'עקיפה'}
                              size="small"
                              sx={{
                                bgcolor: e.type === 'קבועה' ? '#C98929' : '#e0e0e0',
                                color: e.type === 'קבועה' ? 'white' : 'black',
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <AddExpenseDialog open={addDialogOpen} onClose={handleCloseDialog} onSave={handleSaveExpense} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
