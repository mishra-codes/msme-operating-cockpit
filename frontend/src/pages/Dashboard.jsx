import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/dashboard/summary");
        setData(response.data);
      } catch (error) {
        console.error(error);
        setError("Unable to load dashboard data.");
      }
    };

    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Products",
      value: data.total_products,
    },
    {
      title: "Total Customers",
      value: data.total_customers,
    },
    {
      title: "Total Suppliers",
      value: data.total_suppliers,
    },
    {
      title: "Total Sales",
      value: `₹${data.total_sales}`,
    },
    {
      title: "Total Purchases",
      value: `₹${data.total_purchases}`,
    },
    {
      title: "Cash in Hand",
      value: `₹${data.cash_in_hand}`,
    },
    {
      title: "Outstanding Credit",
      value: `₹${data.outstanding_credit}`,
    },
    {
      title: "Low Stock Products",
      value: data.low_stock_products,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-gray-500">
          Overview of your business
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-200"
          >
            <p className="text-sm font-medium text-gray-500">
              {card.title}
            </p>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default Dashboard;