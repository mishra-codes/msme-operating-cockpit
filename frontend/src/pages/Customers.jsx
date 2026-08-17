import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
  CreditCard,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}`;

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 8;
  const canCreate = ["owner", "manager"].includes(user?.role);
  const canEdit = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", address: "", credit_limit: "",
  });

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const response = await api.get("/customers/");
        if (!ignore) {
          setCustomers(response.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("Unable to load customers.");
          setLoading(false);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const refreshCustomers = async () => {
    try {
      setRefreshing(true);
      const response = await api.get("/customers/");
      setCustomers(response.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to refresh customers.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email, c.address]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleCustomers = filteredCustomers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const totalCreditLimit = customers.reduce(
    (sum, c) => sum + Number(c.credit_limit || 0), 0
  );

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", address: "", credit_limit: "" });
    setFormError("");
    setEditingCustomer(null);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      credit_limit: customer.credit_limit ?? "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) return setFormError("Customer name is required.");
    if (!formData.phone.trim()) return setFormError("Phone number is required.");
    if (formData.credit_limit === "" || Number(formData.credit_limit) < 0) {
      return setFormError("Please enter a valid credit limit.");
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      credit_limit: Number(formData.credit_limit),
    };

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post("/customers/", payload);
      }
      await refreshCustomers();
      closeForm();
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.detail ||
        (editingCustomer ? "Unable to update customer." : "Unable to create customer.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete "${customer.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${customer.id}`);
      await refreshCustomers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Unable to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}
          </div>
          <div className="h-[500px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">Customers unavailable</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button onClick={refreshCustomers} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">
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
            <p className="text-sm font-medium text-blue-600">CUSTOMER MANAGEMENT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Customers</h1>
            <p className="mt-1 text-sm text-slate-500">Manage customer profiles and credit limits.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshCustomers} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            {canCreate && (
              <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus size={18} /> Add customer
              </button>
            )}
          </div>
        </header>

        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Customers" value={customers.length} detail="Total customer records" icon={UserRound} />
          <StatCard label="Credit capacity" value={money(totalCreditLimit)} detail="Combined configured limits" icon={CreditCard} />
          <StatCard label="Search results" value={filteredCustomers.length} detail="Current filtered customers" icon={Search} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search customer, phone, email or address..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Showing <strong className="text-slate-700">{filteredCustomers.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filteredCustomers.length)}</strong> of <strong className="text-slate-700">{filteredCustomers.length}</strong> customers
            </p>
          </div>

          {visibleCustomers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Address</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Credit limit</th>
                    {(canEdit || canDelete) && <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleCustomers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={18} /></div>
                          <div>
                            <p className="font-semibold text-slate-900">{customer.name}</p>
                            <p className="text-xs text-slate-400">Customer #{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-slate-600">
                          <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" />{customer.phone || "—"}</div>
                          <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" />{customer.email || "—"}</div>
                        </div>
                      </td>
                      <td className="max-w-[300px] px-5 py-4 text-slate-600"><p className="truncate">{customer.address || "—"}</p></td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">{money(customer.credit_limit)}</td>
                      {(canEdit || canDelete) && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit && <button onClick={() => handleEdit(customer)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Edit3 size={16} /></button>}
                            {canDelete && <button onClick={() => handleDelete(customer)} disabled={deleting} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={16} /></button>}
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
              <UserRound className="mx-auto text-slate-300" size={36} />
              <h2 className="mt-4 font-semibold text-slate-900">No customers found</h2>
              <p className="mt-1 text-sm text-slate-500">Try another search or add your first customer.</p>
            </div>
          )}

          {filteredCustomers.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">Page {safePage} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={safePage === 1} onClick={() => setPage(Math.max(1, safePage - 1))} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <button disabled={safePage === totalPages} onClick={() => setPage(Math.min(totalPages, safePage + 1))} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-5 bg-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Customer management</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{editingCustomer ? "Edit customer" : "Add customer"}</h2>
                <p className="mt-1 text-sm text-slate-500">{editingCustomer ? "Update customer information." : "Create a new customer profile."}</p>
              </div>
              <button onClick={closeForm} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  ["name", "Customer name", "text", "Rahul Sharma"],
                  ["phone", "Phone", "tel", "9876543210"],
                  ["email", "Email", "email", "rahul@example.com"],
                ].map(([name, label, type, placeholder]) => (
                  <div key={name} className={name === "name" ? "md:col-span-2" : ""}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
                    <input type={type} name={name} value={formData[name]} onChange={handleChange} required={name !== "email"} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="3" required placeholder="Mumbai, Maharashtra" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Credit limit</label>
                  <input type="number" min="0" step="0.01" name="credit_limit" value={formData.credit_limit} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
                </div>
              </div>
              {formError && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                <button type="button" onClick={closeForm} className="rounded-xl border px-4 py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : editingCustomer ? "Update customer" : "Create customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;