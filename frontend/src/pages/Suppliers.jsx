import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function StatCard({ label, value, detail, icon: Icon }) {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function Suppliers() {
  const { user } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [formData, setFormData] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canEdit = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  useEffect(() => {
    let ignore = false;

    const loadSuppliers = async () => {
      try {
        const response = await api.get("/suppliers/");

        if (!ignore) {
          setSuppliers(response.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load suppliers.");
          setLoading(false);
        }
      }
    };

    loadSuppliers();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshSuppliers = async () => {
    try {
      setRefreshing(true);

      const response = await api.get("/suppliers/");

      setSuppliers(response.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to refresh suppliers.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return suppliers;
    }

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.contact_phone,
        supplier.contact_email,
        supplier.address,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [suppliers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visibleSuppliers = filteredSuppliers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const resetForm = () => {
    setFormData({
      name: "",
      contact_phone: "",
      contact_email: "",
      address: "",
    });

    setFormError("");
    setEditingSupplier(null);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);

    setFormData({
      name: supplier.name || "",
      contact_phone: supplier.contact_phone || "",
      contact_email: supplier.contact_email || "",
      address: supplier.address || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    if (!formData.contact_phone.trim()) {
      setFormError("Contact phone is required.");
      return;
    }

    if (!formData.contact_email.trim()) {
      setFormError("Contact email is required.");
      return;
    }

    if (!formData.address.trim()) {
      setFormError("Address is required.");
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      contact_phone: formData.contact_phone.trim(),
      contact_email: formData.contact_email.trim(),
      address: formData.address.trim(),
    };

    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post("/suppliers/", payload);
      }

      await refreshSuppliers();
      closeForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail ||
          (editingSupplier
            ? "Unable to update supplier."
            : "Unable to create supplier.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/suppliers/${supplier.id}`);
      await refreshSuppliers();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Unable to delete supplier."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
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

  if (error && suppliers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            Suppliers unavailable
          </p>

          <p className="mt-1 text-sm text-red-700">{error}</p>

          <button
            onClick={refreshSuppliers}
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
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              PROCUREMENT
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Suppliers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage supplier relationships and contact information.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshSuppliers}
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
                Add supplier
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Suppliers"
            value={suppliers.length}
            detail="Total supplier records"
            icon={Truck}
          />

          <StatCard
            label="Search results"
            value={filteredSuppliers.length}
            detail="Suppliers matching current search"
            icon={Search}
          />

          <StatCard
            label="Contact coverage"
            value={
              suppliers.length
                ? `${Math.round(
                    (suppliers.filter(
                      (supplier) =>
                        supplier.contact_phone ||
                        supplier.contact_email
                    ).length /
                      suppliers.length) *
                      100
                  )}%`
                : "0%"
            }
            detail="Suppliers with contact details"
            icon={Phone}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="relative">
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
                placeholder="Search supplier, phone, email or address..."
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

            <p className="mt-4 text-xs text-slate-400">
              Showing{" "}
              <strong className="text-slate-700">
                {filteredSuppliers.length === 0
                  ? 0
                  : (safePage - 1) * pageSize + 1}
                –
                {Math.min(
                  safePage * pageSize,
                  filteredSuppliers.length
                )}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700">
                {filteredSuppliers.length}
              </strong>{" "}
              suppliers
            </p>
          </div>

          {visibleSuppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Supplier
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Address
                    </th>

                    {(canEdit || canDelete) && (
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Truck size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {supplier.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              Supplier #{supplier.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone
                            size={14}
                            className="text-slate-400"
                          />
                          {supplier.contact_phone || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail
                            size={14}
                            className="text-slate-400"
                          />
                          <span className="max-w-[240px] truncate">
                            {supplier.contact_email || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="max-w-[300px] px-5 py-4 text-slate-600">
                        <div className="flex items-start gap-2">
                          <MapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <span className="truncate">
                            {supplier.address || "—"}
                          </span>
                        </div>
                      </td>

                      {(canEdit || canDelete) && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={() =>
                                  handleEdit(supplier)
                                }
                                title="Edit supplier"
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() =>
                                  handleDelete(supplier)
                                }
                                disabled={deleting}
                                title="Delete supplier"
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
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
                <Truck size={26} />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                No suppliers found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try another search or add your first supplier.
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
                  Add supplier
                </button>
              )}
            </div>
          )}

          {filteredSuppliers.length > pageSize && (
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setPage(Math.min(totalPages, safePage + 1))
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Procurement
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {editingSupplier
                    ? "Edit supplier"
                    : "Add supplier"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingSupplier
                    ? "Update supplier information."
                    : "Create a new supplier profile."}
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

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="ABC Traders"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Contact phone
                  </label>

                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Contact email
                  </label>

                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    placeholder="supplier@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows="3"
                    placeholder="Mumbai, Maharashtra"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
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
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                      ? "Update supplier"
                      : "Create supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;