import dryIcon from '../assets/icons/categories/dry-icon.svg';
import liquidIcon from '../assets/icons/categories/liquid-icon.svg';
import dairyIcon from '../assets/icons/categories/dairy-icon.svg';
import freshIcon from '../assets/icons/categories/fresh-icon.svg';
import frozenIcon from '../assets/icons/categories/frozen-icon.svg';
import snackIcon from '../assets/icons/categories/snack-icon.svg';
import cleaningIcon from '../assets/icons/categories/cleaning-icon.svg';
import pakatingIcon from '../assets/icons/categories/packaging-icon.svg';
import otherIcon from '../assets/icons/categories/other-icon.svg';

const CATEGORY_ICON_MAP = {
  // English keys
  Dry: dryIcon,
  NonPerishable: dryIcon,
  Wet: liquidIcon,
  Liquid: liquidIcon,
  Dairy: dairyIcon,
  Fresh: freshIcon,
  Perishable: freshIcon,
  Frozen: frozenIcon,
  Snack: snackIcon,
  Sweet: snackIcon,
  Cleaning: cleaningIcon,
  Packaging: pakatingIcon,
  Other: otherIcon,
  // Hebrew labels
  'יבש': dryIcon,
  'לא מתקלקל': dryIcon,
  'רטוב': liquidIcon,
  'מוצרי חלב': dairyIcon,
  'מתקלקל': freshIcon,
  'קפוא': frozenIcon,
  'ממתיקים': snackIcon,
  'אריזות': pakatingIcon,
  'אחר': otherIcon,
};

export default function getCategoryIcon(category) {
  return CATEGORY_ICON_MAP[category] || otherIcon;
}
