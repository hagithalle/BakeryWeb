import React, { useState } from "react";
import { Box } from "@mui/material";
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
    // בעתיד: filter, onAdd וכו'

    const selectedRecipe = mockRecipes.find(r => r.id === selectedId) || null;

    return (
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Box sx={{ flex: 1 }}>
                <RecipeListSidebar
                    recipes={mockRecipes}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onAdd={() => {}}
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
    );
}