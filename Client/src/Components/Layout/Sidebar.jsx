import {
  List,
  ListItemButton,
  ListItemText,
  Box,
    Toolbar,
} from "@mui/material";

import { useLocation, useNavigate } from "react-router-dom";




const menuItems = [
  { label: "Ingredients", path: "/ingredients" },
  { label: "Recipes", path: "/recipes" },
  { label: "Products", path: "/products" },
];


export default function Sidebar() {
    const navigate= useNavigate();
    const location =  useLocation();

    return(
        <Box sx={{
            width: 220,
            bgcolor: 'primary.main',
           
        }}
        >
            <Toolbar>
<Box sx={{ fontWeight: 700, fontSize: 18}}>
    Hagit Admin
</Box>
</Toolbar>

<List>
    {menuItems.map((item)=>(
        <ListItemButton
        key={item.path}
        selected={location.pathname === item.path}
        onClick={()=> navigate (item.path)}
        >
            <ListItemText primary={item.label} />
        </ListItemButton>
    ))}
</List>

        </Box>
    )
}