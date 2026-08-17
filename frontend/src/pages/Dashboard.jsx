import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const number = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const dateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getAmount = (item) =>
  Number(
    item?.total_amount ??
      item?.amount ??
      item?.line_total ??
      item?.total ??
      0
  );

function MetricCard({ label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl ${tones[tone]} flex items-center justify-center`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ message = "Not enough data yet" }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
      {message}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [credit, setCredit] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setError("");

      const [
        summaryResponse,
        salesResponse,
        purchasesResponse,
        lowStockResponse,
        cashFlowResponse,
        creditResponse,
        productsResponse,
      ] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/recent-sales"),
        api.get("/dashboard/recent-purchases"),
        api.get("/dashboard/low-stock"),
        api.get("/dashboard/cash-flow"),
        api.get("/dashboard/outstanding-credit"),
        api.get("/products/"),
      ]);

      setData(summaryResponse.data);
      setRecentSales(salesResponse.data || []);
      setRecentPurchases(purchasesResponse.data || []);
      setLowStock(lowStockResponse.data || []);
      setCashFlow(cashFlowResponse.data || null);
      setCredit(creditResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;

      try {
        setError("");

        const [
          summaryResponse,
          salesResponse,
          purchasesResponse,
          lowStockResponse,
          cashFlowResponse,
          creditResponse,
          productsResponse,
        ] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/recent-sales"),
          api.get("/dashboard/recent-purchases"),
          api.get("/dashboard/low-stock"),
          api.get("/dashboard/cash-flow"),
          api.get("/dashboard/outstanding-credit"),
          api.get("/products/"),
        ]);

        if (cancelled) return;

        setData(summaryResponse.data);
        setRecentSales(salesResponse.data || []);
        setRecentPurchases(purchasesResponse.data || []);
        setLowStock(lowStockResponse.data || []);
        setCashFlow(cashFlowResponse.data || null);
        setCredit(creditResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    const interval = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const salesVsPurchases = useMemo(() => {
    const rows = new Map();

    [...recentSales, ...recentPurchases].forEach((item) => {
      const isPurchase =
        item.purchase_date !== undefined ||
        item.purchase_id !== undefined ||
        item.supplier_id !== undefined;

      const date = dateLabel(
        item.sale_date ??
          item.purchase_date ??
          item.created_at
      );

      if (!date) return;

      if (!rows.has(date)) {
        rows.set(date, { date, sales: 0, purchases: 0 });
      }

      rows.get(date)[isPurchase ? "purchases" : "sales"] += getAmount(item);
    });

    return Array.from(rows.values()).slice(-8);
  }, [recentSales, recentPurchases]);

  const inventoryHealth = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(
      (product) => Number(product.current_stock) <= 0
    ).length;
    const low = products.filter(
      (product) =>
        Number(product.current_stock) > 0 &&
        Number(product.current_stock) <= Number(product.reorder_point)
    ).length;
    const healthy = Math.max(total - low - outOfStock, 0);

    return [
      { name: "Healthy", value: healthy },
      { name: "Low stock", value: low },
      { name: "Out of stock", value: outOfStock },
    ].filter((item) => item.value > 0);
  }, [products]);

  const categoryData = useMemo(() => {
    const counts = {};

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      counts[category] = (counts[category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const cashIn =
    Number(
      cashFlow?.cash_in ??
        cashFlow?.total_cash_in ??
        cashFlow?.inflow ??
        0
    );

  const cashOut =
    Number(
      cashFlow?.cash_out ??
        cashFlow?.total_cash_out ??
        cashFlow?.outflow ??
        0
    );

  const cashChart =
    cashIn || cashOut
      ? [
          { name: "Cash In", amount: cashIn },
          { name: "Cash Out", amount: cashOut },
        ]
      : [];

  const totalOutstanding = credit.reduce(
    (sum, item) =>
      sum +
      Number(
        item?.balance_after ??
          item?.outstanding_amount ??
          item?.amount ??
          0
      ),
    0
  );

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-white" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-white" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="h-80 rounded-2xl bg-white xl:col-span-2" />
            <div className="h-80 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              BUSINESS OVERVIEW
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {greeting}, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening across your business.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:self-auto"
          >
            Refresh data
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total sales"
            value={money(data.total_sales)}
            detail={`${number(data.total_products)} products tracked`}
            tone="blue"
          />
          <MetricCard
            label="Cash in hand"
            value={money(data.cash_in_hand)}
            detail="Current available cash"
            tone="green"
          />
          <MetricCard
            label="Outstanding credit"
            value={money(data.outstanding_credit)}
            detail={`${number(credit.length)} credit records`}
            tone="amber"
          />
          <MetricCard
            label="Low stock"
            value={number(data.low_stock_products)}
            detail="Products needing attention"
            tone="red"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Panel
            title="Sales & purchases"
            subtitle="Recent transaction activity"
            className="xl:col-span-2"
          >
            {salesVsPurchases.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesVsPurchases}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 30px rgba(15,23,42,.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#salesFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    name="Purchases"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#purchaseFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Create a few sales or purchases to see the trend." />
            )}
          </Panel>

          <Panel
            title="Inventory health"
            subtitle="Current stock position"
          >
            {inventoryHealth.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={inventoryHealth}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {inventoryHealth.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ["#10b981", "#f59e0b", "#ef4444"][index] || "#64748b"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-950">
                      {products.length}
                    </p>
                    <p className="text-xs text-slate-400">products</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyChart message="Add products to see inventory health." />
            )}

            <div className="space-y-2">
              {inventoryHealth.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          ["#10b981", "#f59e0b", "#ef4444"][index],
                      }}
                    />
                    {item.name}
                  </span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Product mix" subtitle="Products by category">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ left: 20, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" name="Products" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Add products with categories to see the mix." />
            )}
          </Panel>

          <Panel title="Cash movement" subtitle="Current cash inflow vs outflow">
            {cashChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Cash-flow data will appear here when available." />
            )}
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel
            title="Low-stock alerts"
            subtitle={`${lowStock.length} products need attention`}
            className="lg:col-span-2"
          >
            {lowStock.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">SKU</th>
                      <th className="pb-3 pr-4 text-right">Stock</th>
                      <th className="pb-3 text-right">Reorder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowStock.slice(0, 6).map((product) => {
                      const current = Number(product.current_stock || 0);
                      const reorder = Number(product.reorder_point || 0);
                      const critical = current <= reorder * 0.5;

                      return (
                        <tr key={product.id} className="group">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-slate-500">
                            {product.sku || "—"}
                          </td>
                          <td
                            className={`py-3 pr-4 text-right font-semibold ${
                              critical ? "text-red-600" : "text-amber-600"
                            }`}
                          >
                            {current} {product.unit || ""}
                          </td>
                          <td className="py-3 text-right text-slate-500">
                            {reorder} {product.unit || ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-700">
                Inventory looks healthy. No products are currently below the reorder point.
              </div>
            )}
          </Panel>

          <Panel title="Business snapshot" subtitle="Key operational totals">
            <div className="space-y-4">
              {[
                ["Products", data.total_products],
                ["Customers", data.total_customers],
                ["Suppliers", data.total_suppliers],
                ["Purchases", money(data.total_purchases)],
                ["Outstanding credit", money(data.outstanding_credit)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-950">
                    {value}
                  </span>
                </div>
              ))}

              {totalOutstanding > 0 && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Receivables to watch
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-900">
                    {money(totalOutstanding)}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;