import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Data from "../../utils/data";
import Fuse from "fuse.js";
import EmptyState from "../../components/EmptyState";

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

  // Tree view state
  const [expandedParents, setExpandedParents] = useState(new Set());
  const [parentChildren, setParentChildren] = useState({});

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
      // Check if user has enhanced teacher data (parent with teacher details)
      const enhancedUser = JSON.parse(localStorage.getItem("enhancedUser") || "null");
      
      // Convert search to lowercase for case-insensitive matching
      const searchLower = search ? search.toLowerCase().trim() : '';
      
      let fetchedParents = [];
      let totalCount = 0;

      if (searchLower) {
        // Client-side fuzzy search
        let searchData = [];
        if (enhancedUser?.teacherDetails) {
            const allParents = Data.parents.list() || [];
            const allTeachers = Data.teachers.list() || [];
            const mappedTeachers = allTeachers.map(teacher => ({
                ...teacher,
                _isTeacherResult: true,
                name: teacher.name,
                email: teacher.email,
                phone: teacher.phone,
                national_id: teacher.national_id || '',
                gender: teacher.gender || '',
            }));
            searchData = [...allParents, ...mappedTeachers];
        } else {
            searchData = Data.parents.list() || [];
        }

        const fuse = new Fuse(searchData, {
          keys: [
            "name",
            "national_id",
            "email",
            "phone",
            "gender",
            "id",
            "students.names",
            "students.registration"
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
        fetchedParents = sortedResults.slice(startIndex, endIndex);

      } else {
        if (enhancedUser?.teacherDetails) {
          const [parentResponse, teacherResponse] = await Promise.all([
            Data.parents.getPage({ page, limit, search: "", sort }),
            Data.teachers.getPage({ page, limit, search: "", sort })
          ]);
          
          fetchedParents = [
            ...parentResponse.parents,
            ...teacherResponse.teachers.map(teacher => ({
              ...teacher,
              _isTeacherResult: true,
              name: teacher.name,
              email: teacher.email,
              phone: teacher.phone,
              national_id: teacher.national_id || '',
              gender: teacher.gender || '',
            }))
          ].slice(0, limit);
          
          totalCount = parentResponse.totalCount + teacherResponse.totalCount;
        } else {
          const pageResponse = await Data.parents.getPage({
            page,
            limit,
            search: "",
            sort,
          });
          fetchedParents = pageResponse.parents;
          totalCount = pageResponse.totalCount;
        }
      }
      
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

  // --- CHILDREN FETCHING ---
  const fetchParentChildren = useCallback(async (parentRow) => {
    const parentId = parentRow.id;
    if (parentChildren[parentId]) {
      return parentChildren[parentId]; // Return cached data
    }

    try {
      console.log("Fetching children for parent:", parentId);
      
      let studentsResponse;
      try {
        studentsResponse = await Data.students.getPage({
          page: 1,
          limit: 100,
          search: parentId,
          sort: { key: 'name', direction: 'ascending' }
        });
        
        if (studentsResponse.students.length === 0) {
          studentsResponse = await Data.students.getPage({
            page: 1,
            limit: 100,
            search: `parent_id:${parentId}`,
            sort: { key: 'name', direction: 'ascending' }
          });
        }
        
        if (studentsResponse.students.length === 0) {
          const allStudents = await Data.students.getPage({
            page: 1,
            limit: 500,
            search: '',
            sort: { key: 'name', direction: 'ascending' }
          });
          
          studentsResponse = {
            students: allStudents.students.filter(student => 
              student.parent === parentId || 
              student.parent?.id === parentId ||
              student.parentId === parentId ||
              student.parent_id === parentId
            )
          };
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        studentsResponse = { students: [] };
      }

      const students = studentsResponse.students && studentsResponse.students.length > 0 
        ? studentsResponse.students 
        : (parentRow.students || []);

      // Fetch classes these students are in
      const classIds = [...new Set(students.map(s => s.class?.id || s.class).filter(Boolean))];
      const classesResponse = classIds.length > 0 ? await Data.classes.getPage({
        where: { id: { in: classIds } },
        limit: 100
      }) : { classes: [] };

      // Fetch grades for these classes
      const gradeIds = [...new Set(classesResponse.classes.map(c => c.grade))];
      const gradesResponse = gradeIds.length > 0 ? await Data.grades.getPage({
        where: { id: { in: gradeIds } },
        limit: 100
      }) : { grades: [] };

      const childrenData = {
        students: students,
        classes: classesResponse.classes,
        grades: gradesResponse.grades
      };

      setParentChildren(prev => ({ ...prev, [parentId]: childrenData }));
      return childrenData;
    } catch (error) {
      console.error("Failed to process parent children:", error);
      return { students: parentRow.students || [], classes: [], grades: [] };
    }
  }, [parentChildren]);

  // Toggle parent expansion
  const toggleParentExpansion = useCallback(async (row) => {
    const parentId = row.id;
    console.log("Toggling parent expansion for:", parentId);
    const newExpanded = new Set(expandedParents);
    
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
      console.log("Collapsing parent:", parentId);
    } else {
      newExpanded.add(parentId);
      console.log("Expanding parent:", parentId);
      // Fetch children if not already cached
      await fetchParentChildren(row);
    }
    
    setExpandedParents(newExpanded);
  }, [expandedParents, fetchParentChildren]);

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
        <div className="v8-header-title-container">
            <h2 className="v8-header-title">Parent Directory</h2>
            <p className="v8-header-desc">Directory of guardians linked to students, powering your bulk communications.</p>
        </div>
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
                    placeholder="Search parents by ALL fields (name, ID, phone, email, gender, national_id)..." 
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
                parents.map(row => {
                  const isExpanded = expandedParents.has(row.id);
                  const children = parentChildren[row.id] || { students: [], classes: [], grades: [] };
                  
                  return (
                    <React.Fragment key={row.id}>
                      <tr key={row.id} className={newlyAddedIds.has(row.id) ? 'v8-new-row' : ''}>
                        {headers.map(h => ( <td key={h.key} className={h.key === 'name' ? 'td-primary' : ''}>
                          {getNestedValue(row, h.key)}
                          {row._isTeacherResult && (
                            <span style={{
                              backgroundColor: '#0095E8',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              marginLeft: '8px',
                              fontWeight: 'bold'
                            }}>
                              TEACHER
                            </span>
                          )}
                        </td>
                        ))}
                        <td className="v8-table-actions" style={{textAlign: 'right'}}>
                          <button 
                            className="v8-tooltip-container"
                            onClick={() => toggleParentExpansion(row)}
                            style={{color: '#0095E8', marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}
                          >
                            <i className={`la la-${isExpanded ? 'chevron-up' : 'chevron-down'}`} style={{fontSize: '1rem'}}></i>
                            <span className="v8-tooltip-text">{isExpanded ? 'Collapse' : 'Expand'} Details</span>
                          </button>
                          {row._isTeacherResult ? (
                            <button className="v8-tooltip-container" onClick={() => handleEdit(row)} style={{color: '#0095E8', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
                              <i className="la la-eye" style={{fontSize: '1.5rem'}}></i>
                              <span className="v8-tooltip-text">View Teacher Details</span>
                            </button>
                          ) : (
                            <>
                              <button className="v8-tooltip-container" onClick={() => handleEdit(row)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
                                <i className="la la-edit" style={{fontSize: '1.5rem'}}></i>
                                <span className="v8-tooltip-text">Edit Parent</span>
                              </button>
                              <button className="v8-tooltip-container" onClick={() => handleDelete(row)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
                                <i className="la la-trash" style={{fontSize: '1.5rem'}}></i>
                                <span className="v8-tooltip-text">Delete Parent</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      
                      {/* Children Tree View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={headers.length + 1} style={{padding: '0', backgroundColor: '#f8f9fa'}}>
                            <div style={{padding: '20px', border: '1px solid #e9ecef', borderRadius: '8px', margin: '10px'}}>
                              <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#495057'}}>
                                <i className="la la-users" style={{marginRight: '8px'}}></i>
                                Children & Student Details
                                {console.log("Rendering children for parent:", row.id, "Children data:", children)}
                              </div>
                              
                              {/* Students Section */}
                              {children.students && children.students.length > 0 && (
                                <div style={{marginBottom: '15px'}}>
                                  <div style={{fontWeight: 'bold', color: '#6c757d', marginBottom: '8px'}}>
                                    <i className="la la-graduation-cap" style={{marginRight: '8px'}}></i>
                                    Students & Login Credentials ({children.students.length})
                                  </div>
                                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px'}}>
                                    {children.students.map(student => (
                                      <div key={student.id} style={{padding: '15px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: 'white'}}>
                                        <div style={{fontWeight: 'bold', color: '#0095E8', fontSize: '1.05rem', marginBottom: '10px'}}>{student.names}</div>
                                        
                                        <div style={{backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #e9ecef'}}>
                                          <div style={{fontWeight: 'bold', color: '#495057', marginBottom: '5px', fontSize: '0.85rem'}}>
                                            <i className="la la-key" style={{marginRight: '5px'}}></i> Login Credentials
                                          </div>
                                          <div style={{fontSize: '0.9rem', color: '#495057'}}>
                                            <div style={{marginBottom: '3px'}}><strong>Username (Parent Phone):</strong> {row.phone || 'N/A'}</div>
                                            <div><strong>Password (Reg No):</strong> {student.registration || student.admissionNumber || student.id}</div>
                                          </div>
                                        </div>

                                        <div style={{fontSize: '0.85rem', color: '#6c757d', borderTop: '1px dashed #e9ecef', paddingTop: '10px'}}>
                                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '3px'}}>
                                            <span><strong>Class:</strong> {student.class?.name || student.className || 'N/A'}</span>
                                            <span><strong>Grade:</strong> {student.grade?.name || student.gradeName || 'N/A'}</span>
                                          </div>
                                          <div><strong>System ID:</strong> {student.id}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Classes Section */}
                              {children.classes && children.classes.length > 0 && (
                                <div style={{marginBottom: '15px'}}>
                                  <div style={{fontWeight: 'bold', color: '#28a745', marginBottom: '8px'}}>
                                    <i className="la la-chalkboard" style={{marginRight: '8px'}}></i>
                                    Classes ({children.classes.length})
                                  </div>
                                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px'}}>
                                    {children.classes.map(cls => (
                                      <div key={cls.id} style={{padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: 'white'}}>
                                        <div style={{fontWeight: 'bold', color: '#495057', marginBottom: '5px'}}>{cls.name}</div>
                                        <div style={{fontSize: '0.85rem', color: '#6c757d'}}>
                                          <div>Grade: {cls.gradeName || 'N/A'}</div>
                                          <div>Students: {cls.studentCount || 'N/A'}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Grades Section */}
                              {children.grades && children.grades.length > 0 && (
                                <div>
                                  <div style={{fontWeight: 'bold', color: '#17a2b8', marginBottom: '8px'}}>
                                    <i className="la fa-chart-line" style={{marginRight: '8px'}}></i>
                                    Grades ({children.grades.length})
                                  </div>
                                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px'}}>
                                    {children.grades.map(grade => (
                                      <div key={grade.id} style={{padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: 'white'}}>
                                        <div style={{fontWeight: 'bold', color: '#495057', marginBottom: '5px'}}>{grade.name}</div>
                                        <div style={{fontSize: '0.85rem', color: '#6c757d'}}>
                                          <div>Level: {grade.level || 'N/A'}</div>
                                        <div>Classes: {grade.classCount || 'N/A'}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                    <td colSpan={headers.length + 1} style={{ padding: 0 }}>
                        <EmptyState 
                            title={activeSearch ? "No parents found" : "No Parents Added"}
                            description={activeSearch ? `We couldn't find any parent matching "${activeSearch}". Try adjusting your search.` : "Build your directory of guardians to power bulk communications."}
                            isSearch={!!activeSearch}
                            primaryAction={activeSearch ? handleClearSearch : () => addModalInstance.show()}
                            primaryActionText={activeSearch ? "Clear Search" : "Add Parent"}
                            iconClass={activeSearch ? "la la-search" : "la la-user-friends"}
                        />
                    </td>
                </tr>
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