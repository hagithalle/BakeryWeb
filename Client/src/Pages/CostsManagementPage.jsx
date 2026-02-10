import React, { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import LaborSettingsPanel from "../Components/CostsManagement/LaborSettingsPanel";
import OverheadItemsPanel from "../Components/CostsManagement/OverheadItemsPanel";

export default function CostsManagementPage() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* כותרת */}
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          fontFamily: 'Suez One, serif', 
          color: '#751B13' 
        }}
      >
        ניהול עלויות
      </Typography>

      {/* טאבים */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem'
            }
          }}
        >
          <Tab label="הגדרות שכר ועבודה" />
          <Tab label="עלויות עקיפות" />
        </Tabs>
      </Paper>

      {/* תוכן */}
      <Box sx={{ mt: 3 }}>
        {currentTab === 0 && <LaborSettingsPanel />}
        {currentTab === 1 && <OverheadItemsPanel />}
      </Box>
    </Box>
  );
}
