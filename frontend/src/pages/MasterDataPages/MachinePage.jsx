import React, { useState, useEffect, useCallback } from "react";
import {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getLines,
} from "../../services/api";

// Edit/Pencil Icon Component
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

// Delete/Trash Icon Component
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const MachinePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machineName, setMachineName] = useState("");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [rowsPerView, setRowsPerView] = useState(10); // default like screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const [machines, setMachines] = useState([]);
  const [lines, setLines] = useState([]);
  const [editingMachineId, setEditingMachineId] = useState(null);

  const fetchMachines = useCallback(async () => {
    try {
      const response = await getMachines();
      setMachines(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch machines:", error);
    }
  }, []);

  const fetchLines = useCallback(async () => {
    try {
      const response = await getLines();
      setLines(response.data);
    } catch (error) {
      console.error("Failed to fetch lines:", error);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
    fetchLines();
  }, [fetchMachines, fetchLines]);

  // Filter and paginate
  const filteredMachines = machines.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredMachines.length / rowsPerView) || 1;
  const startIndex = (currentPage - 1) * rowsPerView;
  const endIndex = startIndex + rowsPerView;
  const paginatedMachines = filteredMachines.slice(startIndex, endIndex);

  const openAddModal = () => {
    setEditingMachineId(null);
    setMachineName("");
    setSelectedLineId("");
    setIsModalOpen(true);
  };

  const openEditModal = (machine) => {
    setEditingMachineId(machine.id);
    setMachineName(machine.name);
    setSelectedLineId(machine.lineId || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMachineName("");
    setSelectedLineId("");
    setEditingMachineId(null);
  };

  const handleSaveMachine = async () => {
    if (!machineName.trim() || !selectedLineId) {
      alert("Please enter machine name and select a line");
      return;
    }
    try {
      if (editingMachineId) {
        await updateMachine(editingMachineId, {
          name: machineName.trim(),
          lineId: selectedLineId,
        });
      } else {
        await createMachine({
          name: machineName.trim(),
          lineId: selectedLineId,
        });
      }
      closeModal();
      fetchMachines();
    } catch (error) {
      console.error("Failed to save machine:", error);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (window.confirm("Are you sure you want to delete this machine?")) {
      try {
        await deleteMachine(id);
        fetchMachines();
      } catch (error) {
        console.error("Failed to delete machine:", error);
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
  }, [isModalOpen]);

  return (
    <div className="min-h-screen p-4 bg-white text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Machines Management
      </h1>

      {/* Top search + add */}
      <div className="flex flex-wrap items-center mb-4 gap-4">
        <input
          type="search"
          placeholder="Search machine name"
          aria-label="Search machines"
          className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-gray-300"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={openAddModal}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm"
        >
          Add Machine
        </button>
      </div>

      {/* Table with gray grid */}
      <div className="overflow-x-auto border border-gray-300 rounded bg-gray-50">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="px-2 py-1 border border-gray-300 w-10">Index</th>
              <th className="px-2 py-1 border border-gray-300">Machine Name</th>
              <th className="px-2 py-1 border border-gray-300">Line</th>
              <th className="sticky right-0 bg-gray-200 px-2 py-1 border border-gray-300 w-20 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-gray-900">
            {paginatedMachines.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-500 border border-gray-300"
                >
                  {filteredMachines.length === 0
                    ? "No machines found."
                    : "No machines found for current filter."}
                </td>
              </tr>
            ) : (
              paginatedMachines.map((machine, index) => {
                const line = lines.find((l) => l.id === machine.lineId);
                return (
                  <tr
                    key={machine.id}
                    tabIndex={0}
                    aria-label={`Machine ${machine.name}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {startIndex + index + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {machine.name}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {line ? line.name : "-"}
                    </td>
                    <td className="sticky right-0 bg-white border border-gray-300 px-2 py-1 z-10">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(machine)}
                          aria-label={`Edit machine ${machine.name}`}
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-gray-900 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteMachine(machine.id)}
                          aria-label={`Delete machine ${machine.name}`}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar: showing + rows per page + pagination */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-700">
        {/* Left: showing text */}
        <div>
          Showing{" "}
          {filteredMachines.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredMachines.length)} of{" "}
          {filteredMachines.length} machines
        </div>

        {/* Right: rows per page + page buttons */}
        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              aria-label="Rows per page"
              value={rowsPerView}
              onChange={(e) => {
                setRowsPerView(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-gray-300"
            >
              {[5, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                currentPage > 1 && setCurrentPage(currentPage - 1)
              }
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center border rounded ${
                    page === currentPage
                      ? "bg-gray-800 text-white border-gray-800"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() =>
                currentPage < totalPages &&
                setCurrentPage(currentPage + 1)
              }
              disabled={
                currentPage === totalPages || filteredMachines.length === 0
              }
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Machine Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          onClick={closeModal}
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="modal-title"
              className="text-xl font-semibold mb-4 text-gray-800"
            >
              {editingMachineId ? "Update Machine" : "Add Machine"}
            </h2>
            <input
              type="text"
              placeholder="Machine Name"
              aria-label="Machine name input"
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring focus:ring-gray-300"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              autoFocus
            />
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Select Line
            </label>
            <select
              aria-label="Select Line"
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring focus:ring-gray-300"
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
            >
              <option value="">-- Select Line --</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-200 text-sm"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                disabled={!machineName.trim() || !selectedLineId}
                className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-900 text-sm"
                onClick={handleSaveMachine}
              >
                {editingMachineId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinePage;
