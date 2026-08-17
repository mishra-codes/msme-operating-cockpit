import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
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
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
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

function Products() {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    unit: "pcs",
    cost_price: "",
    sell_price: "",
    current_stock: "",
    reorder_point: "",
    supplier_id: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canEdit = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products/");

        if (!ignore) {
          setProducts(response.data || []);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load products.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);

        const response = await api.get("/suppliers/");

        if (!ignore) {
          setSuppliers(response.data || []);
        }
      } catch (err) {
        console.error("Unable to load suppliers:", err);
      } finally {
        if (!ignore) {
          setSuppliersLoading(false);
        }
      }
    };

    loadSuppliers();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );

  const metrics = useMemo(() => {
    let inventoryCost = 0;
    let inventorySales = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((product) => {
      const stock = Number(product.current_stock || 0);
      const cost = Number(product.cost_price || 0);
      const sell = Number(product.sell_price || 0);
      const reorder = Number(product.reorder_point || 0);

      inventoryCost += stock * cost;
      inventorySales += stock * sell;

      if (stock <= 0) {
        outOfStock += 1;
      } else if (stock <= reorder) {
        lowStock += 1;
      }
    });

    return {
      total: products.length,
      inventoryCost,
      inventorySales,
      lowStock,
      outOfStock,
      potentialMargin: inventorySales - inventoryCost,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query);

      const stock = Number(product.current_stock || 0);
      const reorder = Number(product.reorder_point || 0);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "healthy" && stock > reorder) ||
        (stockFilter === "low" && stock > 0 && stock <= reorder) ||
        (stockFilter === "out" && stock <= 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    result.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "stock") {
        aValue = Number(a.current_stock || 0);
        bValue = Number(b.current_stock || 0);
      } else if (sortBy === "price") {
        aValue = Number(a.sell_price || 0);
        bValue = Number(b.sell_price || 0);
      } else {
        aValue = String(a[sortBy] || "").toLowerCase();
        bValue = String(b[sortBy] || "").toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    products,
    search,
    categoryFilter,
    stockFilter,
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      category: "",
      unit: "pcs",
      cost_price: "",
      sell_price: "",
      current_stock: "",
      reorder_point: "",
      supplier_id: "",
    });

    setFormError("");
    setEditingProduct(null);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const refreshProducts = async () => {
    const response = await api.get("/products/");
    setProducts(response.data || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await api.post("/products/", {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        cost_price: Number(formData.cost_price),
        sell_price: Number(formData.sell_price),
        current_stock: Number(formData.current_stock),
        reorder_point: Number(formData.reorder_point),
        supplier_id: Number(formData.supplier_id),
      });

      await refreshProducts();
      closeForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail || "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setFormData({
      sku: product.sku || "",
      name: product.name || "",
      category: product.category || "",
      unit: product.unit || "pcs",
      cost_price: product.cost_price ?? "",
      sell_price: product.sell_price ?? "",
      current_stock: product.current_stock ?? "",
      reorder_point: product.reorder_point ?? "",
      supplier_id: product.supplier_id ?? "",
    });

    setFormError("");
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingProduct) return;

    setSaving(true);
    setFormError("");

    try {
      await api.put(`/products/${editingProduct.id}`, {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        cost_price: Number(formData.cost_price),
        sell_price: Number(formData.sell_price),
        current_stock: Number(formData.current_stock),
        reorder_point: Number(formData.reorder_point),
        supplier_id: Number(formData.supplier_id),
      });

      await refreshProducts();
      closeForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail || "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete(`/products/${product.id}`);
      await refreshProducts();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail || "Unable to delete product."
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const statusFor = (product) => {
    const stock = Number(product.current_stock || 0);
    const reorder = Number(product.reorder_point || 0);

    if (stock <= 0) {
      return {
        label: "Out of stock",
        className: "bg-red-50 text-red-700 border-red-100",
        dot: "bg-red-500",
      };
    }

    if (stock <= reorder) {
      return {
        label: "Low stock",
        className: "bg-amber-50 text-amber-700 border-amber-100",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Healthy",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      dot: "bg-emerald-500",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-white" />
            ))}
          </div>
          <div className="h-[520px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Products unavailable</p>
          <p className="mt-1 text-sm">{error}</p>
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
            <p className="text-sm font-medium text-blue-600">CATALOG</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Products
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your catalog, pricing and inventory.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add product
            </button>
          )}
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total products"
            value={metrics.total}
            detail="Active catalog items"
            icon={Package}
            tone="blue"
          />

          <StatCard
            label="Inventory cost"
            value={money(metrics.inventoryCost)}
            detail="Current stock × cost"
            icon={Boxes}
            tone="green"
          />

          <StatCard
            label="Potential sales"
            value={money(metrics.inventorySales)}
            detail="Current stock × sell price"
            icon={ArrowUp}
            tone="blue"
          />

          <StatCard
            label="Needs attention"
            value={metrics.lowStock + metrics.outOfStock}
            detail={`${metrics.lowStock} low · ${metrics.outOfStock} out`}
            icon={AlertTriangle}
            tone={metrics.lowStock + metrics.outOfStock ? "amber" : "green"}
          />
        </div>

        {/* Catalog */}
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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product, SKU or category..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
                <div className="relative">
                  <Filter
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[160px]"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[150px]"
                  >
                    <option value="all">All stock</option>
                    <option value="healthy">Healthy</option>
                    <option value="low">Low stock</option>
                    <option value="out">Out of stock</option>
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
                      setSortDirection("asc");
                    }}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:min-w-[150px]"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="sku">Sort: SKU</option>
                    <option value="stock">Sort: Stock</option>
                    <option value="price">Sort: Price</option>
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
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
                  {Math.min(safePage * pageSize, filteredProducts.length)}
                </strong>{" "}
                of{" "}
                <strong className="font-semibold text-slate-700">
                  {filteredProducts.length}
                </strong>{" "}
                products
              </span>

              {(search || categoryFilter !== "all" || stockFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setStockFilter("all");
                  }}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {visibleProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
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

                    <th className="px-5 py-3.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggleSort("sku")}
                        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        SKU
                        {sortBy === "sku" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>

                    <th className="px-5 py-3.5 text-left">
                      Category
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("price")}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                      >
                        Sell price
                        {sortBy === "price" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("stock")}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900"
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

                    <th className="px-5 py-3.5 text-left">
                      Status
                    </th>

                    {(canEdit || canDelete) && (
                      <th className="px-5 py-3.5 text-right">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleProducts.map((product) => {
                    const status = statusFor(product);
                    const stock = Number(product.current_stock || 0);
                    const reorder = Number(product.reorder_point || 0);
                    const cost = Number(product.cost_price || 0);
                    const sell = Number(product.sell_price || 0);
                    const margin =
                      sell > 0 ? ((sell - cost) / sell) * 100 : 0;

                    return (
                      <tr
                        key={product.id}
                        className="group transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                              <Package size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {product.unit || "unit"} ·{" "}
                                {margin.toFixed(1)}% margin
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                          {product.sku || "—"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {product.category || "Uncategorized"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold text-slate-900">
                            {money(sell)}
                          </p>
                          <p className="text-xs text-slate-400">
                            Cost {money(cost)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold text-slate-900">
                            {stock.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-slate-400">
                            Reorder {reorder.toLocaleString("en-IN")}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>
                        </td>

                        {(canEdit || canDelete) && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(product)}
                                  title="Edit product"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit3 size={16} />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(product)}
                                  disabled={deleting}
                                  title="Delete product"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package size={25} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No products found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or add a new product.
              </p>

              {canCreate && (
                <button
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Add product
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                Page {safePage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(
                      Math.max(0, page - 3),
                      Math.min(totalPages, page + 2)
                    )
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium ${
                          pageNumber === page
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

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {editingProduct ? "Catalog" : "New item"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? "Update product information and inventory settings."
                    : "Add a new product to your catalog."}
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

            <form
              onSubmit={editingProduct ? handleUpdate : handleCreate}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["sku", "SKU", "RICE002"],
                  ["name", "Product name", "Wheat"],
                  ["category", "Category", "Grains"],
                  ["unit", "Unit", "kg"],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {label}
                    </label>
                    <input
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                ))}

                {[
                  ["cost_price", "Cost price", "50"],
                  ["sell_price", "Sell price", "70"],
                  ["current_stock", "Current stock", "100"],
                  ["reorder_point", "Reorder point", "20"],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier
                  </label>

                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    required
                    disabled={suppliersLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                  >
                    <option value="">
                      {suppliersLoading
                        ? "Loading suppliers..."
                        : "Select supplier"}
                    </option>

                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
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
                  disabled={saving || suppliersLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Update product"
                      : "Create product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;