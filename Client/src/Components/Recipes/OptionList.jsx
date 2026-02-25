
import { Stack } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import StartOptionCard from './StartOptionCard';
import { useLanguage } from '../../context/LanguageContext';
import useLocaleStrings from '../../hooks/useLocaleStrings';

export default function OptionList({ onSelect }) {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const opts = strings.recipeStartDialog.options;
  return (
    <Stack direction="row" spacing={2.5} sx={{ px: 2, py: 1 }}>
      <StartOptionCard
        icon={<MenuBookIcon />}
        title={opts.manualTitle}
        subtitle={opts.manualSubtitle}
        onClick={() => onSelect("manual")}
         sx={{ width: "100%", maxWidth: 260 }}
     
      />

      <StartOptionCard
        icon={<CloudUploadIcon />}
        title={opts.importTitle}
        subtitle={opts.importSubtitle}
        onClick={() => onSelect("import")}
         sx={{ width: "100%", maxWidth: 260 }}
      />

      <StartOptionCard
        icon={<AutoAwesomeIcon />}
        title={opts.aiTitle}
        subtitle={opts.aiSubtitle}
        disabled
        badge={opts.comingSoon}
        onClick={() => onSelect("ai")}
         sx={{ width: "100%", maxWidth: 260 }}
   
      />
    </Stack>
  );
}