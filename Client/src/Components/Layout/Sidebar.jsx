import {
    List,
    ListItemButton,
    ListItemText,
    Box,
    Toolbar,
    Typography
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import CakeIcon from '@mui/icons-material/Cake';
import InventoryIcon from '@mui/icons-material/Inventory';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import CalculateIcon from '@mui/icons-material/Calculate';
import PieChartIcon from '@mui/icons-material/PieChart';

const menuKeys = ["ingredients", "recipes", "products"];


export default function Sidebar({ lang = "he" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const strings = useLocaleStrings(lang);
    console.log('Sidebar direction:', strings.direction, 'lang:', lang);

    const menuItems = [
        { label: "דשבורד", path: "/dashboard", icon: DashboardIcon },
        { label: strings.sidebar.ingredients, path: "/ingredients", icon: InventoryIcon },
        { label: strings.sidebar.packaging, path: "/packaging", icon: LocalShippingIcon },
        { label: strings.sidebar.recipes, path: "/recipes", icon: MenuBookIcon },
        { label: strings.sidebar.products, path: "/products", icon: CakeIcon },
        { label: "הכנסות והוצאות", path: "/income-expense", icon: AttachMoneyIcon },
        { label: "ניהול עלויות", path: "/costs", icon: CalculateIcon },
    ];

    return (
        <Box sx={{
            width: 240,
            flexShrink: 0,
            bgcolor: '#FEFEFE',
            color: '#971936',
            boxShadow: '8px 0 24px -8px #e0cfc2', // soft shadow only on the left
            direction: strings.direction,
            textAlign: strings.direction === "rtl" ? "right" : "left",
            order: strings.direction === "rtl" ? 1 : 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            overflow: 'hidden',
            overflowX: 'hidden',
            boxSizing: 'border-box'
        }}>
            <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                py: 3,
                borderBottom: '1px solid #D2A5A0',
                overflow: 'hidden'
            }}>
                <img src="/src/assets/images/logo.png" alt="Logo" style={{ height: 110, width: 'auto', maxWidth: '90%', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </Box>
            <List sx={{ width: '100%', px: 2, pt: 2, overflow: 'hidden' }}>
                {menuItems.map((item, idx) => (
                    <ListItemButton
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                            justifyContent: strings.direction === "rtl" ? "flex-end" : "flex-start",
                            textAlign: strings.direction === "rtl" ? "right" : "left",
                            color: location.pathname === item.path ? "#971936" : "#9B5A25",
                            bgcolor: location.pathname === item.path ? "#F5E6E0" : "transparent",
                            borderRadius: 2,
                            mb: 0.5,
                            overflow: 'hidden',
                            width: '100%',
                            maxWidth: '100%',
                            '&:hover': {
                                bgcolor: '#F5E6E0',
                                color: '#971936'
                            },
                            '&.Mui-selected': {
                                bgcolor: '#F5E6E0',
                                color: '#971936',
                                fontWeight: 600,
                                '&:hover': {
                                    bgcolor: '#F5E6E0'
                                }
                            }
                        }}
                    >
                        <item.icon sx={{ 
                            mr: strings.direction === "rtl" ? 0 : 1.5, 
                            ml: strings.direction === "rtl" ? 1.5 : 0,
                            color: location.pathname === item.path ? "#971936" : "#9B5A25",
                            flexShrink: 0
                        }} />
                        <ListItemText 
                            primary={item.label}
                            primaryTypographyProps={{
                                sx: {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }
                            }}
                        />
                    </ListItemButton>
                ))}
            </List>
            
            {/* Bottom Message */}
            <Box sx={{ 
                mt: 'auto', 
                p: 2, 
                borderTop: '1px solid #D2A5A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                flexDirection: 'column'
            }}>
                <BakeryDiningIcon sx={{ color: '#C98929', fontSize: 32 }} />
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: '#9B5A25',
                        textAlign: 'center',
                        fontWeight: 500,
                        lineHeight: 1.4
                    }}
                >
                    {strings.sidebar?.successMessage || "בהצלחה במאפייה!"}
                </Typography>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: '#C98929',
                        textAlign: 'center',
                        fontWeight: 600
                    }}
                >
                    {strings.sidebar?.goodDay || "יום טוב"} 🎂
                </Typography>
            </Box>
        </Box>
    );
}