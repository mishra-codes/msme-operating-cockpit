import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    roles: ["owner", "manager", "employee"],
  },
  {
    name: "Products",
    path: "/products",
    roles: ["owner", "manager", "employee"],
  },
  {
    name: "Customers",
    path: "/customers",
    roles: ["owner", "manager", "employee"],
  },
  {
    name: "Suppliers",
    path: "/suppliers",
    roles: ["owner", "manager"],
  },
  {
    name: "Sales",
    path: "/sales",
    roles: ["owner", "manager", "employee"],
  },
  {
    name: "Purchases",
    path: "/purchases",
    roles: ["owner", "manager"],
  },
  {
    name: "Credit Ledger",
    path: "/credit-ledger",
    roles: ["owner", "manager"],
  },
  {
    name: "Cash Transactions",
    path: "/cash-transactions",
    roles: ["owner"],
  },
  {
    name: "Stock Alerts",
    path: "/stock-alerts",
    roles: ["owner", "manager"],
  },
  {
    name: "Users",
    path: "/users",
    roles: ["owner"],
  },
];

  const visibleNavItems = navItems.filter((item) =>
  item.roles.includes(user?.role)
);

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">

        <div className="px-6 py-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">
            MSME Cockpit
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Business Management
          </p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">

          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

        </nav>

        {/* User section */}
        <div className="border-t border-gray-700 p-4">

          <div className="mb-3">
            <p className="text-sm font-medium">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-gray-400 capitalize">
              {user?.role || "User"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

    </div>
  );
}

export default MainLayout;