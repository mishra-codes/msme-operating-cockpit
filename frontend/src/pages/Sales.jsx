import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Sales() {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    payment_mode: "cash",
    product_id: "",
    quantity: "",
    unit_price: "",
  });

  const canCreate = ["owner", "manager"].includes(user?.role);
  const canDelete = user?.role === "owner";

  // --------------------------------
  // Load Sales
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadSales = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sales/");

        if (!ignore) {
          setSales(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load sales.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSales();

    return () => {
      ignore = true;
    };
  }, []);

  // --------------------------------
  // Load Customers + Products
  // --------------------------------

  useEffect(() => {
    let ignore = false;

    const loadFormData = async () => {
      try {
        setFormLoading(true);

        const [customersResponse, productsResponse] =
          await Promise.all([
            api.get("/customers/"),
            api.get("/products/"),
          ]);

        if (!ignore) {
          setCustomers(customersResponse.data);
          setProducts(productsResponse.data);
        }
      } catch (error) {
        console.error(
          "Unable to load customers/products:",
          error
        );
      } finally {
        if (!ignore) {
          setFormLoading(false);
        }
      }
    };

    loadFormData();

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

    // Automatically use product selling price
    if (name === "product_id") {
      const selectedProduct = products.find(
        (product) =>
          String(product.id) === String(value)
      );

      setFormData((prev) => ({
        ...prev,
        product_id: value,
        unit_price: selectedProduct
          ? selectedProduct.sell_price
          : "",
      }));
    }
  };

  // --------------------------------
  // Reset Form
  // --------------------------------

  const resetForm = () => {
    setFormData({
      customer_id: "",
      payment_mode: "cash",
      product_id: "",
      quantity: "",
      unit_price: "",
    });

    setFormError("");
  };

  // --------------------------------
  // Refresh Sales
  // --------------------------------

  const refreshSales = async () => {
    const response = await api.get("/sales/");

    setSales(response.data);
  };

  // --------------------------------
  // Create Sale
  // --------------------------------

  const handleCreate = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!formData.customer_id) {
      setFormError("Please select a customer.");
      return;
    }

    if (!formData.product_id) {
      setFormError("Please select a product.");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    if (
      !formData.unit_price ||
      Number(formData.unit_price) < 0
    ) {
      setFormError("Please enter a valid unit price.");
      return;
    }

    setFormLoading(true);

    try {
      await api.post("/sales/", {
        customer_id: Number(formData.customer_id),

        payment_mode: formData.payment_mode,

        created_by: Number(user.id),

        items: [
          {
            product_id: Number(formData.product_id),
            quantity: Number(formData.quantity),
            unit_price: Number(formData.unit_price),
          },
        ],
      });

      await refreshSales();

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create sale."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------
  // Delete Sale
  // --------------------------------

  const handleDelete = async (sale) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Sale #${sale.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/sales/${sale.id}`);

      await refreshSales();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete sale."
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

  const getProductName = (productId) => {
    const product = products.find(
      (item) => item.id === productId
    );

    return product?.name || `Product #${productId}`;
  };

  const selectedQuantity =
    Number(formData.quantity) || 0;

  const selectedUnitPrice =
    Number(formData.unit_price) || 0;

  const calculatedTotal =
    selectedQuantity * selectedUnitPrice;

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading sales...
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
            Sales
          </h1>

          <p className="mt-1 text-gray-500">
            Manage your sales and transactions
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
            New Sale
          </button>
        )}

      </div>

      {/* Sales Table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Sale #
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Date
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Customer
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Items
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Payment
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

              {sales.map((sale) => (

                <tr
                  key={sale.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 font-medium text-gray-900">
                    #{sale.id}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      sale.sale_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-gray-900">
                    {getCustomerName(
                      sale.customer_id
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">

                    <div className="space-y-1">

                      {sale.items?.map((item) => (
                        <div key={item.id}>
                          {getProductName(
                            item.product_id
                          )}{" "}
                          × {item.quantity}
                        </div>
                      ))}

                    </div>

                  </td>

                  <td className="px-6 py-4">

                    {sale.payment_mode === "credit" ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Credit
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Cash
                      </span>
                    )}

                  </td>

                  <td className="px-6 py-4 text-right font-semibold">
                    ₹{sale.total_amount}
                  </td>

                  {canDelete && (
                    <td className="px-6 py-4">

                      <div className="flex justify-end">

                        <button
                          onClick={() =>
                            handleDelete(sale)
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

        {sales.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No sales found.
          </div>
        )}

      </div>

      {/* New Sale Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            {/* Modal Header */}

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  New Sale
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Create a new sales transaction.
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
                    disabled={formLoading}
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:bg-gray-100"
                  >

                    <option value="">
                      {formLoading
                        ? "Loading customers..."
                        : "Select customer"}
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

                {/* Payment Mode */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Payment Mode
                  </label>

                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="cash">
                      Cash
                    </option>

                    <option value="credit">
                      Credit
                    </option>

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
                    disabled={formLoading}
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               disabled:bg-gray-100"
                  >

                    <option value="">
                      {formLoading
                        ? "Loading products..."
                        : "Select product"}
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} — ₹
                        {product.sell_price}
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
                    placeholder="10"
                  />

                </div>

                {/* Unit Price */}

                <div>

                  <label className="block text-sm font-medium mb-1">
                    Unit Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unit_price"
                    value={formData.unit_price}
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
                    : "Create Sale"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Sales;