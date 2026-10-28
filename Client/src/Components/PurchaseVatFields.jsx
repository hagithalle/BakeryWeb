import React from "react";
import { Box, Typography, RadioGroup, FormControlLabel, Radio, Alert } from "@mui/material";
import { TREATMENT_OPTIONS, needsDeductibility } from "../utils/purchaseVat";

// שאלות המע"מ על מחיר קנייה. value = { treatment, deductible }; vatStatus = סטטוס העסק (1 פטור, 2 מורשה, null)
export default function PurchaseVatFields({ value, onChange, vatStatus, isNew, priceLabel = "המחיר" }) {
  const askDeductible = needsDeductibility(vatStatus, value.treatment);

  return (
    <Box sx={{ border: "1px solid #EADBC8", borderRadius: 2, p: 1.5, bgcolor: "#FFFDF9" }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "#5D4037", mb: 0.5 }}>
        מע"מ ב{priceLabel} {isNew && <span style={{ color: "#C62828" }}>*</span>}
      </Typography>
      <RadioGroup
        value={value.treatment === null ? "" : String(value.treatment)}
        onChange={(e) => onChange({ treatment: Number(e.target.value), deductible: null })}
      >
        {TREATMENT_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            value={String(option.value)}
            control={<Radio size="small" />}
            label={
              <span>
                {option.label}
                {option.hint && <Typography component="span" variant="caption" sx={{ color: "#777" }}> – {option.hint}</Typography>}
              </span>
            }
          />
        ))}
      </RadioGroup>

      {askDeductible && (
        <>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#5D4037", mt: 1 }}>
            האם המע"מ על הקנייה הזו מוכר לקיזוז?
          </Typography>
          <RadioGroup
            row
            value={value.deductible === null ? "" : String(value.deductible)}
            onChange={(e) => onChange({ ...value, deductible: e.target.value === "true" })}
          >
            <FormControlLabel value="true" control={<Radio size="small" />} label="כן, מקזזת" />
            <FormControlLabel value="false" control={<Radio size="small" />} label="לא" />
          </RadioGroup>
        </>
      )}

      {value.treatment === null && !isNew && (
        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
          עדיין לא צוין אם המחיר כולל מע"מ – העלות מחושבת לפי המחיר כפי שהוזן.
        </Alert>
      )}
      {vatStatus == null && value.treatment !== null && (
        <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#777" }}>
          לא נבחר סטטוס מע"מ לעסק, ולכן המחיר משמש כפי שהוזן עד לבחירה בהגדרות.
        </Typography>
      )}
    </Box>
  );
}
