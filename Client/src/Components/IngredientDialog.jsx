import React from "react";
import { TextField, MenuItem, Box, Typography } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SoftDialog from "./ui/SoftDialog";
import FormSection from "./ui/FormSection";
import { fieldSx, primaryBtnSx, secondaryBtnSx } from "./ui/dialogStyles";
import { Button } from "@mui/material";

import ingredientsIcon from "../assets/decor/page-headers/ingredients-header-icon.svg";

export default function IngredientDialog({
  open, onClose, onSave, categories, units, strings,
  initialValues, showPriceWarning = false,
  disableEnforceFocus, disableRestoreFocus,
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [pricePerKg, setPricePerKg] = React.useState("");
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [stockUnit, setStockUnit] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "");
      setCategory(initialValues.category ? String(initialValues.category) : "");
      setUnit(initialValues.unit ? String(initialValues.unit) : "");
      setPricePerKg(initialValues.pricePerKg || "");
      setStockQuantity(initialValues.stockQuantity || "");
      setStockUnit(String(initialValues.stockUnit ?? initialValues.unit ?? "1"));
    } else {
      setName("");
      setCategory(categories?.[0]?.value ? String(categories[0].value) : "");
      setUnit("1");
      setStockUnit("1");
      setPricePerKg("");
      setStockQuantity("");
    }
  }, [initialValues, open, categories]);

  const handleSave = async () => {
    if (name && category && unit) {
      setIsSaving(true);
      const ingredient = {
        name,
        category: parseInt(category),
        unit: parseInt(unit),
        pricePerKg: parseFloat(pricePerKg) || 0,
        stockQuantity: parseInt(stockQuantity) || 0,
        stockUnit: parseInt(stockUnit || unit || "1"),
      };
      if (initialValues && initialValues.id) {
        await onSave({ id: initialValues.id, ...ingredient });
      } else {
        await onSave(ingredient);
      }
      setIsSaving(false);
      setName(""); setCategory(""); setUnit("");
      setPricePerKg(""); setStockQuantity(""); setStockUnit("");
    }
  };

  const handleClose = () => {
    setName(""); setCategory(""); setUnit("");
    setPricePerKg(""); setStockQuantity(""); setStockUnit("");
    onClose();
  };

  const isEdit = !!(initialValues && initialValues.id);
  const title = isEdit
    ? (strings?.ingredient?.edit || "ערוך חומר גלם")
    : (strings?.ingredient?.add || "הוסף חומר גלם חדש");

  return (
    <SoftDialog
      open={open}
      onClose={handleClose}
      title={title}
      maxWidth="xs"
      dir={strings?.direction || "rtl"}
      disableEnforceFocus={disableEnforceFocus}
      disableRestoreFocus={disableRestoreFocus}
      showActions={false}
    >
      <FormSection icon={ingredientsIcon}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={strings?.sidebar?.ingredients || "שם חומר הגלם"}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            placeholder="לדוגמה: קמח כוסמין"
            sx={fieldSx}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label={strings?.filter?.category || "קטגוריה"}
              value={category}
              onChange={e => setCategory(e.target.value)}
              fullWidth
              sx={fieldSx}
            >
              {categories?.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  {strings?.ingredient?.categoryValues?.[cat.label] || cat.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={strings?.product?.unit || "יחידת מידה"}
              value={unit}
              onChange={e => setUnit(e.target.value)}
              fullWidth
              sx={fieldSx}
            >
              {units?.map(u => (
                <MenuItem key={u.value} value={u.value}>
                  {strings?.ingredient?.unitValues?.[u.label] || u.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label={strings?.ingredient?.pricePerKg || "מחיר לק\"ג (₪)"}
            value={pricePerKg}
            onChange={e => setPricePerKg(e.target.value)}
            type="number"
            fullWidth
            sx={fieldSx}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={strings?.ingredient?.stockQuantity || "כמות במלאי"}
              value={stockQuantity}
              onChange={e => setStockQuantity(e.target.value)}
              type="number"
              fullWidth
              sx={fieldSx}
            />
            <TextField
              select
              label={strings?.ingredient?.stockUnit || "יחידת מלאי"}
              value={stockUnit}
              onChange={e => setStockUnit(e.target.value)}
              fullWidth
              sx={fieldSx}
            >
              {units?.map(u => (
                <MenuItem key={u.value} value={u.value}>
                  {strings?.ingredient?.unitValues?.[u.label] || u.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {showPriceWarning && !isEdit && (
            <Box sx={{ bgcolor: 'rgba(255,243,224,0.85)', border: '1px solid #F0D5A0', color: '#8A5E4A', borderRadius: '14px', p: 1.5, fontSize: 14, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: '#C98929', flexShrink: 0 }} />
              חומר הגלם יתווסף עם מחיר 0. תוכלי לעדכן לאחר מכן בדף חומרי הגלם.
            </Box>
          )}
        </Box>
      </FormSection>

      {/* Actions inside content area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2.5 }}>
        <Button
          onClick={handleSave}
          disabled={isSaving || !name}
          fullWidth
          sx={{ ...primaryBtnSx, borderRadius: '14px', py: 1.3, fontSize: '16px' }}
        >
          {isSaving ? "שומר..." : (isEdit ? (strings?.ingredient?.edit || "עדכן") : (strings?.ingredient?.add || "הוסף"))}
        </Button>
        <Button
          onClick={handleClose}
          disabled={isSaving}
          fullWidth
          sx={{ ...secondaryBtnSx, borderRadius: '14px', py: 1.1, fontSize: '15px' }}
        >
          {strings?.product?.cancel || "ביטול"}
        </Button>
      </Box>
    </SoftDialog>
  );
}
