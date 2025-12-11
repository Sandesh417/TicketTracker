import React, { useState, useEffect, useCallback } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
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

const ProjectPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [rowsPerView, setRowsPerView] = useState(10); // default like screenshot
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    try {
      const response = await getProjects();
      setProjects(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter and paginate projects
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredProjects.length / rowsPerView) || 1;
  const startIndex = (currentPage - 1) * rowsPerView;
  const endIndex = startIndex + rowsPerView;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const openAddModal = () => {
    setEditingProjectId(null);
    setProjectNameInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);
    setProjectNameInput(project.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProjectNameInput("");
    setEditingProjectId(null);
  };

  const handleSaveProject = async () => {
    if (!projectNameInput.trim()) {
      alert("Please enter a project name.");
      return;
    }
    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, {
          name: projectNameInput.trim(),
        });
      } else {
        await createProject({ name: projectNameInput.trim() });
      }
      closeModal();
      fetchProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
        fetchProjects();
      } catch (error) {
        console.error("Failed to delete project:", error);
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
        Projects Management
      </h1>

      <div className="flex flex-wrap items-center mb-4 gap-4">
        <input
          type="search"
          placeholder="Search by project name"
          aria-label="Search projects"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-gray-300"
        />
        <button
          onClick={openAddModal}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm"
        >
          Add Project
        </button>
      </div>

      {/* Table with gray grid */}
      <div className="overflow-x-auto border border-gray-300 rounded bg-gray-50">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200 text-gray-900">
            <tr>
              <th className="px-2 py-1 border border-gray-300 w-10">Index</th>
              <th className="px-2 py-1 border border-gray-300">Project Name</th>
              <th className="sticky right-0 bg-gray-200 px-2 py-1 border border-gray-300 w-20 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-gray-900">
            {paginatedProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center py-4 text-gray-500 border border-gray-300"
                >
                  {filteredProjects.length === 0
                    ? "No projects found."
                    : "No projects found for current filter."}
                </td>
              </tr>
            ) : (
              paginatedProjects.map((project, index) => (
                <tr
                  key={project.id}
                  tabIndex={0}
                  aria-label={`Project: ${project.name}`}
                  className="hover:bg-gray-50"
                >
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    {project.name}
                  </td>
                  <td className="sticky right-0 bg-white border border-gray-300 px-2 py-1 z-10">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(project)}
                        aria-label={`Edit project ${project.name}`}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        aria-label={`Delete project ${project.name}`}
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
          {filteredProjects.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(endIndex, filteredProjects.length)} of{" "}
          {filteredProjects.length} projects
        </div>

        {/* Right: rows per page + page buttons */}
        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              aria-label="Select number of rows per page"
              value={rowsPerView}
              onChange={(e) => {
                setRowsPerView(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-gray-300"
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
              disabled={currentPage === totalPages || filteredProjects.length === 0}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
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
            <h2
              id="modal-title"
              className="text-xl font-semibold mb-4 text-gray-800"
            >
              {editingProjectId ? "Update Project" : "Add Project"}
            </h2>
            <input
              type="text"
              aria-label="Project name input"
              placeholder="Project Name"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-gray-300 text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                disabled={!projectNameInput.trim()}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50 text-sm"
              >
                {editingProjectId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
