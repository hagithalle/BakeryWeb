import React, { useState } from "react";
import { Box, Button } from "@mui/material";
import AddRecipeDialog from "../Components/Recipes/AddRecipeDialog";
import { useQuery } from '@tanstack/react-query';
import { fetchIngredients } from '../Services/ingredientsServices';
import RecipeListSidebar from "../Components/Recipes/RecipeListSidebar";
import RecipeDetailsPanel from "../Components/Recipes/RecipeDetailsPanel";

// MOCK DATA (later: fetch from server)
const mockRecipes = [
    { id: 1, name: "עוגת שוקולד" },
    { id: 2, name: "עוגת גבינה" },
    { id: 3, name: "חמאה" },
    { id: 4, name: "פירות" },
    { id: 5, name: "צק שמרי מסי" }
];

export default function RecipesPage() {
    const [selectedId, setSelectedId] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    // בעתיד: filter, onAdd וכו'

    const selectedRecipe = mockRecipes.find(r => r.id === selectedId) || null;

    // Fetch ingredients from DB
    const { data: ingredientsList = [], isLoading: ingredientsLoading } = useQuery({
        queryKey: ['ingredients'],
        queryFn: fetchIngredients
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ fontFamily: 'Suez One, serif', fontSize: 18, borderRadius: 2, px: 4, py: 1, background: '#751B13' }}
                    onClick={() => setAddDialogOpen(true)}
                >
                    + הוספת מתכון חדש
                </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <RecipeListSidebar
                        recipes={mockRecipes}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onAdd={() => setAddDialogOpen(true)}
                        filter={""}
                        onFilterChange={() => {}}
                    />
                </Box>
                <Box sx={{ flex: 2, minWidth: 0 }}>
                    <RecipeDetailsPanel
                        recipe={selectedRecipe}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        tab={"ingredients"}
                        onTabChange={() => {}}
                    />
                </Box>
            </Box>
            <AddRecipeDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={recipe => {
                    // TODO: שמור מתכון חדש
                    setAddDialogOpen(false);
                }}
                ingredientsList={ingredientsList}
                loadingIngredients={ingredientsLoading}
            />
        </Box>
    );
}