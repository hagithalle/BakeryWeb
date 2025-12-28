import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "rgba(117, 11, 19, 1)", // בורדו כהה
      light: "rgba(158, 51, 69, 1)", // ורוד בהיר (למצבים של hover/active)
      contrastText: "#fff", // טקסט לבן על כפתור כהה
    },
    secondary: {
      main: "#9ECFD4", // תכלת עדין
      light: "#eaf6fb", // תכלת בהיר
      contrastText: "#333"
    },
    background: {
      default: "#FFE6D4", // רקע כללי
      paper: "#fff" // רקע כרטיסים/טבלאות
    },
  },
  typography: {
    fontFamily: '"Assistant", "Heebo", "Roboto", sans-serif',
  },
});

export default theme;
