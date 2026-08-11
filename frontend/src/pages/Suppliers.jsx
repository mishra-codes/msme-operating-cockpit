import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Suppliers() {
  const { user } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

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
        setLoading(true);
        setError("");

        const response = await api.get("/suppliers/");

        if (!ignore) {
          setSuppliers(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load suppliers.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSuppliers();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const refreshSuppliers = async () => {
    const response = await api.get("/suppliers/");
    setSuppliers(response.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      await api.post("/suppliers/", {
        name: formData.name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        address: formData.address,
      });

      await refreshSuppliers();

      closeForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);

    setFormData({
      name: supplier.name,
      contact_phone: supplier.contact_phone,
      contact_email: supplier.contact_email,
      address: supplier.address,
    });

    setFormError("");
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingSupplier) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.put(
        `/suppliers/${editingSupplier.id}`,
        {
          name: formData.name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          address: formData.address,
        }
      );

      await refreshSuppliers();

      closeForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to update supplier."
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
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete supplier."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading suppliers...
        </p>
      </div>
    );
  }

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
            Suppliers
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your suppliers
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
            Add Supplier
          </button>
        )}

      </div>

      {/* Supplier Table */}
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

                {(canEdit || canDelete) && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {suppliers.map((supplier) => (

                <tr
                  key={supplier.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {supplier.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {supplier.contact_phone}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {supplier.contact_email}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {supplier.address}
                  </td>

                  {(canEdit || canDelete) && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        {canEdit && (
                          <button
                            onClick={() =>
                              handleEdit(supplier)
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
                              handleDelete(supplier)
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

        {suppliers.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No suppliers found.
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
                  {editingSupplier
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingSupplier
                    ? "Update supplier information."
                    : "Add a new supplier."}
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
                editingSupplier
                  ? handleUpdate
                  : handleCreate
              }
            >

              <div className="space-y-4">

                {/* Name */}
                <div>

                  <label className="block text-sm font-medium mb-1">
                    Supplier Name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                {/* Phone */}
                <div>

                  <label className="block text-sm font-medium mb-1">
                    Contact Phone
                  </label>

                  <input
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                {/* Email */}
                <div>

                  <label className="block text-sm font-medium mb-1">
                    Contact Email
                  </label>

                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    required
                    rows="3"
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    : editingSupplier
                      ? "Update Supplier"
                      : "Create Supplier"}
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