import {
    List,
    ListItemButton,
    ListItemText,
    Box,
    Typography,
    IconButton,
    Tooltip,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

import logoUrl              from '../../assets/images/logo.png';
import dashboardIconUrl      from '../../assets/icons/sidebar/dashboard-icon.svg';
import ingredientsIconUrl    from '../../assets/icons/sidebar/ingredients-icon.svg';
import packagingIconUrl      from '../../assets/icons/sidebar/packaging-icon.svg';
import recipesIconUrl        from '../../assets/icons/sidebar/recipes-icon.svg';
import productsIconUrl       from '../../assets/icons/sidebar/products-icon.svg';
import financeIconUrl        from '../../assets/icons/sidebar/finance-icon.svg';
import costManagementIconUrl from '../../assets/icons/sidebar/cost-management-icon.svg';

export default function Sidebar({ lang = "he" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const strings = useLocaleStrings(lang);
    const { user, logout } = useAuth();

    const menuItems = [
        { label: "דשבורד",                       path: "/dashboard",      svgSrc: dashboardIconUrl },
        { label: strings.sidebar.ingredients,    path: "/ingredients",    svgSrc: ingredientsIconUrl },
        { label: strings.sidebar.packaging,      path: "/packaging",      svgSrc: packagingIconUrl },
        { label: strings.sidebar.recipes,        path: "/recipes",        svgSrc: recipesIconUrl },
        { label: strings.sidebar.products,       path: "/products",       svgSrc: productsIconUrl },
        { label: "הכנסות והוצאות",               path: "/income-expense", svgSrc: financeIconUrl },
        { label: "ניהול עלויות",                  path: "/costs",          svgSrc: costManagementIconUrl },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <Box sx={{
            width: 240,
            flexShrink: 0,
            bgcolor: '#FEFEFE',
            color: '#A63D40',
            boxShadow: '8px 0 32px -8px rgba(224, 207, 194, 0.7)',
            direction: strings.direction,
            textAlign: strings.direction === "rtl" ? "right" : "left",
            order: strings.direction === "rtl" ? 1 : 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
        }}>
            {/* Logo */}
            <Box sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 3,
                borderBottom: '1px solid #F0E4DB',
                overflow: 'hidden',
            }}>
                <img
                    src={logoUrl}
                    alt="Logo"
                    loading="lazy"
                    style={{ height: 110, width: 'auto', maxWidth: '90%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
            </Box>

            {/* Nav items */}
            <List sx={{ width: '100%', px: 1.5, pt: 2, overflow: 'hidden', flex: 1 }}>
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <ListItemButton
                            key={item.path}
                            selected={active}
                            onClick={() => navigate(item.path)}
                            sx={{
                                justifyContent: strings.direction === "rtl" ? "flex-end" : "flex-start",
                                textAlign: strings.direction === "rtl" ? "right" : "left",
                                color: active ? "#A63D40" : "#7A5540",
                                bgcolor: active ? "#F5E6E0" : "transparent",
                                borderRadius: "14px",
                                mb: 0.5,
                                px: 1.5,
                                overflow: 'hidden',
                                width: '100%',
                                maxWidth: '100%',
                                position: 'relative',
                                '&::before': active ? {
                                    content: '""',
                                    position: 'absolute',
                                    right: strings.direction === "rtl" ? 0 : 'auto',
                                    left: strings.direction === "rtl" ? 'auto' : 0,
                                    top: '20%',
                                    height: '60%',
                                    width: 3,
                                    borderRadius: '0 4px 4px 0',
                                    bgcolor: '#A63D40',
                                } : {},
                                '&:hover': {
                                    bgcolor: active ? '#F5E6E0' : '#FDF6F0',
                                    color: '#A63D40',
                                },
                                '&.Mui-selected': {
                                    bgcolor: '#F5E6E0',
                                    color: '#A63D40',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: '#F5E6E0' },
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Box
                                component="img"
                                src={item.svgSrc}
                                alt=""
                                loading="lazy"
                                sx={{
                                    width: 32,
                                    height: 32,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                    mr: strings.direction === "rtl" ? 0 : 1.5,
                                    ml: strings.direction === "rtl" ? 1.5 : 0,
                                    opacity: active ? 1 : 0.6,
                                    transition: "opacity 0.2s ease",
                                }}
                            />
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    sx: {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontWeight: active ? 700 : 500,
                                        fontSize: '0.92rem',
                                    }
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            {/* User + logout */}
            <Box sx={{
                p: 2,
                borderTop: '1px solid #F0E4DB',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                background: 'linear-gradient(180deg, transparent 0%, #FDF6F2 100%)',
            }}>
                {/* User row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#7A3B2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name || user?.email || ''}
                        </Typography>
                        {user?.name && (
                            <Typography sx={{ fontSize: 11, color: '#B08070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.email}
                            </Typography>
                        )}
                    </Box>
                    <Tooltip title="התנתקות" placement="top">
                        <IconButton
                            onClick={logout}
                            size="small"
                            sx={{ color: '#C98929', flexShrink: 0, '&:hover': { color: '#9B1F3A', bgcolor: '#FDE8E8' } }}
                        >
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Bakery tagline */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <BakeryDiningIcon sx={{ color: '#C98929', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ color: '#9B5A25', fontWeight: 600 }}>
                        {strings.sidebar?.successMessage || "בהצלחה במאפייה!"}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
