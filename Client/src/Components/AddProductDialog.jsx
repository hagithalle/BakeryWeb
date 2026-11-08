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
import deleteIconSvg from '../assets/icons/actions/delete-icon.svg';
import editIconSvg   from '../assets/icons/actions/edit-icon.svg';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import BaseDialog from "./BaseDialog";
import PackagingDialog from "./PackagingDialog";
import { UnitTypeLabels } from "../utils/unitEnums";
import { previewProductCost } from "../Services/productService";
import {
  withPackagingDetails,
  withRecipeNames,
  packagingLineCost,
  formatMoney,
  toSavedPackageItems,
  toSavedPackagingItems,
} from "../utils/productForm";
import { resolveImageUrl } from "../utils/imageUrl";
import { PREDEFINED_PRODUCT_CATEGORIES, categoryFormState, categoryFromForm } from "../utils/productCategory";
import {
  PricingMode,
  initialPricingState,
  confirmLegacy,
  pricingFields,
  pricingIsValid,
  formatMoneyOrDash,
  formatPercentOrDash,
  vatSummary,
} from "../utils/pricingForm";

// אחד משלושת הערכים העיקריים בתמחור
function PricingFigure({ label, value, note = null, negative = false }) {
  return (
    <Box sx={{ bgcolor: '#fff', p: 1.5, borderRadius: 2, border: '1px solid #EADBC8', textAlign: 'center' }}>
      <Typography variant="caption" sx={{ color: '#7B5B4B', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: negative ? '#C62828' : '#3E2723' }}>{value}</Typography>
      {note && <Typography variant="caption" sx={{ color: '#777' }}>{note}</Typography>}
    </Box>
  );
}

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
  const [selectedRecipeData, setSelectedRecipeData] = useState(null);  // שמירת נתוני המתכון (outputUnits, outputUnitType)
  
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
  // תמחור: מצב (ידני / לפי אחוז / מומלץ; null = מחיר ישן שלא אושר), מחיר ידני ואחוז תוספת של המוצר
  const [pricingState, setPricingState] = useState(() => initialPricingState(null));
  
  // ========== תמונה ==========
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  
  // ========== מצבים ==========
  const [isSaving, setIsSaving] = useState(false);
  const [isPackagingDialogOpen, setIsPackagingDialogOpen] = useState(false);

  // ========== קטגוריות מוגדרות מראש ==========
  const predefinedCategories = PREDEFINED_PRODUCT_CATEGORIES;

  // ========== אתחול ערכים ==========
  useEffect(() => {
    if (initialValues) {
      setProductName(initialValues.name || "");
      setProductType(initialValues.productType || "single");
      setDescription(initialValues.description || "");
      setSelectedRecipeId(initialValues.recipeId || "");
      setRecipeUnits(initialValues.recipeUnits || initialValues.unitConversionRate || 1);
      setPackageItems(initialValues.packageItems || []);
      // A stored custom category (not one of the options) opens as "אחר" + its text, instead of
      // an empty dropdown that hid the value (see utils/productCategory.js).
      const categoryState = categoryFormState(initialValues.category);
      setCategory(categoryState.category);
      setCustomCategory(categoryState.customCategory);
      setShowCustomCategory(categoryState.showCustomCategory);
      setAdditionalPackaging(initialValues.additionalPackaging || []);
      setPackagingTimeMinutes(initialValues.packagingTimeMinutes || 0);
      setPricingState(initialPricingState(initialValues));
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
    setSelectedRecipeData(null);
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
    setPricingState(initialPricingState(null));
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
    setEditingPackageProductId(String(packageItems[idx].productId ?? ""));
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
    setEditingPackagingId(String(additionalPackaging[idx].packagingId ?? ""));
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

  // ========== תצוגת פריטים: שם ועלות עדכניים מרשימות המתכונים והאריזות ==========
  const packageItemsView = useMemo(() => withRecipeNames(packageItems, recipes), [packageItems, recipes]);
  const additionalPackagingView = useMemo(
    () => withPackagingDetails(additionalPackaging, packaging),
    [additionalPackaging, packaging]
  );

  // ========== עלויות מהשרת ==========
  // העלות מחושבת בשרת (אותו חישוב כמו במוצר שמור: מתכוני בסיס, עבודה, תקורה ואריזה – כל אחד פעם אחת).
  const costDraft = useMemo(() => {
    const isPackage = productType === "package";
    const items = isPackage
      ? packageItems
          .map(item => ({ recipeId: Number(item.productId ?? item.recipeId), quantity: Number(item.quantity) || 1 }))
          .filter(item => item.recipeId > 0)
      : [];
    const extras = additionalPackaging
      .map(item => ({ packagingId: Number(item.packagingId), quantity: Number(item.quantity) || 1 }))
      .filter(item => item.packagingId > 0);
    const minutes = parseInt(packagingTimeMinutes) || 0;
    const hasItems = isPackage ? items.length > 0 : !!selectedRecipeId;
    if (!hasItems && extras.length === 0 && minutes === 0) return null;
    return {
      productType: isPackage ? 1 : 0,
      recipeId: isPackage ? null : Number(selectedRecipeId) || null,
      recipeUnits: parseInt(recipeUnits) || 1,
      packageItems: items,
      additionalPackaging: extras,
      packagingTimeMinutes: minutes,
      ...pricingFields(pricingState),
    };
  }, [productType, selectedRecipeId, recipeUnits, packageItems, additionalPackaging, packagingTimeMinutes, pricingState]);

  // התוצאה נשמרת יחד עם הטיוטה שעבורה חושבה, כך שתוצאה ישנה לעולם לא מוצגת
  const draftKey = costDraft ? JSON.stringify(costDraft) : null;
  const [preview, setPreview] = useState({ key: null, result: null, failed: false });

  useEffect(() => {
    if (!draftKey) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      previewProductCost(JSON.parse(draftKey))
        .then(result => { if (!cancelled) setPreview({ key: draftKey, result, failed: false }); })
        .catch(() => { if (!cancelled) setPreview({ key: draftKey, result: null, failed: true }); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [draftKey]);

  const costPreview = preview.key === draftKey ? preview.result : null;
  const costPreviewFailed = preview.key === draftKey && preview.failed;

  const calculatedPrices = useMemo(() => {
    const hasItems = !!costDraft;
    const ready = hasItems && !!costPreview;
    const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

    // עלות בסיסית = חלק המתכונים (כולל מתכוני בסיס) + חומרי אריזה
    const baseCost = ready ? num(costPreview.recipeCost) + num(costPreview.packagingCost) : 0;
    const packagingLaborCost = ready ? num(costPreview.packagingLaborCost) : 0;
    const packagingOverheadCost = ready ? num(costPreview.packagingOverheadCost) : 0;
    const totalCost = ready ? num(costPreview.totalCost) : 0;

    return {
      baseCost,
      packagingLaborCost,
      packagingOverheadCost,
      totalCost,
      hasItems, // אם יש פריטים לחישוב או לא
      ready,
      warnings: ready ? costPreview.warnings || [] : [],
      // מחיר, מע"מ ורווח – מחושבים בשרת בלבד
      pricing: ready ? costPreview.pricing || null : null,
    };
  }, [costDraft, costPreview]);

  const pricing = calculatedPrices.pricing;
  const legacyReview = pricingState.mode === null ? pricing?.legacy ?? null : null;
  const pricingIssues = (pricing?.issues || []).filter(
    (issue) => !["VatStatusNotSet", "LegacyPriceNotConfirmed"].includes(issue.code)
  );

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
    
    // תמחור (מחיר ידני חיובי, אחוז תוספת תקין)
    if (!pricingIsValid(pricingState)) return false;
    
    return true;
  }, [
    productName,
    productType,
    selectedRecipeId,
    packageItems,
    category,
    showCustomCategory,
    customCategory,
    pricingState
  ]);

  // ========== שמירה ==========
  const handleSave = async () => {
    setIsSaving(true);
    
    const finalCategory = categoryFromForm({ category, customCategory, showCustomCategory });
    
    const productData = {
      name: productName,
      productType,
      description,
      category: finalCategory,
      ...pricingFields(pricingState),
      packagingTimeMinutes: parseInt(packagingTimeMinutes) || 0,
      imageFile: imageFile  // נוסיף את התמונה
    };

    if (productType === "single") {
      productData.recipeId = parseInt(selectedRecipeId);
      productData.recipeUnits = parseInt(recipeUnits);
      // בלי בחירה מחדש של המתכון נשמר סוג יחידת המכירה הקיים
      productData.saleUnitType = selectedRecipeData?.outputUnitType ?? initialValues?.saleUnitType ?? 0;
    } else {
      productData.packageItems = toSavedPackageItems(packageItems);
    }

    if (additionalPackaging.length > 0) {
      productData.additionalPackaging = toSavedPackagingItems(additionalPackaging);
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
                image={imagePreview || resolveImageUrl(existingImageUrl)}
                alt="תמונת מוצר"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  onClick={handleRemoveImage}
                  size="small"
                  startIcon={<Box component="img" src={deleteIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />}
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
              בחר מתכון
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="מתכון"
                value={selectedRecipeId}
                onChange={e => {
                  const recipeId = e.target.value;
                  setSelectedRecipeId(recipeId);
                  if (recipeId) {
                    const recipe = recipes.find(r => (r.id || r.Id) === parseInt(recipeId));
                    if (recipe) {
                      setSelectedRecipeData({
                        outputUnits: recipe.outputUnits || recipe.OutputUnits || 1,
                        outputUnitType: recipe.outputUnitType ?? recipe.OutputUnitType ?? 0,
                        costPerUnit: recipe.costPerUnit || recipe.CostPerUnit || 0
                      });
                    }
                  } else {
                    setSelectedRecipeData(null);
                  }
                }}
                fullWidth
                required
                sx={{ bgcolor: '#fff', borderRadius: 2 }}
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
              
              {/* הצגת מידע מהמתכון - קרא-אונלי */}
              {selectedRecipeData && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#FFF7F2', 
                  borderRadius: 2, 
                  border: '1px solid #D7CCC8'
                }}>
                  <Typography variant="body2" sx={{ color: '#5D4037' }}>
                    <strong>המתכון מייצא:</strong> {selectedRecipeData.outputUnits} {UnitTypeLabels[selectedRecipeData.outputUnitType] || "יחידה"}
                  </Typography>
                  {selectedRecipeData.costPerUnit !== undefined && selectedRecipeData.costPerUnit > 0 && (
                    <Typography variant="body2" sx={{ color: '#5D4037', mt: 1 }}>
                      <strong>עלות ליחידה:</strong> ₪{selectedRecipeData.costPerUnit.toFixed(2)}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* בחירה כמה יחידות רוצה כמוצר */}
              <Box>
                <Typography variant="body2" sx={{ color: '#7B5B4B', mb: 1, fontWeight: 500 }}>
                  כמה יחידות רוצה כמוצר?
                </Typography>
                <TextField
                  label="כמות למוצר"
                  type="number"
                  value={recipeUnits}
                  onChange={e => setRecipeUnits(Math.max(1, parseInt(e.target.value) || 1))}
                  sx={{ bgcolor: '#fff', borderRadius: 2 }}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                  helperText="לדוגמה: אם המתכון עושה 5 עוגות, כתוב 5 בשביל עוגה שלמה או 30 בשביל חתיכות"
                />
              </Box>

              {/* סיכום בחירה - סוג יחידה ועלות */}
              {selectedRecipeData && (
                <Box sx={{
                  p: 2,
                  bgcolor: '#F3E5DB',
                  borderRadius: 2,
                  border: '2px solid #D7CCC8'
                }}>
                  <Typography variant="body2" sx={{ color: '#5D4037', mb: 1 }}>
                    <strong>בחרת:</strong> {recipeUnits} {UnitTypeLabels[selectedRecipeData.outputUnitType] || "יחידה"}
                  </Typography>
                  {selectedRecipeData.costPerUnit !== undefined && selectedRecipeData.costPerUnit > 0 && (
                    <>
                      <Typography variant="body2" sx={{ color: '#5D4037', mb: 0.5 }}>
                        <strong>עלות ליחידה:</strong> ₪{selectedRecipeData.costPerUnit.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#D84315', fontWeight: 700 }}>
                        <strong>סה"כ עלות:</strong> ₪{(selectedRecipeData.costPerUnit * recipeUnits).toFixed(2)}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
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
                {packageItemsView.map((item, idx) => (
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
                          <Box component="img" src={editIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
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
              {additionalPackagingView.map((item, idx) => (
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
                        {item.name || "אריזה"} - {item.quantity} יחידות ({formatMoney(packagingLineCost(item))})
                      </Typography>
                      <IconButton onClick={() => handleStartEditPackaging(idx)} sx={{ color: '#5D4037' }}>
                        <Box component="img" src={editIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
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

        {/* ========== תמחור (כל הסכומים מחושבים בשרת) ========== */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#7B5B4B' }}>
            תמחור
          </Typography>

          {pricing?.issues?.some(issue => issue.code === "VatStatusNotSet") && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              לא נבחר סטטוס מע"מ לעסק, ולכן לא ניתן לחשב מחיר מומלץ ורווח.
              יש לבחור "עוסק פטור" או "עוסק מורשה" בעמוד ניהול עלויות.
            </Alert>
          )}

          {/* מחיר ישן שלא אושר: שום דבר לא משתנה עד שהבעלים בוחרת במפורש */}
          {legacyReview && (
            <Box sx={{ bgcolor: '#FFF8E1', p: 2, borderRadius: 2, mb: 2, borderRight: '4px solid #F9A825' }}>
              <Typography sx={{ fontWeight: 700, color: '#5D4037', mb: 0.5 }}>המחיר של מוצר זה עדיין לא אושר</Typography>
              <Typography variant="body2" sx={{ color: '#5D4037' }}>
                המחיר נשמר לפני שהוגדר אם הוא כולל מע"מ. כרגע מוצג {formatMoneyOrDash(legacyReview.displayedPrice)}
                {legacyReview.storedPrice != null && <> (הערך השמור: {formatMoneyOrDash(legacyReview.storedPrice)})</>}.
                כמה הלקוח משלם בפועל?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                {legacyReview.finalIfStoredIsFinal != null && (
                  <Button variant="outlined" onClick={() => setPricingState(state => confirmLegacy(state, "stored", legacyReview))}>
                    הלקוח משלם {formatMoneyOrDash(legacyReview.finalIfStoredIsFinal)}
                  </Button>
                )}
                {legacyReview.finalIfStoredExcludesVat != null && (
                  <Button variant="outlined" onClick={() => setPricingState(state => confirmLegacy(state, "displayed", legacyReview))}>
                    הלקוח משלם {formatMoneyOrDash(legacyReview.finalIfStoredExcludesVat)}
                  </Button>
                )}
                <Button variant="text" onClick={() => setPricingState(state => confirmLegacy(state, "other", legacyReview))}>
                  מחיר אחר
                </Button>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6D4C41' }}>
                עד לבחירה, שמירת המוצר לא משנה את המחיר.
              </Typography>
            </Box>
          )}

          {/* אופן קביעת המחיר */}
          {pricingState.mode !== null && (
            <>
              <FormControl component="fieldset" sx={{ mb: 1 }}>
                <RadioGroup
                  row
                  value={String(pricingState.mode)}
                  onChange={e => setPricingState(state => ({ ...state, mode: Number(e.target.value) }))}
                >
                  <FormControlLabel value={String(PricingMode.Recommended)} control={<Radio />} label="מחיר מומלץ" />
                  <FormControlLabel value={String(PricingMode.Percentage)} control={<Radio />} label="לפי אחוז תוספת" />
                  <FormControlLabel value={String(PricingMode.Manual)} control={<Radio />} label="מחיר ידני" />
                </RadioGroup>
              </FormControl>

              {pricingState.mode === PricingMode.Manual && (
                <TextField
                  label="מחיר סופי ללקוח"
                  type="number"
                  value={pricingState.manualPrice}
                  onChange={e => setPricingState(state => ({ ...state, manualPrice: e.target.value }))}
                  fullWidth
                  required
                  helperText="הסכום שהלקוח משלם בפועל"
                  sx={{ bgcolor: '#fff', borderRadius: 2, mb: 1 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              )}
              {pricingState.mode === PricingMode.Percentage && (
                <TextField
                  label="תוספת על העלות"
                  type="number"
                  value={pricingState.productMarkupPercent}
                  onChange={e => setPricingState(state => ({ ...state, productMarkupPercent: e.target.value }))}
                  fullWidth
                  helperText="מחיר = עלות × (1 + התוספת), ועוד מע״מ לעוסק מורשה"
                  sx={{ bgcolor: '#fff', borderRadius: 2, mb: 1 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 1000, step: 0.5 }
                  }}
                />
              )}
              {pricingState.mode === PricingMode.Recommended && (
                <Typography variant="body2" sx={{ color: '#6D4C41', mb: 1 }}>
                  עלות × (1 + {formatPercentOrDash(pricing?.appliedMarkup)} תוספת), מעוגל לשקל שלם.
                  את אחוז התוספת משנים בהגדרות העסק.
                </Typography>
              )}
            </>
          )}

          {/* שלושת הערכים העיקריים */}
          {!calculatedPrices.hasItems ? (
            <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic', mt: 1 }}>
              {productType === 'single' ? 'בחרי מתכון כדי לראות עלות ומחיר' : 'הוסיפי מוצרים למארז כדי לראות עלות ומחיר'}
            </Typography>
          ) : !calculatedPrices.ready ? (
            <Typography variant="body2" sx={{ color: costPreviewFailed ? '#C62828' : '#999', mt: 1 }}>
              {costPreviewFailed ? 'לא ניתן לחשב כרגע' : 'מחשב…'}
            </Typography>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mt: 1 }}>
                <PricingFigure label="עלות ייצור" value={formatMoneyOrDash(pricing?.productionCost)} />
                <PricingFigure
                  label={legacyReview ? "מחיר מוצג (לא אושר)" : "מחיר סופי ללקוח"}
                  value={formatMoneyOrDash(pricing?.finalPrice)}
                  note={pricing?.roundedToWholeShekel ? "מעוגל לשקל שלם" : null}
                />
                <PricingFigure
                  label="רווח צפוי"
                  value={formatMoneyOrDash(pricing?.profit)}
                  note={pricing?.profit != null
                    ? `${formatPercentOrDash(pricing.markupOnCost)} על העלות · ${formatPercentOrDash(pricing.marginOnRevenue)} מההכנסה`
                    : null}
                  negative={pricing?.profit != null && pricing.profit < 0}
                />
              </Box>
              {vatSummary(pricing) && (
                <Typography variant="body2" sx={{ mt: 1, color: '#5D4037' }}>{vatSummary(pricing)}</Typography>
              )}
              {pricingIssues.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {pricingIssues.map(issue => (
                    <Typography key={issue.code} variant="caption" sx={{ display: 'block', color: '#6D4C41' }}>• {issue.message}</Typography>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* פירוט עלות הייצור (מהשרת) */}
          {calculatedPrices.ready && (
            <Box sx={{ bgcolor: '#FFF3E0', p: 2, borderRadius: 2, mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#666', mb: 2, fontWeight: 600 }}>
                פירוט עלות הייצור:
              </Typography>
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

                {/* אזהרות על נתונים שעלולים להפוך את העלות לשגויה */}
                {calculatedPrices.warnings.length > 0 && (
                  <Box sx={{ bgcolor: '#FFF8E1', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #F9A825' }}>
                    {[...new Set(calculatedPrices.warnings.map(w => w.message))].map(message => (
                      <Typography key={message} variant="body2" sx={{ color: '#6D4C41' }}>⚠️ {message}</Typography>
                    ))}
                  </Box>
                )}

                {/* סה"כ עלות */}
                <Box sx={{ bgcolor: '#E8D4C4', p: 1.5, borderRadius: 1.5, borderLeft: '4px solid #8B4513' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#5D4037' }}>
                    🔢 סה"כ עלות מוצר: ₪{calculatedPrices.totalCost.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
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
