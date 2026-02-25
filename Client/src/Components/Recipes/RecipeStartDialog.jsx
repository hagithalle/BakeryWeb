import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, IconButton, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";


import OptionList from "./OptionList";
import { useLanguage } from '../../context/LanguageContext';
import useLocaleStrings from '../../hooks/useLocaleStrings';
import { logManager } from '../../utils/logging';

export default function RecipeStartDialog({ open, onClose, onSelect }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);

  // Log dialog open/close
  React.useEffect(() => {
    if (open) {
      logManager.logDebug('RecipeStartDialog', 'useEffect', 'Dialog opened');
    } else {
      logManager.logDebug('RecipeStartDialog', 'useEffect', 'Dialog closed');
    }
  }, [open]);

  // Wrap onClose to log
  const handleClose = () => {
    logManager.logInfo('RecipeStartDialog', 'handleClose', 'User closed dialog');
    onClose && onClose();
  };

  // Wrap onSelect to log
  const handleSelect = (option) => {
    logManager.logInfo('RecipeStartDialog', 'handleSelect', `User selected option: ${JSON.stringify(option)}`);
    onSelect && onSelect(option);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, bgcolor: "#FFF8F3", direction: "rtl" }
      }}
    >
      <Box sx={{ position: "absolute", left: 16, top: 16 }}>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogTitle sx={{ textAlign: "center", fontWeight: 700, color: "#971936" }}>
        {strings.recipeStartDialog.title}
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ textAlign: "center", mb: 3, color: "#9B5A25" }}>
          {strings.recipeStartDialog.howToStart}
        </Typography>

        <OptionList onSelect={handleSelect} />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} color="inherit">{strings.recipeStartDialog.cancel}</Button>
      </DialogActions>
    </Dialog>
  );
}