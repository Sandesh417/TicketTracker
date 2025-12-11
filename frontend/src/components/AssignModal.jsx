import React from "react";

function AssignModal({ ticket, developers, selectedDeveloper, setSelectedDeveloper, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200">
        <h3 className="text-base font-semibold mb-4 text-gray-800">
          Assign Developer for <span className="text-blue-600">{ticket?.ticketNumber}</span>
        </h3>
        <select
          value={selectedDeveloper}
          onChange={(e) => setSelectedDeveloper(e.target.value)}
          className="border border-gray-300 rounded-lg w-full px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Select developer"
        >
          <option value="">-- Select Developer --</option>
          {developers.map((dev) => (
            <option key={dev.id} value={dev.username}>
              {dev.username}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium" 
            aria-label="Cancel assign developer"
          >
            Cancel
          </button>
          <button 
            onClick={onAssign} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium shadow-sm" 
            aria-label="Confirm assign developer"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignModal;
