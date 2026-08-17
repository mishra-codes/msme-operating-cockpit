import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}`;

function getCustomerNameById(customers, id) {
  const customer = customers.find((item) => String(item.id) === String(id));
  return customer?.name || `Customer #${id}`;
}

function getSaleLabelById(sales, id) {
  const sale = sales.find((item) => String(item.id) === String(id));
  return sale ? `Sale #${sale.id}` : `Sale #${id}`;
}

function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  return type === "credit" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <DollarSign size={12} /> Credit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <CreditCard size={12} /> Debit
    </span>
  );
}

function CreditLedger() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const canCreate = user?.role === "owner";
  const canDelete = user?.role === "owner";

  const [formData, setFormData] = useState({
    customer_id: "",
    sale_id: "",
    entry_type: "debit",
    amount: "",
    balance_after: "",
  });

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const [ledgerResponse, customersResponse, salesResponse] = await Promise.all([
          api.get("/credit-ledger/"),
          api.get("/customers/"),
          api.get("/sales/"),
        ]);
        if (!ignore) {
          setEntries(ledgerResponse.data || []);
          setCustomers(customersResponse.data || []);
          setSales(salesResponse.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("Unable to load credit ledger.");
          setLoading(false);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const refreshLedger = async () => {
    try {
      setRefreshing(true);
      const response = await api.get("/credit-ledger/");
      setEntries(response.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to refresh credit ledger.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: "", sale_id: "", entry_type: "debit", amount: "", balance_after: "" });
    setFormError("");
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.customer_id) return setFormError("Please select a customer.");
    if (!formData.sale_id) return setFormError("Please select a sale.");
    if (!formData.amount || Number(formData.amount) <= 0) return setFormError("Amount must be greater than 0.");
    if (formData.balance_after === "" || Number(formData.balance_after) < 0) return setFormError("Please enter a valid balance.");

    setFormLoading(true);
    try {
      await api.post("/credit-ledger/", {
        customer_id: Number(formData.customer_id),
        sale_id: Number(formData.sale_id),
        entry_type: formData.entry_type,
        amount: Number(formData.amount),
        balance_after: Number(formData.balance_after),
      });
      await refreshLedger();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || "Unable to create ledger entry.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete ledger entry #${entry.id}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/credit-ledger/${entry.id}`);
      await refreshLedger();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Unable to delete ledger entry.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((entry) => {
        const customer = getCustomerNameById(customers, entry.customer_id).toLowerCase();
        const sale = getSaleLabelById(sales, entry.sale_id).toLowerCase();
        const matchesSearch = !q || String(entry.id).includes(q) || customer.includes(q) || sale.includes(q);
        const matchesType = typeFilter === "all" || entry.entry_type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.entry_date || 0) - new Date(a.entry_date || 0));
  }, [entries, customers, sales, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleEntries = filteredEntries.slice((safePage - 1) * pageSize, safePage * pageSize);

  const metrics = useMemo(() => {
    const debit = entries.filter((e) => e.entry_type === "debit").reduce((s, e) => s + Number(e.amount || 0), 0);
    const credit = entries.filter((e) => e.entry_type === "credit").reduce((s, e) => s + Number(e.amount || 0), 0);
    const latest = entries.length ? Number(entries[0].balance_after || 0) : 0;
    return { debit, credit, net: debit - credit, latest };
  }, [entries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-20 rounded-2xl bg-white" />
          <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-white" />)}</div>
          <div className="h-[500px] rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">Credit ledger unavailable</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button onClick={refreshLedger} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">RECEIVABLES</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Credit Ledger</h1>
            <p className="mt-1 text-sm text-slate-500">Track customer credit balances and repayments.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refreshLedger} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-60">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            {canCreate && <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={18} /> Add entry</button>}
          </div>
        </header>

        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Debit" value={money(metrics.debit)} detail="Credit issued / added" icon={CreditCard} tone="red" />
          <StatCard label="Credit" value={money(metrics.credit)} detail="Repayments / credits" icon={DollarSign} tone="green" />
          <StatCard label="Net movement" value={money(metrics.net)} detail="Debit minus credit" icon={CreditCard} tone="blue" />
          <StatCard label="Latest balance" value={money(metrics.latest)} detail="Most recent balance" icon={UserRound} tone="amber" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search entry, customer or sale..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50" />
                {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>}
              </div>
              <div className="relative">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="h-11 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-blue-300">
                  <option value="all">All entries</option>
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Showing <strong className="text-slate-700">{filteredEntries.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filteredEntries.length)}</strong> of <strong className="text-slate-700">{filteredEntries.length}</strong> entries</p>
          </div>

          {visibleEntries.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b bg-slate-50/70">
                  <tr>
                    {["Entry", "Date", "Customer", "Sale", "Type"].map((h) => <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
                    {canDelete && <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleEntries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-semibold text-slate-900">#{entry.id}</td>
                      <td className="px-5 py-4 text-slate-600">{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-5 py-4 font-medium text-slate-900">{getCustomerNameById(customers, entry.customer_id)}</td>
                      <td className="px-5 py-4 text-slate-600">{getSaleLabelById(sales, entry.sale_id)}</td>
                      <td className="px-5 py-4"><TypeBadge type={entry.entry_type} /></td>
                      <td className="px-5 py-4 text-right font-semibold">{money(entry.amount)}</td>
                      <td className="px-5 py-4 text-right font-bold">{money(entry.balance_after)}</td>
                      {canDelete && <td className="px-5 py-4 text-right"><button onClick={() => handleDelete(entry)} disabled={deleting} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={16} /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center"><CreditCard className="mx-auto text-slate-300" size={36} /><h2 className="mt-4 font-semibold">No ledger entries found</h2><p className="mt-1 text-sm text-slate-500">Try another filter or create an entry.</p></div>
          )}

          {filteredEntries.length > pageSize && (
            <div className="flex items-center justify-between border-t px-5 py-4">
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
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Receivables</p><h2 className="mt-1 text-xl font-bold">Add ledger entry</h2><p className="mt-1 text-sm text-slate-500">Record a customer credit transaction.</p></div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-medium">Customer</label><select name="customer_id" value={formData.customer_id} onChange={handleChange} required className="w-full rounded-xl border px-3.5 py-2.5 text-sm"><option value="">Select customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="mb-1.5 block text-sm font-medium">Sale</label><select name="sale_id" value={formData.sale_id} onChange={handleChange} required className="w-full rounded-xl border px-3.5 py-2.5 text-sm"><option value="">Select sale</option>{sales.map(s => <option key={s.id} value={s.id}>Sale #{s.id} — {money(s.total_amount)}</option>)}</select></div>
                <div><label className="mb-1.5 block text-sm font-medium">Entry type</label><select name="entry_type" value={formData.entry_type} onChange={handleChange} className="w-full rounded-xl border px-3.5 py-2.5 text-sm"><option value="debit">Debit — amount owed</option><option value="credit">Credit — repayment</option></select></div>
                <div><label className="mb-1.5 block text-sm font-medium">Amount</label><input type="number" min="0" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required className="w-full rounded-xl border px-3.5 py-2.5 text-sm" /></div>
                <div className="md:col-span-2"><label className="mb-1.5 block text-sm font-medium">Balance after</label><input type="number" min="0" step="0.01" name="balance_after" value={formData.balance_after} onChange={handleChange} required className="w-full rounded-xl border px-3.5 py-2.5 text-sm" /></div>
              </div>
              {formError && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl border px-4 py-2.5 text-sm">Cancel</button>
                <button type="submit" disabled={formLoading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{formLoading ? "Saving..." : "Create entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditLedger;