import React, { useState, useMemo, useEffect, useCallback } from "react";
import Data from "../../../utils/data";
import Fuse from "fuse.js";
import EmptyState from "../../../components/EmptyState";

import Add from "./add";
import Edit from "./edit";
import Delete from "./delete";

export default function SubjectCategoriesList() {
  const [data, setData] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    fetchData();
    const unsubscribe = Data.schools.subscribe(({ selectedSchool }) => {
      if (selectedSchool && selectedSchool.rubricSubjectCategories) {
        setData(selectedSchool.rubricSubjectCategories);
      } else {
        // Fallback to direct subscription if needed
        setData(Data.rubricSubjectCategories.list() || []);
      }
    });
    const unsubscribeSubjects = Data.subjects.subscribe(({ subjects }) => {
      setSubjectsList(subjects || []);
    });
    
    // Cleanup search timeout on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeSubjects) unsubscribeSubjects();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, []); // Run only once on mount

  const fetchData = () => {
    const activeSchool = Data.schools.list().find(s => s.id === localStorage.getItem('school'));
    const rawData = activeSchool?.rubricSubjectCategories || Data.rubricSubjectCategories.list() || [];
    const subjects = Data.subjects.list() || [];
    setSubjectsList(subjects);
    setData(rawData);
    setInitialLoading(false);
  };

  const getFilteredAndSortedData = () => {
    let result = [...data];

    if (activeSearch) {
      const fuse = new Fuse(result, {
        keys: ["name"],
        threshold: 0.3,
      });
      result = fuse.search(activeSearch).map(r => r.item);
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const filteredData = getFilteredAndSortedData();
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage) || 1;
  const currentData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const headers = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'subjects', label: 'Subjects', sortable: false },
  ];

  const handleRealTimeSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setActiveSearch(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    if (searchTimeout) clearTimeout(searchTimeout);
    setCurrentPage(1);
    setActiveSearch("");
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setCurrentPage(1);
    setSortConfig({ key, direction });
  };

  return (
    <div className="v8-datatable-container">
      {showAddModal && <Add handleClose={() => setShowAddModal(false)} />}
      {editItem && <Edit handleClose={() => setEditItem(null)} item={editItem} />}
      {deleteItem && <Delete handleClose={() => setDeleteItem(null)} item={deleteItem} />}

      <style>{`
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
            <h2 className="v8-header-title">Manage Subject Categories</h2>
            <p className="v8-header-desc">Directory of subject categories and their subjects.</p>
        </div>
        <div className="v8-header-actions">
          <div className="v8-header-stat">
            <div className="value">{initialLoading ? <div className="v8-spinner" style={{width: 20, height: 20}}></div> : totalCount}</div>
            <div className="label">Total Categories</div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn" style={{backgroundColor: 'var(--v8-accent-color)', color: 'white'}}>New Category</button>
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
                    placeholder="Search subject categories by name..." 
                    value={searchTerm} 
                    onChange={(e) => handleRealTimeSearch(e.target.value)} 
                />
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
              ) : currentData.length > 0 ? (
                currentData.map(row => {
                  const categorySubjects = (row.subjects || []).map(sub => {
                      const idToSearch = typeof sub === 'object' ? (sub.id || sub._id) : sub;
                      // Use subjectsList from state, fallback to Data.subjects.list() if state is stale
                      const allSubjects = subjectsList.length > 0 ? subjectsList : (Data.subjects.list() || []);
                      const matchedSubject = allSubjects.find(s => String(s.id) === String(idToSearch));
                      
                      let nameToDisplay = 'Unknown Subject';
                      if (matchedSubject && matchedSubject.name && matchedSubject.name !== String(idToSearch)) {
                          nameToDisplay = matchedSubject.name;
                      } else if (typeof sub === 'object' && sub.name && sub.name !== String(idToSearch)) {
                          nameToDisplay = sub.name;
                      }

                      return { id: idToSearch, name: nameToDisplay };
                  });

                  return (
                      <tr key={row.id}>
                        <td className="td-primary">{row.name}</td>
                        <td>
                            {categorySubjects.length > 0 ? categorySubjects.map(sub => (
                                <span key={sub.id} className="kt-badge kt-badge--info kt-badge--inline kt-badge--pill mr-1 mb-1" style={{ whiteSpace: 'normal', display: 'inline-block' }}>
                                    {sub.name}
                                </span>
                            )) : <span className="text-muted">No subjects added</span>}
                        </td>
                        <td className="v8-table-actions" style={{textAlign: 'right'}}>
                            <button className="v8-tooltip-container" onClick={() => setEditItem(row)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
                            <i className="la la-edit" style={{fontSize: '1.5rem'}}></i>
                            <span className="v8-tooltip-text">Edit</span>
                            </button>
                            <button className="v8-tooltip-container" onClick={() => setDeleteItem(row)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
                            <i className="la la-trash" style={{fontSize: '1.5rem'}}></i>
                            <span className="v8-tooltip-text">Delete</span>
                            </button>
                        </td>
                      </tr>
                  );
                })
              ) : (
                <tr>
                    <td colSpan={headers.length + 1} style={{ padding: 0 }}>
                        <EmptyState 
                            title={activeSearch ? "No categories found" : "No Subject Categories Added"}
                            description={activeSearch ? `We couldn't find any category matching "${activeSearch}". Try adjusting your search.` : "Build your subject categories."}
                            isSearch={!!activeSearch}
                            primaryAction={activeSearch ? handleClearSearch : () => setShowAddModal(true)}
                            primaryActionText={activeSearch ? "Clear Search" : "New Category"}
                            iconClass={activeSearch ? "la la-search" : "la la-layer-group"}
                        />
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!initialLoading && totalCount > 0 && (
          <div className="v8-pagination">
            <div className="v8-pagination-info">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong>-<strong>{Math.min(currentPage * rowsPerPage, totalCount)}</strong> of <strong>{totalCount}</strong>
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
