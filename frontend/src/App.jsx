import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Forbidden from "./pages/Forbidden";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";

import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import CreditLedger from "./pages/CreditLedger";
import Purchases from "./pages/Purchases";
import CashTransactions from "./pages/CashTransactions";
import Users from "./pages/Users";
import StockAlerts from "./pages/StockAlerts";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            Public Routes
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forbidden"
          element={<Forbidden />}
        />

        {/* =========================
            Protected Application
        ========================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            {/* Dashboard */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Products */}

            <Route
              path="/products"
              element={<Products />}
            />

            {/* Suppliers */}

            <Route
              path="/suppliers"
              element={<Suppliers />}
            />

            {/* Customers */}

            <Route
              path="/customers"
              element={<Customers />}
            />

            {/* Sales */}

            <Route
              path="/sales"
              element={<Sales />}
            />

            {/* Purchases */}

            <Route
              path="/purchases"
              element={<Purchases />}
            />

            {/* Credit Ledger */}

            <Route
              path="/credit-ledger"
              element={<CreditLedger />}
            />

            {/* Cash Transactions */}

            <Route
              path="/cash-transactions"
              element={<CashTransactions />}
            />

            {/* Stock Alerts */}

            <Route
              path="/stock-alerts"
              element={<StockAlerts />}
            />

            {/* =========================
                Owner Only
            ========================= */}

            <Route
              element={
                <RoleRoute allowedRoles={["owner"]} />
              }
            >

              <Route
                path="/users"
                element={<Users />}
              />

            </Route>

          </Route>

        </Route>

        {/* =========================
            Fallback
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;