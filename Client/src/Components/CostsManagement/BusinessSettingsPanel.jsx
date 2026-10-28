import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert, RadioGroup, FormControlLabel, Radio, InputAdornment } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { getBusinessSettings, saveBusinessSettings } from "../../Services/businessSettingsService";
import { VatStatus, formatPercentOrDash } from "../../utils/pricingForm";
import { marginToPercent, percentToMargin } from "../../utils/productForm";

// סטטוס מע"מ ואחוז תוספת ברירת מחדל של העסק (נשמרים בשרת לכל משתמש)
export default function BusinessSettingsPanel() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, isError } = useQuery({ queryKey: ["businessSettings"], queryFn: getBusinessSettings });
  // ההודעה נשמרת כאן כדי שלא תיעלם כשהטופס נבנה מחדש אחרי שמירה
  const [message, setMessage] = useState(null);

  if (isLoading) return null;
  if (isError) return <Alert severity="error" sx={{ mb: 3 }}>לא ניתן לטעון את הגדרות המע"מ</Alert>;

  // הטופס נבנה מחדש כשההגדרות השמורות משתנות, כך שהוא תמיד מתחיל מהערכים שבשרת
  return <BusinessSettingsForm key={`${settings.vatStatus}-${settings.defaultMarkupPercent}`} settings={settings} queryClient={queryClient} message={message} setMessage={setMessage} />;
}

function BusinessSettingsForm({ settings, queryClient, message, setMessage }) {
  const [vatStatus, setVatStatus] = useState(settings.vatStatus ? String(settings.vatStatus) : "");
  const [markupPercent, setMarkupPercent] = useState(String(marginToPercent(settings.defaultMarkupPercent)));

  const { mutate, isPending } = useMutation({
    mutationFn: saveBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessSettings"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setMessage({ severity: "success", text: "ההגדרות נשמרו" });
    },
    onError: (error) => setMessage({ severity: "error", text: error?.response?.data?.message || "שמירת ההגדרות נכשלה" }),
  });

  const markup = Number(markupPercent);
  const valid = !!vatStatus && markupPercent !== "" && Number.isFinite(markup) && markup >= 0 && markup <= 1000;

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, color: "#7B5B4B", fontWeight: 700 }}>מע"מ ותמחור</Typography>

      {!settings?.isConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          עדיין לא נבחר סטטוס מע"מ. עד שתבחרי, מחירים מומלצים ורווח לא יחושבו.
        </Alert>
      )}

      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>סטטוס מע"מ של העסק</Typography>
      <RadioGroup row value={vatStatus} onChange={(e) => setVatStatus(e.target.value)}>
        <FormControlLabel value={String(VatStatus.Exempt)} control={<Radio />} label='עוסק פטור (ללא מע"מ במחיר ללקוח)' />
        <FormControlLabel value={String(VatStatus.Registered)} control={<Radio />}
          label={`עוסק מורשה (מע"מ ${formatPercentOrDash(settings?.currentVatRate)} נכלל במחיר ללקוח)`} />
      </RadioGroup>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mt: 2 }}>
        <TextField
          label="תוספת על העלות למחיר מומלץ"
          type="number"
          value={markupPercent}
          onChange={(e) => setMarkupPercent(e.target.value)}
          sx={{ width: 240 }}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, inputProps: { min: 0, max: 1000, step: 0.5 } }}
          helperText="מחיר מומלץ = עלות × (1 + התוספת), מעוגל לשקל שלם"
        />
        <Button
          variant="contained"
          disabled={!valid || isPending}
          onClick={() => { setMessage(null); mutate({ vatStatus: Number(vatStatus), defaultMarkupPercent: percentToMargin(markup) }); }}
          sx={{ bgcolor: "#C98929", "&:hover": { bgcolor: "#A87020" } }}
        >
          שמירה
        </Button>
      </Box>

      {settings?.currentVatRate != null && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#777" }}>
          שיעור המע"מ הנוכחי: {formatPercentOrDash(settings.currentVatRate)} (בתוקף מ-{settings.currentVatRateEffectiveFrom})
        </Typography>
      )}
      {message && <Alert severity={message.severity} sx={{ mt: 2 }}>{message.text}</Alert>}

      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #EADBC8" }}>
        <Typography variant="body2" sx={{ mb: 1, color: "#5D4037" }}>
          כדי שהעלויות יהיו מדויקות, יש לציין לכל חומר גלם, אריזה והוצאה אם המחיר שהוזן כולל מע"מ.
        </Typography>
        <Button component={RouterLink} to="/purchase-vat" variant="outlined">בדיקת מע"מ במחירי קנייה</Button>
      </Box>
    </Paper>
  );
}
