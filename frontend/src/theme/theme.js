import { createTheme } from "@mui/material/styles";

// Enterprise palette: deep corporate blue + teal accent, neutral greys.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0B5394", light: "#3D7CB8", dark: "#073661", contrastText: "#fff" },
    secondary: { main: "#0FA3A3", contrastText: "#fff" },
    background: { default: "#F4F6F9", paper: "#FFFFFF" },
    success: { main: "#2E7D32" },
    warning: { main: "#ED6C02" },
    error: { main: "#C62828" },
    text: { primary: "#1A2230", secondary: "#5A6675" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(16, 36, 64, 0.08)",
          border: "1px solid #E6EAF0",
        },
      },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "0 1px 8px rgba(16,36,64,0.10)" } } },
  },
});

export default theme;
