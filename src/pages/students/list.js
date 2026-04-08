import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Data from "../../utils/data";
import Fuse from "fuse.js";
import EmptyState from "../../components/EmptyState";

// Modals
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "./edit";
import DeleteModal from "./delete";
import UpgradeModal from "./upgrade";

const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();
const upgradeModalInstance = new UpgradeModal();

// Helper function to safely access nested properties
const getNestedValue = (obj, path) => {
  if (!path) return '';
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
};

// --- V8: PRODUCTION DATATABLE WITH FULL SERVER-SIDE PAGINATION ---
export default function StudentDataTableV8() {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  
  // State for related data for modals/dropdowns
  const [routes, setRoutes] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: 'names', direction: 'ascending' });

  // State for highlighting newly added records
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const [searchTimeout, setSearchTimeout] = useState(null);
  const newRecordTimers = useRef(new Map());
  
  // Modal states
  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [upgrade, setUpgrade] = useState(null);

  // --- MODAL EFFECTS ---
  useEffect(() => {
    if (edit) {
      editModalInstance.show();
    }
  }, [edit]);

  useEffect(() => {
    if (remove) {
      deleteModalInstance.show();
    }
  }, [remove]);

  // --- DATA FETCHING (PAGINATED STUDENTS) ---
  const fetchPageData = useCallback(async (page, limit, search, sort) => {
    if (!initialLoading) {
      setIsPaginating(true);
    }
    
    // Convert search to lowercase for case-insensitive matching
    const searchLower = search ? search.toLowerCase().trim() : '';
    
    try {
      let fetchedStudents = [];
      let totalCount = 0;

      if (searchLower) {
        // Client-side exact and fuzzy search across all fields
        const allStudents = Data.students.list() || [];
        const fuse = new Fuse(allStudents, {
          keys: [
            "names",
            "registration",
            "class_name",
            "route_name",
            "parent_name",
            "parent.national_id",
            "parent.phone",
            "parent.email",
            "gender",
            "id"
          ],
          threshold: 0.3,
          ignoreLocation: true,
          useExtendedSearch: true
        });

        const results = fuse.search(searchLower);
        const sortedResults = results.map(r => r.item);

        totalCount = sortedResults.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        fetchedStudents = sortedResults.slice(startIndex, endIndex);

      } else {
        // Server-side pagination for default view
        const pageResponse = await Data.students.getPage({
          page,
          limit,
          search: "",
          sort,
        });
        
        fetchedStudents = pageResponse.students;
        totalCount = pageResponse.totalCount;
      }
      
      setStudents(fetchedStudents);
      setTotalStudents(totalCount);
    } catch (error) {
      console.error("Failed to fetch student page:", error);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setInitialLoading(false);
      setIsPaginating(false);
    }
  }, [initialLoading]); 

  // Effect to fetch PAGE data (Students)
  useEffect(() => {
    fetchPageData(currentPage, rowsPerPage, activeSearch, sortConfig);
  }, [currentPage, rowsPerPage, activeSearch, sortConfig, fetchPageData]);

  // --- SUBSCRIPTIONS (DROPDOWN DATA) ---
  // This replaces the old fetchRoutes/fetchClasses logic. 
  // It ensures that as soon as data loads in the background, the dropdowns populate.
  useEffect(() => {
    
    // 1. Subscribe to Classes
    const unsubClasses = Data.classes.subscribe(({ classes }) => {
        if(classes) setClasses(classes);
    });

    // 2. Subscribe to Routes
    const unsubRoutes = Data.routes.subscribe(({ routes }) => {
        if(routes) setRoutes(routes);
    });

    // 3. Subscribe to Parents (For the dropdown)
    // Note: Data.parents.subscribe returns the cached list. 
    // If you have 10k parents, you might want to fetch this differently (e.g. search on type),
    // but for the Edit Modal dropdowns to work, this is necessary.
    const unsubParents = Data.parents.subscribe(({ parents }) => {
        if(parents) setParents(parents);
    });

    // Cleanup subscriptions and timers on unmount
    return () => {
      if(unsubClasses) unsubClasses();
      if(unsubRoutes) unsubRoutes();
      if(unsubParents) unsubParents();
      newRecordTimers.current.forEach(timerId => clearTimeout(timerId));
    };
  }, []);

  // Cleanup for search timeout on unmount or update
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // --- HEADERS CONFIGURATION ---
  const headers = useMemo(() => [
      { key: 'names', label: 'Student Name', sortable: true },
      { key: 'registration', label: 'Registration', sortable: true },
      { key: 'class_name', label: 'Current Class', sortable: true },
      { key: 'parent_name', label: 'Parent', sortable: true },
  ], []);

  // --- DERIVED STATE ---
  const totalPages = Math.ceil(totalStudents / rowsPerPage);

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

  const handleEdit = (row) => setEdit(row);

  const handleDelete = (row) => setRemove(row);

  const handleUpgrade = (row) => {
    upgradeModalInstance.show(row, async (upgradeData) => {
      await Data.students.upgrade(upgradeData);
      handleAfterAction();
    });
  };

  const handleStudentCreated = (newStudent) => {
    if (!newStudent || !newStudent.id) return;
    setCurrentPage(1);
    setStudents(prev => [newStudent, ...prev.slice(0, rowsPerPage - 1)]);
    setTotalStudents(prev => prev + 1); 

    setNewlyAddedIds(prev => new Set(prev).add(newStudent.id));
    const timerId = setTimeout(() => {
        setNewlyAddedIds(prev => {
            const newIds = new Set(prev);
            newIds.delete(newStudent.id);
            return newIds;
        });
        newRecordTimers.current.delete(newStudent.id);
    }, 5000);
    newRecordTimers.current.set(newStudent.id, timerId);
  };

  const handleCreateStudent = async (studentData) => {
    try {
        const newStudent = await Data.students.create(studentData);
        handleStudentCreated(newStudent);
    } catch (error) {
        console.error("Failed to create student:", error);
    }
  };
  
  const handleAfterAction = () => {
    fetchPageData(currentPage, rowsPerPage, activeSearch, sortConfig);
  }

  return (
    <div className="v8-datatable-container">
      {/* Modals are passed the LIVE data from subscriptions */}
      <AddModal routes={routes} parents={parents} classes={classes} save={handleCreateStudent} />
      <UploadModal save={() => { fetchPageData(1, rowsPerPage, "", sortConfig) }} />
      
      {edit && (
        <EditModal 
            edit={edit} 
            routes={routes} 
            parents={parents} 
            classes={classes} 
            save={async student => { await Data.students.update(student); handleAfterAction(); setEdit(null); }} 
            onHide={() => setEdit(null)}
        />
      )}
      
      {remove && (
        <DeleteModal 
            remove={remove} 
            save={async student => { await Data.students.delete(student); handleAfterAction(); setRemove(null); }} 
            onHide={() => setRemove(null)}
        />
      )}
      
      {upgrade && (
        <UpgradeModal 
            student={upgrade} 
            save={async upgradeData => { await Data.students.upgrade(upgradeData); handleAfterAction(); }} 
            onUpgradeSuccess={() => setUpgrade(null)}
        />
      )}

      <style>{`
        /* --- V8 STYLING --- */
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
        <div className="v8-header-title-container">
            <h2 className="v8-header-title">Student Directory</h2>
            <p className="v8-header-desc">Manage the registry of student profiles, classes, and transportation.</p>
        </div>
        <div className="v8-header-actions">
          <div className="v8-header-stat">
            <div className="value">{initialLoading ? <div className="v8-spinner" style={{width: 20, height: 20}}></div> : totalStudents}</div>
            <div className="label">Total Students</div>
          </div>
          <button onClick={() => uploadModalInstance.show()} className="btn" style={{backgroundColor: '#F3F6F9', color: '#3F4254'}}>Upload</button>
          <button onClick={() => addModalInstance.show()} className="btn" style={{backgroundColor: 'var(--v8-accent-color)', color: 'white'}}>Add Student</button>
        </div>
      </header>

      <main className="v8-main">
        <div className={`v8-table-loader ${isPaginating ? 'v8-loading' : ''}`}>
            <div className="v8-spinner"></div>
        </div>
        <div className="v8-toolbar">
            <div className="v8-search-group">
                <input type="text" className="v8-search-input" placeholder="Search students by ALL fields (name, registration, parent, class, grade, ID, phone, email)..." value={searchTerm} onChange={(e) => handleRealTimeSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
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
              ) : students.length > 0 ? (
                students.map(row => (
                    <tr key={row.id} className={newlyAddedIds.has(row.id) ? 'v8-new-row' : ''}>
                      {headers.map(h => <td key={h.key} className={h.key === 'names' ? 'td-primary' : ''}>{getNestedValue(row, h.key)}</td>)}
                      <td className="v8-table-actions" style={{textAlign: 'right'}}>
                        <button className="v8-tooltip-container" onClick={() => handleEdit(row)}>
                            <i className="la la-edit" style={{fontSize: '1.5rem'}}></i>
                            <span className="v8-tooltip-text">Edit Student</span>
                        </button>
                        <button className="v8-tooltip-container" onClick={() => handleDelete(row)}>
                            <i className="la la-trash" style={{fontSize: '1.5rem'}}></i>
                            <span className="v8-tooltip-text">Delete</span>
                        </button>
                        <button className="v8-tooltip-container" onClick={() => handleUpgrade(row)}>
                            <i className="la la-arrow-up" style={{fontSize: '1.5rem'}}></i>
                            <span className="v8-tooltip-text">Upgrade Class</span>
                        </button>
                      </td>
                    </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={headers.length + 1} style={{ padding: 0 }}>
                        <EmptyState 
                            title={activeSearch ? "No students found" : "No Students Added"}
                            description={activeSearch ? `We couldn't find any student matching "${activeSearch}". Try adjusting your search.` : "Get started by adding your first student to the system."}
                            isSearch={!!activeSearch}
                            primaryAction={activeSearch ? handleClearSearch : () => addModalInstance.show()}
                            primaryActionText={activeSearch ? "Clear Search" : "Add Student"}
                            iconClass={activeSearch ? "la la-search" : "la la-user-graduate"}
                        />
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!initialLoading && totalStudents > 0 && (
          <div className="v8-pagination">
            <div className="v8-pagination-info">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong>-<strong>{Math.min(currentPage * rowsPerPage, totalStudents)}</strong> of <strong>{totalStudents}</strong>
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