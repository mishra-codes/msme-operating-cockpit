import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            toneClasses[tone] || toneClasses.blue
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function StockProgress({ current, reorder }) {
  const stock = Number(current || 0);
  const threshold = Number(reorder || 0);

  const percentage =
    threshold > 0
      ? Math.min(Math.max((stock / threshold) * 100, 0), 100)
      : stock > 0
        ? 100
        : 0;

  const isCritical = stock <= threshold * 0.5;
  const isOut = stock <= 0;

  const barClass = isOut
    ? "bg-red-500"
    : isCritical
      ? "bg-red-500"
      : "bg-amber-500";

  return (
    <div className="min-w-[150px]">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">
          {stock.toLocaleString("en-IN")} {threshold ? `/ ${threshold}` : ""}
        </span>
        <span className="text-slate-400">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ critical, outOfStock }) {
  if (outOfStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Out of stock
      </span>
    );
  }

  if (critical) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Critical
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Low stock
    </span>
  );
}

function StockAlerts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const loadProducts = async (showInitialLoader = false) => {
    try {
      if (showInitialLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/products/");
      setProducts(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load stock alerts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get("/products/");

        if (!ignore) {
          setProducts(response.data || []);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load stock alerts.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const classifiedProducts = useMemo(() => {
    return products
      .map((product) => {
        const stock = Number(product.current_stock || 0);
        const reorder = Number(product.reorder_point || 0);

        const outOfStock = stock <= 0;
        const critical =
          !outOfStock && stock <= reorder * 0.5;

        const severity = outOfStock
          ? 0
          : critical
            ? 1
            : 2;

        const shortage = Math.max(reorder - stock, 0);

        const stockPercentage =
          reorder > 0
            ? Math.min((stock / reorder) * 100, 100)
            : stock > 0
              ? 100
              : 0;

        return {
          ...product,
          stock,
          reorder,
          outOfStock,
          critical,
          severity,
          shortage,
          stockPercentage,
        };
      })
      .filter((product) => product.stock <= product.reorder);
  }, [products]);

  const metrics = useMemo(() => {
    const total = products.length;
    const alerts = classifiedProducts.length;
    const critical = classifiedProducts.filter(
      (product) => product.critical || product.outOfStock
    ).length;
    const warning = classifiedProducts.filter(
      (product) => !product.critical && !product.outOfStock
    ).length;

    const healthy = Math.max(total - alerts, 0);

    const unitsToReorder = classifiedProducts.reduce(
      (sum, product) => sum + product.shortage,
      0
    );

    const reorderValue = classifiedProducts.reduce(
      (sum, product) =>
        sum + product.shortage * Number(product.cost_price || 0),
      0
    );

    return {
      total,
      alerts,
      critical,
      warning,
      healthy,
      unitsToReorder,
      reorderValue,
    };
  }, [products.length, classifiedProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = classifiedProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      const matchesSeverity =
        severityFilter === "all" ||
        (severityFilter === "critical" &&
          (product.critical || product.outOfStock)) ||
        (severityFilter === "warning" &&
          !product.critical &&
          !product.outOfStock);

      return matchesSearch && matchesSeverity;
    });

    result.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "severity") {
        aValue = a.severity;
        bValue = b.severity;
      } else if (sortBy === "stock") {
        aValue = a.stock;
        bValue = b.stock;
      } else if (sortBy === "shortage") {
        aValue = a.shortage;
        bValue = b.shortage;
      } else {
        aValue = String(a.name || "").toLowerCase();
        bValue = String(b.name || "").toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [
    classifiedProducts,
    search,
    severityFilter,
    sortBy,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((value) =>
        value === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSeverityFilter("all");
    setSortBy("severity");
    setSortDirection("asc");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-24 rounded-2xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="h-[500px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 text-red-600"
              size={20}
            />

            <div>
              <p className="font-semibold text-red-800">
                Inventory unavailable
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                onClick={() => loadProducts(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              INVENTORY CONTROL
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Stock Alerts
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor inventory risk and identify products that need
              replenishment.
            </p>
          </div>

          <button
            onClick={() => loadProducts(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total products"
            value={metrics.total}
            detail="Products in catalog"
            icon={Boxes}
            tone="blue"
          />

          <StatCard
            label="Healthy"
            value={metrics.healthy}
            detail="Above reorder point"
            icon={CheckCircle2}
            tone="green"
          />

          <StatCard
            label="Low stock"
            value={metrics.warning}
            detail="Replenishment recommended"
            icon={AlertTriangle}
            tone="amber"
          />

          <StatCard
            label="Critical"
            value={metrics.critical}
            detail={`${metrics.unitsToReorder.toLocaleString(
              "en-IN"
            )} units needed`}
            icon={Zap}
            tone="red"
          />
        </div>

        {/* Reorder overview */}
        {metrics.alerts > 0 && (
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm lg:col-span-2">
              <div className="flex flex-col justify-between gap-5 sm:flex-row">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <ShoppingCart size={18} />
                    </div>

                    <p className="text-sm font-semibold text-red-800">
                      Replenishment required
                    </p>
                  </div>

                  <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                    {metrics.alerts}{" "}
                    {metrics.alerts === 1 ? "product" : "products"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    are currently at or below their reorder point.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Estimated reorder value
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {money(metrics.reorderValue)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Based on current cost price
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">
                Inventory health
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                {metrics.total > 0 && (
                  <div className="flex h-full">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${(metrics.healthy / metrics.total) * 100}%`,
                      }}
                    />

                    <div
                      className="bg-amber-500"
                      style={{
                        width: `${(metrics.warning / metrics.total) * 100}%`,
                      }}
                    />

                    <div
                      className="bg-red-500"
                      style={{
                        width: `${(metrics.critical / metrics.total) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Healthy
                  </span>
                  <span className="font-semibold text-slate-900">
                    {metrics.healthy}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Low
                  </span>
                  <span className="font-semibold text-slate-900">
                    {metrics.warning}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Critical
                  </span>
                  <span className="font-semibold text-slate-900">
                    {metrics.critical}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Alerts table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search product, SKU or category..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(event) => {
                    setSeverityFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[170px]"
                >
                  <option value="all">All alerts</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Low stock</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setSortDirection("asc");
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[170px]"
                >
                  <option value="severity">Sort: Severity</option>
                  <option value="stock">Sort: Current stock</option>
                  <option value="shortage">Sort: Shortage</option>
                  <option value="name">Sort: Name</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row sm:items-center">
              <span>
                Showing{" "}
                <strong className="font-semibold text-slate-700">
                  {filteredProducts.length === 0
                    ? 0
                    : (safePage - 1) * pageSize + 1}
                  –
                  {Math.min(
                    safePage * pageSize,
                    filteredProducts.length
                  )}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-700">
                  {filteredProducts.length}
                </strong>{" "}
                alerts
              </span>

              {(search || severityFilter !== "all") && (
                <button
                  onClick={resetFilters}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        Product
                        {sortBy === "name" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SKU
                    </th>

                    <th className="px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("stock")}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        Stock
                        {sortBy === "stock" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Replenishment
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Shortage
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              product.outOfStock || product.critical
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            <Package size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {product.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StockProgress
                          current={product.stock}
                          reorder={product.reorder}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {product.reorder.toLocaleString("en-IN")}{" "}
                          {product.unit || ""}
                        </p>
                        <p className="text-xs text-slate-400">
                          reorder point
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-red-600">
                          {product.shortage.toLocaleString("en-IN")}{" "}
                          {product.unit || ""}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          critical={product.critical}
                          outOfStock={product.outOfStock}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate("/purchases")}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <ShoppingCart size={14} />
                          Reorder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={27} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                All stock levels are healthy
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                No products are currently below their reorder point.
              </p>
            </div>
          )}

          {filteredProducts.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                Page {safePage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={safePage === 1}
                  onClick={() =>
                    setPage(Math.max(1, safePage - 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .slice(
                      Math.max(0, safePage - 3),
                      Math.min(totalPages, safePage + 2)
                    )
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium ${
                          pageNumber === safePage
                            ? "bg-blue-600 text-white"
                            : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                </div>

                <button
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setPage(
                      Math.min(totalPages, safePage + 1)
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StockAlerts;