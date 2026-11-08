import { Calculator, BookPlus, PackagePlus, Wheat } from 'lucide-react';

/**
 * Dashboard shortcuts to existing pages and workflows only. The pages do not open their dialogs
 * from a link yet, so each card says which button to use once there.
 */
export const QUICK_ACTIONS = [
  { id: 'price-product', title: 'תמחור מוצר', hint: 'בחירת מוצר ועדכון עלות ומחיר מכירה', path: '/products', icon: Calculator, primary: true },
  { id: 'add-recipe', title: 'הוספת מתכון', hint: 'במסך המתכונים: "מתכון חדש"', path: '/recipes', icon: BookPlus },
  { id: 'add-product', title: 'הוספת מוצר', hint: 'במסך המוצרים: "הוסף מוצר"', path: '/products', icon: PackagePlus },
  { id: 'manage-ingredients', title: 'ניהול חומרי גלם', hint: 'מחירי קנייה ומלאי', path: '/ingredients', icon: Wheat },
];
