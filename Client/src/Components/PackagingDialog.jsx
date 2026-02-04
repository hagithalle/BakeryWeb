import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from "@mui/material";

export default function PackagingDialog({ open, onClose, onSave, strings, initialValues }) {
  const [name, setName] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [stockUnits, setStockUnits] = React.useState("");

  React.useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "");
      setCost(initialValues.cost || "");
      setStockUnits(initialValues.stockUnits || "");
    } else {
      setName("");
      setCost("");
      setStockUnits("");
    }
  }, [initialValues, open]);

  const handleSave = () => {
    if (name) {
      const packaging = {
        name,
        cost: parseFloat(cost) || 0,
        stockUnits: parseInt(stockUnits) || 0
      };
      if (initialValues && initialValues.id) {
        onSave({ id: initialValues.id, ...packaging });
      } else {
        onSave(packaging);
      }
      setName("");
      setCost("");
      setStockUnits("");
    }
  };

  const handleClose = () => {
    setName("");
    setCost("");
    setStockUnits("");
    onClose();
  };

  const isEdit = !!(initialValues && initialValues.id);
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? (strings.packaging?.edit || "עדכן מוצר אריזה") : (strings.packaging?.add || "הוסף מוצר אריזה")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={strings.sidebar?.packaging || "שם"}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label={strings.packaging?.cost || "עלות"}
            value={cost}
            onChange={e => setCost(e.target.value)}
            type="number"
            fullWidth
          />
          <TextField
            label={strings.packaging?.stockUnits || "יחידות במלאי"}
            value={stockUnits}
            onChange={e => setStockUnits(e.target.value)}
            type="number"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{strings.product?.cancel || "ביטול"}</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {isEdit ? (strings.packaging?.edit || "עדכן") : (strings.packaging?.add || "הוסף")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
