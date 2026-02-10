import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "#971936", // בורדו כהה - הצבע הראשי של הלוגו
      light: "#AE6063", // ורוד-עתיק
      dark: "#6B1126", // בורדו כהה יותר
      contrastText: "#fff",
    },
    secondary: {
      main: "#C98929", // זהב-קרמל
      light: "#D2A5A0", // ורוד-בהיר חולי
      dark: "#9B5A25", // חום-דבש
      contrastText: "#fff"
    },
    background: {
      default: "#FFF8F3", // רקע בז' בהיר מאוד
      paper: "#FEFEFE" // לבן רקע
    },
    text: {
      primary: "#971936", // בורדו כהה לטקסט עיקרי
      secondary: "#9B5A25" // חום-דבש לטקסט משני
    }
  },
  typography: {
    fontFamily: '"Assistant", "Heebo", "Roboto", sans-serif',
  },
});

export default theme;
