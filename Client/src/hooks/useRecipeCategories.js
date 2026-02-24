import { useEffect, useState } from "react";
import { fetchCategories } from "../Services/ingredientsService";
import useLocaleStrings from "./useLocaleStrings";

export default function useRecipeCategories() {
  const [categories, setCategories] = useState([]);
  const strings = useLocaleStrings();
  useEffect(() => {
    fetchCategories().then(data => {
      const mapped = (data || []).map(cat => ({
        value: cat.value,
        label: (strings.categories && strings.categories[cat.value]) || cat.name
      }));
      setCategories(mapped);
    });
  }, [strings]);
  return categories;
}
