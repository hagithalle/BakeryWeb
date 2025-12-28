import { Box } from "@mui/material";
import TopBar from "./TopBar.jsx";
import Sidebar from "./Sidebar.jsx";

export default function MainLayout({children}) {
    return(
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <TopBar />
            <Box sx={{ display: "flex", flex: 1, flexDirection: "row-reverse" }}>
                <Sidebar />
                <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}