import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SummaryCardRow from '../../Components/SummaryCardRow';

export default function SummaryCards({ balance = 0, income = 0, expense = 0 }) {
 const items = [
  {
    icon: TrendingUpIcon,
    title: 'סה"כ הכנסות',
    value: income,
    valueColor: '#16994e',      // ירוק כהה
    iconColor: '#ffffff',       // ירוק אייקון
   iconBgColor: '#1CA55B',    // ירוק אייקון רקע
    bgColor: '#E5F8E9',         // ירוק בהיר רקע
    currency: '₪',
  },
  {
    icon: TrendingDownIcon,
    title: 'סה"כ הוצאות',
    value: expense,
    valueColor: '#D33A3A',      // אדום כהה
    iconColor: '#ffffff', 
     iconBgColor: '#E44949',       // אדום אייקון
    bgColor: '#FCE5E5',         // ורוד בהיר רקע
    currency: '₪',
  },
  {
    icon: AttachMoneyIcon,
    title: 'יתרה',
    value: balance,
    valueColor: '#16994E',      // ירוק כהה (כמו בהכנסות)
    iconColor: '#ffffff',       // זהוב/חום אייקון
    iconBgColor: '#C68B5A',
    bgColor: '#F8F1E7',         // רקע צהבהב־שמנת
    currency: '₪',
  }
];
  return <SummaryCardRow items={items} />;
}
