import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
} from "@mui/material";

export default function RecipeCard({ recipe, onClick }) {
  // כמות רכיבים – תומך גם ב־recipe.Ingredients
  const ingredientsCount =
    recipe.ingredients?.length ??
    recipe.Ingredients?.length ??
    0;

  const outputUnits = recipe.outputUnits ?? recipe.OutputUnits ?? null;

  // תמונה – חצי "קפסולה" בצד שמאל
  const floatingImage = (
  <Box
    sx={{
      position: "relative",
      left: -18,               // כמה התמונה יוצאת שמאלה
      width: 88,
      height: 88,
      ml: -2,                   // מרווח שלילי כדי "לחבר" את התמונה לכרטיס
      borderRadius: "0 50% 30% 30%",     // חצי עיגול בצד שמאל
      overflow: "hidden",
      boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
      border: "4px solid #FFF7F2",  // מסגרת שמחברת אותה לכרטיס
      bgcolor: "#f5f5f5",
      flexShrink: 0,
    }}
  >
    {recipe.imageUrl ? (
      <img
        src={recipe.imageUrl}
        alt={recipe.name}
        style={{
            width: "115%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center center",
        transform: "translateX(2px)",
        }}
      />
    ) : (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f7e7c1 0%, #e9d8c3 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Avatar
          sx={{
            width: 50,
            height: 50,
            bgcolor: "#bfa47a",
            fontSize: 26,
            color: "#fff",
          }}
        >
          🍰
        </Avatar>
      </Box>
    )}
  </Box>
);

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        bgcolor: "#FFF7F2",
        overflow: "visible",
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",        // טקסט מימין, תמונה משמאל
            justifyContent: "space-between",
            alignItems: "center",
            px: 2.2,
            py: 1.8,                     // פחות גובה – יושב יותר “מדויק”
            gap: 2,
            direction: "rtl",
            textAlign: "right",
          }}
        >
          {/* צד ימין – טקסט */}
          <CardContent
            sx={{
              p: 0,
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* קטגוריה מעל שם המתכון */}
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              {recipe.category && (
                <Chip
                  label={recipe.category}
                  size="small"
                  sx={{
                    bgcolor: "#F5E0D3",
                    color: "#7c5c3b",
                    fontWeight: 500,
                    borderRadius: 999,
                  }}
                />
              )}
              {typeof recipe.recipeType !== 'undefined' && (
                <Chip
                  label={recipe.recipeType === 0 ? 'חלבי' : recipe.recipeType === 1 ? 'בשרי' : 'פרווה'}
                  size="small"
                  sx={{
                    bgcolor: "#E3F7D6",
                    color: "#4B7B5B",
                    fontWeight: 500,
                    borderRadius: 999,
                  }}
                />
              )}
            </Box>

            {/* שם המתכון */}
            <Typography
              variant="h6"
              sx={{
                color: "#7c5c3b",
                fontWeight: 700,
                fontSize: 18,
              }}
              noWrap
            >
              {recipe.name}
            </Typography>

            {/* תיאור קצר */}
            {recipe.description && (
              <Typography
                variant="body2"
                sx={{
                  color: "#8b715c",
                  opacity: 0.8,
                  mt: 0.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {recipe.description}
              </Typography>
            )}

            {/* שורת צ'יפים תחתונה – רכיבים / תפוקה */}
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {ingredientsCount > 0 && (
                <Chip
                  label={`רכיבים: ${ingredientsCount}`}
                  size="small"
                  sx={{
                    bgcolor: "#FFFFFF",
                    color: "#7c5c3b",
                    borderRadius: 999,
                    fontSize: 12,
                    px: 1.5,
                  }}
                />
              )}
              {outputUnits && (
                <Chip
                  label={`תפוקה: ${outputUnits}`}
                  size="small"
                  sx={{
                    bgcolor: "#FFFFFF",
                    color: "#7c5c3b",
                    borderRadius: 999,
                    fontSize: 12,
                    px: 1.5,
                  }}
                />
              )}
            </Box>
          </CardContent>

          {/* צד שמאל – תמונה מעוצבת */}
          {floatingImage}
        </Box>
      </CardActionArea>
    </Card>
  );
}