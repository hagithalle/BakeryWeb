import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./Pages/Dashboard.jsx";
import MainLayout from "./Components/Layout/MainLayout";
import IngredientsPage from "./Pages/IngredientsPage.jsx";
import ProductsPage from "./Pages/ProductsPage.jsx";
import PackagingPage from "./Pages/PackagingPage.jsx";
import CostsManagementPage from "./Pages/CostsManagementPage.jsx";
import IncomeExpense from "./Pages/IncomeExpense.jsx";
import FixedExpensesPage from './Pages/FixedExpensesPage.jsx';
import RecipesPage from './Pages/RecipesPage.jsx';
import LoginPage from './Pages/LoginPage.jsx';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
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

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
