import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateTicket from '../components/CreateTicket';
import AssignModal from '../components/AssignModal';
import DocumentsModal from '../components/DocumentsModal';
import { 
  getTickets, 
  deleteTicket, 
  assignTicket, 
  updateTicketStatus, 
  getUsers 
} from '../services/api';
import { 
  FaUserPlus, 
  FaHistory, 
  FaTrash, 
  FaFilter, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaChevronDown, 
  FaCheck,
  FaFileAlt
} from 'react-icons/fa';




function HomePage() {
  const [selected, setSelected] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const hasRestoredState = useRef(false);
  const skipPageReset = useRef(false);
  const previousFilters = useRef(null);
  const previousSearch = useRef(null);
  
  // Restore pagination state from sessionStorage
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = sessionStorage.getItem('ticketRowsPerPage');
    return saved ? Number(saved) : 10;
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('ticketCurrentPage');
    return saved ? Number(saved) : 1;
  });
  
  const token = localStorage.getItem('authToken');
  const [user, setUser] = useState({ username: '', role: '' });
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});
  
  // Initialize filters from sessionStorage or use defaults
  const getInitialFilters = () => {
    const savedFilters = sessionStorage.getItem('ticketFilters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
    return {
      projects: [],
      statuses: [],
      assignedUsers: [],
      excludeStatuses: ['done', 'closed']
    };
  };



  const [columnFilters, setColumnFilters] = useState(getInitialFilters);
  const [tempFilters, setTempFilters] = useState(getInitialFilters);
  const [showFilters, setShowFilters] = useState(false);


  // Restore state when coming back from ticket history
  useEffect(() => {
    if (location.state?.returnPage && !hasRestoredState.current) {
      hasRestoredState.current = true;
      skipPageReset.current = true;
      const { returnPage, rowsPerPage: savedRows } = location.state;
      
      if (savedRows) {
        setRowsPerPage(savedRows);
        sessionStorage.setItem('ticketRowsPerPage', savedRows.toString());
      }
      
      if (returnPage) {
        setCurrentPage(returnPage);
        sessionStorage.setItem('ticketCurrentPage', returnPage.toString());
      }
      
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);


  // Persist filters to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('ticketFilters', JSON.stringify(columnFilters));
  }, [columnFilters]);



  // Persist pagination state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('ticketCurrentPage', currentPage.toString());
  }, [currentPage]);



  useEffect(() => {
    sessionStorage.setItem('ticketRowsPerPage', rowsPerPage.toString());
  }, [rowsPerPage]);



  const KNOWN = new Set(['created', 'assigned', 'inprogress', 'testing', 'done', 'closed', 'rework']);



  const canonicalizeStatus = (raw) => {
    const s = raw?.toString().trim().toLowerCase();
    if (!s) return 'created';
    
    const map = {
      'todo': 'created', 'to do': 'created', 'to-do': 'created', 
      'to.do': 'created', 'pending': 'created', 'new': 'created', 
      'open': 'created', 'assigned': 'assigned', 
      'in progress': 'inprogress', 'in-progress': 'inprogress',
      'inprogress': 'inprogress', 'testing': 'testing', 'test': 'testing', 
      'done': 'done', 'closed': 'closed', 'close': 'closed', 
      'rework': 'rework'
    };
    
    if (map[s]) return map[s];
    
    const compact = s.replace(/-/g, '');
    if (compact === 'todo') return 'created';
    if (compact === 'inprogress') return 'inprogress';
    if (s.includes('done')) return 'done';
    if (s.includes('close')) return 'closed';
    if (s.includes('assign')) return 'assigned';
    if (s.includes('test')) return 'testing';
    if (KNOWN.has(s)) return s;
    return 'created';
  };



  const formatStatusLabel = (status) => {
    const s = canonicalizeStatus(status);
    if (s === 'inprogress') return 'In Progress';
    if (s === 'testing') return 'Testing';
    if (s === 'done') return 'Done';
    if (s === 'closed') return 'Closed';
    if (s === 'assigned') return 'Assigned';
    if (s === 'rework') return 'Rework';
    return 'Created';
  };



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);



  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ username: payload.username, role: payload.role });
    } catch {
      setUser({ username: '', role: '' });
    }
  }, [token]);



  const fetchTickets = async () => {
    skipPageReset.current = true;
    setLoading(true);
    try {
      const res = await getTickets(search, token);
      const ticketsData = res.data.data || res.data;
      const normalized = ticketsData.map(t => ({
        ...t,
        status: canonicalizeStatus(t.status)
      }));
      const sorted = normalized.sort((a, b) => {
        const dateA = new Date(a.createdAt) || 0;
        const dateB = new Date(b.createdAt) || 0;
        return dateB - dateA;
      });
      setTickets(sorted);
    } catch (e) {
      console.error('Fetch tickets error:', e);
    } finally {
      setLoading(false);
    }
  };



  const fetchDevelopers = async () => {
    try {
      const res = await getUsers(token);
      const usersData = res.data.data || res.data;
      setDevelopers(usersData.filter(u => u.role === 'Developer' || u.role === 'Admin'));
    } catch (e) {
      console.error('Fetch developers error:', e);
    }
  };



  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchDevelopers();
    }
  }, [token]);



  useEffect(() => {
    const debounce = setTimeout(fetchTickets, 300);
    return () => clearTimeout(debounce);
  }, [search]);



  useEffect(() => {
    if (showFilters) {
      setTempFilters({ ...columnFilters });
    }
  }, [showFilters]);



  async function handleDelete(ticketNumber) {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        skipPageReset.current = true;
        await deleteTicket(ticketNumber, token);
        await fetchTickets();
      } catch (e) {
        console.error('Delete ticket error:', e);
      }
    }
  }



  function openAssignModal(ticket) {
    setCurrentTicket(ticket);
    setSelectedDeveloper(ticket.assignedTo || '');
    setShowAssign(true);
  }



  async function handleAssignSubmit() {
    if (!selectedDeveloper) {
      alert('Please select a developer');
      return;
    }
    try {
      skipPageReset.current = true;
      await assignTicket(currentTicket.ticketNumber, selectedDeveloper, token);
      await updateTicketStatus(currentTicket.ticketNumber, 'assigned', token);
      await fetchTickets();
      setShowAssign(false);
      setSelectedDeveloper('');
      setCurrentTicket(null);
    } catch (e) {
      console.error('Assign ticket error:', e);
      alert('Failed to assign');
    }
  }



  async function handleStatusChange(ticketNumber, newStatus) {
    try {
      skipPageReset.current = true;
      const normalizedNew = canonicalizeStatus(newStatus);
      await updateTicketStatus(ticketNumber, normalizedNew, token);
      await fetchTickets();
    } catch (e) {
      console.error('Update status error:', e);
      alert('Failed to update status');
    }
  }



  const handleDocumentsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDocuments(true);
  };



  // Handle navigation to ticket history - save current page state
  const handleNavigateToHistory = (ticket) => {
    navigate('/ticket-history', { 
      state: { 
        ticket, 
        userRole: user.role, 
        authToken: token,
        returnPage: currentPage,
        rowsPerPage: rowsPerPage
      } 
    });
  };



  const filterOptions = useMemo(() => ({
    projects: [...new Set(tickets.map(t => t.projectName).filter(Boolean))].sort(),
    statuses: [
      { value: 'created', label: 'Created' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'inprogress', label: 'In Progress' },
      { value: 'testing', label: 'Testing' },
      { value: 'done', label: 'Done' },
      { value: 'closed', label: 'Closed' },
      { value: 'rework', label: 'Rework' }
    ],
    assignedUsers: [...new Set(tickets.map(t => t.assignedTo).filter(Boolean))].sort(),
  }), [tickets]);



  const toggleDropdown = (filterName) => {
    setOpenDropdown(openDropdown === filterName ? null : filterName);
  };



  const handleMultiSelectChange = (filterName, value) => {
    setTempFilters(prev => {
      const currentValues = prev[filterName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterName]: newValues };
    });
  };



  const handleClearFilters = () => {
    const defaultFilters = {
      projects: [],
      statuses: [],
      assignedUsers: [],
      excludeStatuses: ['done', 'closed']
    };
    setTempFilters(defaultFilters);
    setColumnFilters(defaultFilters);
    sessionStorage.removeItem('ticketFilters');
  };



  const handleApplyFilters = () => {
    setColumnFilters({ ...tempFilters });
    setShowFilters(false);
    setOpenDropdown(null);
  };



  const handleCloseFilters = () => {
    setShowFilters(false);
    setTempFilters({ ...columnFilters });
    setOpenDropdown(null);
  };



  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };



  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(Number(newRowsPerPage));
    setCurrentPage(1);
  };



  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (columnFilters.projects?.length > 0) count += columnFilters.projects.length;
    if (columnFilters.statuses?.length > 0) count += columnFilters.statuses.length;
    if (columnFilters.assignedUsers?.length > 0) count += columnFilters.assignedUsers.length;
    return count;
  }, [columnFilters]);



  const tempFilterCount = useMemo(() => {
    let count = 0;
    if (tempFilters.projects?.length > 0) count += tempFilters.projects.length;
    if (tempFilters.statuses?.length > 0) count += tempFilters.statuses.length;
    if (tempFilters.assignedUsers?.length > 0) count += tempFilters.assignedUsers.length;
    return count;
  }, [tempFilters]);



  const filtered = useMemo(() => {
    let result = tickets;
    const s = search.trim().toLowerCase();



    if (s) {
      result = result.filter(t =>
        t.ticketNumber?.toString().toLowerCase().includes(s) ||
        t.assignedTo?.toLowerCase().includes(s) ||
        t.requestorName?.toLowerCase().includes(s) ||
        t.projectName?.toLowerCase().includes(s) ||
        t.title?.toLowerCase().includes(s)
      );
    }



    if (columnFilters.projects.length > 0) {
      result = result.filter(t => columnFilters.projects.includes(t.projectName));
    }



    if (columnFilters.statuses.length > 0) {
      result = result.filter(t => columnFilters.statuses.includes(canonicalizeStatus(t.status)));
    } else {
      if (columnFilters.excludeStatuses && columnFilters.excludeStatuses.length > 0) {
        result = result.filter(t => !columnFilters.excludeStatuses.includes(canonicalizeStatus(t.status)));
      }
    }



    if (columnFilters.assignedUsers.length > 0) {
      result = result.filter(t => columnFilters.assignedUsers.includes(t.assignedTo));
    }



    return result;
  }, [tickets, search, columnFilters]);



  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  
  // Adjust current page if it exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0 && !skipPageReset.current) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);


  // Reset to page 1 when filters or search change (but NOT when other actions happen)
  useEffect(() => {
    // Skip if we're performing an action that shouldn't reset pagination
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    
    // Check if filters actually changed
    const filtersChanged = JSON.stringify(previousFilters.current) !== JSON.stringify(columnFilters);
    const searchChanged = previousSearch.current !== search;
    
    // Store current values for next comparison
    previousFilters.current = columnFilters;
    previousSearch.current = search;
    
    // Only reset to page 1 if filters or search actually changed
    if ((filtersChanged || searchChanged) && !hasRestoredState.current) {
      setCurrentPage(1);
    }
    
    if (hasRestoredState.current) {
      hasRestoredState.current = false;
    }
  }, [columnFilters, search]);



  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTickets = filtered.slice(startIndex, endIndex);



  const stats = useMemo(() => {
    let counts = {
      total: tickets.length,
      created: 0, assigned: 0, inprogress: 0, testing: 0, done: 0, closed: 0, rework: 0
    };
    
    for (const t of tickets) {
      const s = canonicalizeStatus(t.status);
      if (counts.hasOwnProperty(s)) {
        counts[s]++;
      } else {
        counts.created++;
      }
    }
    return counts;
  }, [tickets]);



  const getStatusColor = (status) => {
    const s = canonicalizeStatus(status);
    switch (s) {
      case 'created': return 'bg-gray-300 text-gray-900';
      case 'assigned': return 'bg-indigo-100 text-indigo-800';
      case 'inprogress': return 'bg-yellow-100 text-yellow-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'rework': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };



  const getStatusOptions = (ticket) => {
    const isAssignedUser = user.username === ticket.assignedTo;
    const isAdmin = user.role === 'Admin';
    const status = canonicalizeStatus(ticket.status);



    if (status === 'created') {
      return [];
    }



    if (status === 'rework') {
      return [];
    }



    if (status === 'closed') {
      return [];
    }



    if (status === 'done') {
      if (isAdmin) {
        return [
          { value: 'done', label: 'Done' },
          { value: 'rework', label: 'Rework' },
          { value: 'closed', label: 'Closed' }
        ];
      }
      return [];
    }



    if (isAssignedUser) {
      if (status === 'assigned') {
        return [
          { value: 'assigned', label: 'Assigned' },
          { value: 'inprogress', label: 'In Progress' },
          { value: 'testing', label: 'Testing' },
          { value: 'done', label: 'Done' }
        ];
      }
      if (status === 'inprogress') {
        return [
          { value: 'inprogress', label: 'In Progress' },
          { value: 'testing', label: 'Testing' },
          { value: 'done', label: 'Done' }
        ];
      }
      if (status === 'testing') {
        return [
          { value: 'testing', label: 'Testing' },
          { value: 'done', label: 'Done' }
        ];
      }
    }



    return [];
  };



  const showAssignButton = (ticket) => {
    const status = canonicalizeStatus(ticket.status);
    return user.role === 'Admin' && (status === 'created' || status === 'rework');
  };



  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  };



  const formatFullDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };



  const MultiSelectDropdown = ({ label, filterName, options, isStatusFilter = false }) => {
    const selectedValues = tempFilters[filterName] || [];
    const isOpen = openDropdown === filterName;
    
    const getDisplayText = () => {
      if (selectedValues.length === 0) return `Select ${label}...`;
      if (selectedValues.length === 1) {
        if (isStatusFilter) {
          const statusObj = options.find(o => o.value === selectedValues[0]);
          return statusObj ? statusObj.label : selectedValues[0];
        }
        return selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    };



    return (
      <div ref={el => dropdownRefs.current[filterName] = el} className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label} {selectedValues.length > 0 && (
            <span className="text-blue-600 font-semibold">({selectedValues.length})</span>
          )}
        </label>
        <button
          type="button"
          onClick={() => toggleDropdown(filterName)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between hover:border-blue-400 transition-colors"
        >
          <span className="truncate text-gray-700">{getDisplayText()}</span>
          <FaChevronDown className={`text-gray-500 text-[10px] ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 italic">No options available</div>
            ) : (
              <div className="py-1">
                {options.map(option => {
                  const optionValue = isStatusFilter ? option.value : option;
                  const optionLabel = isStatusFilter ? option.label : option;
                  const isSelected = selectedValues.includes(optionValue);
                  return (
                    <div
                      key={optionValue}
                      onClick={() => handleMultiSelectChange(filterName, optionValue)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                    >
                      <div className={`w-4 h-4 flex items-center justify-center border-2 rounded ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <FaCheck className="text-white text-[8px]" />}
                      </div>
                      <span className={`text-xs truncate flex-1 ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                        {optionLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };



  return (
    <main className="flex-grow p-6 bg-gray-50 min-h-screen text-gray-900">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Manage Tickets</h1>
      </header>
      
      <div className="max-w-7xl mx-auto w-full">
        <section className="grid grid-cols-7 gap-3 mb-4 text-xs w-full">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Created" value={stats.created} />
          <StatCard label="Assigned" value={stats.assigned} />
          <StatCard label="In Progress" value={stats.inprogress} />
          <StatCard label="Testing" value={stats.testing} />
          <StatCard label="Done" value={stats.done} />
          <StatCard label="Closed" value={stats.closed} />
        </section>



        <section className="flex justify-between items-end mb-3 w-full gap-2">
          <SearchInput value={search} onChange={setSearch} />
          <div className="flex items-center gap-2">
            {user.role === 'Admin' && (
              <button
                type="button"
                onClick={handleDocumentsClick}
                className="border border-gray-300 bg-white text-gray-700 rounded px-3 py-1 flex items-center gap-1.5 text-xs font-medium shadow-sm hover:bg-gray-50 hover:border-gray-400 transition"
                aria-label="View Documents"
              >
                <FaFileAlt className="text-xs" />
                <span>Documents</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`border rounded px-3 py-1 flex items-center gap-1.5 text-xs font-medium shadow-sm hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700 transition relative ${
                showFilters 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
              aria-label="Toggle Filters"
            >
              <FaFilter className="text-xs" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {(user.role === 'User' || user.role === 'Admin') && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="border border-gray-300 text-blue-700 bg-white rounded px-3 py-1 flex items-center gap-1.5 text-xs font-medium shadow-sm hover:bg-blue-50 hover:border-blue-800 hover:text-blue-800 transition"
              >
                <FaUserPlus className="text-xs" />
                <span>Create</span>
              </button>
            )}
          </div>
        </section>



        {showFilters && (
          <section className="bg-white border border-gray-300 rounded shadow-sm mb-3">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Filter Options</h2>
                {tempFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <FaTimes className="text-[10px]" />
                    Clear All ({tempFilterCount})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MultiSelectDropdown label="Project" filterName="projects" options={filterOptions.projects} />
                <MultiSelectDropdown label="Status" filterName="statuses" options={filterOptions.statuses} isStatusFilter={true} />
                <MultiSelectDropdown label="Assigned To" filterName="assignedUsers" options={filterOptions.assignedUsers} />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic">
                Note: By default, "Done" and "Closed" tickets are hidden. Select specific statuses to show them.
              </p>
            </div>



            <div className="flex justify-end items-center gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseFilters}
                className="border border-gray-300 bg-white text-gray-700 rounded px-4 py-1.5 text-xs font-medium hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleApplyFilters}
                className="border border-blue-600 bg-blue-600 text-white rounded px-4 py-1.5 text-xs font-medium hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-sm"
              >
                Apply Filters {tempFilterCount > 0 && `(${tempFilterCount})`}
              </button>
            </div>
          </section>
        )}



        <div className="w-full">
          <TicketTable
            tickets={paginatedTickets}
            allTicketsCount={filtered.length}
            user={user}
            onDelete={handleDelete}
            onAssign={openAssignModal}
            onHistory={handleNavigateToHistory}
            onStatusChange={handleStatusChange}
            getStatusOptions={getStatusOptions}
            getStatusColor={getStatusColor}
            showAssignButton={showAssignButton}
            formatStatusLabel={formatStatusLabel}
            canonicalizeStatus={canonicalizeStatus}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={handleRowsPerPageChange}
            formatShortDate={formatShortDate}
            formatFullDateTime={formatFullDateTime}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            startIndex={startIndex}
          />
        </div>
      </div>



      {showCreate && (
        <CreateTicket onClose={() => setShowCreate(false)} onRefresh={fetchTickets} />
      )}
      
      {showAssign && (
        <AssignModal
          ticket={currentTicket}
          developers={developers}
          selectedDeveloper={selectedDeveloper}
          setSelectedDeveloper={setSelectedDeveloper}
          onAssign={handleAssignSubmit}
          onClose={() => {
            setShowAssign(false);
            setCurrentTicket(null);
            setSelectedDeveloper('');
          }}
        />
      )}



      {showDocuments && (
        <DocumentsModal 
          onClose={() => setShowDocuments(false)} 
          token={token} 
        />
      )}
    </main>
  );
}



function StatCard({ label, value }) {
  return (
    <article className="bg-white rounded p-2 text-center border border-gray-200 shadow w-full">
      <p className="text-gray-500 uppercase font-semibold text-xs">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </article>
  );
}



function SearchInput({ value, onChange }) {
  return (
    <div className="relative w-64">
      <input
        type="search"
        placeholder="Search tickets..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded pl-8 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Search tickets"
      />
      <div className="absolute left-2.5 top-1.5 text-gray-400">
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
    </div>
  );
}



function TicketTable({
  tickets, allTicketsCount, user, onDelete, onAssign, onHistory, onStatusChange,
  getStatusOptions, getStatusColor, showAssignButton, formatStatusLabel, canonicalizeStatus,
  rowsPerPage, setRowsPerPage, formatShortDate, formatFullDateTime, loading,
  currentPage, totalPages, onPageChange, startIndex
}) {
  // Simplified pagination - only show previous, current, and next page
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show previous page if exists
    if (currentPage > 1) {
      pages.push(currentPage - 1);
    }
    
    // Always show current page
    pages.push(currentPage);
    
    // Always show next page if exists
    if (currentPage < totalPages) {
      pages.push(currentPage + 1);
    }
    
    return pages;
  };


  const pageNumbers = getPageNumbers();



  return (
    <div className="bg-white border border-gray-300 rounded shadow text-xs w-full">
      <div className="overflow-auto">
        <table className="min-w-full">
          <thead className="bg-blue-700 text-white uppercase font-semibold">
            <tr>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">#</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Ticket ID</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Title</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Requestor</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Project</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Plant</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Created</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Status</th>
              <th className="px-1.5 py-1.5 border-r border-blue-600 text-xs whitespace-nowrap">Assigned To</th>
              <th className="px-1.5 py-1.5 text-xs whitespace-nowrap" colSpan="3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="p-6 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Loading tickets...</span>
                  </div>
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="11" className="p-6 text-center text-gray-500 italic border-t border-gray-200 text-xs">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((t, idx) => {
                const statusOptions = getStatusOptions(t);
                const disableStatusChange = statusOptions.length === 0;
                const statusValue = canonicalizeStatus(t.status);
                return (
                  <tr key={t.ticketNumber} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-center text-xs">{startIndex + idx + 1}</td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 font-semibold text-xs text-blue-700">{t.ticketNumber}</td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs max-w-[200px]" title={t.title || '-'}>
                      <div className="truncate">{t.title || '-'}</div>
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs">{t.requestorName || '-'}</td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs">{t.projectName || '-'}</td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs">{t.plantName || '-'}</td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs" title={formatFullDateTime(t.createdAt)}>
                      {formatShortDate(t.createdAt)}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs">
                      {disableStatusChange ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(statusValue)}`}>
                          {formatStatusLabel(statusValue)}
                        </span>
                      ) : (
                        <select
                          className="border border-gray-300 rounded px-1.5 py-0.5 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={statusValue}
                          onChange={e => onStatusChange(t.ticketNumber, e.target.value)}
                          aria-label={`Change status of ticket ${t.ticketNumber}`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-1.5 py-1.5 border-r border-gray-200 text-xs">{t.assignedTo || '-'}</td>
                    <td className="px-1 py-1.5 text-center" style={{ width: '32px' }}>
                      {showAssignButton(t) ? (
                        <button
                          onClick={() => onAssign(t)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 inline-block border border-gray-300 rounded p-1 transition-colors"
                          aria-label={`Assign developer for ticket ${t.ticketNumber}`}
                          title="Assign Developer"
                        >
                          <FaUserPlus style={{ fontSize: '11px' }} />
                        </button>
                      ) : (
                        <span className="inline-block" style={{ width: '10px', height: '10px' }}></span>
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center" style={{ width: '32px' }}>
                      <button
                        onClick={() => onHistory(t)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 inline-block border border-gray-300 rounded p-1 transition-colors"
                        aria-label={`View history for ticket ${t.ticketNumber}`}
                        title="View History"
                      >
                        <FaHistory style={{ fontSize: '11px' }} />
                      </button>
                    </td>
                    <td className="px-1 py-1.5 text-center" style={{ width: '32px' }}>
                      {user.role === 'Admin' ? (
                        <button
                          onClick={() => onDelete(t.ticketNumber)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 inline-block border border-gray-300 rounded p-1 transition-colors"
                          aria-label={`Delete ticket ${t.ticketNumber}`}
                          title="Delete Ticket"
                        >
                          <FaTrash style={{ fontSize: '11px' }} />
                        </button>
                      ) : (
                        <span className="inline-block" style={{ width: '10px', height: '10px' }}></span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>



      <div className="flex justify-between items-center px-4 py-2.5 border-t border-gray-300 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">
            Showing{' '}
            <span className="font-semibold">{allTicketsCount === 0 ? '0' : startIndex + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(startIndex + rowsPerPage, allTicketsCount)}</span> of{' '}
            <span className="font-semibold">{allTicketsCount}</span> tickets
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={e => setRowsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Previous page"
              >
                <FaChevronLeft className="text-[10px]" />
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                    currentPage === page
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Next page"
              >
                <FaChevronRight className="text-[10px]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default HomePage;
