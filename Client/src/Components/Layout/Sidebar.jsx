import { Box, IconButton, List, ListItemButton, Tooltip, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import useLocaleStrings from "../../hooks/useLocaleStrings";
import { useAuth } from "../../context/AuthContext";
import { brandPalette as p } from "../../constants/brandPalette";
import BakeryIdentity from "../Branding/BakeryIdentity";
import BakeryManagerLogo from "../Branding/BakeryManagerLogo";
import { NAV_GROUPS, isNavItemActive, navLabel } from "./navigation";

const FONT = '"Assistant", "Heebo", "Roboto", sans-serif';

function NavItem({ item, lang, active }) {
    const Icon = item.icon;
    return (
        <ListItemButton
            component={RouterLink}
            to={item.path}
            aria-current={active ? "page" : undefined}
            sx={{
                position: "relative",
                minHeight: 44,
                gap: 1.5,
                px: 1.5,
                mb: 0.25,
                borderRadius: "12px",
                color: active ? p.burgundy : p.ink,
                bgcolor: active ? p.blush : "transparent",
                "&:hover": { bgcolor: active ? p.blush : p.blushSoft, color: p.burgundy },
                // Active marker on the inline-start edge (right in RTL).
                "&::before": active ? {
                    content: '""',
                    position: "absolute",
                    insetInlineStart: 0,
                    top: "22%",
                    height: "56%",
                    width: 3,
                    borderRadius: 4,
                    bgcolor: p.burgundy,
                } : {},
                transition: "background-color 0.15s ease, color 0.15s ease",
            }}
        >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
            <Typography sx={{ fontFamily: FONT, fontSize: 15, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {navLabel(item.label, lang)}
            </Typography>
        </ListItemButton>
    );
}

export default function Sidebar({ lang = "he" }) {
    const { pathname } = useLocation();
    const strings = useLocaleStrings(lang);
    const { user, logout } = useAuth();

    return (
        <Box
            component="aside"
            sx={{
                width: 248,
                flexShrink: 0,
                height: "100vh",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                bgcolor: p.white,
                borderInlineEnd: `1px solid ${p.border}`,
                boxShadow: "8px 0 32px -12px rgba(94, 20, 40, 0.12)",
                direction: strings.direction,
                order: strings.direction === "rtl" ? 1 : 0,
                fontFamily: FONT,
            }}
        >
            {/* The bakery's own identity (never another bakery's logo) */}
            <Box sx={{ px: 2.5, pt: 3, pb: 2.5, borderBottom: `1px solid ${p.border}` }}>
                <BakeryIdentity />
            </Box>

            {/* Grouped navigation */}
            <Box component="nav" aria-label={lang === "he" ? "ניווט ראשי" : "Main navigation"} sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1.5 }}>
                {NAV_GROUPS.map((group) => (
                    <Box key={group.id} sx={{ mb: 1.5 }}>
                        {group.id !== "main" && (
                            <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: p.muted, px: 1.5, pt: 0.5, pb: 0.75 }}>
                                {navLabel(group.label, lang)}
                            </Typography>
                        )}
                        <List disablePadding>
                            {group.items.map((item) => (
                                <NavItem key={item.id} item={item} lang={lang} active={isNavItemActive(item, pathname)} />
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* Signed-in user + logout */}
            <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${p.border}`, display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: p.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.name || user?.email || ""}
                    </Typography>
                    {user?.name && user?.email && (
                        <Typography sx={{ fontFamily: FONT, fontSize: 13, color: p.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr", textAlign: "right" }}>
                            {user.email}
                        </Typography>
                    )}
                </Box>
                <Tooltip title="התנתקות" placement="top">
                    <IconButton
                        onClick={logout}
                        aria-label="התנתקות"
                        sx={{ width: 44, height: 44, color: p.burgundy, "&:hover": { bgcolor: p.blushSoft } }}
                    >
                        <LogOut size={20} strokeWidth={1.9} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Universal software brand, kept subtle */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1.25, bgcolor: p.cream, borderTop: `1px solid ${p.border}` }}>
                <BakeryManagerLogo height={30} alt="" />
                <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: p.muted }}>
                    <bdi>BakeryManager</bdi>
                </Typography>
            </Box>
        </Box>
    );
}
