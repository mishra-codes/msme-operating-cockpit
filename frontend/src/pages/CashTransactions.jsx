import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
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
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
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
            tones[tone] || tones.slate
          }`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  if (type === "cash_in") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <ArrowDownLeft size={13} />
        Cash In
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <ArrowUpRight size={13} />
      Cash Out
    </span>
  );
}

function CashTransactions() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  const [formData, setFormData] = useState({
    txn_type: "cash_in",
    source: "manual",
    reference_id: "",
    amount: "",
    notes: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  useEffect(() => {
    let ignore = false;

    const loadTransactions = async () => {
      try {
        const response = await api.get("/cash-transactions/");

        if (!ignore) {
          setTransactions(response.data || []);
          setError("");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Unable to load cash transactions.");
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      ignore = true;
    };
  }, []);

  const refreshTransactions = async () => {
    try {
      setRefreshing(true);

      const response = await api.get("/cash-transactions/");

      setTransactions(response.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to refresh cash transactions.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...transactions]
      .filter((transaction) => {
        const matchesSearch =
          !query ||
          String(transaction.id || "").includes(query) ||
          String(transaction.source || "").toLowerCase().includes(query) ||
          String(transaction.reference_id || "").includes(query) ||
          String(transaction.notes || "").toLowerCase().includes(query);

        const matchesType =
          typeFilter === "all" ||
          transaction.txn_type === typeFilter;

        const matchesSource =
          sourceFilter === "all" ||
          transaction.source === sourceFilter;

        return matchesSearch && matchesType && matchesSource;
      })
      .sort(
        (a, b) =>
          new Date(b.txn_date || 0).getTime() -
          new Date(a.txn_date || 0).getTime()
      );
  }, [transactions, search, typeFilter, sourceFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  const visibleTransactions = filteredTransactions.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const metrics = useMemo(() => {
    const cashIn = transactions
      .filter((transaction) => transaction.txn_type === "cash_in")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount || 0),
        0
      );

    const cashOut = transactions
      .filter((transaction) => transaction.txn_type === "cash_out")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount || 0),
        0
      );

    return {
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    };
  }, [transactions]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      txn_type: "cash_in",
      source: "manual",
      reference_id: "",
      amount: "",
      notes: "",
    });

    setFormError("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.txn_type) {
      setFormError("Please select a transaction type.");
      return;
    }

    if (!formData.source) {
      setFormError("Please select a source.");
      return;
    }

    if (
      formData.amount === "" ||
      Number(formData.amount) <= 0
    ) {
      setFormError("Amount must be greater than 0.");
      return;
    }

    if (
      formData.reference_id !== "" &&
      Number(formData.reference_id) < 0
    ) {
      setFormError("Reference ID cannot be negative.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/cash-transactions/", {
        txn_type: formData.txn_type,
        source: formData.source,
        reference_id:
          formData.reference_id === ""
            ? 0
            : Number(formData.reference_id),
        amount: Number(formData.amount),
        notes: formData.notes.trim(),
      });

      await refreshTransactions();

      closeForm();
    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.detail ||
          "Unable to create transaction."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete transaction #${transaction.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/cash-transactions/${transaction.id}`
      );

      await refreshTransactions();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Unable to delete transaction."
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

  if (error && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            Cash transactions unavailable
          </p>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>

          <button
            onClick={refreshTransactions}
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
              FINANCE
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Cash Transactions
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track cash inflow, outflow and daily liquidity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshTransactions}
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
                Add transaction
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Cash in"
            value={money(metrics.cashIn)}
            detail="Total recorded inflow"
            icon={ArrowDownLeft}
            tone="green"
          />

          <StatCard
            label="Cash out"
            value={money(metrics.cashOut)}
            detail="Total recorded outflow"
            icon={ArrowUpRight}
            tone="red"
          />

          <StatCard
            label="Net cash flow"
            value={money(metrics.net)}
            detail="Cash in minus cash out"
            icon={Wallet}
            tone={metrics.net >= 0 ? "blue" : "red"}
          />

          <StatCard
            label="Transactions"
            value={transactions.length}
            detail="Total recorded entries"
            icon={DollarSign}
            tone="slate"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
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
                  placeholder="Search transaction, source, reference or notes..."
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
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-blue-300 sm:w-40"
                >
                  <option value="all">All types</option>
                  <option value="cash_in">Cash in</option>
                  <option value="cash_out">Cash out</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-blue-300 sm:w-40"
                >
                  <option value="all">All sources</option>
                  <option value="manual">Manual</option>
                  <option value="sale">Sale</option>
                  <option value="purchase">Purchase</option>
                  <option value="other">Other</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Showing{" "}
              <strong className="text-slate-700">
                {filteredTransactions.length === 0
                  ? 0
                  : (safePage - 1) * pageSize + 1}
                –
                {Math.min(
                  safePage * pageSize,
                  filteredTransactions.length
                )}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700">
                {filteredTransactions.length}
              </strong>{" "}
              transactions
            </p>
          </div>

          {visibleTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Transaction
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reference
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notes
                    </th>

                    {canDelete && (
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          #{transaction.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {transaction.txn_date
                          ? new Date(
                              transaction.txn_date
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <TypeBadge type={transaction.txn_type} />
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                          {transaction.source || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {transaction.reference_id
                          ? `#${transaction.reference_id}`
                          : "—"}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-bold ${
                          transaction.txn_type === "cash_in"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.txn_type === "cash_in"
                          ? "+"
                          : "-"}
                        {money(transaction.amount)}
                      </td>

                      <td className="max-w-[280px] px-5 py-4 text-slate-600">
                        <span className="block truncate">
                          {transaction.notes || "—"}
                        </span>
                      </td>

                      {canDelete && (
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() =>
                              handleDelete(transaction)
                            }
                            disabled={deleting}
                            title="Delete transaction"
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
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
                <Wallet size={26} />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                No cash transactions found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try another filter or record your first transaction.
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
                  Add transaction
                </button>
              )}
            </div>
          )}

          {filteredTransactions.length > pageSize && (
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
                  Finance
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Add cash transaction
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record a cash inflow or outflow.
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
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Transaction type
                  </label>

                  <select
                    name="txn_type"
                    value={formData.txn_type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="cash_in">Cash In</option>
                    <option value="cash_out">Cash Out</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Source
                  </label>

                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="manual">Manual</option>
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reference ID
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="reference_id"
                    value={formData.reference_id}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="500"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Optional notes..."
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
                  disabled={formLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading
                    ? "Adding..."
                    : "Add transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashTransactions;