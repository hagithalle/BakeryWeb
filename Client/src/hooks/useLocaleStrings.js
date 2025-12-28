import { useMemo } from "react";


// Example: pass 'he' or 'en' as lang
const STRINGS = {
  he: {
    direction: "rtl",
    sidebar: {
      ingredients: "חומרי גלם",
      recipes: "מתכונים",
      products: "מוצרים",
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
    // ...נושאים נוספים
  },
  en: {
    direction: "ltr",
    sidebar: {
      ingredients: "Ingredients",
      recipes: "Recipes",
      products: "Products",
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
    // ...more sections
  }
};

export default function useLocaleStrings(lang = "he") {
  return useMemo(() => STRINGS[lang] || STRINGS["he"], [lang]);
}
