import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, TextField, Button, Grid, Alert, CircularProgress } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLaborSettings, saveLaborSettings } from "../../Services/laborSettingsService";
import { getAllOverheadItems } from "../../Services/overheadItemService";

export default function LaborSettingsPanel() {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    desiredMonthlySalary: 0,
    pensionPercent: 0,
    kerenHishtalmutPercent: 0,
    otherEmployerCostsPercent: 0,
    workingDaysPerMonth: 22,
    workingHoursPerDay: 8
  });

  // טעינת הנתונים
  const { data: settings, isLoading } = useQuery({
    queryKey: ['laborSettings'],
    queryFn: getLaborSettings
  });

  // טעינת עלויות עקיפות
  const { data: overheadItems = [] } = useQuery({
    queryKey: ['overheadItems'],
    queryFn: getAllOverheadItems
  });

  // עדכון מוצלח
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: saveLaborSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['laborSettings']);
      alert('✅ ההגדרות נשמרו בהצלחה!');
    },
    onError: (error) => {
      alert('❌ שגיאה בשמירת ההגדרות: ' + error.message);
    }
  });

  // עדכון הטופס כאשר הנתונים נטענו
  useEffect(() => {
    if (settings) {
      setFormData({
        desiredMonthlySalary: settings.desiredMonthlySalary || 0,
        pensionPercent: (settings.pensionPercent * 100) || 0, // המרה לאחוזים
        kerenHishtalmutPercent: (settings.kerenHishtalmutPercent * 100) || 0,
        otherEmployerCostsPercent: (settings.otherEmployerCostsPercent * 100) || 0,
        workingDaysPerMonth: settings.workingDaysPerMonth || 22,
        workingHoursPerDay: settings.workingHoursPerDay || 8
      });
    }
  }, [settings]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: parseFloat(event.target.value) || 0 });
  };

  const handleSave = () => {
    // המרה חזרה לערכים עשרוניים
    const dataToSave = {
      id: settings?.id || 1,
      desiredMonthlySalary: formData.desiredMonthlySalary,
      pensionPercent: formData.pensionPercent / 100,
      kerenHishtalmutPercent: formData.kerenHishtalmutPercent / 100,
      otherEmployerCostsPercent: formData.otherEmployerCostsPercent / 100,
      workingDaysPerMonth: formData.workingDaysPerMonth,
      workingHoursPerDay: formData.workingHoursPerDay
    };
    
    saveSettings(dataToSave);
  };

  // חישוב עלות שעת עבודה
  const calculateHourlyCost = () => {
    const totalMonthlyPercent = 1 + 
      (formData.pensionPercent / 100) + 
      (formData.kerenHishtalmutPercent / 100) + 
      (formData.otherEmployerCostsPercent / 100);
    
    const monthlyTotal = formData.desiredMonthlySalary * totalMonthlyPercent;
    const monthlyHours = formData.workingDaysPerMonth * formData.workingHoursPerDay;
    
    return monthlyHours === 0 ? 0 : monthlyTotal / monthlyHours;
  };

  // חישוב עלויות עקיפות לשעה
  const calculateOverheadPerHour = () => {
    const totalMonthlyCost = overheadItems
      .filter(item => item.isActive)
      .reduce((sum, item) => sum + (item.monthlyCost || 0), 0);
    
    const monthlyHours = formData.workingDaysPerMonth * formData.workingHoursPerDay;
    return monthlyHours === 0 ? 0 : totalMonthlyCost / monthlyHours;
  };

  // חישוב סה"כ עלות לשעה (שכר + עקיפות)
  const calculateTotalCostPerHour = () => {
    return calculateHourlyCost() + calculateOverheadPerHour();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, color: '#751B13', fontFamily: 'Suez One, serif' }}>
        הגדרות שכר ועבודה
      </Typography>

      <Grid container spacing={3}>
        {/* משכורת חודשית רצויה */}
          <Grid>
          <TextField
            fullWidth
            label="משכורת חודשית רצויה (₪)"
            type="number"
            value={formData.desiredMonthlySalary}
            onChange={handleChange('desiredMonthlySalary')}
            InputProps={{ inputProps: { min: 0, step:100 } }}
          />
        </Grid>

        {/* פנסיה */}
          <Grid>
          <TextField
            fullWidth
            label="פנסיה - אחוז מעסיק (%)"
            type="number"
            value={formData.pensionPercent}
            onChange={handleChange('pensionPercent')}
            InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
            helperText="למשל: 12.5% = 12.5"
          />
        </Grid>

        {/* קרן השתלמות */}
          <Grid>
          <TextField
            fullWidth
            label="קרן השתלמות - אחוז מעסיק (%)"
            type="number"
            value={formData.kerenHishtalmutPercent}
            onChange={handleChange('kerenHishtalmutPercent')}
            InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
            helperText="למשל: 7.5% = 7.5"
          />
        </Grid>

        {/* עלויות מעסיק נוספות */}
          <Grid>
          <TextField
            fullWidth
            label="עלויות מעסיק נוספות (%)"
            type="number"
            value={formData.otherEmployerCostsPercent}
            onChange={handleChange('otherEmployerCostsPercent')}
            InputProps={{ inputProps: { min: 0, max: 100, step: 0.5 } }}
            helperText="ביטוח לאומי, ביטוח בריאות וכו'"
          />
        </Grid>

        {/* ימי עבודה בחודש */}
          <Grid>
          <TextField
            fullWidth
            label="ימי עבודה בחודש"
            type="number"
            value={formData.workingDaysPerMonth}
            onChange={handleChange('workingDaysPerMonth')}
            InputProps={{ inputProps: { min: 1, max: 31 } }}
          />
        </Grid>

        {/* שעות עבודה ביום */}
          <Grid>
          <TextField
            fullWidth
            label="שעות עבודה ביום"
            type="number"
            value={formData.workingHoursPerDay}
            onChange={handleChange('workingHoursPerDay')}
            InputProps={{ inputProps: { min: 0.5, max: 24, step: 0.5 } }}
          />
        </Grid>

        {/* תצוגת תוצאה */}
          <Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="h6">
              עלות שכר לשעת עבודה: ₪{calculateHourlyCost().toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              חישוב: (משכורת + הפרשות מעסיק) / ({formData.workingDaysPerMonth} ימים × {formData.workingHoursPerDay} שעות)
            </Typography>
            {overheadItems.length > 0 && (
              <>
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                  עלות עקיפה לשעת עבודה: ₪{calculateOverheadPerHour().toFixed(2)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, color: '#751B13', fontWeight: 700 }}>
                  סה"כ עלות לשעת עבודה: ₪{calculateTotalCostPerHour().toFixed(2)}
                </Typography>
              </>
            )}
          </Alert>
        </Grid>

        {/* כפתור שמירה */}
          <Grid>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{
              bgcolor: '#5D4037',
              ':hover': { bgcolor: '#4E342E' },
              fontWeight: 600,
              px: 4
            }}
          >
            {isSaving ? 'שומר...' : 'שמור הגדרות'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
