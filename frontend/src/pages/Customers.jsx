import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    credit_limit: "",
  });

  // --------------------------------
  // Permissions
  // --------------------------------

  const canCreate = ["owner", "manager"].includes(user?.role);

  const canEdit = ["owner", "manager"].includes(user?.role);

  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load Customers
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/customers/");

        if (!ignore) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load customers.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCustomers();

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
  // Reset Form
  // --------------------------------

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      credit_limit: "",
    });

    setFormError("");
    setEditingCustomer(null);
  };

  // --------------------------------
  // Close Form
  // --------------------------------

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  // --------------------------------
  // Refresh Customers
  // --------------------------------

  const refreshCustomers = async () => {
    const response = await api.get("/customers/");

    setCustomers(response.data);
  };

  // --------------------------------
  // Create Customer
  // --------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      await api.post("/customers/", {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        credit_limit: Number(formData.credit_limit),
      });

      await refreshCustomers();

      closeForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create customer."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Start Editing
  // --------------------------------

  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      credit_limit: customer.credit_limit,
    });

    setFormError("");
    setShowForm(true);
  };

  // --------------------------------
  // Update Customer
  // --------------------------------

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingCustomer) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.put(
        `/customers/${editingCustomer.id}`,
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          credit_limit: Number(formData.credit_limit),
        }
      );

      await refreshCustomers();

      closeForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to update customer."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Delete Customer
  // --------------------------------

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/customers/${customer.id}`
      );

      await refreshCustomers();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete customer."
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
          Loading customers...
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

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your customers
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
            Add Customer
          </button>
        )}

      </div>

      {/* Customer Table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Name
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Phone
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Email
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Address
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Credit Limit
                </th>

                {(canEdit || canDelete) && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {customers.map((customer) => (

                <tr
                  key={customer.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {customer.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {customer.phone}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {customer.email || "—"}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {customer.address}
                  </td>

                  <td className="px-6 py-4 text-right font-medium">
                    ₹{customer.credit_limit}
                  </td>

                  {(canEdit || canDelete) && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        {canEdit && (
                          <button
                            onClick={() =>
                              handleEdit(customer)
                            }
                            className="px-3 py-1.5 text-sm text-blue-600
                                       border border-blue-200 rounded-lg
                                       hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDelete(customer)
                            }
                            disabled={deleting}
                            className="px-3 py-1.5 text-sm text-red-600
                                       border border-red-200 rounded-lg
                                       hover:bg-red-50
                                       disabled:opacity-50"
                          >
                            Delete
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

        {customers.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No customers found.
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            {/* Modal Header */}

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingCustomer
                    ? "Update customer information."
                    : "Add a new customer."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={
                editingCustomer
                  ? handleUpdate
                  : handleCreate
              }
            >

              <div className="space-y-4">

                {/* Name */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer Name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rahul Sharma"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="9876543210"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="rahul@example.com"
                  />
                </div>

                {/* Address */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>

                {/* Credit Limit */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Credit Limit
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>

              </div>

              {/* Error */}

              {formError && (
                <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Buttons */}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Create Customer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Customers;