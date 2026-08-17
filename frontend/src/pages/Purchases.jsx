import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
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

function getSupplierNameById(suppliers, supplierId) {
  const supplier = suppliers.find(
    (item) => String(item.id) === String(supplierId)
  );

  return supplier?.name || `Supplier #${supplierId}`;
}

function getProductNameById(products, productId) {
  const product = products.find(
    (item) => String(item.id) === String(productId)
  );

  return product?.name || `Product #${productId}`;
}

function Purchases() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [formData, setFormData] = useState({
    supplier_id: "",
    product_id: "",
    quantity: "",
    unit_cost: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const [
          purchasesResponse,
          suppliersResponse,
          productsResponse,
        ] = await Promise.all([
          api.get("/purchases/"),
          api.get("/suppliers/"),
          api.get("/products/"),
        ]);

        if (!ignore) {
          setPurchases(purchasesResponse.data || []);
          setSuppliers(suppliersResponse.data || []);
          setProducts(productsResponse.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load purchases.");
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshData = async () => {
    try {
      setRefreshing(true);
      setError("");

      const [purchasesResponse, productsResponse] =
        await Promise.all([
          api.get("/purchases/"),
          api.get("/products/"),
        ]);

      setPurchases(purchasesResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to refresh purchases.");
    } finally {
      setRefreshing(false);
    }
  };

  const metrics = useMemo(() => {
    const totalSpend = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total_amount || 0),
      0
    );

    const totalItems = purchases.reduce(
      (sum, purchase) =>
        sum +
        (purchase.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    const averagePurchase =
      purchases.length > 0 ? totalSpend / purchases.length : 0;

    return {
      totalPurchases: purchases.length,
      totalSpend,
      totalItems,
      averagePurchase,
    };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = purchases.filter((purchase) => {
      const supplierName = getSupplierNameById(suppliers, 
        purchase.supplier_id
      ).toLowerCase();

      const productNames = (purchase.items || [])
        .map((item) => getProductNameById(products, item.product_id))
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        String(purchase.id).includes(query) ||
        supplierName.includes(query) ||
        productNames.includes(query);

      const matchesSupplier =
        supplierFilter === "all" ||
        String(purchase.supplier_id) === String(supplierFilter);

      return matchesSearch && matchesSupplier;
    });

    result.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "total") {
        aValue = Number(a.total_amount || 0);
        bValue = Number(b.total_amount || 0);
      } else if (sortBy === "supplier") {
        aValue = getSupplierNameById(suppliers, a.supplier_id).toLowerCase();
        bValue = getSupplierNameById(suppliers, b.supplier_id).toLowerCase();
      } else {
        aValue = new Date(a.purchase_date || 0).getTime();
        bValue = new Date(b.purchase_date || 0).getTime();
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
    purchases,
    search,
    supplierFilter,
    sortBy,
    sortDirection,
    suppliers,
    products,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchases.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visiblePurchases = filteredPurchases.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "product_id") {
      const selectedProduct = products.find(
        (product) => String(product.id) === String(value)
      );

      setFormData((prev) => ({
        ...prev,
        product_id: value,
        unit_cost: selectedProduct?.cost_price ?? "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      product_id: "",
      quantity: "",
      unit_cost: "",
    });

    setFormError("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.supplier_id) {
      setFormError("Please select a supplier.");
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
      formData.unit_cost === "" ||
      Number(formData.unit_cost) < 0
    ) {
      setFormError("Please enter a valid unit cost.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/purchases/", {
        supplier_id: Number(formData.supplier_id),
        created_by: Number(user.id),
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: Number(formData.quantity),
            unit_cost: Number(formData.unit_cost),
          },
        ],
      });

      await refreshData();
      closeForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail ||
          "Unable to create purchase."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (purchase) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Purchase #${purchase.id}?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete(`/purchases/${purchase.id}`);
      await refreshData();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Unable to delete purchase."
      );
    } finally {
      setDeleting(false);
    }
  };

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

  const quantity = Number(formData.quantity) || 0;
  const unitCost = Number(formData.unit_cost) || 0;
  const calculatedTotal = quantity * unitCost;

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

          <div className="h-[500px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error && purchases.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            Purchases unavailable
          </p>

          <p className="mt-1 text-sm text-red-700">{error}</p>

          <button
            onClick={() => window.location.reload()}
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
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              PROCUREMENT
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Purchases
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track supplier purchases and inventory intake.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
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
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus size={18} />
                New purchase
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
            label="Purchases"
            value={metrics.totalPurchases}
            detail="Recorded purchase orders"
            icon={ShoppingCart}
            tone="blue"
          />

          <StatCard
            label="Total spend"
            value={money(metrics.totalSpend)}
            detail="Purchase value recorded"
            icon={TrendingDown}
            tone="amber"
          />

          <StatCard
            label="Units purchased"
            value={metrics.totalItems.toLocaleString("en-IN")}
            detail="Across all purchase items"
            icon={Package}
            tone="green"
          />

          <StatCard
            label="Average purchase"
            value={money(metrics.averagePurchase)}
            detail="Average order value"
            icon={CalendarDays}
            tone="blue"
          />
        </div>

        {/* Purchases */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
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
                  placeholder="Search purchase, supplier or product..."
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
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[190px]"
                >
                  <option value="all">All suppliers</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
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
                      e.target.value === "date" ? "desc" : "asc"
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[170px]"
                >
                  <option value="date">Sort: Date</option>
                  <option value="total">Sort: Total</option>
                  <option value="supplier">Sort: Supplier</option>
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
                  {filteredPurchases.length === 0
                    ? 0
                    : (safePage - 1) * pageSize + 1}
                  –
                  {Math.min(
                    safePage * pageSize,
                    filteredPurchases.length
                  )}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-700">
                  {filteredPurchases.length}
                </strong>{" "}
                purchases
              </span>

              {(search || supplierFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSupplierFilter("all");
                    setPage(1);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {visiblePurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Purchase
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
                      Supplier
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Items
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
                  {visiblePurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ShoppingCart size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              Purchase #{purchase.id}
                            </p>

                            <p className="text-xs text-slate-400">
                              {purchase.items?.length || 0}{" "}
                              line item
                              {(purchase.items?.length || 0) === 1
                                ? ""
                                : "s"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {purchase.purchase_date
                          ? new Date(
                              purchase.purchase_date
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {getSupplierNameById(suppliers, purchase.supplier_id)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[330px] space-y-1">
                          {purchase.items?.map((item) => (
                            <div
                              key={item.id}
                              className="truncate text-slate-600"
                            >
                              <span className="font-medium text-slate-800">
                                {getProductNameById(products, item.product_id)}
                              </span>{" "}
                              × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {money(purchase.total_amount)}
                        </span>
                      </td>

                      {canDelete && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end opacity-70 transition group-hover:opacity-100">
                            <button
                              onClick={() => handleDelete(purchase)}
                              disabled={deleting}
                              title="Delete purchase"
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
                <ShoppingCart size={26} />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                No purchases found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or create your first purchase.
              </p>

              {canCreate && (
                <button
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  New purchase
                </button>
              )}
            </div>
          )}

          {filteredPurchases.length > pageSize && (
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
                    setPage(Math.min(totalPages, safePage + 1))
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

      {/* New Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Procurement
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  New purchase
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record inventory purchased from a supplier.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier
                  </label>

                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Select supplier</option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Product
                  </label>

                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Select product</option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} — {money(product.cost_price)}
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
                    placeholder="50"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Unit cost
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unit_cost"
                    value={formData.unit_cost}
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
                      Purchase total
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {quantity || 0} units × {money(unitCost)}
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
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;