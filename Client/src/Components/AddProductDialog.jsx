import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Divider,
  Chip,
  InputAdornment,
  Alert,
  Switch,
  FormControlLabel,
  FormControl,
  RadioGroup,
  Radio,
  Card,
  CardMedia,
  CardContent,
  Paper
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import BaseDialog from "./BaseDialog";
import PackagingDialog from "./PackagingDialog";

/**
 * דיאלוג להוספת מוצר חדש
 * 
 * @param {object} props
 * @param {boolean} props.open - האם הדיאלוג פתוח
 * @param {function} props.onClose - פונקציה לסגירת הדיאלוג
 * @param {function} props.onSave - פונקציה לשמירת המוצר החדש
 * @param {Array} props.recipes - רשימת מתכונים זמינים
 * @param {Array} props.products - רשימת מוצרים קיימים
 * @param {Array} props.packaging - רשימת מוצרי אריזה זמינים
 * @param {object} props.strings - מחרוזות תרגום
 * @param {object} props.initialValues - ערכים התחלתיים (למצב עריכה)
 * @param {function} props.onDelete - callback למחיקת מוצר
 * @param {function} props.onEditProduct - callback כשלוחצים עריכה על מוצר מהרשימה
 * @param {function} props.onBackToList - callback כשלוחצים חזור לרשימה mFromEdit
 */
export default function AddProductDialog({
  open,
  onClose,
  onSave,
  recipes = [],
  products = [],
  packaging = [],
  strings = {},
  initialValues = null,
  onDelete,
  onEditProduct,  // callback להודעה ל-ProductsPage שצריך לערוך מוצר
  onBackToList,   // callback להודעה ל-ProductsPage שצריך לחזור לרשימה
  onAddPackaging  // callback להוספת מוצר אריזה חדש
}) {
  // ========== States בסיסיים ==========
  const [isCreatingNew, setIsCreatingNew] = useState(false); // תמיד נתחיל במצב יצירה
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("single"); // single או package
  const [description, setDescription] = useState("");
  
  // ========== מוצר בודד ==========
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeUnits, setRecipeUnits] = useState(1);
  
  // ========== מארז ==========
  // כל פריט במערך הוא: { productId, quantity }
  const [packageItems, setPackageItems] = useState([]);
  // שורות הוספה חדשות
  const [packageAddRows, setPackageAddRows] = useState([]);
  // עריכת שורה קיימת
  const [editingPackageIdx, setEditingPackageIdx] = useState(null);
  const [editingPackageProductId, setEditingPackageProductId] = useState("");
  const [editingPackageQuantity, setEditingPackageQuantity] = useState("");
  
  // ========== קטגוריה ==========
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  // ========== עלויות נוספות ==========
  // כל פריט במערך הוא: { packagingId, quantity }
  const [additionalPackaging, setAdditionalPackaging] = useState([]);
  const [packagingTimeMinutes, setPackagingTimeMinutes] = useState(0);
  // שורות הוספה חדשות
  const [packagingAddRows, setPackagingAddRows] = useState([]);
  // עריכת שורה קיימת
  const [editingPackagingIdx, setEditingPackagingIdx] = useState(null);
  const [editingPackagingId, setEditingPackagingId] = useState("");
  const [editingPackagingQuantity, setEditingPackagingQuantity] = useState("");
  
  // ========== מחירים ==========
  const [profitMarginPercent, setProfitMarginPercent] = useState(15);
  const [priceType, setPriceType] = useState("withVAT"); // withVAT, withoutVAT, manual
  const [manualSellingPrice, setManualSellingPrice] = useState("");
  
  // ========== תמונה ==========
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  
  // ========== מצבים ==========
  const [isSaving, setIsSaving] = useState(false);
  const [isPackagingDialogOpen, setIsPackagingDialogOpen] = useState(false);

  // ========== קטגוריות מוגדרות מראש ==========
  const predefinedCategories = [
    "מארז יום הולדת",
    "מארז יום אהבה",
    "מארז פורים",
    "מארז חג",
    "מארז כללי",
    "אחר"
  ];

  // ========== אתחול ערכים ==========
  useEffect(() => {
    if (initialValues) {
      setProductName(initialValues.name || "");
      setProductType(initialValues.productType || "single");
      setDescription(initialValues.description || "");
      setSelectedRecipeId(initialValues.recipeId || "");
      setRecipeUnits(initialValues.recipeUnits || 1);
      setPackageItems(initialValues.packageItems || []);
      setCategory(initialValues.category || "");
      setCustomCategory(initialValues.customCategory || "");
      setShowCustomCategory(initialValues.category === "אחר" || false);
      setAdditionalPackaging(initialValues.additionalPackaging || []);
      setPackagingTimeMinutes(initialValues.packagingTimeMinutes || 0);
      setProfitMarginPercent(initialValues.profitMarginPercent || 15);
      setPriceType(initialValues.manualSellingPrice ? "manual" : "withVAT");
      setManualSellingPrice(initialValues.manualSellingPrice || "");
      setExistingImageUrl(initialValues.imageUrl || "");
      setImagePreview(null);
      setImageFile(null);
      setIsCreatingNew(false); // עבור לטופס עריכה
    } else {
      resetForm();
      setIsCreatingNew(false); // גם במצב חדש - ישר לטופס
    }
  }, [initialValues, open]);

  const resetForm = () => {
    setProductName("");
    setProductType("single");
    setDescription("");
    setSelectedRecipeId("");
    setRecipeUnits(1);
    setPackageItems([]);
    setPackageAddRows([]);
    setEditingPackageIdx(null);
    setCategory("");
    setCustomCategory("");
    setShowCustomCategory(false);
    setAdditionalPackaging([]);
    setPackagingAddRows([]);
    setEditingPackagingIdx(null);
    setPackagingTimeMinutes(0);
    setProfitMarginPercent(15);
    setPriceType("withVAT");
    setManualSellingPrice("");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl("");
  };

  // ========== ניהול מארז - הוספת מוצר ==========
  const handleOpenAddPackageRow = () => {
    setPackageAddRows([...packageAddRows, { productId: "", quantity: 1 }]);
  };

  const handleCancelAddPackageRow = (idx) => {
    setPackageAddRows(packageAddRows.filter((_, i) => i !== idx));
  };

  const handleConfirmAddPackageRow = (idx) => {
    const row = packageAddRows[idx];
    if (!row.productId || !row.quantity) return;
    
    const recipe = recipes.find(r => r.id === Number(row.productId));
    setPackageItems([...packageItems, {
      productId: row.productId,
      name: recipe?.name || "",
      quantity: row.quantity
    }]);
    setPackageAddRows(packageAddRows.filter((_, i) => i !== idx));
  };

  const handleStartEditPackage = (idx) => {
    setEditingPackageIdx(idx);
    setEditingPackageProductId(packageItems[idx].productId.toString());
    setEditingPackageQuantity(packageItems[idx].quantity.toString());
  };

  const handleSaveEditPackage = (idx) => {
    const recipe = recipes.find(r => r.id === Number(editingPackageProductId));
    const newItems = [...packageItems];
    newItems[idx] = {
      productId: editingPackageProductId,
      name: recipe?.name || "",
      quantity: parseInt(editingPackageQuantity) || 1
    };
    setPackageItems(newItems);
    setEditingPackageIdx(null);
  };

  const handleCancelEditPackage = () => {
    setEditingPackageIdx(null);
    setEditingPackageProductId("");
    setEditingPackageQuantity("");
  };

  const handleRemovePackageItem = (idx) => {
    setPackageItems(packageItems.filter((_, i) => i !== idx));
  };

  // ========== ניהול עליות נוספות - הוספת אריזה ==========
  const handleOpenAddPackagingRow = () => {
    setPackagingAddRows([...packagingAddRows, { packagingId: "", quantity: 1 }]);
  };

  const handleCancelAddPackagingRow = (idx) => {
    setPackagingAddRows(packagingAddRows.filter((_, i) => i !== idx));
  };

  const handleConfirmAddPackagingRow = (idx) => {
    const row = packagingAddRows[idx];
    if (!row.packagingId || !row.quantity) return;
    
    const pack = packaging.find(p => p.id === Number(row.packagingId));
    setAdditionalPackaging([...additionalPackaging, {
      packagingId: row.packagingId,
      name: pack?.name || "",
      cost: pack?.cost || 0,
      quantity: row.quantity
    }]);
    setPackagingAddRows(packagingAddRows.filter((_, i) => i !== idx));
  };

  const handleStartEditPackaging = (idx) => {
    setEditingPackagingIdx(idx);
    setEditingPackagingId(additionalPackaging[idx].packagingId.toString());
    setEditingPackagingQuantity(additionalPackaging[idx].quantity.toString());
  };

  const handleSaveEditPackaging = (idx) => {
    const pack = packaging.find(p => p.id === Number(editingPackagingId));
    const newItems = [...additionalPackaging];
    newItems[idx] = {
      packagingId: editingPackagingId,
      name: pack?.name || "",
      cost: pack?.cost || 0,
      quantity: parseInt(editingPackagingQuantity) || 1
    };
    setAdditionalPackaging(newItems);
    setEditingPackagingIdx(null);
  };

  const handleCancelEditPackaging = () => {
    setEditingPackagingIdx(null);
    setEditingPackagingId("");
    setEditingPackagingQuantity("");
  };

  const handleRemovePackaging = (idx) => {
    setAdditionalPackaging(additionalPackaging.filter((_, i) => i !== idx));
  };

  // ========== ניהול תמונה ==========
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (!isEdit) {
      setExistingImageUrl("");
    }
  };

  // TODO: פונקציה ליצירת תמונה עם AI (להמשך)
  const handleGenerateWithAI = () => {
    console.log('🤖 יצירת תמונה עם AI - תכונה עתידית');
    // כאן בעתיד נוסיף קריאה ל-API של יצירת תמונות AI
    // לדוגמה: DALL-E, Midjourney, Stable Diffusion וכו'
  };

  // ========== ניהול הוספת מוצר אריזה חדש ==========
  const handleSaveNewPackaging = async (newPackaging) => {
    if (onAddPackaging) {
      await onAddPackaging(newPackaging);
    }
    setIsPackagingDialogOpen(false);
  };

  // ========== ניהול קטגוריה ==========
  const handleCategoryChange = (value) => {
    setCategory(value);
    setShowCustomCategory(value === "אחר");
    if (value !== "אחר") {
      setCustomCategory("");
    }
  };

  // ========== חישוב מחירים (לצורך תצוגה בלבד) ==========
  // ========== עוזרים לחישוב עלויות ==========
  const getRecipeById = (id) => {
    const recipe = recipes.find(r => Number(r.id ?? r.Id) === Number(id));
    if (recipe) {
      console.log(`🔍 Recipe ${recipe.name || recipe.Name}:`, {
        id: recipe.id || recipe.Id,
        totalCost: recipe.totalCost || recipe.TotalCost,
        costPerUnit: recipe.costPerUnit || recipe.CostPerUnit,
        ingredientsCost: recipe.ingredientsCost || recipe.IngredientsCost,
        outputUnits: recipe.outputUnits || recipe.OutputUnits,
        laborCost: recipe.laborCost || recipe.LaborCost,
        overheadCost: recipe.overheadCost || recipe.OverheadCost,
      });
    }
    return recipe;
  };
  
  const getPackagingById = (id) => packaging.find(p => Number(p.id ?? p.Id) === Number(id));

  const calculatedPrices = useMemo(() => {
    let baseCost = 0;
    let packagingLaborCost = 0;
    let packagingOverheadCost = 0;
    let totalCost = 0;
    let hasItems = false;

    // חישוב עלות מתכונים
    if (productType === "single" && selectedRecipeId) {
      hasItems = true;
      const recipe = getRecipeById(selectedRecipeId);
      if (recipe) {
        // TotalCost הוא עלות כל המתכון
        // recipeUnits הוא כמה יחידות המתכון עושה
        // ולכן עלות ליחידה = TotalCost / OutputUnits
        const recipeTotalCost = recipe.TotalCost ?? recipe.totalCost ?? 0;
        const recipeOutputUnits = recipe.OutputUnits ?? recipe.outputUnits ?? 1;
        const recipeName = recipe.Name ?? recipe.name ?? "";
        const costPerUnit = recipeTotalCost / recipeOutputUnits;
        
        console.log(`💰 Single Recipe Cost:`, {
          name: recipeName,
          totalCost: recipeTotalCost,
          outputUnits: recipeOutputUnits,
          costPerUnit: costPerUnit
        });
        
        baseCost = costPerUnit > 0 ? costPerUnit : 0;
      }
    } else if (productType === "package" && packageItems.length > 0) {
      hasItems = true;
      // סכום עלויות כל המתכונים במארז
      packageItems.forEach(item => {
        const recipe = getRecipeById(item.productId); // productId contains recipeId
        if (recipe) {
          const recipeTotalCost = recipe.TotalCost ?? recipe.totalCost ?? 0;
          const recipeOutputUnits = recipe.OutputUnits ?? recipe.outputUnits ?? 1;
          const recipeName = recipe.Name ?? recipe.name ?? "";
          const costPerUnit = recipeTotalCost / recipeOutputUnits;
          const itemCost = costPerUnit * (item.quantity || 1);
          
          console.log(`💰 Package Item: ${recipeName}`, {
            totalCost: recipeTotalCost,
            outputUnits: recipeOutputUnits,
            costPerUnit: costPerUnit,
            quantity: item.quantity,
            itemCost: itemCost
          });
          
          baseCost += itemCost; // ✅ הוסף את עלות המוצרים למארז
        }
      });
    }

    // הוספת עלויות אריזה
    if (additionalPackaging.length > 0) {
      hasItems = true;
      additionalPackaging.forEach(item => {
        const pack = getPackagingById(item.packagingId);
        if (pack) {
          const packCost = pack.Cost || pack.cost || 0;
          if (packCost > 0) {
            const itemCost = packCost * (item.quantity || 1);
            console.log(`📦 Packaging: ${pack.Name || pack.name}`, {
              costPerUnit: packCost,
              quantity: item.quantity,
              itemCost: itemCost
            });
            baseCost += itemCost;
          }
        }
      });
    }

    // הוספת עלות זמן אריזה (עבודה + תקורה)
    // * ערכים משוערים בקליינט - השרת יחשב בדיוק
    const HOURLY_LABOR = 200; // שקל לשעה (משוער)
    const HOURLY_OVERHEAD = 100; // שקל לשעה (משוער)
    if (packagingTimeMinutes > 0) {
      hasItems = true;
      packagingLaborCost = (packagingTimeMinutes / 60) * HOURLY_LABOR;
      packagingOverheadCost = (packagingTimeMinutes / 60) * HOURLY_OVERHEAD;
      console.log(`⏱️ Packaging Time: ${packagingTimeMinutes} דקות`, {
        packagingTimeMinutes,
        packagingLaborCost: packagingLaborCost.toFixed(2),
        packagingOverheadCost: packagingOverheadCost.toFixed(2)
      });
    }

    // אם אין פריטים בחורים, להציג 0
    if (!hasItems) {
      baseCost = 0;
    }

    // סה"כ עלות = בסיס + עבודה/תקורה
    totalCost = baseCost + packagingLaborCost + packagingOverheadCost;

    console.log(`📊 Final totalCost: ₪${totalCost.toFixed(2)}`);

    const profitAmount = totalCost * (profitMarginPercent / 100);
    const sellingPriceBeforeVAT = totalCost + profitAmount;
    const sellingPriceWithVAT = sellingPriceBeforeVAT * 1.17;

    return {
      baseCost,
      packagingLaborCost,
      packagingOverheadCost,
      totalCost,
      profitAmount,
      sellingPriceBeforeVAT,
      sellingPriceWithVAT,
      hasItems // אם יש פריטים לחישוב או לא
    };
  }, [
    productType,
    selectedRecipeId,
    recipeUnits,
    packageItems,
    additionalPackaging,
    packagingTimeMinutes,
    profitMarginPercent,
    recipes,
    packaging
  ]);

  // ========== בדיקת תקינות ==========
  const isValid = useMemo(() => {
    if (!productName.trim()) return false;
    
    // אם מוצר בודד - חייב לבחור מתכון
    if (productType === "single" && !selectedRecipeId) return false;
    
    // אם מארז - חייבים לפחות פריט אחד עם מוצר נבחר
    if (productType === "package") {
      if (packageItems.length === 0) return false;
      if (packageItems.some(item => !item.productId || item.quantity < 1)) return false;
    }
    
    // קטגוריה
    if (!category) return false;
    if (showCustomCategory && !customCategory.trim()) return false;
    
    // מחיר ידני
    if (priceType === "manual" && (!manualSellingPrice || parseFloat(manualSellingPrice) <= 0)) return false;
    
    return true;
  }, [
    productName,
    productType,
    selectedRecipeId,
    packageItems,
    category,
    showCustomCategory,
    customCategory,
    priceType,
    manualSellingPrice
  ]);

  // ========== שמירה ==========
  const handleSave = async () => {
    setIsSaving(true);
    
    const finalCategory = showCustomCategory ? customCategory : category;
    
    // חישוב המחיר הסופי בהתאם לבחירה
    let sellingPrice;
    if (priceType === "manual") {
      sellingPrice = parseFloat(manualSellingPrice);
    } else if (priceType === "withVAT") {
      sellingPrice = calculatedPrices.sellingPriceWithVAT;
    } else {
      sellingPrice = calculatedPrices.sellingPriceBeforeVAT;
    }
    
    const productData = {
      name: productName,
      productType,
      description,
      category: finalCategory,
      profitMarginPercent: profitMarginPercent / 100,
      manualSellingPrice: sellingPrice,
      priceType: priceType,
      packagingTimeMinutes: parseInt(packagingTimeMinutes) || 0,
      imageFile: imageFile  // נוסיף את התמונה
    };

    if (productType === "single") {
      productData.recipeId = parseInt(selectedRecipeId);
      productData.recipeUnits = parseInt(recipeUnits);
    } else {
      productData.packageItems = packageItems.map(item => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity)
      }));
    }

    if (additionalPackaging.length > 0) {
      productData.additionalPackaging = additionalPackaging
        .filter(p => p.packagingId)
        .map(item => ({
          packagingId: parseInt(item.packagingId),
          quantity: parseInt(item.quantity) || 1
        }));
    }

    try {
      await onSave(productData);
      alert(isEdit ? "✅ המוצר עודכן בהצלחה!" : "✅ המוצר נשמר בהצלחה!");
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("❌ שגיאה בשמירת המוצר");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setIsCreatingNew(true);
    onClose();
  };

  const handleEditProduct = (product) => {
    setIsCreatingNew(false);
    // קרא ל-callback אם קיים
    if (onEditProduct) {
      onEditProduct(product);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("האם למחוק את המוצר?")) {
      if (onDelete) {
        onDelete(productId);
      }
    }
  };

  const isEdit = !!(initialValues && initialValues.id);
  const title = isEdit ? "ערוך מוצר" : "הוסף מוצר חדש";
  
  // תמיד נציג את הטופס (לא את הרשימה)
  const showEditForm = true;

  return (
    <>
      <BaseDialog
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        title={title}
        strings={strings}
        isValid={isValid}
        isSaving={isSaving}
        maxWidth="sm"
        showActions={true}
      >
        {/* ========== טופס מוצר ========== */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ========== מידע בסיסי ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            מידע בסיסי
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="שם המוצר"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              fullWidth
              required
              placeholder="לדוגמה: עוגת יום הולדת"
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
            />
            <TextField
              label="תיאור"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="תיאור קצר של המוצר"
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
            />
          </Box>
        </Box>

        <Divider />

        {/* ========== תמונה ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            תמונת מוצר
          </Typography>
          
          {/* תצוגת תמונה קיימת או preview */}
          {(imagePreview || existingImageUrl) && (
            <Card sx={{ maxWidth: 300, mb: 2, borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="200"
                image={imagePreview || existingImageUrl}
                alt="תמונת מוצר"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  onClick={handleRemoveImage}
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                >
                  הסר תמונה
                </Button>
              </CardContent>
            </Card>
          )}

          {/* כפתורי העלאה */}
          {!imagePreview && !existingImageUrl && (
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: '#C98929',
                  color: '#C98929',
                  '&:hover': {
                    borderColor: '#9B5A25',
                    backgroundColor: 'rgba(201, 137, 41, 0.04)'
                  },
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                העלה תמונה
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>

              {/* כפתור AI - מושבת לעת עתה */}
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerateWithAI}
                disabled
                sx={{
                  borderColor: '#9C27B0',
                  color: '#9C27B0',
                  '&:hover': {
                    borderColor: '#7B1FA2',
                    backgroundColor: 'rgba(156, 39, 176, 0.04)'
                  },
                  borderRadius: 2,
                  py: 1.5,
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                צור תמונה עם AI (בקרוב)
                <Chip
                  label="בקרוב"
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: '#e0e0e0',
                    color: '#666',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              </Button>

              <Typography variant="caption" sx={{ color: '#666', textAlign: 'center' }}>
                בעתיד: צור תמונה אוטומטית באמצעות בינה מלאכותית
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        {/* ========== סוג מוצר ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            סוג מוצר
          </Typography>
          <TextField
            select
            value={productType}
            onChange={e => setProductType(e.target.value)}
            fullWidth
            sx={{ bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="single">מוצר בודד</MenuItem>
            <MenuItem value="package">מארז</MenuItem>
          </TextField>
        </Box>

        {/* ========== מוצר בודד - בחירת מוצר ========== */}
        {productType === "single" && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
              בחר מוצר
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="מוצר (מתכון)"
                value={selectedRecipeId}
                onChange={e => setSelectedRecipeId(e.target.value)}
                fullWidth
                required
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>בחר מוצר...</em>
                </MenuItem>
                {recipes.map(recipe => (
                  <MenuItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box>
                <TextField
                  label="כמה יחידות המתכון עושה"
                  type="number"
                  value={recipeUnits}
                  onChange={e => setRecipeUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  sx={{ bgcolor: '#fff', borderRadius: 2 }}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  helperText="לדוגמה: מתכון עוגה עושה 12 פרוסות, אז כתוב 12"
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* ========== מארז - בחירת מוצרים ========== */}
        {productType === "package" && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B5B4B' }}>
                מוצרים במארז
              </Typography>
              <Button
                startIcon={<AddIcon sx={{ mr: 1 }} />}
                onClick={handleOpenAddPackageRow}
                size="small"
                sx={{ color: '#C98929' }}
              >
                הוסף מוצר
              </Button>
            </Box>

            {/* שורות הוספה */}
            {packageAddRows.map((addRow, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  mb: 2,
                  bgcolor: '#FFF3E0',
                  borderRadius: 3
                }}
              >
                <IconButton onClick={() => handleCancelAddPackageRow(idx)} sx={{ color: '#D32F2F' }}>
                  <CloseIcon />
                </IconButton>

                <TextField
                  select
                  value={addRow.productId || ''}
                  onChange={e => {
                    const newRows = [...packageAddRows];
                    newRows[idx].productId = e.target.value;
                    setPackageAddRows(newRows);
                  }}
                  placeholder="בחר מתכון"
                  sx={{ flex: 2, bgcolor: '#fff', borderRadius: 2 }}
                  size="small"
                >
                  <MenuItem value="">
                    <em>בחר מתכון...</em>
                  </MenuItem>
                  {recipes.map(recipe => (
                    <MenuItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="number"
                  value={addRow.quantity}
                  onChange={e => {
                    const newRows = [...packageAddRows];
                    newRows[idx].quantity = e.target.value;
                    setPackageAddRows(newRows);
                  }}
                  placeholder="כמות"
                  sx={{ width: 100, bgcolor: '#fff', borderRadius: 2 }}
                  size="small"
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />

                <IconButton onClick={() => handleConfirmAddPackageRow(idx)} sx={{ color: '#C98929' }}>
                  <AddIcon />
                </IconButton>
              </Paper>
            ))}

            {/* רשימת מוצרים קיימים */}
            {packageItems.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                  מוצרים שנוספו:
                </Typography>
                {packageItems.map((item, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#E8D4C4',
                      borderRadius: 2
                    }}
                  >
                    {editingPackageIdx === idx ? (
                      // מצב עריכה
                      <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
                        <TextField
                          select
                          value={editingPackageProductId}
                          onChange={e => setEditingPackageProductId(e.target.value)}
                          size="small"
                          sx={{ flex: 2 }}
                        >
                          {recipes.map(recipe => (
                            <MenuItem key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          type="number"
                          value={editingPackageQuantity}
                          onChange={e => setEditingPackageQuantity(e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          InputProps={{
                            inputProps: { min: 1 }
                          }}
                        />
                        <IconButton onClick={() => handleSaveEditPackage(idx)} sx={{ color: 'green' }}>
                          <CheckIcon />
                        </IconButton>
                        <IconButton onClick={handleCancelEditPackage} sx={{ color: '#D32F2F' }}>
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      // מצב צפייה
                      <>
                        {(() => {
                          const recipe = getRecipeById(item.productId);
                          if (recipe) {
                            const recipeTotalCost = recipe.TotalCost ?? recipe.totalCost ?? 0;
                            const recipeOutputUnits = recipe.OutputUnits ?? recipe.outputUnits ?? 1;
                            const costPerUnit = recipeTotalCost / recipeOutputUnits;
                            const itemCost = costPerUnit * (item.quantity || 1);
                            return (
                              <Typography sx={{ flex: 1, color: '#5D4037' }}>
                                {item.name} - {item.quantity} יחידות (₪{itemCost.toFixed(2)})
                              </Typography>
                            );
                          }
                          return (
                            <Typography sx={{ flex: 1, color: '#5D4037' }}>
                              {item.name} - {item.quantity} יחידות
                            </Typography>
                          );
                        })()}
                        <IconButton onClick={() => handleStartEditPackage(idx)} sx={{ color: '#5D4037' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleRemovePackageItem(idx)} sx={{ color: '#D32F2F' }}>
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                  </Paper>
                ))}
              </Box>
            )}

            {packageItems.length === 0 && packageAddRows.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                לחץ על "הוסף מוצר" כדי להוסיף מתכונים למארז
              </Alert>
            )}
          </Box>
        )}

        <Divider />

        {/* ========== קטגוריה ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            קטגוריה
          </Typography>
          <TextField
            select
            label="בחר קטגוריה"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            fullWidth
            required
            sx={{ bgcolor: '#fff', borderRadius: 2 }}
          >
            <MenuItem value="">
              <em>בחר קטגוריה...</em>
            </MenuItem>
            {predefinedCategories.map(cat => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
          
          {showCustomCategory && (
            <TextField
              label="הזן קטגוריה חדשה"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              fullWidth
              required
              sx={{ bgcolor: '#fff', borderRadius: 2, mt: 2 }}
              placeholder="לדוגמה: מארז ראש השנה"
            />
          )}
        </Box>

        <Divider />

        {/* ========== עלויות נוספות ========== */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B5B4B' }}>
              עלויות נוספות
            </Typography>
          </Box>

          {/* זמן עבודה לאריזה */}
          <TextField
            label="זמן עבודה לאריזה (דקות)"
            type="number"
            value={packagingTimeMinutes}
            onChange={e => setPackagingTimeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
            fullWidth
            sx={{ bgcolor: '#fff', borderRadius: 2, mb: 2 }}
            InputProps={{
              inputProps: { min: 0 }
            }}
          />

          <Button
            startIcon={<AddIcon sx={{ mr: 1 }} />}
            onClick={handleOpenAddPackagingRow}
            size="small"
            sx={{ color: '#C98929', mb: 2 }}
          >
            הוסף אריזה
          </Button>

          {/* שורות הוספת אריזה */}
          {packagingAddRows.map((addRow, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                mb: 2,
                bgcolor: '#FFF3E0',
                borderRadius: 3
              }}
            >
              <IconButton onClick={() => handleCancelAddPackagingRow(idx)} sx={{ color: '#D32F2F' }}>
                <CloseIcon />
              </IconButton>

              <Box sx={{ display: 'flex', gap: 1, flex: 2, alignItems: 'center' }}>
                <TextField
                  select
                  value={addRow.packagingId || ''}
                  onChange={e => {
                    const newRows = [...packagingAddRows];
                    newRows[idx].packagingId = e.target.value;
                    setPackagingAddRows(newRows);
                  }}
                  placeholder="בחר מוצר אריזה"
                  sx={{ flex: 1, bgcolor: '#fff', borderRadius: 2 }}
                  size="small"
                >
                  <MenuItem value="">
                    <em>בחר מוצר אריזה...</em>
                  </MenuItem>
                  {packaging.map(pack => (
                    <MenuItem key={pack.id} value={pack.id}>
                      {pack.name} (₪{pack.cost?.toFixed(2) || '0.00'})
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  onClick={() => setIsPackagingDialogOpen(true)}
                  sx={{
                    color: '#C98929',
                    bgcolor: '#fff',
                    border: '1px solid #C98929',
                    '&:hover': {
                      bgcolor: '#FFF3E0'
                    }
                  }}
                  size="small"
                >
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              <TextField
                type="number"
                value={addRow.quantity}
                onChange={e => {
                  const newRows = [...packagingAddRows];
                  newRows[idx].quantity = e.target.value;
                  setPackagingAddRows(newRows);
                }}
                placeholder="כמות"
                sx={{ width: 100, bgcolor: '#fff', borderRadius: 2 }}
                size="small"
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />

              <IconButton onClick={() => handleConfirmAddPackagingRow(idx)} sx={{ color: '#C98929' }}>
                <AddIcon />
              </IconButton>
            </Paper>
          ))}

          {/* רשימת מוצרי אריזה קיימים */}
          {additionalPackaging.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                מוצרי אריזה שנוספו:
              </Typography>
              {additionalPackaging.map((item, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#E8D4C4',
                    borderRadius: 2
                  }}
                >
                  {editingPackagingIdx === idx ? (
                    // מצב עריכה
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, flex: 2, alignItems: 'center' }}>
                        <TextField
                          select
                          value={editingPackagingId}
                          onChange={e => setEditingPackagingId(e.target.value)}
                          size="small"
                          sx={{ flex: 1 }}
                        >
                          {packaging.map(pack => (
                            <MenuItem key={pack.id} value={pack.id}>
                              {pack.name} (₪{pack.cost?.toFixed(2) || '0.00'})
                            </MenuItem>
                          ))}
                        </TextField>
                        <IconButton
                          onClick={() => setIsPackagingDialogOpen(true)}
                          sx={{ color: '#C98929' }}
                          size="small"
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        type="number"
                        value={editingPackagingQuantity}
                        onChange={e => setEditingPackagingQuantity(e.target.value)}
                        size="small"
                        sx={{ width: 100 }}
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                      />
                      <IconButton onClick={() => handleSaveEditPackaging(idx)} sx={{ color: 'green' }}>
                        <CheckIcon />
                      </IconButton>
                      <IconButton onClick={handleCancelEditPackaging} sx={{ color: '#D32F2F' }}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    // מצב צפייה
                    <>
                      <Typography sx={{ flex: 1, color: '#5D4037' }}>
                        {item.name} - {item.quantity} יחידות (₪{(item.cost * item.quantity).toFixed(2)})
                      </Typography>
                      <IconButton onClick={() => handleStartEditPackaging(idx)} sx={{ color: '#5D4037' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleRemovePackaging(idx)} sx={{ color: '#D32F2F' }}>
                        <CloseIcon />
                      </IconButton>
                    </>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        {/* ========== תמחור ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            תמחור
          </Typography>

          {/* מחיר עלות (תצוגה בלבד - יחושב בשרת) */}
          <Box sx={{ bgcolor: '#FFF3E0', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 2, fontWeight: 600 }}>
              💰 פירוט עלויות (משוער - החישוב המדויק בשרת):
            </Typography>
            {calculatedPrices.hasItems ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* עלות בסיסית */}
                <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #C98929' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#5D4037', mb: 0.5 }}>
                    📦 עלות בסיסית (מוצר + אריזה חומרים):
                  </Typography>
                  <Typography variant="body2">
                    ₪{calculatedPrices.baseCost?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>

                {/* עלות אריזה/עבודה */}
                {calculatedPrices.packagingLaborCost > 0 && (
                  <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #FF9800' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#E65100', mb: 0.5 }}>
                      ⏱️ עלות זמן אריזה/עבודה ({packagingTimeMinutes} דקות):
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 1 }}>
                      עבודה: ₪{calculatedPrices.packagingLaborCost?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 1 }}>
                      תקורה: ₪{calculatedPrices.packagingOverheadCost?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                )}

                {/* סה"כ עלות */}
                <Box sx={{ bgcolor: '#E8D4C4', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #8B4513' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#5D4037' }}>
                    🔢 סה"כ עלות מוצר: ₪{calculatedPrices.totalCost.toFixed(2)}
                  </Typography>
                </Box>

                {/* תמחור סופי */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>רווח ({profitMarginPercent}%):</strong> ₪{calculatedPrices.profitAmount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>מחיר בלי מע"מ:</strong> ₪{calculatedPrices.sellingPriceBeforeVAT.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#D7CCC8', p: 1, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#3E2723' }}>
                    💵 מחיר מכירה סופי (עם מע"מ): ₪{calculatedPrices.sellingPriceWithVAT.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                {productType === 'single' 
                  ? '← בחר מתכון כדי לראות חישוב עלויות' 
                  : '← הוסף מוצרים/אריזה כדי לראות חישוב עלויות'}
              </Typography>
            )}
          </Box>

          {/* אחוז רווח */}
          <TextField
            label="אחוז רווח מומלץ (%)"
            type="number"
            value={profitMarginPercent}
            onChange={e => setProfitMarginPercent(Math.max(0, parseFloat(e.target.value) || 0))}
            fullWidth
            sx={{ bgcolor: '#fff', borderRadius: 2, mb: 2 }}
            InputProps={{
              inputProps: { min: 0, step: 0.5 }
            }}
          />

          {/* בחירת סוג מחיר */}
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#7B5B4B', mb: 1 }}>
              בחר סוג מחיר
            </Typography>
            <RadioGroup
              value={priceType}
              onChange={e => setPriceType(e.target.value)}
              sx={{ ml: 1 }}
            >
              <FormControlLabel
                value="withVAT"
                control={
                  <Radio
                    sx={{
                      color: '#C98929',
                      '&.Mui-checked': {
                        color: '#C98929',
                      }
                    }}
                  />
                }
                label={`מחיר עם מע"מ (מומלץ): ₪${calculatedPrices.sellingPriceWithVAT?.toFixed(2) || '0.00'}`}
              />
              <FormControlLabel
                value="withoutVAT"
                control={
                  <Radio
                    sx={{
                      color: '#C98929',
                      '&.Mui-checked': {
                        color: '#C98929',
                      }
                    }}
                  />
                }
                label={`מחיר בלי מע"מ: ₪${calculatedPrices.sellingPriceBeforeVAT?.toFixed(2) || '0.00'}`}
              />
              <FormControlLabel
                value="manual"
                control={
                  <Radio
                    sx={{
                      color: '#C98929',
                      '&.Mui-checked': {
                        color: '#C98929',
                      }
                    }}
                  />
                }
                label="קבע מחיר ידני"
              />
            </RadioGroup>
          </FormControl>

          {priceType === "manual" && (
            <TextField
              label='מחיר מכירה ידני (כולל מע"מ)'
              type="number"
              value={manualSellingPrice}
              onChange={e => setManualSellingPrice(e.target.value)}
              fullWidth
              required
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
            />
          )}
        </Box>
        </Box>
    </BaseDialog>

    {/* Packaging Dialog */}
    <PackagingDialog
      open={isPackagingDialogOpen}
      onClose={() => setIsPackagingDialogOpen(false)}
      onSave={handleSaveNewPackaging}
      strings={strings}
    />
    </>
  );
}
