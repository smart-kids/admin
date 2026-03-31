import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Data from "../../utils/data";

// Modals are used as before. No changes needed for them.
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "./edit";
import DeleteModal from "./delete";

// Assuming these modal instances are defined and exported correctly for parents
const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();

// Helper function to safely access nested properties
const getNestedValue = (obj, path) => {
  if (!path) return '';
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
};

export default function ParentDataTable() {
  // --- STATE MANAGEMENT ---
  const [parents, setParents] = useState([]);
  const [totalParents, setTotalParents] = useState(0);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  // State for highlighting newly added records
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const newRecordTimers = useRef(new Map());

  // --- DATA FETCHING & SUBSCRIPTIONS ---

  // The core data fetching function
  const fetchPageData = useCallback(async (page, limit, search, sort) => {
    if (!initialLoading) {
      setIsPaginating(true);
    }
    
    try {
      // Assumes a `Data.parents.getPage` method exists, similar to `Data.students.getPage`
      const pageResponse = await Data.parents.getPage({
        page,
        limit,
        search,
        sort,
      });
      
      const { parents: fetchedParents, totalCount } = pageResponse;
      setParents(fetchedParents);
      setTotalParents(totalCount);
    } catch (error) {
      console.error("Failed to fetch parent page:", error);
      setParents([]);
      setTotalParents(0);
    } finally {
      setInitialLoading(false);
      setIsPaginating(false);
    }
  }, [initialLoading]);

  // Effect to fetch data whenever pagination, sorting, or searching changes.
  useEffect(() => {
    fetchPageData(currentPage, rowsPerPage, activeSearch, sortConfig);
  }, [currentPage, rowsPerPage, activeSearch, sortConfig, fetchPageData]);

  // Effect for one-time setup
  useEffect(() => {
    // Cleanup for highlight-new-record timers on unmount
    return () => {
      newRecordTimers.current.forEach(timerId => clearTimeout(timerId));
      // Cleanup search timeout on unmount
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // --- HEADERS CONFIGURATION ---
  const headers = useMemo(() => [
      { key: 'name', label: 'Parent Name', sortable: true },
      { key: 'national_id', label: 'ID Number', sortable: true },
      { key: 'gender', label: 'Gender', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: false }, // Phone numbers often aren't ideal for sorting
  ], []);

  // --- DERIVED STATE ---
  const totalPages = Math.ceil(totalParents / rowsPerPage);

  // --- EVENT HANDLERS ---
  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchTerm);
  };

  const handleRealTimeSearch = (value) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for real-time search (debounce)
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setActiveSearch(value);
    }, 300); // 300ms debounce
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    if (activeSearch) {
      setCurrentPage(1);
      setActiveSearch("");
    }
  };
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setCurrentPage(1);
    setSortConfig({ key, direction });
  };

  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const handleEdit = (parent) => { setEdit(parent); editModalInstance.show(); };
  const handleDelete = (parent) => { setRemove(parent); deleteModalInstance.show(); };

  // Handler for when a parent is successfully created via the modal
  const handleParentCreated = (newParent) => {
    if (!newParent || !newParent.id) return;

    setCurrentPage(1);
    setParents(prev => [newParent, ...prev.slice(0, rowsPerPage - 1)]);
    setTotalParents(prev => prev + 1);

    setNewlyAddedIds(prev => new Set(prev).add(newParent.id));
    const timerId = setTimeout(() => {
        setNewlyAddedIds(prev => {
            const newIds = new Set(prev);
            newIds.delete(newParent.id);
            return newIds;
        });
        newRecordTimers.current.delete(newParent.id);
    }, 5000);
    newRecordTimers.current.set(newParent.id, timerId);
  };

  const handleCreateParent = async (parentData) => {
    try {
        const newParent = await Data.parents.create(parentData);
        handleParentCreated(newParent);
    } catch (error) {
        console.error("Failed to create parent:", error);
    }
  };
  
  // After an edit or delete, refetch the current page data.
  const handleAfterAction = () => {
    fetchPageData(currentPage, rowsPerPage, activeSearch, sortConfig);
  }

  return (
    <div className="v8-datatable-container">
      {/* Modals are passed the necessary handlers */}
      <AddModal save={handleCreateParent} />
      <UploadModal save={() => { fetchPageData(1, rowsPerPage, "", sortConfig) }} />
      {edit && <EditModal edit={edit} save={async parent => { await Data.parents.update(parent); handleAfterAction(); }} />}
      {remove && <DeleteModal remove={remove} save={async parent => { await Data.parents.delete(parent); handleAfterAction(); }} />}

      <style>{`
        /* --- Styles are identical to StudentDataTableV8 and can be shared in a global CSS file --- */
        .v8-datatable-container {
            --v8-bg: #F9F9FB;
            --v8-content-bg: #FFFFFF;
            --v8-border-color: #EFF2F5;
            --v8-text-primary: #181C32;
            --v8-text-secondary: #7E8299;
            --v8-accent-color: #0095E8;
            --v8-accent-light: #F1FAFF;
            --v8-danger-color: #F64E60;
            --v8-danger-light: #FFE2E5;
            --v8-success-light: #E8FFF3;
            font-family: 'Poppins', sans-serif;
            background-color: var(--v8-bg);
        }
        .v8-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; }
        .v8-header-title { font-size: 1.25rem; font-weight: 600; color: var(--v8-text-primary); }
        .v8-header-actions { display: flex; align-items: center; gap: 1rem; }
        .v8-header-stat { text-align: right; }
        .v8-header-stat .value { font-size: 1.25rem; font-weight: 700; color: var(--v8-text-primary); min-width: 30px; display: inline-block; }
        .v8-header-stat .label { font-size: 0.8rem; font-weight: 500; color: var(--v8-text-secondary); }
        .v8-main { margin: 0 2rem 2rem; background-color: var(--v8-content-bg); border-radius: 0.75rem; box-shadow: 0 0 20px 0 rgba(76,87,125,.02); position: relative; }
        .v8-table-loader {
            position: absolute; top: 70px; left: 0; right: 0; bottom: 68px;
            background-color: rgba(255, 255, 255, 0.7);
            display: flex; align-items: center; justify-content: center;
            z-index: 10;
            opacity: 0; visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        }
        .v8-table-loader.v8-loading { opacity: 1; visibility: visible; }
        .v8-spinner {
            border: 4px solid var(--v8-border-color);
            border-top: 4px solid var(--v8-accent-color);
            border-radius: 50%;
            width: 40px; height: 40px;
            animation: v8-spin 1s linear infinite;
        }
        @keyframes v8-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .v8-header-actions .btn { font-weight: 600; padding: 0.75rem 1.5rem; border-radius: 0.42rem; border: none; cursor: pointer; }
        .v8-toolbar { padding: 1rem 2rem; border-bottom: 1px solid var(--v8-border-color); }
        .v8-search-group { display: flex; gap: 0.5rem; }
        .v8-search-input { flex-grow: 1; border: 1px solid #E4E6EF; border-radius: 0.42rem; padding: 0.75rem 1rem; font-size: 1rem; }
        .v8-table-wrapper { overflow-x: auto; }
        .v8-table { width: 100%; border-collapse: collapse; }
        .v8-table th { text-align: left; padding: 1rem 2rem; color: #B5B5C3; text-transform: uppercase; font-size: 0.8rem; font-weight: 600; user-select: none; }
        .v8-table th.sortable { cursor: pointer; }
        .v8-table th .sort-icon { display: inline-block; margin-left: 0.5rem; color: #B5B5C3; opacity: 0.5; transition: all 0.2s; }
        .v8-table th:hover .sort-icon { opacity: 1; }
        .v8-table th .sort-icon.active { color: var(--v8-accent-color); opacity: 1; }
        .v8-table td { padding: 1.25rem 2rem; color: var(--v8-text-secondary); font-weight: 500; border-top: 1px solid var(--v8-border-color); white-space: nowrap; }
        .v8-table .td-primary { color: var(--v8-text-primary); font-weight: 600; }
        .v8-table tbody tr { transition: background-color 0.3s ease-in-out; }
        .v8-table tbody tr.v8-new-row { background-color: var(--v8-success-light) !important; transition: background-color 2s ease-out; }
        .v8-table tbody tr:hover { background-color: var(--v8-accent-light); }
        .v8-table-actions button { background: none; border: none; cursor: pointer; padding: 0.5rem; font-size: 1.1rem; color: #B5B5C3; }
        .v8-table-actions button:hover { color: var(--v8-accent-color); }
        .v8-pagination { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem; border-top: 1px solid var(--v8-border-color); }
        .v8-pagination-info { font-size: 0.9rem; color: var(--v8-text-secondary); font-weight: 500; }
        .v8-pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
        .v8-pagination-controls .btn-nav { font-weight: 500; padding: 0.5rem 1rem; border-radius: 0.42rem; border: 1px solid #E4E6EF; background-color: white; cursor: pointer; }
        .v8-pagination-controls .btn-nav:disabled { background-color: #F9F9FB; cursor: not-allowed; color: #D1D5DB; }
        .v8-pagination-controls .page-indicator { font-weight: 500; color: var(--v8-text-primary); }
      `}</style>
    
      <header className="v8-header">
        <h2 className="v8-header-title">Parent Directory</h2>
        <div className="v8-header-actions">
          <div className="v8-header-stat">
            <div className="value">{initialLoading ? <div className="v8-spinner" style={{width: 20, height: 20}}></div> : totalParents}</div>
            <div className="label">Total Parents</div>
          </div>
          <button onClick={() => uploadModalInstance.show()} className="btn" style={{backgroundColor: '#F3F6F9', color: '#3F4254'}}>Upload</button>
          <button onClick={() => addModalInstance.show()} className="btn" style={{backgroundColor: 'var(--v8-accent-color)', color: 'white'}}>Add Parent</button>
        </div>
      </header>

      <main className="v8-main">
        <div className={`v8-table-loader ${isPaginating ? 'v8-loading' : ''}`}>
            <div className="v8-spinner"></div>
        </div>
        <div className="v8-toolbar">
            <div className="v8-search-group">
                <input 
                    type="text" 
                    className="v8-search-input" 
                    placeholder="Search parents by name, ID, phone, email..." 
                    value={searchTerm} 
                    onChange={(e) => handleRealTimeSearch(e.target.value)} 
                />
                <button className="btn" onClick={handleSearch} style={{backgroundColor: 'var(--v8-accent-color)', color: 'white'}}>Search</button>
                {activeSearch && <button className="btn" onClick={handleClearSearch} style={{backgroundColor: 'var(--v8-border-color)', color: 'var(--v8-text-secondary)'}}>Clear</button>}
            </div>
        </div>
        <div className="v8-table-wrapper">
          <table className="v8-table">
            <thead>
              <tr>
                {headers.map(h => (
                    <th key={h.key} className={h.sortable ? 'sortable' : ''} onClick={() => h.sortable && requestSort(h.key)}>
                        {h.label}
                        {h.sortable && (
                            <span className={`sort-icon ${sortConfig.key === h.key ? 'active' : ''}`}>
                                {sortConfig.key === h.key && sortConfig.direction === 'ascending' ? '▲' : '▼'}
                            </span>
                        )}
                    </th>
                ))}
                <th style={{textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                [...Array(rowsPerPage)].map((_, i) => <tr key={i}><td colSpan={headers.length + 1}><div style={{height: '2rem', backgroundColor: '#EFF2F5', borderRadius: '4px', margin: '1rem 0', animation: 'pulse 1.5s infinite ease-in-out'}}></div></td></tr>)
              ) : parents.length > 0 ? (
                parents.map(row => (
                    <tr key={row.id} className={newlyAddedIds.has(row.id) ? 'v8-new-row' : ''}>
                      {headers.map(h => <td key={h.key} className={h.key === 'name' ? 'td-primary' : ''}>{getNestedValue(row, h.key)}</td>)}
                      <td className="v8-table-actions" style={{textAlign: 'right'}}>
                        <button title="Edit Parent" onClick={() => handleEdit(row)}><i className="la la-edit" style={{fontSize: '1.5rem'}}></i></button>
                        <button title="Delete Parent" onClick={() => handleDelete(row)}><i className="la la-trash" style={{fontSize: '1.5rem'}}></i></button>
                      </td>
                    </tr>
                ))
              ) : (
                <tr><td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '4rem', color: '#B5B5C3' }}>No parents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!initialLoading && totalParents > 0 && (
          <div className="v8-pagination">
            <div className="v8-pagination-info">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong>-<strong>{Math.min(currentPage * rowsPerPage, totalParents)}</strong> of <strong>{totalParents}</strong>
            </div>
            <div className="v8-pagination-controls">
                <span>Rows:</span>
                <select className="form-select form-select-sm" style={{padding: '0.5rem', borderRadius: '0.42rem', border: '1px solid #E4E6EF'}} value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
                <button className="btn-nav ms-3" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1 || isPaginating}>Previous</button>
                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                <button className="btn-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || isPaginating}>Next</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}