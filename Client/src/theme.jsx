import { createTheme } from "@mui/material/styles";

const bakery = {
  cream: "#F9F5F1",
  sand: "#E8D5C4",
  caramel: "#B7795A",
  burgundy: "#A63D40",
  burgundyDark: "#6B1126",
  burgundyDeep: "#971936",
  gold: "#C98929",
  goldLight: "#E2B35A",
  honey: "#9B5A25",
  warmWhite: "#FEFEFE",
  softPink: "#F5E6E0",
  peach: "#F0E4DB",
};

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: bakery.burgundy,
      light: "#C87878",
      dark: bakery.burgundyDark,
      contrastText: "#fff",
    },
    secondary: {
      main: bakery.gold,
      light: bakery.goldLight,
      dark: bakery.honey,
      contrastText: "#fff",
    },
    background: {
      default: bakery.cream,
      paper: bakery.warmWhite,
    },
    text: {
      primary: "#3D2B1F",
      secondary: bakery.honey,
    },
    success: {
      main: "#2E7D32",
      light: "#E8F5E9",
      contrastText: "#fff",
    },
    warning: {
      main: "#E65100",
      light: "#FFF3E0",
      contrastText: "#fff",
    },
    error: {
      main: bakery.burgundy,
      light: "#FFEBEE",
      contrastText: "#fff",
    },
  },
  typography: {
    fontFamily: '"Assistant", "Heebo", "Roboto", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.5px",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "0.95rem",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.95rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.01em",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(166, 61, 64, 0.07)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.78rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "14px 18px",
          borderColor: "#F5EDE8",
        },
        head: {
          fontWeight: 700,
          fontSize: "0.875rem",
          letterSpacing: "0.02em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: "all 0.2s ease",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": {
            color: bakery.burgundy,
            "& + .MuiSwitch-track": {
              backgroundColor: bakery.burgundy,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: bakery.caramel,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: bakery.burgundy,
          },
        },
        notchedOutline: {
          borderColor: bakery.sand,
        },
      },
    },
  },
});

export default theme;
