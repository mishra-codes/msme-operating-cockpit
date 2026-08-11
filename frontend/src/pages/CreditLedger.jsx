import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function CreditLedger() {
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    sale_id: "",
    entry_type: "debit",
    amount: "",
    balance_after: "",
  });

  const canCreate = user?.role === "owner";
  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load Ledger
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadLedger = async () => {
      try {
        setLoading(true);
        setError("");

        const [ledgerResponse, customersResponse, salesResponse] =
          await Promise.all([
            api.get("/credit-ledger/"),
            api.get("/customers/"),
            api.get("/sales/"),
          ]);

        if (!ignore) {
          setEntries(ledgerResponse.data);
          setCustomers(customersResponse.data);
          setSales(salesResponse.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load credit ledger.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadLedger();

    return () => {
      ignore = true;
    };
  }, []);

  // --------------------------------
  // Form Change
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------
  // Reset
  // --------------------------------

  const resetForm = () => {
    setFormData({
      customer_id: "",
      sale_id: "",
      entry_type: "debit",
      amount: "",
      balance_after: "",
    });

    setFormError("");
  };

  // --------------------------------
  // Refresh
  // --------------------------------

  const refreshLedger = async () => {
    const response = await api.get("/credit-ledger/");

    setEntries(response.data);
  };

  // --------------------------------
  // Create Entry
  // --------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!formData.customer_id) {
      setFormError("Please select a customer.");
      return;
    }

    if (!formData.sale_id) {
      setFormError("Please select a sale.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError("Amount must be greater than 0.");
      return;
    }

    if (
      formData.balance_after === "" ||
      Number(formData.balance_after) < 0
    ) {
      setFormError("Please enter a valid balance.");
      return;
    }

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
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create ledger entry."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------
  // Delete Entry
  // --------------------------------

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ledger entry #${entry.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/credit-ledger/${entry.id}`
      );

      await refreshLedger();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete ledger entry."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------
  // Helpers
  // --------------------------------

  const getCustomerName = (customerId) => {
    const customer = customers.find(
      (item) => item.id === customerId
    );

    return customer?.name || `Customer #${customerId}`;
  };

  const getSaleLabel = (saleId) => {
    const sale = sales.find(
      (item) => item.id === saleId
    );

    return sale
      ? `Sale #${sale.id}`
      : `Sale #${saleId}`;
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading credit ledger...
        </p>
      </div>
    );
  }

  // --------------------------------
  // Error
  // --------------------------------

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Credit Ledger
          </h1>

          <p className="mt-1 text-gray-500">
            Track customer credit transactions
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition"
          >
            Add Entry
          </button>
        )}

      </div>

      {/* Ledger Table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Entry #
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Date
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Customer
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Sale
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Type
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Amount
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Balance
                </th>

                {canDelete && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {entries.map((entry) => (

                <tr
                  key={entry.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    #{entry.id}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      entry.entry_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {getCustomerName(
                      entry.customer_id
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {getSaleLabel(entry.sale_id)}
                  </td>

                  <td className="px-6 py-4">

                    {entry.entry_type === "debit" ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Debit
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Credit
                      </span>
                    )}

                  </td>

                  <td className="px-6 py-4 text-right font-medium">
                    ₹{Number(entry.amount).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    ₹{Number(entry.balance_after).toFixed(2)}
                  </td>

                  {canDelete && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end">

                        <button
                          onClick={() =>
                            handleDelete(entry)
                          }
                          disabled={deleting}
                          className="px-3 py-1.5 text-sm text-red-600
                                     border border-red-200 rounded-lg
                                     hover:bg-red-50
                                     disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </div>

                    </td>
                  )}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {entries.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No credit ledger entries found.
          </div>
        )}

      </div>

      {/* Add Entry Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Ledger Entry
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Record a customer credit transaction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreate}>

              <div className="space-y-4">

                {/* Customer */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Customer
                  </label>

                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select customer
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

                {/* Sale */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Sale
                  </label>

                  <select
                    name="sale_id"
                    value={formData.sale_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select sale
                    </option>

                    {sales.map((sale) => (
                      <option
                        key={sale.id}
                        value={sale.id}
                      >
                        Sale #{sale.id} — ₹
                        {sale.total_amount}
                      </option>
                    ))}

                  </select>

                </div>

                {/* Entry Type */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Entry Type
                  </label>

                  <select
                    name="entry_type"
                    value={formData.entry_type}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="debit">
                      Debit
                    </option>

                    <option value="credit">
                      Credit
                    </option>

                  </select>

                </div>

                {/* Amount */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                  />

                </div>

                {/* Balance */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Balance After
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="balance_after"
                    value={formData.balance_after}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1500"
                  />

                </div>

              </div>

              {formError && (
                <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading
                    ? "Saving..."
                    : "Create Entry"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default CreditLedger;