import HomeIcon from '@mui/icons-material/Home';
import CalculateIcon from '@mui/icons-material/Calculate';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import BuildIcon from '@mui/icons-material/Build';

export const CATEGORY_ICON_COLOR = {
  0: { icon: BuildIcon, color: '#9B5A25', bg: '#f3ede7', type: 1 }, // הוצאות תפעול
  1: { icon: HomeIcon, color: '#ac0e6a', bg: '#f6ede2', type: 1 }, // שכירות
  2: { icon: CalculateIcon, color: '#7c5c3b', bg: '#f6ede2', type: 0 }, // רואה חשבון
  3: { icon: ShieldIcon, color: '#7c5cfa', bg: '#eafaea', type: 0 }, // ביטוח
  4: { icon: BoltIcon, color: '#d4b03a', bg: '#faeaea', type: 1 }, // שונות
};

export const CATEGORY_ENUM_LABEL = {
  0: 'הוצאות תפעול',
  1: 'שכירות',
  2: 'רואה חשבון',
  3: 'ביטוח',
  4: 'שונות',
};
