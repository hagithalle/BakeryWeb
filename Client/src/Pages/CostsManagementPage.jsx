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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* טאבים */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem',
              color: '#9B5A25',
              '&.Mui-selected': {
                color: '#971936'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#C98929'
            }
          }}
        >
          <Tab label="הגדרות שכר ועבודה" />
          <Tab label="עלויות עקיפות" />
        </Tabs>
      </Paper>

      {/* תוכן */}
      <Box sx={{ mt: 3, flexGrow: 1, overflow: 'auto' }}>
        {currentTab === 0 && <LaborSettingsPanel />}
        {currentTab === 1 && <OverheadItemsPanel />}
      </Box>
    </Box>
  );
}
