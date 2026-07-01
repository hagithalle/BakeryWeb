import React from "react";
import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SoftDialog from "../ui/SoftDialog";
import OptionList from "./OptionList";
import { useLanguage } from '../../context/LanguageContext';
import useLocaleStrings from '../../hooks/useLocaleStrings';
import { logManager } from '../../utils/logging';

export default function RecipeStartDialog({ open, onClose, onSelect }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);

  React.useEffect(() => {
    if (open) logManager.logDebug('RecipeStartDialog', 'useEffect', 'Dialog opened');
    else logManager.logDebug('RecipeStartDialog', 'useEffect', 'Dialog closed');
  }, [open]);

  const handleClose = () => {
    logManager.logSuccess('RecipeStartDialog', 'handleClose', 'User closed dialog');
    onClose?.();
  };

  const handleSelect = (option) => {
    logManager.logSuccess('RecipeStartDialog', 'handleSelect', `User selected option: ${JSON.stringify(option)}`);
    onSelect?.(option);
  };

  return (
    <SoftDialog
      open={open}
      onClose={handleClose}
      title={strings.recipeStartDialog?.title || "איך נוסיף מתכון?"}
      maxWidth="md"
      dir="rtl"
      showActions={false}
      contentSx={{ maxHeight: '75vh' }}
    >
      <OptionList onSelect={handleSelect} />
    </SoftDialog>
  );
}
