import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import MainLayout from "./Components/Layout/MainLayout";
import IngredientsPage from "./Pages/IngredientsPage.jsx";
import ProductsPage from "./Pages/ProductsPage.jsx";

import PackagingPage from "./Pages/PackagingPage.jsx";

import CostsManagementPage from "./Pages/CostsManagementPage.jsx";

import IncomeExpense from "./Pages/IncomeExpense.jsx";
import FixedExpensesPage from './Pages/FixedExpensesPage.jsx';
import RecipesPage from './Pages/RecipesPage.jsx';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/packaging" element={<PackagingPage />} />
         <Route path="/income-expense" element={<IncomeExpense />} />
        <Route path="/costs" element={<CostsManagementPage />} />
        <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
       
      </Routes>
    </MainLayout>
  );
}

export default App;
