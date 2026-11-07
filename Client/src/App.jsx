import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { clerkAppearance } from "./Components/Auth/clerkAppearance";
import { clerkLocalization } from "./Components/Auth/clerkLocalization";
import AccountProblemPage from "./Components/Auth/AccountProblemPage";
import PageLoader from "./Components/Common/PageLoader";
import Dashboard from "./Pages/Dashboard.jsx";
import MainLayout from "./Components/Layout/MainLayout";
import IngredientsPage from "./Pages/IngredientsPage.jsx";
import ProductsPage from "./Pages/ProductsPage.jsx";
import PackagingPage from "./Pages/PackagingPage.jsx";
import CostsManagementPage from "./Pages/CostsManagementPage.jsx";
import IncomeExpense from "./Pages/IncomeExpense.jsx";
import FixedExpensesPage from './Pages/FixedExpensesPage.jsx';
import PurchaseVatReviewPage from './Pages/PurchaseVatReviewPage';
import RecipesPage from './Pages/RecipesPage.jsx';
import LoginPage from './Pages/LoginPage.jsx';
import SignUpPage from './Pages/SignUpPage.jsx';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppRoutes() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <PageLoader message="מתחברים..." />;
  }

  if (status === 'signedOut') {
    return (
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (status === 'problem') {
    return <AccountProblemPage />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/sign-up/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/packaging" element={<PackagingPage />} />
        <Route path="/income-expense" element={<IncomeExpense />} />
        <Route path="/costs" element={<CostsManagementPage />} />
        <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
        <Route path="/purchase-vat" element={<PurchaseVatReviewPage />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  const navigate = useNavigate();

  if (!CLERK_PUBLISHABLE_KEY) {
    // Without this check ClerkProvider throws and the whole app renders as a blank page.
    return (
      <div dir="rtl" style={{ padding: 32, fontFamily: 'sans-serif' }}>
        חסרה הגדרת VITE_CLERK_PUBLISHABLE_KEY — לא ניתן להציג את מסך ההתחברות.
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      localization={clerkLocalization}
      appearance={clerkAppearance}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/login"
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
