import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  RiEdit2Line,
  RiCloseLine,
  RiDownloadLine,
  RiEyeLine,
  RiArrowLeftSLine,
  RiSaveLine,
  RiSendPlaneFill,
  RiLink,
  RiAttachmentLine,
  RiMessage3Line,
} from "react-icons/ri";
import {
  getTicketHistory,
  addTicketComment,
  editTicketComment,
  deleteTicketComment,
  updateTicketRemark,
  getFileUrl,
  updateTicket,
} from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";

export default function TicketHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticket, authToken } = location.state || {};

  const [comments, setComments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [remark, setRemark] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [editingRemark, setEditingRemark] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [editingExplanation, setEditingExplanation] = useState(false);

  const [titleText, setTitleText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  const [drfUrl, setDrfUrl] = useState("");
  const [azureUrl, setAzureUrl] = useState("");
  const [editingDrfUrl, setEditingDrfUrl] = useState(false);
  const [editingAzureUrl, setEditingAzureUrl] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);
  const [ticketAttachments, setTicketAttachments] = useState([]);

  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");

  const [activeTab, setActiveTab] = useState("comments");
  
  // NEW: Add state for user filter
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");

  const commentsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authToken) {
      try {
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        setCurrentUserRole(payload.role || "");
        setCurrentUsername(payload.username || "");
      } catch {
        setCurrentUserRole("");
        setCurrentUsername("");
      }
    }
  }, [authToken]);

  const isAdmin = currentUserRole === "Admin";

  const loadHistoryAndRemark = async () => {
    if (!ticket) return;
    try {
      const res = await getTicketHistory(ticket.ticketNumber, authToken);
      const responseData = res.data.data || res.data;
      
      setComments(responseData.comments || []);
      setRemark(responseData.remark || "");
      setRemarkText(responseData.remark || "");
      setExplanationText(ticket.explanation || "");
      setTitleText(ticket.title || "");
      setTicketAttachments(responseData.ticketAttachments || ticket.attachments || []);
      setDrfUrl(
        responseData.drfLink ||
          `http://localhost:8000/api/tickets/${ticket.ticketNumber}/`
      );
      setAzureUrl(
        responseData.azureLink ||
          `https://your-azure-app.azurewebsites.net/api/tickets/${ticket.ticketNumber}`
      );
    } catch (err) {
      console.error("Error loading ticket history:", err);
    }
  };

  useEffect(() => {
    if (ticket?.ticketNumber) {
      loadHistoryAndRemark();
    }
  }, [ticket?.ticketNumber, authToken]);

  useEffect(() => {
    if (activeTab === "comments") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, activeTab]);

  const workingDays = useMemo(() => {
    if (!ticket?.assignedDate) return 0;
    const start = new Date(ticket.assignedDate);
    const now = new Date();
    return Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [ticket?.assignedDate]);

  const commentAttachmentsWithMeta = useMemo(() => {
    const attachmentsArray = [];
    comments.forEach((comment) => {
      if (comment.attachments && comment.attachments.length > 0) {
        comment.attachments.forEach((att) => {
          attachmentsArray.push({
            ...att,
            commentUser: comment.user,
            commentDate: comment.date,
            commentId: comment.id,
          });
        });
      }
    });
    return attachmentsArray;
  }, [comments]);

  // NEW: Extract unique users from comments
  const uniqueUsers = useMemo(() => {
    const users = comments.map(c => c.user).filter(Boolean);
    return ["all", ...new Set(users)];
  }, [comments]);

  // NEW: Filter comments based on selected user
  const filteredComments = useMemo(() => {
    if (selectedUserFilter === "all") return comments;
    return comments.filter(c => c.user === selectedUserFilter);
  }, [comments, selectedUserFilter]);

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };

  const formatFullDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleSaveTitle = async () => {
    if (!titleText.trim()) {
      alert("Title cannot be empty");
      return;
    }
    
    try {
      await updateTicket(
        ticket.ticketNumber,
        { title: titleText.trim() },
        authToken
      );
      
      ticket.title = titleText.trim();
      setEditingTitle(false);
    } catch (error) {
      console.error("Failed to update title:", error);
      alert("Failed to update title.");
    }
  };

  const handleSaveExplanation = async () => {
    if (!explanationText.trim()) {
      alert("Explanation cannot be empty");
      return;
    }
    
    try {
      await updateTicket(
        ticket.ticketNumber,
        { explanation: explanationText.trim() },
        authToken
      );
      
      ticket.explanation = explanationText.trim();
      setEditingExplanation(false);
    } catch (error) {
      console.error("Failed to update explanation:", error);
      alert("Failed to update explanation.");
    }
  };

  const handleSaveDrfUrl = async () => {
    if (!drfUrl.trim()) {
      alert("DRF URL cannot be empty");
      return;
    }
    
    try {
      await updateTicket(
        ticket.ticketNumber,
        { drfLink: drfUrl.trim() },
        authToken
      );
      
      setEditingDrfUrl(false);
    } catch (error) {
      console.error("Failed to update DRF URL:", error);
      alert("Failed to update DRF URL.");
    }
  };

  const handleSaveAzureUrl = async () => {
    if (!azureUrl.trim()) {
      alert("Azure URL cannot be empty");
      return;
    }
    
    try {
      await updateTicket(
        ticket.ticketNumber,
        { azureLink: azureUrl.trim() },
        authToken
      );
      
      setEditingAzureUrl(false);
    } catch (error) {
      console.error("Failed to update Azure URL:", error);
      alert("Failed to update Azure URL.");
    }
  };

  const handleSaveRemark = async () => {
    if (!remarkText.trim()) return;
    try {
      await updateTicketRemark(
        ticket.ticketNumber,
        remarkText.trim(),
        authToken
      );
      await loadHistoryAndRemark();
      setEditingRemark(false);
    } catch (error) {
      console.error("Failed to update remark:", error);
      alert("Failed to update remark.");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setCommentAttachments((prev) => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index) => {
    setCommentAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && commentAttachments.length === 0) return;
    try {
      const formData = new FormData();
      formData.append("text", commentText.trim());
      formData.append("userName", currentUsername);
      commentAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await addTicketComment(ticket.ticketNumber, formData, authToken);
      await loadHistoryAndRemark();
      setCommentText("");
      setCommentAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment.");
    }
  };

  const getLastCommentByUser = () => {
    const userComments = comments.filter((c) => c.user === currentUsername);
    return userComments[userComments.length - 1];
  };

  const isLastCommentEditable = (comment) => {
    const last = getLastCommentByUser();
    return last && last.id === comment.id && comment.user === currentUsername;
  };

  const handleEditClick = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleEditSave = async (id) => {
    if (!editText.trim()) return;
    try {
      await editTicketComment(
        ticket.ticketNumber,
        id,
        editText.trim(),
        currentUsername,
        authToken
      );
      await loadHistoryAndRemark();
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to edit comment:", error);
      alert("Failed to edit comment.");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      await deleteTicketComment(ticket.ticketNumber, id, authToken);
      await loadHistoryAndRemark();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment.");
    }
  };

  const renderAttachment = (att) => {
    const isImage = att.mimetype?.startsWith("image/");
    const isPDF = att.mimetype === "application/pdf";
    const fileUrl = getFileUrl(att.path);

    return (
      <div
        key={att.storedFilename || att.filename}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs"
      >
        {isImage && (
          <svg
            className="w-3.5 h-3.5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
        {isPDF && (
          <svg
            className="w-3.5 h-3.5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )}
        <span
          className="truncate flex-1 text-gray-700"
          title={att.filename || att.storedFilename}
        >
          {att.filename || att.storedFilename}
        </span>
        <div className="flex gap-1">
          {isImage && (
            <button
              onClick={() =>
                setPreviewImage({ src: fileUrl, name: att.filename })
              }
              className="text-blue-600 hover:text-blue-800 inline-block border border-gray-300 rounded p-1"
              title="View"
            >
              <RiEyeLine className="text-[11px]" />
            </button>
          )}
          <a
            href={fileUrl}
            download={att.filename}
            className="text-green-600 hover:text-green-800 inline-block border border-gray-300 rounded p-1"
            title="Download"
            target="_blank"
            rel="noopener noreferrer"
          >
            <RiDownloadLine className="text-[11px]" />
          </a>
        </div>
      </div>
    );
  };

  const renderAttachmentCard = (att) => {
    const isImage = att.mimetype?.startsWith("image/");
    const isPDF = att.mimetype === "application/pdf";
    const fileUrl = getFileUrl(att.path);

    return (
      <div
        key={`${att.commentId}-${att.storedFilename || att.filename}`}
        className="bg-white border border-gray-200 rounded-lg p-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isImage ? (
              <div
                className="cursor-pointer"
                onClick={() =>
                  setPreviewImage({ src: fileUrl, name: att.filename })
                }
              >
                <img
                  src={fileUrl}
                  alt={att.filename}
                  className="w-20 h-20 rounded border border-gray-300 object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded border border-gray-300 bg-gray-50 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium text-gray-900 truncate"
              title={att.filename}
            >
              {att.filename}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
              <span className="font-medium">{att.commentUser}</span>
              <span>•</span>
              <span>
                {formatShortDate(att.commentDate)}{" "}
                {formatTimeOnly(att.commentDate)}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              {isImage && (
                <button
                  onClick={() =>
                    setPreviewImage({ src: fileUrl, name: att.filename })
                  }
                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 border border-gray-300 rounded px-2 py-1"
                >
                  <RiEyeLine className="text-xs" />
                  View
                </button>
              )}
              <a
                href={fileUrl}
                download={att.filename}
                className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:text-green-800 border border-gray-300 rounded px-2 py-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <RiDownloadLine className="text-xs" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-lg px-8 py-6 text-center">
          <p className="text-gray-700 text-sm">
            No ticket data available. Go back and select a ticket.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs"
            >
              <RiArrowLeftSLine className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5">
              Ticket #{ticket.ticketNumber}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {editingTitle ? (
              <>
                <input
                  type="text"
                  className="flex-1 text-xl font-semibold text-gray-900 border border-gray-300 rounded px-3 py-2"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="Enter ticket title..."
                />
                <button
                  onClick={handleSaveTitle}
                  className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-green-50"
                >
                  <RiSaveLine className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setTitleText(ticket.title || "");
                    setEditingTitle(false);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-red-50"
                >
                  <RiCloseLine className="w-3 h-3" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h1 className="flex-1 text-xl font-semibold text-gray-900">
                  {ticket.title || "Untitled Ticket"}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <RiEdit2Line className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                <RiLink className="w-3.5 h-3.5 text-orange-500" />
                DRF API Endpoint
              </h3>
              {isAdmin && !editingDrfUrl && (
                <button
                  onClick={() => setEditingDrfUrl(true)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
                >
                  <RiEdit2Line className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            {editingDrfUrl ? (
              <>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  value={drfUrl}
                  onChange={(e) => setDrfUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDrfUrl}
                    className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-2 py-1 hover:bg-green-50"
                  >
                    <RiSaveLine className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setDrfUrl(
                        `http://localhost:8000/api/tickets/${ticket.ticketNumber}/`
                      );
                      setEditingDrfUrl(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-2 py-1 hover:bg-red-50"
                  >
                    <RiCloseLine className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  readOnly
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono bg-gray-50 mb-2"
                  value={drfUrl}
                  onFocus={(e) => e.target.select()}
                />
                <a
                  href={drfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-white bg-orange-500 hover:bg-orange-600 rounded px-3 py-1.5"
                >
                  <RiLink className="w-3 h-3" />
                  Open DRF API
                </a>
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                <RiLink className="w-3.5 h-3.5 text-purple-500" />
                Azure API Endpoint
              </h3>
              {isAdmin && !editingAzureUrl && (
                <button
                  onClick={() => setEditingAzureUrl(true)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
                >
                  <RiEdit2Line className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            {editingAzureUrl ? (
              <>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  value={azureUrl}
                  onChange={(e) => setAzureUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAzureUrl}
                    className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-2 py-1 hover:bg-green-50"
                  >
                    <RiSaveLine className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setAzureUrl(
                        `https://your-azure-app.azurewebsites.net/api/tickets/${ticket.ticketNumber}`
                      );
                      setEditingAzureUrl(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-2 py-1 hover:bg-red-50"
                  >
                    <RiCloseLine className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  readOnly
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono bg-gray-50 mb-2"
                  value={azureUrl}
                  onFocus={(e) => e.target.select()}
                />
                <a
                  href={azureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-white bg-purple-500 hover:bg-purple-600 rounded px-3 py-1.5"
                >
                  <RiLink className="w-3 h-3" />
                  Open Azure API
                </a>
              </>
            )}
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-lg mb-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h2 className="text-xs font-semibold text-gray-600 uppercase">
              Explanation
            </h2>
            {isAdmin && !editingExplanation && (
              <button
                onClick={() => setEditingExplanation(true)}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
              >
                <RiEdit2Line className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
          <div className="p-4 text-xs text-gray-700">
            {editingExplanation ? (
              <>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSaveExplanation}
                    className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-2 py-1 hover:bg-green-50"
                  >
                    <RiSaveLine className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setExplanationText(ticket.explanation || "");
                      setEditingExplanation(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-2 py-1 hover:bg-red-50"
                  >
                    <RiCloseLine className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="whitespace-pre-wrap">
                {ticket.explanation || "No explanation provided"}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <section className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-2 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-600 uppercase">
                Ticket Information
              </h2>
            </div>
            <div className="p-4">
              <dl className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Assigned To:</dt>
                  <dd className="text-gray-900 font-medium">
                    {ticket.userName || ticket.assignedTo || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Assigned Date:</dt>
                  <dd
                    className="text-gray-900 font-medium"
                    title={formatFullDateTime(ticket.assignedDate)}
                  >
                    {formatShortDate(ticket.assignedDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Working Days:</dt>
                  <dd className="text-green-600 font-bold">
                    {workingDays} days
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg md:col-span-2">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-600 uppercase">
                Remark
              </h2>
              {isAdmin && !editingRemark && (
                <button
                  onClick={() => setEditingRemark(true)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
                >
                  <RiEdit2Line className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            <div className="p-4 text-xs text-gray-700">
              {editingRemark ? (
                <>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    placeholder="Enter admin remark..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSaveRemark}
                      className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-2 py-1 hover:bg-green-50"
                    >
                      <RiSaveLine className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setRemarkText(remark);
                        setEditingRemark(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-2 py-1 hover:bg-red-50"
                    >
                      <RiCloseLine className="w-3 h-3" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="whitespace-pre-wrap italic text-gray-500">
                  {remark || "No remarks added"}
                </div>
              )}
            </div>
          </section>
        </div>

        {ticketAttachments && ticketAttachments.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg mb-4">
            <div className="px-4 py-2 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-600 uppercase">
                Attachments ({ticketAttachments.length})
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {ticketAttachments.map(renderAttachment)}
              </div>
            </div>
          </section>
        )}

        <section
          className="bg-white border border-gray-200 rounded-lg flex flex-col"
          style={{ height: "600px" }}
        >
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase transition-colors ${
                    activeTab === "comments"
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <RiMessage3Line className="w-3.5 h-3.5" />
                  Comments Timeline
                </button>
                <button
                  onClick={() => setActiveTab("attachments")}
                  className={`flex items-center gap-1.5 text-xs font-semibold uppercase transition-colors ${
                    activeTab === "attachments"
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <RiAttachmentLine className="w-3.5 h-3.5" />
                  Attachments
                </button>
              </div>
              
              {/* NEW: Add filter dropdown */}
              {activeTab === "comments" && (
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.slice(1).map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              {activeTab === "comments"
                ? `${filteredComments.length} comment${filteredComments.length !== 1 ? "s" : ""}`
                : `${commentAttachmentsWithMeta.length} attachment${
                    commentAttachmentsWithMeta.length !== 1 ? "s" : ""
                  } from comments`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {activeTab === "comments" ? (
              filteredComments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic text-xs">
                    {selectedUserFilter === "all" 
                      ? "No comments yet. Start the conversation!"
                      : `No comments from ${selectedUserFilter}`}
                  </p>
                </div>
              ) : (
                <>
                  {filteredComments.map((comment) => {
                    const isOwnComment = comment.user === currentUsername;
                    const isLastEditable = isLastCommentEditable(comment);
                    const showEditOption = isOwnComment && isLastEditable && !editingId;
                    
                    const hasText = comment.text && comment.text.trim();

                    return (
                      <div
                        key={comment.id}
                        className={`flex ${
                          isOwnComment ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwnComment ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-medium text-gray-700">
                              {comment.user || "Anonymous"}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {formatShortDate(comment.date)}{" "}
                              {formatTimeOnly(comment.date)}
                            </span>
                          </div>

                          {editingId === comment.id ? (
                            <div className="w-full bg-white border border-gray-300 rounded-lg p-3">
                              <textarea
                                rows={3}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditSave(comment.id)}
                                  className="inline-flex items-center gap-1 text-xs text-green-700 border border-gray-300 rounded px-2 py-1 hover:bg-green-50"
                                >
                                  <RiSaveLine className="w-3 h-3" />
                                  Update
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="inline-flex items-center gap-1 text-xs text-red-700 border border-gray-300 rounded px-2 py-1 hover:bg-red-50"
                                >
                                  <RiCloseLine className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Render images first as main content */}
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="space-y-2">
                                  {comment.attachments.map((att, idx) => {
                                    const isImage = att.mimetype?.startsWith("image/");
                                    const isPDF = att.mimetype === "application/pdf";
                                    const fileUrl = getFileUrl(att.path);

                                    if (isImage) {
                                      return (
                                        <div
                                          key={idx}
                                          className="cursor-pointer"
                                          onClick={() =>
                                            setPreviewImage({ src: fileUrl, name: att.filename })
                                          }
                                        >
                                          <img
                                            src={fileUrl}
                                            alt={att.filename}
                                            className="max-w-[300px] max-h-[300px] rounded-lg border border-gray-300 object-cover shadow-sm hover:shadow-md transition-shadow"
                                          />
                                        </div>
                                      );
                                    } else if (isPDF) {
                                      return (
                                        <div
                                          key={idx}
                                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                                            isOwnComment
                                              ? "bg-blue-600 border border-blue-700"
                                              : "bg-gray-100 border border-gray-200"
                                          }`}
                                        >
                                          <svg
                                            className={`w-4 h-4 ${
                                              isOwnComment ? "text-white" : "text-red-500"
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                          </svg>
                                          <span
                                            className={`truncate flex-1 max-w-[180px] ${
                                              isOwnComment ? "text-white" : "text-gray-700"
                                            }`}
                                            title={att.filename}
                                          >
                                            {att.filename}
                                          </span>
                                          <a
                                            href={fileUrl}
                                            download={att.filename}
                                            className={`hover:opacity-80 ${
                                              isOwnComment ? "text-white" : "text-blue-600"
                                            }`}
                                            title="Download"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <RiDownloadLine className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              )}

                              {/* Render text below images (if exists) */}
                              {hasText && (
                                <div
                                  className={`rounded-lg px-3 py-2 text-xs border ${
                                    isOwnComment
                                      ? "bg-blue-500 text-white border-blue-600"
                                      : "bg-white text-gray-800 border-gray-200"
                                  }`}
                                >
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {comment.text}
                                  </pre>
                                  {comment.editedAt && (
                                    <span
                                      className={`text-[9px] mt-1 block ${
                                        isOwnComment
                                          ? "text-blue-100"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      (edited)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {showEditOption && (
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() =>
                                  handleEditClick(comment.id, comment.text)
                                }
                                className="text-blue-600 hover:text-blue-800 text-[9px] underline"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </>
              )
            ) : (
              commentAttachmentsWithMeta.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic text-xs">
                    No attachments in comments yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {commentAttachmentsWithMeta.map(renderAttachmentCard)}
                </div>
              )
            )}
          </div>

          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2">
              <div className="flex-1">
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  placeholder="Type your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2 py-1"
                  >
                    <RiAttachmentLine className="w-3 h-3" />
                    Attach
                  </button>
                  {commentAttachments.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {commentAttachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-[10px]"
                        >
                          <span className="max-w-[100px] truncate">
                            {file.name}
                          </span>
                          <button
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <RiCloseLine className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() && commentAttachments.length === 0}
                className="self-start bg-blue-600 text-white rounded px-4 py-2 text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RiSendPlaneFill className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </section>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 text-sm"
            >
              <RiCloseLine className="w-6 h-6" />
              Close
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              className="max-w-full max-h-[90vh] object-contain rounded"
            />
            <div className="mt-2 text-center text-white text-sm">
              {previewImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
