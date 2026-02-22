// SummaryCards.jsx
import { Paper, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CakeIcon from '@mui/icons-material/Cake';

const SummaryCards = ({ strings, counts = {} }) => (
  <>
   

    {/* מוצרים */}
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        minHeight: 120,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <Inventory2Icon sx={{ fontSize: 40, color: '#bfa47a', mb: 1 }} />
      <Typography variant="subtitle2">
        {strings.dashboard?.products || 'מוצרים'}
      </Typography>
      <Typography variant="h6">{counts.products ?? 0}</Typography>
    </Paper>

    {/* אריזות */}
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        minHeight: 120,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <AllInboxIcon sx={{ fontSize: 40, color: '#bfa47a', mb: 1 }} />
      <Typography variant="subtitle2">
        {strings.dashboard?.packaging || 'אריזות'}
      </Typography>
      <Typography variant="h6">{counts.packaging ?? 0}</Typography>
    </Paper>

    {/* מתכונים */}
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        minHeight: 120,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <MenuBookIcon sx={{ fontSize: 40, color: '#7c5c3b', mb: 1 }} />
      <Typography variant="subtitle2">
        {strings.dashboard?.recipes || 'מתכונים'}
      </Typography>
      <Typography variant="h6">{counts.recipes ?? 0}</Typography>
    </Paper>

    {/* חומרי גלם */}
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        minHeight: 120,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <CakeIcon sx={{ fontSize: 40, color: '#bfa47a', mb: 1 }} />
      <Typography variant="subtitle2">
        {strings.dashboard?.ingredients || 'חומרי גלם'}
      </Typography>
      <Typography variant="h6">{counts.ingredients ?? 0}</Typography>
    </Paper>
     {/* רווח נקי */}
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 3,
        minHeight: 120,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
      }}
    >
      <AttachMoneyIcon sx={{ fontSize: 40, color: '#d46a6a', mb: 1 }} />
      <Typography variant="subtitle2">
        {strings.dashboard?.profit || 'רווח נקי'}
      </Typography>
      <Typography variant="h6">₪{counts.profit ?? 0}</Typography>
    </Paper>
  </>
);

export default SummaryCards;