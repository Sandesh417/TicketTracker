import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaEye, FaFileAlt, FaComment } from 'react-icons/fa';
import { getTickets, getTicket, getTicketHistory, getFileUrl } from '../services/api';

export default function DocumentsModal({ onClose, token }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const res = await getTickets('', token);
      const ticketsData = res.data.data || res.data;
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async (ticketNumber) => {
    setLoadingAttachments(true);
    try {
      const ticketRes = await getTicket(ticketNumber, token);
      const ticketData = ticketRes.data.data || ticketRes.data;
      
      const historyRes = await getTicketHistory(ticketNumber, token);
      const historyDataWrapper = historyRes.data.data || historyRes.data;
      const commentsArray = historyDataWrapper.comments || [];
      const ticketAttachmentsFromHistory = historyDataWrapper.ticketAttachments || [];
      
      let allAttachments = [];
      
      const ticketAttachments = ticketData.attachments || ticketAttachmentsFromHistory || [];
      if (ticketAttachments && Array.isArray(ticketAttachments)) {
        ticketAttachments.forEach(att => {
          allAttachments.push({
            filename: att.filename || att.name || att.path?.split('/').pop(),
            path: att.path || att.filepath || att.url,
            filepath: att.filepath || att.path || att.url,
            source: 'Ticket Creation',
            uploadedBy: att.uploadedBy || ticketData.requestorName || ticketData.createdBy || '-',
            uploadedAt: att.uploadedAt || att.createdAt || ticketData.createdAt,
            commentText: null
          });
        });
      }
      
      if (commentsArray && Array.isArray(commentsArray)) {
        commentsArray.forEach((comment) => {
          if (comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0) {
            comment.attachments.forEach(att => {
              allAttachments.push({
                filename: att.filename || att.name || att.storedFilename?.split('/').pop(),
                path: att.path || att.filepath || att.url,
                filepath: att.filepath || att.path || att.url,
                source: 'Comment',
                uploadedBy: att.uploadedBy || comment.user || comment.userName || comment.username || '-',
                uploadedAt: att.uploadedAt || att.createdAt || comment.date || comment.createdAt,
                commentText: comment.text || comment.comment || comment.message 
              });
            });
          }
        });
      }
      
      allAttachments.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || 0);
        const dateB = new Date(b.uploadedAt || 0);
        return dateB - dateA;
      });
      
      setAttachments(allAttachments);
      
    } catch (error) {
      console.error('Error fetching attachments:', error);
      alert('Failed to load attachments');
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleTicketChange = (e) => {
    const ticketNumber = e.target.value;
    setSelectedTicket(ticketNumber);
    if (ticketNumber) {
      fetchAttachments(ticketNumber);
    } else {
      setAttachments([]);
    }
  };

  const handleDownload = async (filepath) => {
    try {
      if (!filepath) {
        alert('File path not available');
        return;
      }
      
      const fileUrl = getFileUrl(filepath);
      console.log('Downloading from URL:', fileUrl);
      
      // Fetch the file as a blob
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('File not found');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filepath.split('/').pop() || 'download';
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleView = (filepath) => {
    try {
      if (!filepath) {
        alert('File path not available');
        return;
      }
      const fileUrl = getFileUrl(filepath);
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to view file');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '-';
    }
  };

  const getFileName = (attachment) => {
    if (attachment.filename) return attachment.filename;
    if (attachment.name) return attachment.name;
    if (attachment.path) return attachment.path.split('/').pop();
    if (attachment.filepath) return attachment.filepath.split('/').pop();
    return 'Unknown file';
  };

  const getFilePath = (attachment) => {
    return attachment.path || attachment.filepath || attachment.url || '';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md p-4">
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-semibold text-gray-800">Documents & Attachments</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          
          {/* Ticket Selection */}
          <div className="mb-5">
            <label htmlFor="ticketSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Ticket Number
            </label>
            <select
              id="ticketSelect"
              value={selectedTicket}
              onChange={handleTicketChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              <option value="">-- Select a Ticket --</option>
              {tickets.map((ticket) => (
                <option key={ticket.ticketNumber} value={ticket.ticketNumber}>
                  #{ticket.ticketNumber} - {ticket.title}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {loadingAttachments && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-gray-600">Loading attachments...</span>
            </div>
          )}

          {/* Attachments List */}
          {!loadingAttachments && selectedTicket && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                All Attachments ({attachments.length})
              </h3>
              
              {attachments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic text-sm bg-gray-50 rounded-lg border border-gray-200">
                  No attachments found for this ticket.
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          File Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Uploaded By
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Upload Time
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attachments.map((attachment, index) => {
                        const filename = getFileName(attachment);
                        const filepath = getFilePath(attachment);
                        
                        return (
                          <tr key={index} className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="flex items-start gap-2">
                                <FaFileAlt className="text-blue-600 text-base flex-shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                  <span className="truncate max-w-xs font-medium" title={filename}>
                                    {filename}
                                  </span>
                                  {attachment.commentText && (
                                    <span className="text-xs text-gray-500 italic truncate max-w-xs mt-0.5" title={attachment.commentText}>
                                      💬 {attachment.commentText}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                attachment.source === 'Comment' 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {attachment.source === 'Comment' && <FaComment className="text-[10px]" />}
                                {attachment.source}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                              {attachment.uploadedBy}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDateTime(attachment.uploadedAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleView(filepath)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 hover:border-blue-400 transition-colors shadow-sm"
                                  title="View Document"
                                >
                                  <FaEye className="text-xs" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownload(filepath)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded hover:bg-green-100 hover:border-green-400 transition-colors shadow-sm"
                                  title="Download Document"
                                >
                                  <FaDownload className="text-xs" />
                                  Download
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!selectedTicket && !loadingAttachments && (
            <div className="text-center py-16">
              <FaFileAlt className="mx-auto text-gray-300 text-5xl mb-4" />
              <p className="text-gray-500 text-sm">
                Please select a ticket to view all its attachments
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
