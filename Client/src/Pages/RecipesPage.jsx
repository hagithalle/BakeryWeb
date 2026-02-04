import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import AddRecipeDialog from "../Components/Recipes/AddRecipeDialog";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchIngredients } from '../Services/ingredientsService';
import { getAllRecipes, createRecipeWithImage, deleteRecipe, updateRecipeWithImage } from '../Services/RecipeService';
import { addIngredient } from '../Services/ingredientsService';
import RecipeListSidebar from "../Components/Recipes/RecipeListSidebar";
import RecipeDetailsPanel from "../Components/Recipes/RecipeDetailsPanel";


export default function RecipesPage() {
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editRecipe, setEditRecipe] = useState(null);
    // בעתיד: filter, onAdd וכו'

    // Fetch recipes from DB
    const { data: rows = [], isLoading: recipesLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: getAllRecipes
    });

    const selectedRecipe = rows.find(r => r.id === selectedId) || null;

    // הצג את כל המידע של המתכון הנבחר בפאנל הצד
    const fullSelectedRecipe = React.useMemo(() => {
        if (!selectedRecipe) return null;
        return {
            ...selectedRecipe,
            ingredients: (selectedRecipe.ingredients || selectedRecipe.Ingredients || [])
                .map(ri => ({
                    name: ri.ingredient?.name || ri.Ingredient?.name || '',
                    amount: ri.quantity || ri.Quantity || '',
                    unit: ri.ingredient?.unit || ri.Ingredient?.unit || ''
                })),
            steps: (selectedRecipe.steps || selectedRecipe.Steps || [])
                .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
                .map(s => s.description || s.Description || '')
        };
    }, [selectedRecipe]);

    // Fetch ingredients from DB
    const { data: ingredientsList = [], isLoading: ingredientsLoading } = useQuery({
        queryKey: ['ingredients'],
        queryFn: fetchIngredients
    });

    return (
        <Box>
          
            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <RecipeListSidebar
                        recipes={rows}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={() => { setEditRecipe(null); setAddDialogOpen(true); }}
                        onEdit={recipe => {
                            // המרת מבנה החומרים והשלבים למבנה שהדיאלוג מצפה לו, ללא כפילויות ותמיד עם שם ויחידה
                            const mappedRecipe = {
                                ...recipe,
                                ingredients: (recipe.ingredients || recipe.Ingredients || [])
                                    .filter((ri, idx, arr) =>
                                        arr.findIndex(x => (x.ingredient?.id || x.Ingredient?.id) === (ri.ingredient?.id || ri.Ingredient?.id)) === idx
                                    )
                                    .map(ri => ({
                                        name: ri.ingredient?.name || ri.Ingredient?.name || '',
                                        amount: ri.quantity || ri.Quantity || '',
                                        unit: ri.ingredient?.unit || ri.Ingredient?.unit || ''
                                    })),
                                steps: (recipe.steps || recipe.Steps || [])
                                    .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
                                    .map(s => s.description || s.Description || '')
                            };
                            setEditRecipe(mappedRecipe);
                            setAddDialogOpen(true);
                        }}
                        onDelete={async recipe => {
                            if (window.confirm('האם למחוק את המתכון "' + recipe.name + '"?')) {
                                await deleteRecipe(recipe.id);
                                queryClient.invalidateQueries(['recipes']);
                                setSelectedId(null);
                            }
                        }}
                        filter={""}
                        onFilterChange={() => {}}
                    />
                </Box>
                <Box sx={{ flex: 2, minWidth: 0 }}>
                    <RecipeDetailsPanel
                        recipe={fullSelectedRecipe}
                        onEdit={() => { if (fullSelectedRecipe) { setEditRecipe(fullSelectedRecipe); setAddDialogOpen(true); } }}
                        onDelete={async () => {
                            if (fullSelectedRecipe && window.confirm('האם למחוק את המתכון "' + fullSelectedRecipe.name + '"?')) {
                                await deleteRecipe(fullSelectedRecipe.id);
                                queryClient.invalidateQueries(['recipes']);
                                setSelectedId(null);
                            }
                        }}
                        tab={"ingredients"}
                        onTabChange={() => {}}
                    />
                </Box>
            </Box>
            <AddRecipeDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={async recipe => {
                    try {
                        console.log('onSave received recipe:', recipe);
                        // ודא שכל חומר גלם קיים ב-DB, אחרת הוסף אותו
                        const ensuredIngredients = [];
                        for (const ing of recipe.ingredients || []) {
                            console.log('Processing ingredient in onSave:', ing);
                            let found = (ingredientsList || []).find(i => i.name === ing.name || i.ingredientName === ing.name);
                            if (!found) {
                                found = await addIngredient({ name: ing.name, unit: ing.unit || 'יחידה', category: 7, pricePerKg: 0, stockQuantity: 0 });
                                await queryClient.invalidateQueries(['ingredients']);
                                console.log('Added new ingredient to DB:', found);
                            }
                            if (!ing.amount || isNaN(Number(ing.amount)) || Number(ing.amount) <= 0) {
                                console.warn('Ingredient missing valid amount:', ing);
                                alert(`חומר הגלם "${ing.name}" חייב כמות מספרית גדולה מ-0!`);
                                continue;
                            }
                            ensuredIngredients.push({
                                IngredientId: found.id,
                                Quantity: Number(ing.amount)
                            });
                        }
                        console.log('ensuredIngredients after mapping:', ensuredIngredients);
                        // המרת steps לפורמט שהשרת מצפה לו
                        const mappedSteps = (recipe.steps || []).map((desc, idx) => ({
                            description: desc,
                            order: idx + 1
                        }));
                        console.log('mappedSteps:', mappedSteps);
                        const recipeToSend = {
                            ...recipe,
                            ingredients: ensuredIngredients,
                            steps: mappedSteps
                        };
                        console.log('Recipe sent to server:', recipeToSend);
                        if (editRecipe) {
                            await updateRecipeWithImage(editRecipe.id, recipeToSend, recipe.imageFile);
                        } else {
                            await createRecipeWithImage(recipeToSend, recipe.imageFile);
                        }
                        setAddDialogOpen(false);
                        setEditRecipe(null);
                        queryClient.invalidateQueries(['recipes']);
                        queryClient.invalidateQueries(['ingredients']);
                    } catch (err) {
                        alert('שגיאה בשמירת מתכון: ' + (err?.message || ''));
                    }
                }}
                ingredientsList={ingredientsList}
                loadingIngredients={ingredientsLoading}
                onIngredientAdded={() => queryClient.invalidateQueries(['ingredients'])}
                initialValues={editRecipe}
            />
        </Box>
    );
}

