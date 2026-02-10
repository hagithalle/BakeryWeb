import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getAllOverheadItems,
  createOverheadItem,
  updateOverheadItem,
  deleteOverheadItem
} from "../../Services/overheadItemService";

export default function OverheadItemsPanel() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    monthlyCost: 0,
    isActive: true
  });

  // טעינת כל העלויות העקיפות
  const { data: overheadItems = [], isLoading } = useQuery({
    queryKey: ['overheadItems'],
    queryFn: getAllOverheadItems
  });

  // יצירת עלות חדשה
  const { mutate: createItem } = useMutation({
    mutationFn: createOverheadItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['overheadItems']);
      setDialogOpen(false);
      resetForm();
      alert('✅ העלות נוספה בהצלחה!');
    },
    onError: (error) => {
      alert('❌ שגיאה בהוספת העלות: ' + error.message);
    }
  });

  // עדכון עלות
  const { mutate: updateItem } = useMutation({
    mutationFn: ({ id, data }) => updateOverheadItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['overheadItems']);
      setDialogOpen(false);
      resetForm();
      alert('✅ העלות עודכנה בהצלחה!');
    },
    onError: (error) => {
      alert('❌ שגיאה בעדכון העלות: ' + error.message);
    }
  });

  // מחיקת עלות
  const { mutate: deleteItem } = useMutation({
    mutationFn: deleteOverheadItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['overheadItems']);
      alert('✅ העלות נמחקה בהצלחה!');
    },
    onError: (error) => {
      alert('❌ שגיאה במחיקת העלות: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      monthlyCost: 0,
      isActive: true
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        monthlyCost: item.monthlyCost,
        isActive: item.isActive
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('נא להזין שם לעלות');
      return;
    }

    const dataToSave = {
      name: formData.name,
      monthlyCost: parseFloat(formData.monthlyCost) || 0,
      isActive: formData.isActive
    };

    if (editingItem) {
      updateItem({ id: editingItem.id, data: { ...dataToSave, id: editingItem.id } });
    } else {
      createItem(dataToSave);
    }
  };

  const handleDelete = (item) => {
    if (window.confirm(`האם למחוק את "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  // חישוב סה"כ עלויות חודשיות
  const totalMonthlyCost = overheadItems
    .filter(item => item.isActive)
    .reduce((sum, item) => sum + item.monthlyCost, 0);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* כותרת וכפתור הוספה */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#751B13', fontFamily: 'Suez One, serif' }}>
          עלויות עקיפות חודשיות
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#5D4037',
            ':hover': { bgcolor: '#4E342E' },
            fontWeight: 600
          }}
        >
          הוסף עלות
        </Button>
      </Box>

      {/* סיכום */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">
          סה"כ עלויות עקיפות חודשיות: ₪{totalMonthlyCost.toFixed(2)}
        </Typography>
      </Alert>

      {/* טבלת עלויות */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#FFF7F2' }}>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>שם העלות</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>עלות חודשית (₪)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>סטטוס</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overheadItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    אין עלויות עקיפות. הוסיפי עלות ראשונה!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              overheadItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell align="right">{item.name}</TableCell>
                  <TableCell align="right">₪{item.monthlyCost.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={item.isActive ? 'פעיל' : 'לא פעיל'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(item)}
                      sx={{ color: '#5D4037', mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item)}
                      sx={{ color: '#D32F2F' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* דיאלוג הוספה/עריכה */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ fontWeight: 700, color: '#5D4037' }}>
          {editingItem ? 'עריכת עלות עקיפה' : 'הוספת עלות עקיפה חדשה'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="שם העלות"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: רואה חשבון, ביטוח, חשמל"
            />
            <TextField
              fullWidth
              label="עלות חודשית (₪)"
              type="number"
              value={formData.monthlyCost}
              onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
              InputProps={{ inputProps: { min: 0, step: 10 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#5D4037' }}>
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: '#5D4037',
              ':hover': { bgcolor: '#4E342E' }
            }}
          >
            {editingItem ? 'שמור שינויים' : 'הוסף'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
