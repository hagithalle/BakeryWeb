import { useState, useEffect } from "react";

function useRecipeForm(initialValues, open) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("לחמים");
  const [recipeType, setRecipeType] = useState(2);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [yieldAmount, setYieldAmount] = useState(1);
  const [outputUnitType, setOutputUnitType] = useState(0);
  const [bakeTime, setBakeTime] = useState(0);
  const [prepTime, setPrepTime] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [baseRecipes, setBaseRecipes] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (initialValues) {
      // מצב עריכה / ייבוא
      setName(initialValues.name || "");
      setDescription(initialValues.description || "");
      setCategory(initialValues.category || "לחמים");
      setRecipeType(
        typeof initialValues.recipeType === "number"
          ? initialValues.recipeType
          : initialValues.recipeType === "Dairy"
          ? 0
          : initialValues.recipeType === "Meat"
          ? 1
          : 2
      );
      setImagePreview(initialValues.imageUrl || null);
      setYieldAmount(initialValues.yieldAmount || 1);
      setOutputUnitType(initialValues.outputUnitType ?? 0);
      setBakeTime(initialValues.bakeTime || 0);
      setPrepTime(initialValues.prepTime || 0);
      setTemperature(initialValues.temperature || 0);
      setIngredients(initialValues.ingredients || []);
      setSteps(initialValues.steps || []);
      setBaseRecipes(initialValues.baseRecipes || []);
    } else {
      // מצב מתכון חדש מאפס
      setName("");
      setDescription("");
      setCategory("לחמים");
      setRecipeType(2);
      setImageFile(null);
      setImagePreview(null);
      setYieldAmount(1);
      setOutputUnitType(0);
      setBakeTime(0);
      setPrepTime(0);
      setTemperature(0);
      setIngredients([]);
      setSteps([]);
      setBaseRecipes([]);
    }
  }, [open, initialValues]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const buildRecipeData = () => ({
    name,
    description,
    category,
    recipeType,
    imageFile,
    yieldAmount,
    outputUnitType,
    bakeTime,
    prepTime,
    temperature,
    ingredients,
    steps,
    baseRecipes,
  });

  return {
    // values
    name,
    description,
    category,
    recipeType,
    imageFile,
    imagePreview,
    yieldAmount,
    outputUnitType,
    bakeTime,
    prepTime,
    temperature,
    ingredients,
    steps,
    baseRecipes,

    // setters
    setName,
    setDescription,
    setCategory,
    setRecipeType,
    setImageFile,
    setImagePreview,
    setYieldAmount,
    setOutputUnitType,
    setBakeTime,
    setPrepTime,
    setTemperature,
    setIngredients,
    setSteps,
    setBaseRecipes,

    // handlers
    handleImageChange,
    buildRecipeData,
  };
}

export default useRecipeForm;