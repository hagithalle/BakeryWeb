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

    // Fetch ingredients from DB
    const { data: ingredientsList = [], isLoading: ingredientsLoading } = useQuery({
        queryKey: ['ingredients'],
        queryFn: fetchIngredients
    });

    const selectedRecipe = rows.find(r => r.id === selectedId) || null;

    // הצג את כל המידע של המתכון הנבחר בפאנל הצד
    const fullSelectedRecipe = React.useMemo(() => {
        if (!selectedRecipe) return null;
        console.log('fullSelectedRecipe: selectedRecipe raw:', selectedRecipe);
        console.log('fullSelectedRecipe: ingredientsList:', ingredientsList);
        const result = {
            ...selectedRecipe,
            // שמור את המבנה המקורי של ingredients עם האובייקט המלא
            ingredients: (selectedRecipe.ingredients || selectedRecipe.Ingredients || [])
                .map(ri => {
                    const ingId = ri.ingredient?.id || ri.Ingredient?.id || ri.ingredientId || ri.IngredientId;
                    // חפש את המידע המלא מרשימת הרכיבים
                    const fullIngredient = ingredientsList.find(i => i.id === ingId);
                    return {
                        ingredient: fullIngredient || ri.ingredient || ri.Ingredient,
                        quantity: ri.quantity || ri.Quantity || 0
                    };
                }),
            steps: (selectedRecipe.steps || selectedRecipe.Steps || [])
                .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
                .map((s, idx) => ({
                    order: s.order || s.Order || idx,
                    description: s.description || s.Description || ''
                }))
        };
        console.log('fullSelectedRecipe: final result:', result);
        return result;
    }, [selectedRecipe, ingredientsList]);

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
                            console.log('RecipesPage: onEdit triggered with recipe:', recipe);
                            console.log('RecipesPage: recipe.ingredients:', recipe.ingredients);
                            console.log('RecipesPage: recipe.Ingredients:', recipe.Ingredients);
                            // המרת מבנה החומרים והשלבים למבנה שהדיאלוג מצפה לו, ללא כפילויות ותמיד עם שם ויחידה
                            const mappedRecipe = {
                                ...recipe,
                                ingredients: (recipe.ingredients || recipe.Ingredients || [])
                                    .filter((ri, idx, arr) => {
                                        const currentId = ri.ingredient?.id || ri.Ingredient?.id || ri.ingredientId || ri.IngredientId;
                                        const firstIndex = arr.findIndex(x => {
                                            const xId = x.ingredient?.id || x.Ingredient?.id || x.ingredientId || x.IngredientId;
                                            return xId === currentId;
                                        });
                                        return firstIndex === idx;
                                    })
                                    .map(ri => {
                                        const ingId = ri.ingredient?.id || ri.Ingredient?.id || ri.ingredientId || ri.IngredientId;
                                        // חפש את המידע המלא מרשימת הרכיבים
                                        const fullIngredient = ingredientsList.find(i => i.id === ingId);
                                        const result = {
                                            ingredientId: ingId,
                                            name: ri.ingredient?.name || ri.Ingredient?.name || fullIngredient?.name || '',
                                            amount: ri.quantity || ri.Quantity || '',
                                            unit: ri.ingredient?.unit || ri.Ingredient?.unit || fullIngredient?.unit || ''
                                        };
                                        console.log('RecipesPage: mapped ingredient:', result);
                                        return result;
                                    }),
                                steps: (recipe.steps || recipe.Steps || [])
                                    .sort((a, b) => (a.order || a.Order || 0) - (b.order || b.Order || 0))
                                    .map(s => s.description || s.Description || '')
                            };
                            console.log('RecipesPage: final mappedRecipe.ingredients:', mappedRecipe.ingredients);
                            console.log('RecipesPage: final mappedRecipe:', mappedRecipe);
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
                        onEdit={() => { 
                            if (fullSelectedRecipe) {
                                console.log('RecipesPage: onEdit from panel, fullSelectedRecipe:', fullSelectedRecipe);
                                setEditRecipe(fullSelectedRecipe); 
                                setAddDialogOpen(true); 
                            } 
                        }}
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
                        console.log('=============== RecipesPage.onSave START ===============');
                        
                        // 1. בדיקה בסיסית
                        console.log('▶️ בדיקה בסיסית:');
                        if (!recipe.name || recipe.name.trim() === '') {
                            console.warn('❌ שם מתכון ריק!');
                            alert('חובה להזין שם למתכון!');
                            return;
                        }
                        console.log('✅ שם מתכון:', recipe.name);

                        // 2. עיבוד רכיבים - הסבר כל שלב
                        console.log('▶️ עיבוד רכיבים:');
                        console.log('   מתכון קיבל', recipe.ingredients.length, 'רכיבים:');
                        const ensuredIngredients = [];
                        
                        for (const ing of recipe.ingredients || []) {
                            console.log(`\n   🔍 מעבד רכיב: "${ing.name}"`);
                            console.log(`     קלט: {id: ${ing.ingredientId}, name: "${ing.name}", amount: ${ing.amount}, unit: ${ing.unit}}`);
                            
                            // אם יש ID, השתמש בו. אחרת, חפש לפי שם
                            let found;
                            if (ing.ingredientId) {
                                found = (ingredientsList || []).find(i => i.id === ing.ingredientId);
                                if (found) {
                                    console.log(`     ✅ נמצא ב-DB לפי ID: ${found.id}`);
                                }
                            }
                            
                            if (!found) {
                                // חפש ב-DB לפי שם
                                found = (ingredientsList || []).find(i => i.name === ing.name || i.ingredientName === ing.name);
                            
                                if (!found) {
                                    console.log(`     ⚠️ רכיב לא נמצא ב-DB, מוסיף חדש...`);
                                    found = await addIngredient({ name: ing.name, unit: 1, category: 7, pricePerKg: 0, stockQuantity: 0, stockUnit: 1 });
                                    await queryClient.invalidateQueries(['ingredients']);
                                    console.log(`     ✅ נוסף ב-DB עם ID: ${found.id}`);
                                } else {
                                    console.log(`     ✅ נמצא ב-DB לפי שם עם ID: ${found.id}`);
                                }
                            }
                            
                            // בדיקת כמות תקינה
                            if (!ing.amount || isNaN(Number(ing.amount)) || Number(ing.amount) <= 0) {
                                console.warn(`     ❌ כמות לא תקינה: "${ing.amount}"`);
                                alert(`חומר הגלם "${ing.name}" חייב כמות מספרית גדולה מ-0!`);
                                continue;
                            }
                            
                            // הוסף לarrayסופי
                            const finalIngredient = {
                                IngredientId: found.id,
                                Quantity: Number(ing.amount)
                            };
                            ensuredIngredients.push(finalIngredient);
                            console.log(`     ➡️ שלח לשרת: {IngredientId: ${finalIngredient.IngredientId}, Quantity: ${finalIngredient.Quantity}}`);
                        }
                        
                        console.log(`\n   📦 סה"כ רכיבים שישלחו: ${ensuredIngredients.length}`);
                        console.log('   ', JSON.stringify(ensuredIngredients, null, 4));

                        // 3. עיבוד שלבים
                        console.log('\n▶️ עיבוד שלבים:');
                        console.log('   מתכון קיבל', recipe.steps.length, 'שלבים:');
                        const mappedSteps = (recipe.steps || []).map((step, idx) => {
                            console.log(`   [${idx}] קלט:`, { value: step, type: typeof step });
                            
                            const description = typeof step === 'string' ? step : (step.description || step.Description || '');
                            const output = {
                                Description: description,
                                Order: idx + 1
                            };
                            console.log(`   [${idx}] פלט:`, output);
                            return output;
                        });
                        
                        console.log(`\n   📦 סה"כ שלבים שישלחו: ${mappedSteps.length}`);
                        console.log('   ', JSON.stringify(mappedSteps, null, 4));

                        // 4. בניית הnload שנשלח לשרת
                        console.log('\n▶️ בניית payload סופי:');
                        const recipeToSend = {
                            name: recipe.name,
                            description: recipe.description,
                            category: recipe.category,
                            outputUnits: Number(recipe.yieldAmount) || 0,
                            prepTime: Number(recipe.prepTime) || 0,
                            bakeTime: Number(recipe.bakeTime) || 0,
                            temperature: Number(recipe.temperature) || 0,
                            recipeType: recipe.recipeType ?? 2,
                            ingredients: ensuredIngredients,
                            steps: mappedSteps
                        };
                        
                        console.log('   📤 שלח לשרת:');
                        console.log(JSON.stringify(recipeToSend, null, 4));
                        
                        console.log('\n▶️ קריאה ל-createRecipeWithImage...');
                        console.log('   תמונה?', recipe.imageFile ? `כן (${recipe.imageFile.name})` : 'לא');
                        
                        if (editRecipe) {
                            console.log('   מצב: עדכון מתכון קיים (ID:', editRecipe.id, ')');
                            await updateRecipeWithImage(editRecipe.id, recipeToSend, recipe.imageFile);
                            console.log('✅ שמור בהצלחה!');
                            
                            // רענן את הנתונים מהשרת
                            await queryClient.invalidateQueries(['recipes']);
                            await queryClient.invalidateQueries(['ingredients']);
                            
                            setAddDialogOpen(false);
                            setEditRecipe(null);
                            alert('✅ המתכון עודכן בהצלחה!');
                        } else {
                            console.log('   מצב: יצירת מתכון חדש');
                            await createRecipeWithImage(recipeToSend, recipe.imageFile);
                            console.log('✅ שמור בהצלחה!');
                            
                            // רענן את הנתונים מהשרת
                            await queryClient.invalidateQueries(['recipes']);
                            await queryClient.invalidateQueries(['ingredients']);
                            
                            setAddDialogOpen(false);
                            setEditRecipe(null);
                            alert('✅ המתכון נוצר בהצלחה!');
                        }
                        
                        console.log('=============== RecipesPage.onSave END ===============\n');
                    } catch (err) {
                        console.error('=============== RecipesPage.onSave ERROR ===============');
                        console.error('❌ שגיאה:', err);
                        console.error('   status:', err?.response?.status);
                        console.error('   statusText:', err?.response?.statusText);
                        console.error('   data:', err?.response?.data);
                        console.error('   message:', err?.message);
                        console.error('=============== END ERROR ===============\n');
                        
                        const errorMsg = err?.response?.data?.message || err?.message || 'שגיאה לא ידועה';
                        alert('שגיאה בשמירת מתכון: ' + errorMsg);
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

