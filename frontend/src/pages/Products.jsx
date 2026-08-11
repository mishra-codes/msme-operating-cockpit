import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

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

  // --------------------------------
  // Permissions
  // --------------------------------

  const canCreate = ["owner", "manager"].includes(user?.role);

  const canEdit = ["owner", "manager"].includes(user?.role);

  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load Products
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products/");

        if (!ignore) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error(error);

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

  // --------------------------------
  // Load Suppliers
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);

        const response = await api.get("/suppliers/");

        if (!ignore) {
          setSuppliers(response.data);
        }
      } catch (error) {
        console.error(
          "Unable to load suppliers:",
          error
        );
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

  // --------------------------------
  // Close Modal
  // --------------------------------

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  // --------------------------------
  // Refresh Products
  // --------------------------------

  const refreshProducts = async () => {
    const response = await api.get("/products/");

    setProducts(response.data);
  };

  // --------------------------------
  // Create Product
  // --------------------------------

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
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Start Editing
  // --------------------------------

  const handleEdit = (product) => {
    setEditingProduct(product);

    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      cost_price: product.cost_price,
      sell_price: product.sell_price,
      current_stock: product.current_stock,
      reorder_point: product.reorder_point,
      supplier_id: product.supplier_id,
    });

    setFormError("");
    setShowForm(true);
  };

  // --------------------------------
  // Update Product
  // --------------------------------

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingProduct) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await api.put(
        `/products/${editingProduct.id}`,
        {
          sku: formData.sku,
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          cost_price: Number(formData.cost_price),
          sell_price: Number(formData.sell_price),
          current_stock: Number(formData.current_stock),
          reorder_point: Number(formData.reorder_point),
          supplier_id: Number(formData.supplier_id),
        }
      );

      await refreshProducts();

      closeForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Delete Product
  // --------------------------------

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/products/${product.id}`
      );

      await refreshProducts();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete product."
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
          Loading products...
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
            Products
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your inventory
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
            Add Product
          </button>
        )}

      </div>

      {/* Product Table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  SKU
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Product
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Category
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Unit
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Cost Price
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Sell Price
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Stock
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Reorder Point
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Status
                </th>

                {(canEdit || canDelete) && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {products.map((product) => {

                const stock =
                  Number(product.current_stock);

                const reorderPoint =
                  Number(product.reorder_point);

                const lowStock =
                  stock <= reorderPoint;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.sku}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {product.category}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {product.unit}
                    </td>

                    <td className="px-6 py-4 text-right">
                      ₹{product.cost_price}
                    </td>

                    <td className="px-6 py-4 text-right">
                      ₹{product.sell_price}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {product.current_stock}
                    </td>

                    <td className="px-6 py-4 text-right text-gray-600">
                      {product.reorder_point}
                    </td>

                    <td className="px-6 py-4">

                      {lowStock ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}

                    </td>

                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          {canEdit && (
                            <button
                              onClick={() =>
                                handleEdit(product)
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
                                handleDelete(product)
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
                );
              })}

            </tbody>

          </table>

        </div>

        {products.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No products found.
          </div>
        )}

      </div>

      {/* Add / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">

            {/* Modal Header */}

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct
                    ? "Update product information."
                    : "Add a new product to your inventory."}
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
                editingProduct
                  ? handleUpdate
                  : handleCreate
              }
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* SKU */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    SKU
                  </label>

                  <input
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RICE002"
                  />
                </div>

                {/* Product Name */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Wheat"
                  />
                </div>

                {/* Category */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>

                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Grains"
                  />
                </div>

                {/* Unit */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unit
                  </label>

                  <input
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="kg"
                  />
                </div>

                {/* Cost Price */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />
                </div>

                {/* Sell Price */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sell Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="sell_price"
                    value={formData.sell_price}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="70"
                  />
                </div>

                {/* Current Stock */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Current Stock
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="current_stock"
                    value={formData.current_stock}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>

                {/* Reorder Point */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reorder Point
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="reorder_point"
                    value={formData.reorder_point}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>

                {/* Supplier */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium mb-1">
                    Supplier
                  </label>

                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    required
                    disabled={suppliersLoading}
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:bg-gray-100"
                  >

                    <option value="">
                      {suppliersLoading
                        ? "Loading suppliers..."
                        : "Select supplier"}
                    </option>

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

              </div>

              {/* Form Error */}

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
                  disabled={saving || suppliersLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Update Product"
                      : "Create Product"}
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