import {
    List,
    ListItemButton,
    ListItemText,
    Box,
    Toolbar,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import CakeIcon from '@mui/icons-material/Cake';
import InventoryIcon from '@mui/icons-material/Inventory';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const menuKeys = ["ingredients", "recipes", "products"];


export default function Sidebar({ lang = "he" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const strings = useLocaleStrings(lang);
    console.log('Sidebar direction:', strings.direction, 'lang:', lang);

    const menuItems = [
        { label: strings.sidebar.ingredients, path: "/ingredients", icon: InventoryIcon },
        { label: strings.sidebar.recipes, path: "/recipes", icon: MenuBookIcon },
        { label: strings.sidebar.products, path: "/products", icon: CakeIcon },
    ];

    return (
        <Box sx={{
            width: 220,
            bgcolor: '#9ECFD4',
            color: '#9ECFD4',
            borderRight: strings.direction === "rtl" ? "1px solid rgba(0, 0, 0, 0.8)" : undefined,
            borderLeft: strings.direction === "ltr" ? "1px solid rgba(0, 0, 0, 0.8)" : undefined,
            direction: strings.direction,
            textAlign: strings.direction === "rtl" ? "right" : "left",
            order: strings.direction === "rtl" ? 1 : 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 0
        }}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <img src="/src/assets/images/logo.png" alt="Logo" style={{ height: 90, maxWidth: 200, objectFit: 'contain' }} />
            </Box>
            <Toolbar />
            <List sx={{ width: '100%' }}>
                {menuItems.map((item, idx) => (
                    <ListItemButton
                        key={item.path}
                        selected={location.pathname === item.path}
                        onClick={() => navigate(item.path)}
                        sx={{
                            justifyContent: strings.direction === "rtl" ? "flex-end" : "flex-start",
                            textAlign: strings.direction === "rtl" ? "right" : "left",
                            color:  "rgba(117, 11, 19, 1)" 
                        }}
                    >
                        <item.icon sx={{ mr: strings.direction === "rtl" ? 0 : 1, ml: strings.direction === "rtl" ? 1 : 0 }} />
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
}