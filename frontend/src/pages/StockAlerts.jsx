import { useEffect, useState } from "react";
import api from "../services/api";

function StockAlerts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError("Unable to load stock alerts.");
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
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading stock alerts...
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
  // Low stock products
  // --------------------------------

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.current_stock) <=
      Number(product.reorder_point)
  );

  // --------------------------------
  // Critical stock
  // --------------------------------

  const criticalProducts = lowStockProducts.filter(
    (product) =>
      Number(product.current_stock) <=
      Number(product.reorder_point) * 0.5
  );

  // --------------------------------
  // Low stock but not critical
  // --------------------------------

  const warningProducts = lowStockProducts.filter(
    (product) =>
      Number(product.current_stock) >
      Number(product.reorder_point) * 0.5
  );

  return (
    <div className="p-8">

      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Stock Alerts
        </h1>

        <p className="mt-1 text-gray-500">
          Monitor products that need to be reordered.
        </p>
      </div>

      {/* Summary */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <p className="text-3xl font-bold text-gray-900 mt-2">
            {products.length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Low Stock
          </p>

          <p className="text-3xl font-bold text-orange-600 mt-2">
            {lowStockProducts.length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Critical
          </p>

          <p className="text-3xl font-bold text-red-600 mt-2">
            {criticalProducts.length}
          </p>
        </div>

      </div>

      {/* Critical Stock */}

      {criticalProducts.length > 0 && (
        <div className="mb-8">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />

            <h2 className="text-xl font-semibold text-gray-900">
              Critical Stock
            </h2>
          </div>

          <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-red-50 border-b border-red-100">

                  <tr>

                    <th className="text-left px-6 py-4 font-semibold text-gray-600">
                      Product
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-600">
                      SKU
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Current Stock
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Reorder Point
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {criticalProducts.map((product) => (

                    <tr
                      key={product.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {product.sku}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {product.current_stock}{" "}
                        {product.unit}
                      </td>

                      <td className="px-6 py-4 text-right text-gray-600">
                        {product.reorder_point}{" "}
                        {product.unit}
                      </td>

                      <td className="px-6 py-4 text-right">

                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Critical
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      )}

      {/* Low Stock */}

      {warningProducts.length > 0 && (
        <div className="mb-8">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />

            <h2 className="text-xl font-semibold text-gray-900">
              Low Stock
            </h2>
          </div>

          <div className="bg-white border border-orange-200 rounded-xl shadow-sm overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-orange-50 border-b border-orange-100">

                  <tr>

                    <th className="text-left px-6 py-4 font-semibold text-gray-600">
                      Product
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-gray-600">
                      SKU
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Current Stock
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Reorder Point
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-gray-600">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {warningProducts.map((product) => (

                    <tr
                      key={product.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {product.sku}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-orange-600">
                        {product.current_stock}{" "}
                        {product.unit}
                      </td>

                      <td className="px-6 py-4 text-right text-gray-600">
                        {product.reorder_point}{" "}
                        {product.unit}
                      </td>

                      <td className="px-6 py-4 text-right">

                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Low Stock
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>
      )}

      {/* No alerts */}

      {lowStockProducts.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">

          <div className="text-3xl mb-3">
            ✓
          </div>

          <h2 className="text-lg font-semibold text-green-800">
            All Stock Levels Are Healthy
          </h2>

          <p className="text-sm text-green-700 mt-1">
            No products are currently below their reorder point.
          </p>

        </div>
      )}

    </div>
  );
}

export default StockAlerts;