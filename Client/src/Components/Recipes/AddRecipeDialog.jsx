
import React, { useState, useEffect } from "react";
import { addIngredient, fetchCategories } from "../../Services/ingredientsService";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, MenuItem, Autocomplete, IconButton, Divider, Paper, Tooltip, Avatar, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RecipeMainInfo from "./Details/RecipeMainInfo";
import RecipeBakingInfo from "./Details/RecipeBakingInfo";
import RecipeIngredientsSection from "./Details/RecipeIngredientsSection";
import RecipeStepsSection from "./Details/RecipeStepsSection";
import IngredientDialog from "../IngredientDialog";
import { useLanguage } from "../../context/LanguageContext";
import useLocaleStrings from "../../hooks/useLocaleStrings";

export default function AddRecipeDialog({ open, onClose, onSave, ingredientsList, loadingIngredients, onIngredientAdded, initialValues }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const [categories, setCategories] = useState([]);
  
  // יחידות מידה מוגדרות מראש (תואם ל-UnitOfMeasure enum)
  const units = [
    { value: 1, label: "Kilogram" },
    { value: 2, label: "Gram" },
    { value: 3, label: "Liter" },
    { value: 4, label: "Milliliter" },
    { value: 5, label: "Unit" },
    { value: 6, label: "Dozen" },
    { value: 7, label: "Package" },
    { value: 8, label: "Teaspoon" },
    { value: 9, label: "Tablespoon" },
    { value: 10, label: "Cup" }
  ];
  
  useEffect(() => {
    fetchCategories().then(data => {
      const mapped = (data || []).map(cat => ({ value: cat.value, label: cat.name }));
      setCategories(mapped);
    });
  }, []);
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

  const handleSaveNewIngredient = async (ingredient) => {
    setAddingIngredient(true);
    try {
      await addIngredient(ingredient);
      onIngredientAdded && onIngredientAdded();
      setShowAddIngredientDialog(false);
      setPendingIngredient(null);
      setAddIngredientError("");
    } catch (err) {
      setAddIngredientError("שגיאה בהוספת חומר גלם: " + (err?.message || ""));
      throw err; // זורקים את השגיאה כדי שהדיאלוג יישאר פתוח
    } finally {
      setAddingIngredient(false);
    }
  };

  // Categories for select
  const recipeCategories = ["לחמים", "עוגות", "עוגיות", "מאפים", "קינוחים", "לחמניות", "פיצות", "אחר"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 700, color: '#5D4037', pb: 0 }}>{initialValues ? "עריכת מתכון" : "מתכון חדש"}</DialogTitle>
      <DialogContent sx={{ bgcolor: '#FFF7F2', borderRadius: 3, p: 4, minWidth: 600 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Main Info */}
          <RecipeMainInfo name={name} description={description} imageUrl={imagePreview} />
          {/* Baking Info */}
          <RecipeBakingInfo bakingTime={bakeTime} temperature={temp} servings={unit} yieldAmount={yieldAmount} />
          {/* Ingredients Section */}
          <RecipeIngredientsSection ingredients={ingredients} />
          {/* Steps Section */}
          <RecipeStepsSection steps={steps} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#F9E3D6', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ borderRadius: 3, fontWeight: 600, color: '#5D4037', borderColor: '#D4A574' }}>ביטול</Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: 3, fontWeight: 600, bgcolor: '#5D4037', ':hover': { bgcolor: '#4E342E' } }}>
          {initialValues ? "שמור שינויים" : "צור מתכון"}
        </Button>
      </DialogActions>

      {/* דיאלוג להוספת חומר גלם חדש */}
      <IngredientDialog
        open={showAddIngredientDialog}
        onClose={() => setShowAddIngredientDialog(false)}
        onSave={handleSaveNewIngredient}
        categories={categories}
        units={units}
        strings={strings}
        showPriceWarning={true}
      />
    </Dialog>
  );
}
