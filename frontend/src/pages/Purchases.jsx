import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Purchases() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    supplier_id: "",
    product_id: "",
    quantity: "",
    unit_cost: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load purchases, suppliers, products
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          purchasesResponse,
          suppliersResponse,
          productsResponse,
        ] = await Promise.all([
          api.get("/purchases/"),
          api.get("/suppliers/"),
          api.get("/products/"),
        ]);

        if (!ignore) {
          setPurchases(purchasesResponse.data);
          setSuppliers(suppliersResponse.data);
          setProducts(productsResponse.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load purchases.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // --------------------------------
  // Form change
  // --------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "product_id") {
      const selectedProduct = products.find(
        (product) =>
          String(product.id) === String(value)
      );

      setFormData((prev) => ({
        ...prev,
        product_id: value,
        unit_cost: selectedProduct
          ? selectedProduct.cost_price
          : "",
      }));
    }
  };

  // --------------------------------
  // Reset form
  // --------------------------------

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      product_id: "",
      quantity: "",
      unit_cost: "",
    });

    setFormError("");
  };

  // --------------------------------
  // Refresh purchases
  // --------------------------------

  const refreshPurchases = async () => {
    const response = await api.get("/purchases/");
    setPurchases(response.data);
  };

  // --------------------------------
  // Create purchase
  // --------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!formData.supplier_id) {
      setFormError("Please select a supplier.");
      return;
    }

    if (!formData.product_id) {
      setFormError("Please select a product.");
      return;
    }

    if (
      !formData.quantity ||
      Number(formData.quantity) <= 0
    ) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    if (
      formData.unit_cost === "" ||
      Number(formData.unit_cost) < 0
    ) {
      setFormError("Please enter a valid unit cost.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/purchases/", {
        supplier_id: Number(formData.supplier_id),
        created_by: Number(user.id),
        items: [
          {
            product_id: Number(formData.product_id),
            quantity: Number(formData.quantity),
            unit_cost: Number(formData.unit_cost),
          },
        ],
      });

      await refreshPurchases();

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create purchase."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------
  // Delete purchase
  // --------------------------------

  const handleDelete = async (purchase) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Purchase #${purchase.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/purchases/${purchase.id}`
      );

      await refreshPurchases();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete purchase."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------
  // Helpers
  // --------------------------------

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(
      (item) => item.id === supplierId
    );

    return (
      supplier?.name ||
      `Supplier #${supplierId}`
    );
  };

  const getProductName = (productId) => {
    const product = products.find(
      (item) => item.id === productId
    );

    return (
      product?.name ||
      `Product #${productId}`
    );
  };

  const quantity =
    Number(formData.quantity) || 0;

  const unitCost =
    Number(formData.unit_cost) || 0;

  const calculatedTotal =
    quantity * unitCost;

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading purchases...
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
            Purchases
          </h1>

          <p className="mt-1 text-gray-500">
            Manage purchases and inventory intake
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
            New Purchase
          </button>
        )}

      </div>

      {/* Purchases table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Purchase #
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Date
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Supplier
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Items
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Total
                </th>

                {canDelete && (
                  <th className="text-right px-6 py-4 font-semibold text-gray-600">
                    Actions
                  </th>
                )}

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {purchases.map((purchase) => (

                <tr
                  key={purchase.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    #{purchase.id}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      purchase.purchase_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {getSupplierName(
                      purchase.supplier_id
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">

                    <div className="space-y-1">

                      {purchase.items?.map((item) => (
                        <div key={item.id}>
                          {getProductName(
                            item.product_id
                          )}{" "}
                          × {item.quantity}
                        </div>
                      ))}

                    </div>

                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    ₹
                    {Number(
                      purchase.total_amount
                    ).toFixed(2)}
                  </td>

                  {canDelete && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end">

                        <button
                          onClick={() =>
                            handleDelete(purchase)
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

        {purchases.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No purchases found.
          </div>
        )}

      </div>

      {/* New Purchase Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  New Purchase
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Record inventory purchased from a supplier.
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

                {/* Supplier */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Supplier
                  </label>

                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select supplier
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

                {/* Product */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Product
                  </label>

                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} — ₹
                        {product.cost_price}
                      </option>
                    ))}

                  </select>

                </div>

                {/* Quantity */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                  />

                </div>

                {/* Unit Cost */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Unit Cost
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unit_cost"
                    value={formData.unit_cost}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                </div>

                {/* Total */}

                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">

                  <span className="font-medium text-gray-600">
                    Total
                  </span>

                  <span className="text-xl font-bold text-gray-900">
                    ₹{calculatedTotal.toFixed(2)}
                  </span>

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
                    ? "Creating..."
                    : "Create Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Purchases;