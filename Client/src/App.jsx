import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./Components/Layout/MainLayout.jsx";
import IngredientsPage from "./Pages/IngredientsPage.jsx";
import RecipesPage from "./Pages/RecipesPage.jsx";  
import ProductsPage from "./Pages/ProductsPage.jsx";
import PackagingPage from "./Pages/PackagingPage.jsx";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/ingredients" replace />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/packaging" element={<PackagingPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
