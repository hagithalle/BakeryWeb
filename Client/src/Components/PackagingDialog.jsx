import React from "react";
import { TextField, Box, Button } from "@mui/material";
import SoftDialog from "./ui/SoftDialog";
import FormSection from "./ui/FormSection";
import { fieldSx, primaryBtnSx, secondaryBtnSx } from "./ui/dialogStyles";
import packagingIcon from "../assets/decor/page-headers/packaging-header-icon.svg";

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
      setName(""); setCost(""); setStockUnits("");
    }
  }, [initialValues, open]);

  const handleSave = () => {
    if (name) {
      const packaging = { name, cost: parseFloat(cost) || 0, stockUnits: parseInt(stockUnits) || 0 };
      if (initialValues && initialValues.id) {
        onSave({ id: initialValues.id, ...packaging });
      } else {
        onSave(packaging);
      }
      setName(""); setCost(""); setStockUnits("");
    }
  };

  const handleClose = () => {
    setName(""); setCost(""); setStockUnits("");
    onClose();
  };

  const isEdit = !!(initialValues && initialValues.id);
  const title = isEdit
    ? (strings?.packaging?.edit || "עדכן מוצר אריזה")
    : (strings?.packaging?.add || "הוסף מוצר אריזה");

  return (
    <SoftDialog
      open={open}
      onClose={handleClose}
      title={title}
      maxWidth="sm"
      dir={strings?.direction || "rtl"}
      showActions={false}
    >
      <FormSection icon={packagingIcon}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={strings?.sidebar?.packaging || "שם מוצר האריזה"}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            required
            sx={fieldSx}
          />
          <TextField
            label={strings?.packaging?.cost || "עלות (₪)"}
            value={cost}
            onChange={e => setCost(e.target.value)}
            type="number"
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label={strings?.packaging?.stockUnits || "יחידות במלאי"}
            value={stockUnits}
            onChange={e => setStockUnits(e.target.value)}
            type="number"
            fullWidth
            sx={fieldSx}
          />
        </Box>
      </FormSection>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, justifyContent: 'flex-end' }}>
        <Button onClick={handleClose} sx={secondaryBtnSx}>
          {strings?.product?.cancel || "ביטול"}
        </Button>
        <Button onClick={handleSave} disabled={!name} sx={primaryBtnSx}>
          {isEdit ? (strings?.packaging?.edit || "עדכן") : (strings?.packaging?.add || "הוסף")}
        </Button>
      </Box>
    </SoftDialog>
  );
}
