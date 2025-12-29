import { useMemo } from "react";


// Example: pass 'he' or 'en' as lang
const STRINGS = {
  he: {
    direction: "rtl",
    sidebar: {
      ingredients: "חומרי גלם",
      recipes: "מתכונים",
      products: "מוצרים",
      packaging: "מוצרי אריזה"
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
      categoryValues: {
        Dry: "יבש",
        Wet: "רטוב",
        Dairy: "מוצרי חלב",
        Frozen: "קפוא",
        Perishable: "מתקלקל",
        NonPerishable: "לא מתקלקל",
        Other: "אחר"
      }
    },
    packaging: {
      cost: "עלות",
      stockUnits: "יחידות במלאי"
    },
    // ...נושאים נוספים
  },
  en: {
    direction: "ltr",
    sidebar: {
      ingredients: "Ingredients",
      recipes: "Recipes",
      products: "Products",
      packaging: "Packaging"
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
      categoryValues: {
        Dry: "Dry",
        Wet: "Wet",
        Dairy: "Dairy",
        Frozen: "Frozen",
        Perishable: "Perishable",
        NonPerishable: "Non-Perishable",
        Other: "Other"
      }
    },
    packaging: {
      cost: "Cost",
      stockUnits: "Stock Units"
    },
    // ...more sections
  }
};

export default function useLocaleStrings(lang = "he") {
  return useMemo(() => STRINGS[lang] || STRINGS["he"], [lang]);
}
