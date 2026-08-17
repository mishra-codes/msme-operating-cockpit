import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function getCustomerNameById(customers, customerId) {
  const customer = customers.find(
    (item) => String(item.id) === String(customerId)
  );

  return customer?.name || `Customer #${customerId}`;
}

function getProductNameById(products, productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId)
  );

  return product?.name || `Product #${productId}`;
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
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
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function PaymentBadge({ mode }) {
  if (mode === "credit") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
        <CreditCard size={12} />
        Credit
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <DollarSign size={12} />
      Cash
    </span>
  );
}

function Sales() {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [formData, setFormData] = useState({
    customer_id: "",
    payment_mode: "cash",
    product_id: "",
    quantity: "",
    unit_price: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  useEffect(() => {
    let ignore = false;

    const loadSales = async () => {
      try {
        const response = await api.get("/sales/");

        if (!ignore) {
          setSales(response.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load sales.");
          setLoading(false);
        }
      }
    };

    loadSales();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadFormData = async () => {
      try {
        const [customersResponse, productsResponse] =
          await Promise.all([
            api.get("/customers/"),
            api.get("/products/"),
          ]);

        if (!ignore) {
          setCustomers(customersResponse.data || []);
          setProducts(productsResponse.data || []);
        }
      } catch (err) {
        console.error("Unable to load customers/products:", err);
      }
    };

    loadFormData();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshSales = async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await api.get("/sales/");
      setSales(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to refresh sales.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      payment_mode: "cash",
      product_id: "",
      quantity: "",
      unit_price: "",
    });

    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "product_id") {
      const selectedProduct = products.find(
        (product) => String(product.id) === String(value)
      );

      setFormData((prev) => ({
        ...prev,
        product_id: value,
        unit_price: selectedProduct?.sell_price ?? "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.customer_id) {
      setFormError("Please select a customer.");
      return;
    }

    if (!formData.product_id) {
      setFormError("Please select a product.");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    if (
      formData.unit_price === "" ||
      Number(formData.unit_price) < 0
    ) {
      setFormError("Please enter a valid unit price.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/sales/", {
        customer_id: Number(formData.customer_id),
        payment_mode: formData.payment_mode,
        created_by: Number(user.id),
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: Number(formData.quantity),
            unit_price: Number(formData.unit_price),
          },
        ],
      });

      await refreshSales();

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail || "Unable to create sale."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (sale) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Sale #${sale.id}?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete(`/sales/${sale.id}`);
      await refreshSales();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail || "Unable to delete sale."
      );
    } finally {
      setDeleting(false);
    }
  };

  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0
    );

    const creditSales = sales.filter(
      (sale) => sale.payment_mode === "credit"
    );

    const cashSales = sales.filter(
      (sale) => sale.payment_mode !== "credit"
    );

    const creditValue = creditSales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0
    );

    const unitsSold = sales.reduce(
      (sum, sale) =>
        sum +
        (sale.items || []).reduce(
          (itemSum, item) =>
            itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    return {
      totalRevenue,
      totalSales: sales.length,
      averageOrder:
        sales.length > 0 ? totalRevenue / sales.length : 0,
      creditSales: creditSales.length,
      creditValue,
      cashSales: cashSales.length,
      unitsSold,
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = sales.filter((sale) => {
      const customerName = getCustomerNameById(
        customers,
        sale.customer_id
      ).toLowerCase();

      const productNames = (sale.items || [])
        .map((item) =>
          getProductNameById(products, item.product_id)
        )
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        String(sale.id).includes(query) ||
        customerName.includes(query) ||
        productNames.includes(query);

      const matchesPayment =
        paymentFilter === "all" ||
        sale.payment_mode === paymentFilter;

      return matchesSearch && matchesPayment;
    });

    result.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "total") {
        aValue = Number(a.total_amount || 0);
        bValue = Number(b.total_amount || 0);
      } else if (sortBy === "customer") {
        aValue = getCustomerNameById(
          customers,
          a.customer_id
        ).toLowerCase();

        bValue = getCustomerNameById(
          customers,
          b.customer_id
        ).toLowerCase();
      } else {
        aValue = new Date(a.sale_date || 0).getTime();
        bValue = new Date(b.sale_date || 0).getTime();
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
    sales,
    customers,
    products,
    search,
    paymentFilter,
    sortBy,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSales.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visibleSales = filteredSales.slice(
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
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setSortBy("date");
    setSortDirection("desc");
    setPage(1);
  };

  const selectedQuantity = Number(formData.quantity) || 0;
  const selectedUnitPrice = Number(formData.unit_price) || 0;
  const calculatedTotal = selectedQuantity * selectedUnitPrice;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="h-[520px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error && sales.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            Sales unavailable
          </p>

          <p className="mt-1 text-sm text-red-700">{error}</p>

          <button
            onClick={refreshSales}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
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
              REVENUE
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Sales
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage sales, payments and customer transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshSales}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canCreate && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={18} />
                New sale
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={money(metrics.totalRevenue)}
            detail="All recorded sales"
            icon={TrendingUp}
            tone="blue"
          />

          <StatCard
            label="Sales"
            value={metrics.totalSales}
            detail={`${metrics.unitsSold.toLocaleString(
              "en-IN"
            )} units sold`}
            icon={ShoppingBag}
            tone="green"
          />

          <StatCard
            label="Average order"
            value={money(metrics.averageOrder)}
            detail="Revenue per transaction"
            icon={DollarSign}
            tone="violet"
          />

          <StatCard
            label="Credit sales"
            value={money(metrics.creditValue)}
            detail={`${metrics.creditSales} credit transactions`}
            icon={CreditCard}
            tone="amber"
          />
        </div>

        {/* Payment mix */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Payment mix
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Number of transactions by payment mode
                </p>
              </div>

              <CreditCard
                size={19}
                className="text-slate-400"
              />
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
              {metrics.totalSales > 0 && (
                <div className="flex h-full">
                  <div
                    className="bg-emerald-500"
                    style={{
                      width: `${
                        (metrics.cashSales /
                          metrics.totalSales) *
                        100
                      }%`,
                    }}
                  />

                  <div
                    className="bg-orange-500"
                    style={{
                      width: `${
                        (metrics.creditSales /
                          metrics.totalSales) *
                        100
                      }%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Cash
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {metrics.cashSales}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Transactions
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Credit
                </p>

                <p className="mt-2 text-xl font-bold text-slate-950">
                  {metrics.creditSales}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {money(metrics.creditValue)} outstanding
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Package size={19} />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Sales activity
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {metrics.unitsSold.toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              total units sold across recorded transactions
            </p>
          </div>
        </section>

        {/* Sales table */}
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search sale, customer or product..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
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
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[170px]"
                >
                  <option value="all">All payments</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setSortDirection(
                      e.target.value === "date"
                        ? "desc"
                        : "asc"
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[170px]"
                >
                  <option value="date">Sort: Date</option>
                  <option value="total">Sort: Total</option>
                  <option value="customer">
                    Sort: Customer
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-3 text-xs text-slate-400">
              <span>
                Showing{" "}
                <strong className="text-slate-700">
                  {filteredSales.length === 0
                    ? 0
                    : (safePage - 1) * pageSize + 1}
                  –
                  {Math.min(
                    safePage * pageSize,
                    filteredSales.length
                  )}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-700">
                  {filteredSales.length}
                </strong>{" "}
                sales
              </span>

              {(search || paymentFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {visibleSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sale
                    </th>

                    <th className="px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("date")}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        Date
                      </button>
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Items
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Payment
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("total")}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        Total
                      </button>
                    </th>

                    {canDelete && (
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ShoppingBag size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              Sale #{sale.id}
                            </p>

                            <p className="text-xs text-slate-400">
                              {sale.items?.length || 0}{" "}
                              line item
                              {(sale.items?.length || 0) ===
                              1
                                ? ""
                                : "s"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {sale.sale_date
                          ? new Date(
                              sale.sale_date
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {getCustomerNameById(
                          customers,
                          sale.customer_id
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[330px] space-y-1">
                          {sale.items?.map((item) => (
                            <div
                              key={item.id}
                              className="truncate text-slate-600"
                            >
                              <span className="font-medium text-slate-800">
                                {getProductNameById(
                                  products,
                                  item.product_id
                                )}
                              </span>{" "}
                              × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <PaymentBadge
                          mode={sale.payment_mode}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {money(sale.total_amount)}
                        </span>
                      </td>

                      {canDelete && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end opacity-70 transition group-hover:opacity-100">
                            <button
                              onClick={() => handleDelete(sale)}
                              disabled={deleting}
                              title="Delete sale"
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingBag size={26} />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                No sales found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or create your first
                sale.
              </p>

              {canCreate && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  New sale
                </button>
              )}
            </div>
          )}

          {filteredSales.length > pageSize && (
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

      {/* New Sale Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Revenue
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  New sale
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a customer transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Customer
                  </label>

                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                    disabled={formLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  >
                    <option value="">
                      {customers.length === 0
                        ? "Loading customers..."
                        : "Select customer"}
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment mode
                  </label>

                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Product
                  </label>

                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    disabled={formLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  >
                    <option value="">
                      {products.length === 0
                        ? "Loading products..."
                        : "Select product"}
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} —{" "}
                        {money(product.sell_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    placeholder="10"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unit price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Sale total
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {selectedQuantity || 0} units ×{" "}
                      {money(selectedUnitPrice)}
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-slate-950">
                    {money(calculatedTotal)}
                  </p>
                </div>
              </div>

              {formError && (
                <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;