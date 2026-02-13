
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
import { UnitTypeOptions } from "../../utils/unitEnums";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("לחמים");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [yieldAmount, setYieldAmount] = useState(1);
  const [outputUnitType, setOutputUnitType] = useState(0);  // סוג היחידה שהמתכון עושה (Piece, Whole, וכו')
  const [bakeTime, setBakeTime] = useState(0);
  const [prepTime, setPrepTime] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [steps, setSteps] = useState([]);
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [pendingIngredient, setPendingIngredient] = useState(null);
  const [addIngredientError, setAddIngredientError] = useState("");
  const [addingIngredient, setAddingIngredient] = useState(false);

  // Reset or populate form when dialog opens with new initialValues
  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Editing mode - populate with existing values
        console.log('AddRecipeDialog: initialValues received:', initialValues);
        console.log('AddRecipeDialog: ingredients in initialValues:', initialValues.ingredients);
        setName(initialValues.name || "");
        setDescription(initialValues.description || "");
        setCategory(initialValues.category || "לחמים");
        setImagePreview(initialValues.imageUrl || null);
        setYieldAmount(initialValues.yieldAmount || 1);
        setOutputUnitType(initialValues.outputUnitType ?? 0);
        setBakeTime(initialValues.bakeTime || 0);
        setPrepTime(initialValues.prepTime || 0);
        setTemperature(initialValues.temperature || 0);
        setIngredients(initialValues.ingredients || []);
        setSteps(initialValues.steps || []);
        console.log('AddRecipeDialog: set ingredients to:', initialValues.ingredients);
      } else {
        // New recipe mode - reset all fields
        setName("");
        setDescription("");
        setCategory("לחמים");
        setImageFile(null);
        setImagePreview(null);
        setYieldAmount(1);
        setOutputUnitType(0);
        setBakeTime(0);
        setPrepTime(0);
        setTemperature(0);
        setIngredients([]);
        setSteps([]);
      }
      // Always reset these fields when opening
      setIngredientName("");
      setIngredientAmount("");
      setIngredientUnit("");
    }
  }, [open, initialValues]);

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
    console.log('=============== handleSave START ===============');
    
    // 1. בדיקה בסיסית של שם מתכון
    console.log('1️⃣ בדיקה שם מתכון:', { name, isEmpty: !name || name.trim() === '' });
    if (!name || name.trim() === '') {
      alert('חובה להזין שם למתכון!');
      return;
    }

    // 2. הדפסת רכיבים - בדיוק כמו שהם בstate
    console.log('2️⃣ רכיבים ב-state:', JSON.stringify(ingredients, null, 2));
    console.log('   מספר רכיבים:', ingredients.length);
    ingredients.forEach((ing, idx) => {
      console.log(`   [${idx}]:`, {
        ingredientId: ing.ingredientId,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        types: {
          id: typeof ing.ingredientId,
          amount: typeof ing.amount,
          unit: typeof ing.unit
        }
      });
    });

    // 3. הדפסת שלבים - בדיוק כמו שהם בstate
    console.log('3️⃣ שלבים ב-state:', JSON.stringify(steps, null, 2));
    console.log('   מספר שלבים:', steps.length);
    steps.forEach((step, idx) => {
      console.log(`   [${idx}]:`, {
        value: step,
        type: typeof step,
        length: typeof step === 'string' ? step.length : 'N/A'
      });
    });

    // 4. הדפסת כל הנתונים שנשלחים
    const recipeData = {
      name,
      description,
      category,
      imageFile: imageFile ? { name: imageFile.name, size: imageFile.size } : null,
      yieldAmount,
      outputUnitType,
      bakeTime,
      prepTime,
      temperature,
      ingredients,
      steps
    };
    console.log('4️⃣ נתונים למטה לשלוח:', {
      basicInfo: {
        name,
        description,
        category,
        yieldAmount: Number(yieldAmount),
        outputUnitType: Number(outputUnitType),
        prepTime: Number(prepTime),
        bakeTime: Number(bakeTime),
        temperature: Number(temperature)
      },
      image: imageFile ? `יש תמונה: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)` : 'אין תמונה',
      ingredientsCount: ingredients.length,
      stepsCount: steps.length
    });

    // 5. שליחת הנתונים ללא שינוי
    console.log('5️⃣ שווק onSave...');
    console.log('=============== handleSave END ===============');
    
    onSave(recipeData);
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
          <RecipeMainInfo
            name={name}
            description={description}
            category={category}
            categories={recipeCategories}
            imageUrl={imagePreview}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onCategoryChange={setCategory}
            onImageChange={handleImageChange}
          />
          {/* Baking Info */}
          <RecipeBakingInfo
            bakingTime={bakeTime}
            temperature={temperature}
            prepTime={prepTime}
            yieldAmount={yieldAmount}
            outputUnitType={outputUnitType}
            onBakingTimeChange={setBakeTime}
            onTemperatureChange={setTemperature}
            onPrepTimeChange={setPrepTime}
            onYieldAmountChange={setYieldAmount}
            onOutputUnitTypeChange={setOutputUnitType}
          />
          {/* Ingredients Section */}
          <RecipeIngredientsSection
            ingredients={ingredients}
            ingredientsList={ingredientsList}
            onAddIngredient={(item) => {
              console.log('AddRecipeDialog: onAddIngredient received:', item);
              setIngredients(prev => [...prev, { 
                ingredientId: item.ingredientId,
                name: item.name, 
                amount: item.amount, 
                unit: item.unit 
              }]);
              console.log('AddRecipeDialog: ingredients updated');
            }}
            onRemoveIngredient={(idx) => {
              console.log('AddRecipeDialog: removing ingredient at index:', idx);
              setIngredients(prev => prev.filter((_, i) => i !== idx));
            }}
            onUpdateIngredient={(idx, updatedIngredient) => {
              console.log('AddRecipeDialog: updating ingredient at index:', idx, updatedIngredient);
              setIngredients(prev => prev.map((ing, i) => i === idx ? updatedIngredient : ing));
            }}
            onIngredientAdded={onIngredientAdded}
          />
          {/* Steps Section */}
          <RecipeStepsSection
            steps={steps}
            onStepsChange={setSteps}
          />
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
        disableEnforceFocus
        disableRestoreFocus
      />
    </Dialog>
  );
}
