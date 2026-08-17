import {
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";
import { useAuth } from "../context/useAuth";

const navGroups = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["owner", "manager", "employee"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Products",
        path: "/products",
        icon: Package,
        roles: ["owner", "manager", "employee"],
      },
      {
        name: "Sales",
        path: "/sales",
        icon: ShoppingCart,
        roles: ["owner", "manager", "employee"],
      },
      {
        name: "Purchases",
        path: "/purchases",
        icon: Truck,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        name: "Stock Alerts",
        path: "/stock-alerts",
        icon: Boxes,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Relationships",
    items: [
      {
        name: "Customers",
        path: "/customers",
        icon: Users,
        roles: ["owner", "manager", "employee"],
      },
      {
        name: "Suppliers",
        path: "/suppliers",
        icon: Truck,
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        name: "Credit Ledger",
        path: "/credit-ledger",
        icon: CreditCard,
        roles: ["owner", "manager"],
      },
      {
        name: "Cash Transactions",
        path: "/cash-transactions",
        icon: CircleDollarSign,
        roles: ["owner"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        name: "Users",
        path: "/users",
        icon: UserCircle,
        roles: ["owner"],
      },
    ],
  },
];

function SidebarContent({
  user,
  logout,
  navigate,
  visibleGroups,
  collapsed = false,
  mobile = false,
  onMobileClose,
}) {
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={`flex h-[72px] items-center border-b border-slate-800 ${
          collapsed && !mobile
            ? "justify-center px-3"
            : "justify-between px-5"
        }`}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
            S
          </div>

          {(!collapsed || mobile) && (
            <div className="text-left">
              <p className="text-sm font-bold tracking-tight text-white">
                SethSaathi
              </p>
              <p className="text-[11px] text-slate-500">
                Business Operations
              </p>
            </div>
          )}
        </button>

        {mobile && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-6">
            {(!collapsed || mobile) && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {group.label}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={mobile ? onMobileClose : undefined}
                    title={collapsed && !mobile ? item.name : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all ${
                        collapsed && !mobile
                          ? "justify-center px-2"
                          : "gap-3 px-3"
                      } ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className="shrink-0"
                        />

                        {(!collapsed || mobile) && (
                          <span>{item.name}</span>
                        )}

                        {isActive && (
                          <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        <div
          className={`mb-2 flex items-center rounded-xl bg-slate-800/70 ${
            collapsed && !mobile
              ? "justify-center p-2"
              : "gap-3 px-3 py-3"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user?.role || "User"}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={collapsed && !mobile ? "Logout" : undefined}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 ${
            collapsed && !mobile
              ? "justify-center px-2"
              : "gap-3 px-3"
          }`}
        >
          <LogOut size={18} />

          {(!collapsed || mobile) && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </div>
  );
}

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(user?.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const currentPage =
    navGroups
      .flatMap((group) => group.items)
      .find((item) => item.path === location.pathname)?.name ||
    "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 bg-slate-950 transition-all duration-200 lg:block ${
          sidebarCollapsed ? "w-[76px]" : "w-[260px]"
        }`}
      >
        <SidebarContent
          user={user}
          logout={logout}
          navigate={navigate}
          visibleGroups={visibleGroups}
          collapsed={sidebarCollapsed}
        />

        <button
          onClick={() =>
            setSidebarCollapsed((value) => !value)
          }
          className="absolute -right-3 top-[84px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-950 lg:hidden">
            <SidebarContent
              user={user}
              logout={logout}
              navigate={navigate}
              visibleGroups={visibleGroups}
              mobile
              onMobileClose={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main area */}
      <div
        className={`min-h-screen transition-all duration-200 ${
          sidebarCollapsed
            ? "lg:pl-[76px]"
            : "lg:pl-[260px]"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-[72px] border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            {/* Search */}
            <div className="relative hidden max-w-xl flex-1 md:block">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search products, customers, orders..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-20 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
                Ctrl K
              </span>
            </div>

            {/* Mobile title */}
            <div className="flex-1 md:hidden">
              <p className="text-sm font-semibold text-slate-900">
                {currentPage}
              </p>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen((value) => !value);
                    setUserMenuOpen(false);
                  }}
                  className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Notifications
                        </p>
                        <p className="text-xs text-slate-400">
                          SethSaathi updates
                        </p>
                      </div>

                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close notifications"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-3">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate("/stock-alerts");
                        }}
                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <Boxes size={16} />
                        </span>

                        <span>
                          <span className="block text-sm font-medium text-slate-800">
                            Stock monitoring
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            Review products that may need reordering.
                          </span>
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate("/credit-ledger");
                        }}
                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <CreditCard size={16} />
                        </span>

                        <span>
                          <span className="block text-sm font-medium text-slate-800">
                            Credit ledger
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                            Review customer credit and outstanding entries.
                          </span>
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-center text-xs text-slate-400">
                        Operational alerts will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden h-7 w-px bg-slate-200 sm:block" />

              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setUserMenuOpen((value) => !value);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100"
                  aria-label="Open user menu"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="hidden xl:block">
                    <p className="max-w-[130px] truncate text-sm font-medium text-slate-900">
                      {user?.name || "User"}
                    </p>

                    <p className="text-[11px] capitalize text-slate-400">
                      {user?.role || "User"}
                    </p>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.name || "User"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user?.email || "Account"}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-slate-400">
                            {user?.role || "User"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate("/users");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <UserCircle size={17} />
                        Account
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          navigate("/login");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={17} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;