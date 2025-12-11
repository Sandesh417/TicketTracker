import React, { useState, useEffect, useMemo } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/api";

// Icon components
const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const IconDelete = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const roles = ["Admin", "Developer", "User"];

// Simple JWT parser to extract role without external libs
function parseJwt(token) {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(payload)));
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
}

function UserAccessManagement() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({ username: "", role: roles[0], password: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize token and role from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) setUserRole(decoded.role || "");
    }
  }, [token]);

  // Load users when token available
  useEffect(() => {
    if (!token) return;
    getUsers(token)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to load users:", err));
  }, [token]);

  const openCreateModal = () => {
    setFormData({ username: "", role: roles[0], password: "" });
    setEditMode(false);
    setEditUserId(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormData({ username: user.username, role: user.role, password: "" });
    setEditMode(true);
    setEditUserId(user.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData({ username: "", role: roles[0], password: "" });
    setEditUserId(null);
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.username || (!editMode && !formData.password)) {
      alert("Please enter username and password");
      return;
    }
    if (!token) {
      alert("Not authenticated");
      return;
    }

    if (editMode) {
      updateUser(editUserId, formData, token)
        .then(() => {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === editUserId ? { ...u, username: formData.username, role: formData.role } : u
            )
          );
          closeModal();
        })
        .catch((err) => {
          alert("Update failed: " + (err.response?.data?.message || err.message));
        });
    } else {
      createUser(formData, token)
        .then((res) => {
          setUsers((prev) => [...prev, res.data]);
          closeModal();
        })
        .catch((err) => {
          alert("Create failed: " + (err.response?.data?.message || err.message));
        });
    }
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    if (!token) {
      alert("Not authenticated");
      return;
    }
    deleteUser(id, token)
      .then(() => {
        setUsers((prev) => prev.filter((user) => user.id !== id));
      })
      .catch((err) => {
        alert("Delete failed: " + (err.response?.data?.message || err.message));
      });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [users, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="p-6 font-sans bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Access Management</h1>
      </div>

      {/* Top bar with search and Add button */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search by username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 w-80"
        />
        {userRole === "Admin" && (
          <button
            onClick={openCreateModal}
            className="bg-gray-900 text-white px-5 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
            aria-label="Add User"
          >
            Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-1 text-left font-medium text-gray-700 w-20 border-r border-gray-300">Index</th>
              <th className="px-4 py-1 text-left font-medium text-gray-700 border-r border-gray-300">Username</th>
              <th className="px-4 py-1 text-left font-medium text-gray-700 w-40 border-r border-gray-300">Role</th>
              <th className="px-4 py-1 text-right font-medium text-gray-700 w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, idx) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-1 text-gray-700 border-r border-gray-300">{startIndex + idx + 1}</td>
                  <td className="px-4 py-1 text-gray-900 border-r border-gray-300">{user.username}</td>
                  <td className="px-4 py-1 text-gray-700 border-r border-gray-300">{user.role}</td>
                  <td className="px-4 py-1">
                    <div className="flex justify-end gap-2">
                      {userRole === "Admin" && (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                            aria-label={`Edit user ${user.username}`}
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            aria-label={`Delete user ${user.username}`}
                          >
                            <IconDelete />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              &lt;
            </button>
            <button
              className="px-3 py-1 text-sm bg-gray-900 text-white rounded"
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
            <h2 id="modal-title" className="text-xl font-semibold mb-5 text-gray-900">
              {editMode ? "Edit User" : "Create New User"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium mb-2 text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              {!editMode && (
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editMode}
                  />
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium mb-2 text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm font-medium transition"
                >
                  {editMode ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAccessManagement;
