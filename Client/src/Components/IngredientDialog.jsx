import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function IngredientDialog({ open, onClose, onSave, categories, units, strings, initialValues, showPriceWarning = false }) {
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
      setUnit("1");  // ברירת מחדל: Kilogram
      setStockUnit("1");  // ברירת מחדל: Kilogram
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
        stockUnit: parseInt(stockUnit || unit || "1")
      };
      if (initialValues && initialValues.id) {
        await onSave({ id: initialValues.id, ...ingredient });
      } else {
        await onSave(ingredient);
      }
      setIsSaving(false);
      setName("");
      setCategory("");
      setUnit("");
      setPricePerKg("");
      setStockQuantity("");
      setStockUnit("");
    }
  };

  const handleClose = () => {
    setName("");
    setCategory("");
    setUnit("");
    setPricePerKg("");
    setStockQuantity("");
    setStockUnit("");
    onClose();
  };

  const isEdit = initialValues && initialValues.id;
  const title = isEdit ? (strings.ingredient?.edit || "ערוך חומר גלם") : (strings.ingredient?.add || "הוסף חומר גלם חדש");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth dir={strings.direction || "rtl"}>
      <DialogTitle sx={{ color: '#7B5B4B', fontWeight: 700, fontSize: 26, textAlign: 'center', pb: 0, pt: 2 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#FFF7F2', borderRadius: 3, p: 3, pt: 1 }}>
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={strings.sidebar?.ingredients || "שם חומר הגלם"}
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              placeholder="לדוגמה: קמח כוסמין"
              sx={{ bgcolor: '#fff', borderRadius: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label={strings.filter?.category || "קטגוריה"}
                value={category}
                onChange={e => setCategory(e.target.value)}
                fullWidth
                sx={{ bgcolor: '#fff', borderRadius: 3 }}
              >
                {categories?.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {strings.ingredient?.categoryValues?.[cat.label] || cat.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={strings.product?.unit || "יחידת מידה"}
                value={unit}
                onChange={e => setUnit(e.target.value)}
                fullWidth
                sx={{ bgcolor: '#fff', borderRadius: 3 }}
              >
                {units?.map(u => (
                  <MenuItem key={u.value} value={u.value}>
                    {strings.ingredient?.unitValues?.[u.label] || u.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            {!isEdit && (
              <>
                <TextField
                  label={strings.ingredient?.pricePerKg || "מחיר לקילוגרם (₪)"}
                  value={pricePerKg}
                  onChange={e => setPricePerKg(e.target.value)}
                  type="number"
                  fullWidth
                  sx={{ bgcolor: '#fff', borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={strings.ingredient?.stockQuantity || "כמות במלאי"}
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    type="number"
                    fullWidth
                    sx={{ bgcolor: '#fff', borderRadius: 3 }}
                  />
                  <TextField
                    select
                    label={strings.ingredient?.stockUnit || "יחידת מלאי"}
                    value={stockUnit}
                    onChange={e => setStockUnit(e.target.value)}
                    fullWidth
                    sx={{ bgcolor: '#fff', borderRadius: 3 }}
                  >
                    {units?.map(u => (
                      <MenuItem key={u.value} value={u.value}>
                        {strings.ingredient?.unitValues?.[u.label] || u.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </>
            )}
            {isEdit && (
              <>
                <TextField
                  label={strings.ingredient?.pricePerKg || "מחיר לק\"ג"}
                  value={pricePerKg}
                  onChange={e => setPricePerKg(e.target.value)}
                  type="number"
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={strings.ingredient?.stockQuantity || "כמות במלאי"}
                    value={stockQuantity}
                    onChange={e => setStockQuantity(e.target.value)}
                    type="number"
                    fullWidth
                  />
                  <TextField
                    select
                    label={strings.ingredient?.stockUnit || "יחידת מלאי"}
                    value={stockUnit}
                    onChange={e => setStockUnit(e.target.value)}
                    fullWidth
                  >
                    {units?.map(u => (
                      <MenuItem key={u.value} value={u.value}>
                        {strings.ingredient?.unitValues?.[u.label] || u.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </>
            )}
          </Box>
          {showPriceWarning && !isEdit && (
            <Box sx={{ bgcolor: '#FFF3E0', color: '#A1887F', borderRadius: 2, p: 1.5, fontSize: 15, display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
              <InfoOutlinedIcon sx={{ fontSize: 20, color: '#A1887F', mr: 0.5 }} />
              חומר הגלם יתווסף עם מחיר 0. תוכלי לעדכן את המחיר לאחר מכן בדף חומרי הגלם.
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#FFF7F2', p: 2, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, flexDirection: 'column', gap: 1 }}>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary" 
          fullWidth 
          disabled={isSaving || !name}
          sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#7B5B4B', ':hover': { bgcolor: '#5D4037' }, mb: 1, fontSize: 18, py: 1.2 }}
        >
          {isSaving ? "שומר..." : (isEdit ? (strings.ingredient?.edit || "עדכן") : (strings.ingredient?.add || "הוסף"))}
        </Button>
        <Button 
          onClick={handleClose} 
          disabled={isSaving} 
          fullWidth 
          sx={{ borderRadius: 3, fontWeight: 600, color: '#7B5B4B', bgcolor: 'transparent', border: 'none', boxShadow: 'none', fontSize: 18 }}
        >
          {strings.product?.cancel || "ביטול"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
