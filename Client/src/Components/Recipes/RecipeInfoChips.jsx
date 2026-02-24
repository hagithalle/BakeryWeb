import React from "react";
import { Box, Chip } from "@mui/material";
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import TimerIcon from '@mui/icons-material/Timer';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';

export default function RecipeInfoChips({ difficulty, temperature, yieldValue, totalTime }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      {difficulty && (
        <Chip icon={<SignalCellularAltIcon sx={{ color: '#D84315' }} />} label={difficulty} size="small" sx={{ bgcolor: '#fff3e0', color: '#7c5c3b', fontWeight: 500 }} />
      )}
      {temperature > 0 && (
        <Chip icon={<ThermostatIcon sx={{ color: '#D84315' }} />} label={`${temperature}°C`} size="small" sx={{ bgcolor: '#fff3e0', color: '#7c5c3b', fontWeight: 500 }} />
      )}
      <Chip icon={<BakeryDiningIcon sx={{ color: '#D84315' }} />} label={`תפוקה: ${yieldValue}`} size="small" sx={{ bgcolor: '#fff3e0', color: '#7c5c3b', fontWeight: 500 }} />
      {totalTime > 0 && (
        <Chip icon={<TimerIcon sx={{ color: '#D84315' }} />} label={`זמן: ${totalTime} דק׳`} size="small" sx={{ bgcolor: '#fff3e0', color: '#7c5c3b', fontWeight: 500 }} />
      )}
    </Box>
  );
}
