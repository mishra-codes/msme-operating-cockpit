import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const isOwner = user?.role === "owner";

  // --------------------------------
  // Load users
  // --------------------------------

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    let ignore = false;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/");

        if (!ignore) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setError("Unable to load users.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      ignore = true;
    };
  }, [isOwner]);

  // --------------------------------
  // Form change
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
      name: "",
      email: "",
      password: "",
      role: "employee",
    });

    setFormError("");
    setEditingUser(null);
  };

  // --------------------------------
  // Open create form
  // --------------------------------

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  // --------------------------------
  // Open edit form
  // --------------------------------

  const openEditForm = (selectedUser) => {
    setEditingUser(selectedUser);

    setFormData({
      name: selectedUser.name,
      email: selectedUser.email,
      password: "",
      role: selectedUser.role,
    });

    setFormError("");
    setShowForm(true);
  };

  // --------------------------------
  // Refresh users
  // --------------------------------

  const refreshUsers = async () => {
    const response = await api.get("/users/");
    setUsers(response.data);
  };

  // --------------------------------
  // Create / Update
  // --------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Email is required.");
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError("Password is required.");
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      } else {
        await api.post("/users/", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        });
      }

      await refreshUsers();

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Delete
  // --------------------------------

  const handleDelete = async (selectedUser) => {
    if (selectedUser.id === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.name}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(`/users/${selectedUser.id}`);

      await refreshUsers();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------
  // Access denied
  // --------------------------------

  if (!isOwner) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 rounded-lg p-4">
          You do not have permission to access User Management.
        </div>
      </div>
    );
  }

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">
          Loading users...
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
            Users
          </h1>

          <p className="mt-1 text-gray-500">
            Manage system users and their roles
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 transition"
        >
          Add User
        </button>
      </div>

      {/* Users table */}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  ID
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Name
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Email
                </th>

                <th className="text-left px-6 py-4 font-semibold text-gray-600">
                  Role
                </th>

                <th className="text-right px-6 py-4 font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {users.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-6 py-4 text-gray-500">
                    #{item.id}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {item.email}
                  </td>

                  <td className="px-6 py-4">

                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.role === "owner"
                          ? "bg-purple-100 text-purple-700"
                          : item.role === "manager"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.role}
                    </span>

                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-end gap-2">

                      <button
                        onClick={() =>
                          openEditForm(item)
                        }
                        className="px-3 py-1.5 text-sm text-blue-600
                                   border border-blue-200 rounded-lg
                                   hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      {item.id !== user?.id && (
                        <button
                          onClick={() =>
                            handleDelete(item)
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

                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {users.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No users found.
          </div>
        )}

      </div>

      {/* Create / Edit Modal */}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingUser
                    ? "Update user information."
                    : "Create a new system user."}
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

            <form onSubmit={handleSubmit}>

              <div className="space-y-4">

                {/* Name */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password */}

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full border rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Role */}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="owner">
                      Owner
                    </option>

                    <option value="manager">
                      Manager
                    </option>

                    <option value="employee">
                      Employee
                    </option>
                  </select>
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
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                    ? "Save Changes"
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Users;