import React, { useState, useEffect, useRef } from 'react';
import {
  getProjects,
  getPlants,
  getShops,
  getLines,
  getMachines,
  createTicket,
} from '../services/api';

export default function CreateTicket({ onClose, onRefresh }) {
  const [ticketTitle, setTicketTitle] = useState('');
  const [requestorName, setRequestorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [projects, setProjects] = useState([]);
  const [plants, setPlants] = useState([]);
  const [shops, setShops] = useState([]);
  const [lines, setLines] = useState([]);
  const [machines, setMachines] = useState([]);

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [explanation, setExplanation] = useState('');
  const [attachments, setAttachments] = useState([]);

  const [drfLink, setDrfLink] = useState('');
  const [azureLink, setAzureLink] = useState('');

  const [isFormValid, setIsFormValid] = useState(false);

  const fileInputRef = useRef();

  useEffect(() => {
    getProjects().then(res => setProjects(res.data)).catch(console.error);
    getPlants().then(res => setPlants(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedPlant) {
      setShops([]);
      setSelectedShop('');
      return;
    }
    getShops(selectedPlant).then(res => setShops(res.data)).catch(console.error);
    setSelectedShop('');
    setSelectedLine('');
    setSelectedMachine('');
    setLines([]);
    setMachines([]);
  }, [selectedPlant]);

  useEffect(() => {
    if (!selectedShop) {
      setLines([]);
      setSelectedLine('');
      return;
    }
    getLines(selectedShop).then(res => setLines(res.data)).catch(console.error);
    setSelectedLine('');
    setSelectedMachine('');
    setMachines([]);
  }, [selectedShop]);

  useEffect(() => {
    if (!selectedLine) {
      setMachines([]);
      setSelectedMachine('');
      return;
    }
    getMachines(selectedLine).then(res => setMachines(res.data)).catch(console.error);
    setSelectedMachine('');
  }, [selectedLine]);

  // Form validation effect
  useEffect(() => {
    const isValid = 
      ticketTitle.trim() !== '' &&
      requestorName.trim() !== '' &&
      selectedProject !== '' &&
      selectedPlant !== '' &&
      explanation.trim() !== '';
    
    setIsFormValid(isValid);
  }, [ticketTitle, requestorName, selectedProject, selectedPlant, explanation]);

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...filesArray]);
  };

  const removeAttachment = (name) => {
    setAttachments(prev => prev.filter(file => file.name !== name));
  };

  const handleReset = () => {
    setTicketTitle('');
    setRequestorName('');
    setMobileNumber('');
    setSelectedProject('');
    setSelectedPlant('');
    setSelectedShop('');
    setSelectedLine('');
    setSelectedMachine('');
    setExplanation('');
    setAttachments([]);
    setShops([]);
    setLines([]);
    setMachines([]);
    setDrfLink('');
    setAzureLink('');
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', ticketTitle);
      formData.append('requestorName', requestorName);
      formData.append('mobileNumber', mobileNumber || null);
      formData.append('projectId', Number(selectedProject));
      formData.append('plantId', Number(selectedPlant));
      formData.append('shopId', selectedShop ? Number(selectedShop) : null);
      formData.append('lineId', selectedLine ? Number(selectedLine) : null);
      formData.append('machine', selectedMachine || null);
      formData.append('explanation', explanation);
      formData.append('drfLink', drfLink || null);
      formData.append('azureLink', azureLink || null);

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await createTicket(formData);

      handleReset();
      onClose();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating ticket:', error);
      if (error.response) {
        console.error('Backend error details:', error.response.data);
        alert(`Failed to create ticket: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to create ticket. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent bg-opacity-50 backdrop-blur-sm p-4">
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full"
        style={{ maxWidth: '900px', maxHeight: '90vh' }}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col" style={{ maxHeight: '90vh' }}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Create New Ticket</h2>
          </div>

          <div
            className="overflow-y-auto px-6 py-5"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Ticket Title */}
              <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                <label
                  htmlFor="ticketTitle"
                  className="text-xs font-medium text-gray-600 text-right"
                >
                  Ticket Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="ticketTitle"
                  type="text"
                  value={ticketTitle}
                  onChange={e => setTicketTitle(e.target.value)}
                  required
                  placeholder="Short summary of the issue"
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Details section: Explanation + Attachments in separate blocks */}
              <fieldset className="border border-gray-200 rounded-md px-4 py-3 space-y-4">
                <legend className="text-xs font-semibold text-gray-700 px-2">
                  Details
                </legend>

                {/* Explanation */}
                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label
                    htmlFor="explanation"
                    className="text-xs font-medium text-gray-600 text-right pt-1.5"
                  >
                    Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="explanation"
                    rows="3"
                    value={explanation}
                    onChange={e => setExplanation(e.target.value)}
                    required
                    placeholder="Add detailed explanation..."
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Attachments */}
                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label
                    className="text-xs font-medium text-gray-600 text-right pt-1.5"
                    htmlFor="attachmentInput"
                  >
                    Attachments
                  </label>
                  <div className="flex flex-col" style={{ maxWidth: '400px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      aria-label="Attach files"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      Attach Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      id="attachmentInput"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {attachments.length > 0 && (
                      <ul
                        className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 space-y-1"
                        style={{ maxHeight: '100px', overflowY: 'auto' }}
                      >
                        {attachments.map(file => (
                          <li
                            key={file.name}
                            className="flex justify-between items-center text-xs text-gray-700"
                          >
                            <span className="truncate flex-1 mr-2">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(file.name)}
                              className="text-red-600 hover:text-red-800 flex-shrink-0"
                              aria-label={`Remove ${file.name}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Project Details (with URLs + hierarchy) */}
              <fieldset className="border border-gray-200 rounded-md px-4 py-3">
                <legend className="text-xs font-semibold text-gray-700 px-2">
                  Project Details
                </legend>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 mt-2 items-center">
                 
                  {/* Project */}
                  <label
                    htmlFor="project"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="project"
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="" disabled>
                      Select Project
                    </option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {/* Plant */}
                  <label
                    htmlFor="plant"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Plant <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="plant"
                    value={selectedPlant}
                    onChange={e => setSelectedPlant(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="" disabled>
                      Select Plant
                    </option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {/* Shop */}
                  <label
                    htmlFor="shop"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Shop
                  </label>
                  <select
                    id="shop"
                    value={selectedShop}
                    onChange={e => setSelectedShop(e.target.value)}
                    disabled={!shops.length}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="" disabled>
                      Select Shop
                    </option>
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Line */}
                  <label
                    htmlFor="line"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Line
                  </label>
                  <select
                    id="line"
                    value={selectedLine}
                    onChange={e => setSelectedLine(e.target.value)}
                    disabled={!lines.length}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="" disabled>
                      Select Line
                    </option>
                    {lines.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>

                  {/* Machine */}
                  <label
                    htmlFor="machine"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Machine
                  </label>
                  <select
                    id="machine"
                    value={selectedMachine}
                    onChange={e => setSelectedMachine(e.target.value)}
                    disabled={!machines.length}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{ maxWidth: '400px' }}
                  >
                    <option value="" disabled>
                      Select Machine
                    </option>
                    {machines.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  {/* DRF Link */}
                  <label
                    htmlFor="drfLink"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    DRF Link
                  </label>
                  <input
                    id="drfLink"
                    type="url"
                    value={drfLink}
                    onChange={e => setDrfLink(e.target.value)}
                    placeholder="https://..."
                    className="w-100 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                  {/* Azure Link */}
                  <label
                    htmlFor="azureLink"
                    className="text-xs font-medium text-gray-600 text-right"
                  >
                    Azure Link
                  </label>
                  <input
                    id="azureLink"
                    type="url"
                    value={azureLink}
                    onChange={e => setAzureLink(e.target.value)}
                    placeholder="https://..."
                    className="w-100 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                </div>
              </fieldset>

              {/* Requestor Details at last */}
              <fieldset className="border border-gray-200 rounded-md px-4 py-3">
                <legend className="text-xs font-semibold text-gray-700 px-2">
                  Requestor Details
                </legend>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label
                      htmlFor="requestorName"
                      className="text-xs font-medium text-gray-600 block mb-1"
                    >
                      Requestor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="requestorName"
                      type="text"
                      value={requestorName}
                      onChange={e => setRequestorName(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mobileNumber"
                      className="text-xs font-medium text-gray-600 block mb-1"
                    >
                      Mobile Number
                    </label>
                    <input
                      id="mobileNumber"
                      type="tel"
                      maxLength="10"
                      value={mobileNumber}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 10) val = val.slice(0, 10);
                        setMobileNumber(val);
                      }}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      inputMode="numeric"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-4 py-1.5 rounded text-xs font-medium focus:outline-none focus:ring-1 transition-colors ${
                isFormValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
