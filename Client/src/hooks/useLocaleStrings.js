import { useMemo } from "react";


// Example: pass 'he' or 'en' as lang
const STRINGS = {
  he: {
    direction: "rtl",
    sidebar: {
      ingredients: "חומרי גלם",
      recipes: "מתכונים",
      products: "מוצרים",
      packaging: "מוצרי אריזה",
      successMessage: "בהצלחה במאפייה!",
      goodDay: "יום טוב"
    },
    titles: {
      home: "דף הבית",
      products: "רשימת מוצרים",
    },
    product: {
      add: "הוסף מוצר",
      edit: "ערוך מוצר",
      delete: "מחק מוצר",
    },
    filter: {
      search: "חפש לפי שם",
      category: "קטגוריה",
      all: "הכל"
    },
    ingredient: {
      add: "הוסף חומר גלם",
      pricePerKg: "מחיר לק",
      stockQuantity: "כמות במלאי",
      stockUnit: "יחידת מלאי",
      duplicateError: "חומר גלם '{name}' כבר קיים במערכת!",
      categoryValues: {
        Dry: "יבש",
        Wet: "רטוב",
        Dairy: "מוצרי חלב",
        Frozen: "קפוא",
        Perishable: "מתקלקל",
        NonPerishable: "לא מתקלקל",
        Other: "אחר"
      },
      unitValues: {
        Kilogram: "קילוגרם",
        Gram: "גרם",
        Liter: "ליטר",
        Milliliter: "מיליליטר",
        Unit: "יחידה",
        Dozen: "תריסר",
        Package: "חבילה",
        Teaspoon: "כפית",
        Tablespoon: "כף",
        Cup: "כוס"
      }
    },
    packaging: {
      cost: "עלות",
      stockUnits: "יחידות במלאי"
    },
    recipeTabs: {
      ingredients: "חומרים",
      steps: "שלבים",
      costs: "עלויות"
    },
      recipeStartDialog: {
        title: "יצירת מתכון חדש",
        howToStart: "איך תרצי להתחיל?",
        cancel: "ביטול",
        options: {
          manualTitle: "ידני",
          manualSubtitle: "יצירת מתכון מאפס",
          importTitle: "ייבוא מתכון",
          importSubtitle: "העלאת קובץ ואיתור אוטומטי",
          aiTitle: "עזרת AI",
          aiSubtitle: "יצירת מתכון לפי תיאור (בקרוב)",
          comingSoon: "בקרוב"
        }
      },
      // ...נושאים נוספים
  },
  en: {
    direction: "ltr",
    sidebar: {
      ingredients: "Ingredients",
      recipes: "Recipes",
      products: "Products",
      packaging: "Packaging",
      successMessage: "Good luck at the bakery!",
      goodDay: "Have a great day"
    },
    titles: {
      home: "Home",
      products: "Product List",
    },
    product: {
      add: "Add Product",
      edit: "Edit Product",
      delete: "Delete Product",
    },
    filter: {
      search: "Search by name",
      category: "Category",
      all: "All"
    },
    ingredient: {
      add: "Add Ingredient",
      pricePerKg: "Price per Kg",
      stockQuantity: "Stock Quantity",
      stockUnit: "Stock Unit",
      duplicateError: "Ingredient '{name}' already exists!",
      categoryValues: {
        Dry: "Dry",
        Wet: "Wet",
        Dairy: "Dairy",
        Frozen: "Frozen",
        Perishable: "Perishable",
        NonPerishable: "Non-Perishable",
        Other: "Other"
      },
      unitValues: {
        Kilogram: "Kilogram",
        Gram: "Gram",
        Liter: "Liter",
        Milliliter: "Milliliter",
        Unit: "Unit",
        Dozen: "Dozen",
        Package: "Package",
        Teaspoon: "Teaspoon",
        Tablespoon: "Tablespoon",
        Cup: "Cup"
      }
    },
    packaging: {
      cost: "Cost",
      stockUnits: "Stock Units"
    },
    recipeTabs: {
      ingredients: "Ingredients",
      steps: "Steps",
      costs: "Costs"
    },
      recipeStartDialog: {
        title: "Create New Recipe",
        howToStart: "How would you like to start?",
        cancel: "Cancel",
        options: {
          manualTitle: "Manual",
          manualSubtitle: "Create a recipe from scratch",
          importTitle: "Import Recipe",
          importSubtitle: "Upload a file and auto-detect",
          aiTitle: "AI Assist",
          aiSubtitle: "Create a recipe from description (soon)",
          comingSoon: "Coming Soon"
        }
      },
      // ...more sections
  }
};

export default function useLocaleStrings(lang = "he") {
  return useMemo(() => STRINGS[lang] || STRINGS["he"], [lang]);
}
