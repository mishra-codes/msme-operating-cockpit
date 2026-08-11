import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function CashTransactions() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    txn_type: "cash_in",
    source: "manual",
    reference_id: "",
    amount: "",
    notes: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load transactions
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/cash-transactions/"
        );

        if (!ignore) {
          setTransactions(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError(
            "Unable to load cash transactions."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      ignore = true;
    };
  }, []);

  // --------------------------------
  // Handle form change
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------
  // Reset form
  // --------------------------------

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

  // --------------------------------
  // Refresh
  // --------------------------------

  const refreshTransactions = async () => {
    const response = await api.get(
      "/cash-transactions/"
    );

    setTransactions(response.data);
  };

  // --------------------------------
  // Create transaction
  // --------------------------------

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
        notes: formData.notes,
      });

      await refreshTransactions();

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create transaction."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------
  // Delete transaction
  // --------------------------------

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
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete transaction."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading cash transactions...
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
            Cash Transactions
          </h1>

          <p className="mt-1 text-gray-500">
            Track cash inflow and outflow
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
            Add Transaction
          </button>
        )}

      </div>

      {/* Transactions table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Transaction #
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Date
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Type
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Source
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Reference
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Amount
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Notes
                </th>

                {canDelete && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {transactions.map((transaction) => (

                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    #{transaction.id}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      transaction.txn_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">

                    {transaction.txn_type ===
                    "cash_in" ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Cash In
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Cash Out
                      </span>
                    )}

                  </td>

                  <td className="px-6 py-4 text-gray-900 capitalize">
                    {transaction.source}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {transaction.reference_id
                      ? `#${transaction.reference_id}`
                      : "—"}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    ₹
                    {Number(
                      transaction.amount
                    ).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {transaction.notes || "—"}
                  </td>

                  {canDelete && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end">

                        <button
                          onClick={() =>
                            handleDelete(transaction)
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

        {transactions.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No cash transactions found.
          </div>
        )}

      </div>

      {/* Add Transaction Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Cash Transaction
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Record a cash inflow or outflow.
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

                {/* Transaction Type */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Transaction Type
                  </label>

                  <select
                    name="txn_type"
                    value={formData.txn_type}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="cash_in">
                      Cash In
                    </option>

                    <option value="cash_out">
                      Cash Out
                    </option>

                  </select>

                </div>

                {/* Source */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Source
                  </label>

                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="manual">
                      Manual
                    </option>

                    <option value="sale">
                      Sale
                    </option>

                    <option value="purchase">
                      Purchase
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

                {/* Reference ID */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Reference ID
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="reference_id"
                    value={formData.reference_id}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                {/* Amount */}

                <div>

                  <label className="block text-sm font-medium mb-1">
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
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                {/* Notes */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Optional notes..."
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    ? "Adding..."
                    : "Add Transaction"}
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