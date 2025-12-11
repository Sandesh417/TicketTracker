import React, { useState, useEffect, useCallback } from "react";
import { getShops, createShop, updateShop, deleteShop, getPlants } from "../../services/api";

// Edit Icon
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="#19202a"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

// Delete Icon
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="#b3001a"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ShopPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shopNameInput, setShopNameInput] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [shops, setShops] = useState([]);
  const [plants, setPlants] = useState([]);
  const [editingShopId, setEditingShopId] = useState(null);

  const fetchShops = useCallback(async () => {
    try {
      const response = await getShops();
      setShops(response.data);
    } catch (error) {
      console.error("Failed to fetch shops:", error);
    }
  }, []);

  const fetchPlants = useCallback(async () => {
    try {
      const response = await getPlants();
      setPlants(response.data);
    } catch (error) {
      console.error("Failed to fetch plants:", error);
    }
  }, []);

  useEffect(() => {
    fetchShops();
    fetchPlants();
  }, [fetchShops, fetchPlants]);

  // Filter shops based on search term
  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredShops.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  // Reset to page 1 when search term or rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const openAddModal = () => {
    setEditingShopId(null);
    setShopNameInput("");
    setSelectedPlantId("");
    setIsModalOpen(true);
  };

  const openEditModal = (shop) => {
    setEditingShopId(shop.id);
    setShopNameInput(shop.name);
    setSelectedPlantId(shop.plantId || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShopNameInput("");
    setSelectedPlantId("");
    setEditingShopId(null);
  };

  const handleSaveShop = async () => {
    if (!shopNameInput.trim() || !selectedPlantId) {
      alert("Please enter shop name and select a plant.");
      return;
    }
    try {
      if (editingShopId) {
        await updateShop(editingShopId, { name: shopNameInput.trim(), plantId: selectedPlantId });
      } else {
        await createShop({ name: shopNameInput.trim(), plantId: selectedPlantId });
      }
      closeModal();
      fetchShops();
    } catch (error) {
      console.error("Failed to save shop:", error);
    }
  };

  const handleDeleteShop = async (id) => {
    if (window.confirm("Are you sure you want to delete this shop?")) {
      try {
        await deleteShop(id);
        fetchShops();
      } catch (error) {
        console.error("Failed to delete shop:", error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";
  }, [isModalOpen]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
      >
        &lt;
      </button>
    );

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded text-sm ${
            currentPage === i
              ? "bg-[#19202a] text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
      >
        &gt;
      </button>
    );

    return buttons;
  };

  return (
    <div className="min-h-screen p-4 bg-white text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-[#19202a]">Shops Management</h1>

      <div className="flex flex-wrap items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search by shop name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search shops"
          className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19202a] bg-white"
        />
        <button
          onClick={openAddModal}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="px-4 py-2 rounded bg-[#19202a] hover:bg-[#253143] text-white text-sm font-semibold"
        >
          Add Shop
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-[#19202a]">
            <tr>
              <th className="px-2 py-1 border border-gray-300 w-10 font-semibold">Index</th>
              <th className="px-2 py-1 border border-gray-300 font-semibold">Shop Name</th>
              <th className="px-2 py-1 border border-gray-300 font-semibold">Plant Name</th>
              <th className="sticky right-0 bg-gray-100 px-2 py-1 border border-gray-300 w-20 z-10 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-gray-900">
            {currentShops.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No shops found.
                </td>
              </tr>
            ) : (
              currentShops.map((shop, index) => {
                const plant = plants.find((p) => p.id === shop.plantId);
                return (
                  <tr
                    key={shop.id}
                    tabIndex={0}
                    aria-label={`Shop: ${shop.name}`}
                    className="hover:bg-gray-100"
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {startIndex + index + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{shop.name}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {plant ? plant.name : "-"}
                    </td>
                    <td className="sticky right-0 bg-white border border-gray-300 px-2 py-1 z-10">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(shop)}
                          aria-label={`Edit shop ${shop.name}`}
                          className="p-1.5 hover:bg-[#e9ecef] rounded text-[#19202a] hover:text-black transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteShop(shop.id)}
                          aria-label={`Delete shop ${shop.name}`}
                          className="p-1.5 hover:bg-[#f9eaea] rounded text-[#b3001a] hover:text-red-700 transition-colors"
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
        <div>
          Showing {filteredShops.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} entries
        </div>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            aria-label="Select rows per page"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none bg-white text-sm"
          >
            {[10, 15, 20, 25].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <div className="flex gap-1">{renderPageButtons()}</div>
        </div>
      </div>

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
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-xl font-semibold mb-4 text-[#19202a]">
              {editingShopId ? "Update Shop" : "Add Shop"}
            </h2>
            <input
              type="text"
              placeholder="Shop Name"
              value={shopNameInput}
              onChange={(e) => setShopNameInput(e.target.value)}
              aria-label="Shop name input"
              autoFocus
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#19202a] bg-white"
            />
            <label className="block mb-2 font-medium text-gray-700 text-sm">Select Plant</label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              aria-label="Select plant for shop"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#19202a] bg-white"
            >
              <option value="">-- Select Plant --</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShop}
                disabled={!shopNameInput.trim() || !selectedPlantId}
                className="px-4 py-2 rounded bg-[#19202a] hover:bg-[#253143] text-white disabled:opacity-50 text-sm font-semibold"
              >
                {editingShopId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
