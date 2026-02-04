
import React, { useState } from "react";
import { addIngredient } from "../../Services/ingredientsService";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, MenuItem, Autocomplete, IconButton, Divider, Paper, Tooltip, Avatar } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ImageIcon from '@mui/icons-material/Image';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import useLocaleStrings from "../../hooks/useLocaleStrings";
import { useLanguage } from "../../context/LanguageContext";

export default function AddRecipeDialog({ open, onClose, onSave, ingredientsList, loadingIngredients, onIngredientAdded, initialValues }) {
  // State for all fields
  const [name, setName] = useState(initialValues?.name || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [category, setCategory] = useState(initialValues?.category || "לחמים");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialValues?.imageUrl || null);
  const [yieldAmount, setYieldAmount] = useState(initialValues?.yieldAmount || 1);
  const [bakeTime, setBakeTime] = useState(initialValues?.bakeTime || 0);
  const [prepTime, setPrepTime] = useState(initialValues?.prepTime || 0);
  const [temp, setTemp] = useState(initialValues?.temp || 0);
  const [unit, setUnit] = useState(initialValues?.unit || "יחידות");
  const [ingredients, setIngredients] = useState(initialValues?.ingredients || []);
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [steps, setSteps] = useState(initialValues?.steps || []);
  const [newStep, setNewStep] = useState("");
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [pendingIngredient, setPendingIngredient] = useState(null);
  const [addIngredientError, setAddIngredientError] = useState("");
  const [addingIngredient, setAddingIngredient] = useState(false);

  // Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddIngredient = () => {
    if (!ingredientName || !ingredientAmount) return;
    // Check if ingredient exists in list
    const exists = (ingredientsList || []).some(i => i.name === ingredientName || i.ingredientName === ingredientName);
    if (!exists) {
      setPendingIngredient({ name: ingredientName, unit: ingredientUnit });
      setShowAddIngredientDialog(true);
      return;
    }
    setIngredients([...ingredients, { name: ingredientName, amount: ingredientAmount, unit: ingredientUnit }]);
    setIngredientName("");
    setIngredientAmount("");
    setIngredientUnit("");
  };

  const handleEditIngredient = (idx) => {
    const ing = ingredients[idx];
    setIngredientName(ing.name);
    setIngredientAmount(ing.amount);
    setIngredientUnit(ing.unit);
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleDeleteIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleAddStep = () => {
    if (!newStep) return;
    setSteps([...steps, newStep]);
    setNewStep("");
  };

  const handleEditStep = (idx) => {
    setNewStep(steps[idx]);
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleDeleteStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      category,
      imageFile,
      yieldAmount,
      bakeTime,
      prepTime,
      temp,
      unit,
      ingredients,
      steps
    });
  };

  const handleCancelAddIngredient = () => {
    setShowAddIngredientDialog(false);
    setPendingIngredient(null);
    setAddIngredientError("");
  };

  const handleConfirmAddIngredient = async () => {
    setAddingIngredient(true);
    try {
      await addIngredient({ name: pendingIngredient.name, unit: pendingIngredient.unit || "יחידה", category: 7, pricePerKg: 0, stockQuantity: 0 });
      onIngredientAdded && onIngredientAdded();
      setIngredients([...ingredients, { name: pendingIngredient.name, amount: ingredientAmount, unit: pendingIngredient.unit }]);
      setIngredientName("");
      setIngredientAmount("");
      setIngredientUnit("");
      setShowAddIngredientDialog(false);
      setPendingIngredient(null);
      setAddIngredientError("");
    } catch (err) {
      setAddIngredientError("שגיאה בהוספת חומר גלם: " + (err?.message || ""));
    } finally {
      setAddingIngredient(false);
    }
  };

  // Categories for select
  const categories = ["לחמים", "עוגות", "עוגיות", "מאפים", "קינוחים", "לחמניות", "פיצות", "אחר"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 700, color: '#5D4037', pb: 0 }}>{initialValues ? "עריכת מתכון" : "מתכון חדש"}</DialogTitle>
      <DialogContent sx={{ bgcolor: '#FFF7F2', borderRadius: 3, p: 4, minWidth: 600 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField label="שם המתכון" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ bgcolor: '#fff', borderRadius: 3, mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
            <TextField label="תיאור קצר" value={description} onChange={e => setDescription(e.target.value)} fullWidth sx={{ bgcolor: '#fff', borderRadius: 3 }} />
            <TextField select label="קטגוריה" value={category} onChange={e => setCategory(e.target.value)} sx={{ minWidth: 140, bgcolor: '#fff', borderRadius: 3 }}>
              {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px dashed #D4A574', borderRadius: 3, p: 2.5, minWidth: 130, minHeight: 130, justifyContent: 'center', cursor: 'pointer', bgcolor: '#FFF' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} id="recipe-image-upload" onChange={handleImageChange} />
              <label htmlFor="recipe-image-upload" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {imagePreview ? (
                  <Avatar src={imagePreview} variant="rounded" sx={{ width: 90, height: 90, mb: 1 }} />
                ) : (
                  <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#D4A574', mb: 1 }} />
                )}
                <Typography sx={{ color: '#BCAAA4', fontSize: 15 }}>העלה תמונה</Typography>
              </label>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
            <TextField label="כמות שיוצאת" value={yieldAmount} onChange={e => setYieldAmount(e.target.value)} type="number" sx={{ bgcolor: '#fff', borderRadius: 3, flex: 1 }} />
            <TextField label="טמפרטורה (°C)" value={temp} onChange={e => setTemp(e.target.value)} type="number" sx={{ bgcolor: '#fff', borderRadius: 3, flex: 1 }} />
            <TextField label="זמן אפייה (דקות)" value={bakeTime} onChange={e => setBakeTime(e.target.value)} type="number" sx={{ bgcolor: '#fff', borderRadius: 3, flex: 1 }} />
            <TextField label="זמן הכנה (דקות)" value={prepTime} onChange={e => setPrepTime(e.target.value)} type="number" sx={{ bgcolor: '#fff', borderRadius: 3, flex: 1 }} />
          </Box>
          <TextField label="יחידת תפוקה (עוגות, יחידות וכו')" value={unit} onChange={e => setUnit(e.target.value)} fullWidth sx={{ bgcolor: '#fff', borderRadius: 3, mb: 2 }} />
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontWeight: 700, color: '#7B5B4B', mb: 1 }}>מרכיבים</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Autocomplete
              freeSolo
              options={ingredientsList.map(i => i.name)}
              value={ingredientName}
              onInputChange={(_, v) => setIngredientName(v)}
              renderInput={params => <TextField {...params} label="חומר גלם" sx={{ bgcolor: '#fff', borderRadius: 3 }} />}
              sx={{ minWidth: 180 }}
            />
            <TextField label="כמות" value={ingredientAmount} onChange={e => setIngredientAmount(e.target.value)} type="number" sx={{ bgcolor: '#fff', borderRadius: 3, minWidth: 90 }} />
            <TextField label="יחידה" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} sx={{ bgcolor: '#fff', borderRadius: 3, minWidth: 90 }} />
            <Button onClick={handleAddIngredient} variant="outlined" sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574', minWidth: 110 }}>הוסף מרכיב</Button>
            <Button onClick={() => setShowAddIngredientDialog(true)} variant="outlined" startIcon={<AddPhotoAlternateIcon />} sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574', minWidth: 140 }}>חומר גלם חדש</Button>
          </Box>
          <Paper elevation={0} sx={{ bgcolor: '#FFF', borderRadius: 3, p: 2, mb: 3 }}>
            {ingredients.length === 0 && <Typography sx={{ color: '#BCAAA4', textAlign: 'center' }}>לא הוספת חומרים</Typography>}
            {ingredients.map((ing, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: idx < ingredients.length - 1 ? '1px solid #F9E3D6' : 'none', py: 1 }}>
                <Typography sx={{ flex: 1 }}>{ing.name} - {ing.amount} {ing.unit}</Typography>
                <Tooltip title="ערוך">
                  <IconButton size="small" onClick={() => handleEditIngredient(idx)} sx={{ color: '#D4A574' }}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="מחק">
                  <IconButton size="small" onClick={() => handleDeleteIngredient(idx)} sx={{ color: '#D4A574' }}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
            ))}
          </Paper>
          <Typography sx={{ fontWeight: 700, color: '#7B5B4B', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}> <InfoOutlinedIcon sx={{ fontSize: 20, color: '#D4A574' }} /> שלבי הכנה</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField label="שלב חדש" value={newStep} onChange={e => setNewStep(e.target.value)} fullWidth sx={{ bgcolor: '#fff', borderRadius: 3 }} />
            <Button onClick={handleAddStep} variant="outlined" sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574', minWidth: 110 }}>הוסף שלב</Button>
          </Box>
          <Paper elevation={0} sx={{ bgcolor: '#FFF', borderRadius: 3, p: 2 }}>
            {steps.length === 0 && <Typography sx={{ color: '#BCAAA4', textAlign: 'center' }}>לא הוספת שלבים</Typography>}
            {steps.map((step, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: idx < steps.length - 1 ? '1px solid #F9E3D6' : 'none', py: 1 }}>
                <Typography sx={{ flex: 1 }}>{idx + 1}. {step}</Typography>
                <Tooltip title="ערוך">
                  <IconButton size="small" onClick={() => handleEditStep(idx)} sx={{ color: '#D4A574' }}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="מחק">
                  <IconButton size="small" onClick={() => handleDeleteStep(idx)} sx={{ color: '#D4A574' }}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
            ))}
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#F9E3D6', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574' }}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#5D4037', ':hover': { bgcolor: '#4E342E' } }}>
          {initialValues ? "שמור שינויים" : "צור מתכון"}
        </Button>
      </DialogActions>

      {/* דיאלוג להוספת חומר גלם חדש */}
      <Dialog open={showAddIngredientDialog} onClose={handleCancelAddIngredient} maxWidth="xs" fullWidth dir="rtl">
        <DialogTitle sx={{ color: '#5D4037', fontWeight: 700, pb: 0 }}>הוסף חומר גלם חדש</DialogTitle>
        <DialogContent sx={{ bgcolor: '#FFF7F2', borderRadius: 3, p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="שם חומר הגלם"
              value={pendingIngredient?.name || ''}
              onChange={e => setPendingIngredient({ ...pendingIngredient, name: e.target.value })}
              fullWidth
              placeholder="לדוגמה: קמח כוסמין"
              sx={{ bgcolor: '#fff', borderRadius: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="קטגוריה"
                value={pendingIngredient?.category || 'קטנים'}
                onChange={e => setPendingIngredient({ ...pendingIngredient, category: e.target.value })}
                sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 3 }}
              >
                {['קטנים', 'בינוניים', 'גדולים', 'אחר'].map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="יחידת מידה"
                value={pendingIngredient?.unit || 'קילו'}
                onChange={e => setPendingIngredient({ ...pendingIngredient, unit: e.target.value })}
                sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: 3 }}
              >
                {['קילו', 'גרם', 'ליטר', 'מ"ל', 'יחידה', 'אחר'].map(unit => (
                  <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="מחיר ליחידה (₪)"
              value={pendingIngredient?.price || 0}
              onChange={e => setPendingIngredient({ ...pendingIngredient, price: e.target.value })}
              type="number"
              sx={{ bgcolor: '#fff', borderRadius: 3 }}
            />
            <Box sx={{ bgcolor: '#FFF3E0', color: '#A1887F', borderRadius: 2, p: 1, fontSize: 14, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: '#A1887F' }} />
              חומר הגלם יתווסף עם מחיר 0. תוכלי לעדכן את המחיר לאחר מכן בדף חומרי הגלם.
            </Box>
            {addIngredientError && <Typography color="error" sx={{ mt: 1 }}>{addIngredientError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#F9E3D6', p: 2, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <Button onClick={handleCancelAddIngredient} disabled={addingIngredient} sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574' }}>ביטול</Button>
          <Button onClick={handleConfirmAddIngredient} variant="contained" color="primary" disabled={addingIngredient || !pendingIngredient?.name} sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#5D4037', ':hover': { bgcolor: '#4E342E' } }}>
            {addingIngredient ? "מוסיף..." : "הוסף"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
