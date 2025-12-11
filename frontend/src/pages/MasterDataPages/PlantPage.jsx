import React, { useState, useEffect, useCallback } from "react";
import {
  getPlants,
  createPlant,
  updatePlant,
  deletePlant,
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

const PlantPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plantNameInput, setPlantNameInput] = useState("");
  const [rowsPerView, setRowsPerView] = useState(10); // default like screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const [plants, setPlants] = useState([]);
  const [editingPlantId, setEditingPlantId] = useState(null);

  const fetchPlants = useCallback(async () => {
    try {
      const response = await getPlants();
      setPlants(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch plants:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  // Filter + pagination
  const filteredPlants = plants.filter((plant) =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredPlants.length / rowsPerView) || 1;
  const startIndex = (currentPage - 1) * rowsPerView;
  const endIndex = startIndex + rowsPerView;
  const paginatedPlants = filteredPlants.slice(startIndex, endIndex);

  const openAddModal = () => {
    setEditingPlantId(null);
    setPlantNameInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (plant) => {
    setEditingPlantId(plant.id);
    setPlantNameInput(plant.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPlantNameInput("");
    setEditingPlantId(null);
  };

  const handleSavePlant = async () => {
    if (!plantNameInput.trim()) {
      alert("Please enter a plant name.");
      return;
    }
    try {
      if (editingPlantId) {
        await updatePlant(editingPlantId, { name: plantNameInput.trim() });
      } else {
        await createPlant({ name: plantNameInput.trim() });
      }
      closeModal();
      fetchPlants();
    } catch (error) {
      console.error("Failed to save plant:", error);
    }
  };

  const handleDeletePlant = async (id) => {
    if (window.confirm("Are you sure you want to delete this plant?")) {
      try {
        await deletePlant(id);
        fetchPlants();
      } catch (error) {
        console.error("Failed to delete plant:", error);
      }
    }
  };

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape" && isModalOpen) closeModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isModalOpen]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
  }, [isModalOpen]);

  return (
    <div className="min-h-screen p-4 bg-white text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Plants Management
      </h1>

      {/* Search + Add */}
      <div className="flex flex-wrap items-center mb-4 gap-4">
        <input
          type="search"
          placeholder="Search by plant name"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Search plants"
          className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-gray-300"
        />
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
        >
          Add Plant
        </button>
      </div>

      {/* Table with gray grid */}
      <div className="overflow-x-auto border border-gray-300 rounded bg-gray-50">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="px-2 py-1 border border-gray-300 w-10">Index</th>
              <th className="px-2 py-1 border border-gray-300">Plant Name</th>
              <th className="sticky right-0 bg-gray-200 px-2 py-1 border border-gray-300 w-20 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-gray-900">
            {paginatedPlants.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-4 text-gray-500 border border-gray-300"
                >
                  {filteredPlants.length === 0
                    ? "No plants found."
                    : "No plants found for current filter."}
                </td>
              </tr>
            ) : (
              paginatedPlants.map((plant, index) => (
                <tr
                  key={plant.id}
                  tabIndex={0}
                  className="hover:bg-gray-50"
                  aria-label={`Plant: ${plant.name}`}
                >
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {plant.name}
                  </td>
                  <td className="sticky right-0 bg-white border border-gray-300 px-2 py-1 z-10">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(plant)}
                        aria-label={`Edit plant ${plant.name}`}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeletePlant(plant.id)}
                        aria-label={`Delete plant ${plant.name}`}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom bar: showing + rows per page + pagination */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-700">
        {/* Left: showing text */}
        <div>
          Showing{" "}
          {filteredPlants.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredPlants.length)} of{" "}
          {filteredPlants.length} plants
        </div>

        {/* Right: rows per page + page buttons */}
        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={rowsPerView}
              onChange={(e) => {
                setRowsPerView(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-gray-300"
              aria-label="Rows per page"
            >
              {[5, 10, 15].map((num) => (
                <option key={num} value={num}>
                  {num}
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
              disabled={currentPage === totalPages || filteredPlants.length === 0}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
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
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h2
              id="modal-title"
              className="text-xl font-semibold mb-4 text-gray-800"
            >
              {editingPlantId ? "Update Plant" : "Add Plant"}
            </h2>
            <input
              type="text"
              placeholder="Plant Name"
              aria-label="Plant name input"
              value={plantNameInput}
              onChange={(e) => setPlantNameInput(e.target.value)}
              autoFocus
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring focus:ring-gray-300"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlant}
                disabled={!plantNameInput.trim()}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 text-sm"
              >
                {editingPlantId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantPage;
