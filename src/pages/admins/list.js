import React, { useState, useMemo, useEffect, useRef } from "react";
import AddModal from "./add";
import UploadModal from "./upload";
import EditModal from "./edit";
import DeleteModal from "./delete";
import TransferModal from "./transfer";
import InviteModal from "./invite";
import Data from "../../utils/data";
import Fuse from "fuse.js";
import SuccessMessage from "./components/success-toast";

const addModalInstance = new AddModal();
const uploadModalInstance = new UploadModal();
const editModalInstance = new EditModal();
const deleteModalInstance = new DeleteModal();
const transferModalInstance = new TransferModal();
const inviteModalInstance = new InviteModal();
const ISuccessMessage = new SuccessMessage();

export default function AdminsDirectory() {
  const [admins, setAdmins] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canEditAdmins, setCanEditAdmins] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: 'names', direction: 'ascending' });
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const newRecordTimers = useRef(new Map());

  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [adminToTransfer, setAdminToTransfer] = useState({});
  const [selectedAdmin, setSelectedAdmin] = useState({});
  
  const school = localStorage.getItem("school");
  const currentUserEmail = JSON.parse(localStorage.getItem("user") || "{}")?.email || "";

  const fetchAdminsAndSchools = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const ENABLE_ROLE_RESTRICTIONS = false; // Toggle this to true once all admins have assigned roles
        const parsed = JSON.parse(storedUser);
        let role = String(parsed?.userType || parsed?.role || '').toLowerCase().replace(/ /g, '_');
        
        if (!ENABLE_ROLE_RESTRICTIONS) {
            const isSuper = ['super_admin', 'superadmin', 'sadmin'].includes(role) || parsed?.isSuperAdmin || parsed?.admin?.user === 'Super Admin';
            if (!isSuper) {
                role = 'admin'; // Treat all other admins as standard admin
            }
        }

        if (['super_admin', 'superadmin', 'sadmin'].includes(role) || parsed?.isSuperAdmin || parsed?.admin?.user === 'Super Admin') {
          setIsSuperAdmin(true);
          setCanEditAdmins(true);
        } else if (['customer_success_manager', 'csm', 'principal_admin', 'principal'].includes(role) || role === 'admin' || role === 'school_admin') {
          setCanEditAdmins(true);
        }
      }
      
      const adminData = await Data.admins.list() || [];
      const schoolData = await Data.schools.list() || [];
      // Filter out deleted admins
      const activeAdmins = adminData.filter(admin => !admin.isDeleted);
      setAdmins(activeAdmins);
      setSchools(schoolData);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminsAndSchools();
    const unsub = Data.admins.subscribe(({ admins: freshAdmins }) => {
      if (freshAdmins) {
        // Filter out deleted admins
        const activeAdmins = freshAdmins.filter(admin => !admin.isDeleted);
        setAdmins(activeAdmins);
      }
    });
    return () => {
      if (unsub) unsub();
      newRecordTimers.current.forEach(timerId => clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  // Headers config
  const headers = useMemo(() => {
    const baseHeaders = [
      { key: 'names', label: 'Admin Names', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true }
    ];
    if (isSuperAdmin) {
      baseHeaders.push({ key: 'role', label: 'Role', sortable: true });
      baseHeaders.push({ key: 'schools', label: 'Schools', sortable: false });
    }
    return baseHeaders;
  }, [isSuperAdmin]);

  // Filtering & Sorting
  const processedData = useMemo(() => {
    let result = [...admins];
    
    if (activeSearch) {
      const fuse = new Fuse(result, {
        keys: ['names', 'username', 'email', 'phone', 'role'],
        threshold: 0.3,
        ignoreLocation: true,
        useExtendedSearch: true
      });
      result = fuse.search(activeSearch).map(r => r.item);
    }
    
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [admins, activeSearch, sortConfig]);

  const totalAdmins = processedData.length;
  const totalPages = Math.ceil(totalAdmins / rowsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleRealTimeSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setActiveSearch(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setCurrentPage(1);
    setSortConfig({ key, direction });
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

  const sendInvite = async (userToInvite) => {
    try {
      await Data.admins.invite({ school, user: userToInvite });
      ISuccessMessage.show(); 
    } catch (error) {
      console.error("Invite failed:", error);
    }
  };

  const handleCreateAdmin = async (admin) => {
    try {
      const res = await Data.admins.create(admin);
      if (res && res.id) {
          setNewlyAddedIds(prev => new Set(prev).add(res.id));
          const timerId = setTimeout(() => {
              setNewlyAddedIds(prev => {
                  const newIds = new Set(prev);
                  newIds.delete(res.id);
                  return newIds;
              });
              newRecordTimers.current.delete(res.id);
          }, 5000);
          newRecordTimers.current.set(res.id, timerId);
      }
    } catch (e) { console.error(e); }
  };

  const getSchoolName = (schoolIdOrObj) => {
    if (!schoolIdOrObj) return '-';
    const id = typeof schoolIdOrObj === 'object' ? schoolIdOrObj.id : schoolIdOrObj;
    const found = schools.find(s => String(s.id) === String(id));
    return found ? found.name : (schoolIdOrObj.name || id);
  };

  const formatRole = (role) => {
    if (!role) return '-';
    const r = String(role).toUpperCase();
    const map = {
      'ADMIN': 'Admin',
      'SUPER_ADMIN': 'Super Admin',
      'CUSTOMER_SUCCESS_MANAGER': 'Customer Success Manager',
      'PRINCIPAL_ADMIN': 'Principal Admin',
      'ADMIN_OPERATIONS': 'Operations Admin',
      'ADMIN_ACADEMICS': 'Academics Admin'
    };
    return map[r] || String(role).toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="v8-datatable-container">
      <AddModal isSuperAdmin={isSuperAdmin} schools={schools} save={handleCreateAdmin} />
      <UploadModal admin={isSuperAdmin} save={data => data.forEach(a => Data.admins.create(a))} />
      {edit && <EditModal isSuperAdmin={isSuperAdmin} schools={schools} edit={edit} save={a => Data.admins.update(a)} />}
      {remove && <DeleteModal remove={remove} save={a => Data.admins.delete(a)} />}
      <InviteModal admin={selectedAdmin} invite={() => sendInvite(selectedAdmin.id)} />
      <TransferModal schools={schools} admin={adminToTransfer} transfer={a => Data.admins.transfer(a)} />
      
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
            min-height: 100vh;
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
        <h2 className="v8-header-title">Admins Directory</h2>
        <div className="v8-header-actions">
          <div className="v8-header-stat">
            <div className="value">{loading ? <div className="v8-spinner" style={{width: 20, height: 20}}></div> : totalAdmins}</div>
            <div className="label">Total Admins</div>
          </div>
          {canEditAdmins && (
            <>
              <button onClick={() => uploadModalInstance.show()} className="btn" style={{backgroundColor: '#F3F6F9', color: '#3F4254'}}>Upload</button>
              <button onClick={() => addModalInstance.show()} className="btn" style={{backgroundColor: 'var(--v8-accent-color)', color: 'white'}}>Add Admin</button>
            </>
          )}
        </div>
      </header>

      <main className="v8-main">
        <div className="v8-toolbar">
            <div className="v8-search-group">
                <input type="text" className="v8-search-input" placeholder="Search admins by name, email, phone..." value={searchTerm} onChange={(e) => handleRealTimeSearch(e.target.value)} />
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
              {loading ? (
                [...Array(rowsPerPage)].map((_, i) => <tr key={i}><td colSpan={headers.length + 1}><div style={{height: '2rem', backgroundColor: '#EFF2F5', borderRadius: '4px', margin: '1rem 0', animation: 'pulse 1.5s infinite ease-in-out'}}></div></td></tr>)
              ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => {
                    const isSelf = row.email === currentUserEmail;
                    return (
                    <tr key={row.id || idx} className={newlyAddedIds.has(row.id) ? 'v8-new-row' : ''}>
                      {headers.map(h => {
                        if (h.key === 'schools') {
                          return <td key={h.key}>{Array.isArray(row.schools) ? row.schools.map(s => getSchoolName(s)).join(', ') : '-'}</td>;
                        }
                        if (h.key === 'role') {
                          return <td key={h.key}>{formatRole(row[h.key])}</td>;
                        }
                        return <td key={h.key} className={h.key === 'names' ? 'td-primary' : ''}>{row[h.key] || '-'}</td>;
                      })}
                      <td className="v8-table-actions" style={{textAlign: 'right'}}>
                        <button title="Invite Admin" onClick={() => { setSelectedAdmin(row); inviteModalInstance.show(); }}><i className="la la-envelope" style={{fontSize: '1.5rem'}}></i></button>
                        {isSuperAdmin && !isSelf && <button title="Transfer Admin" onClick={() => { setAdminToTransfer(row); transferModalInstance.show(); }}><i className="la la-exchange" style={{fontSize: '1.5rem'}}></i></button>}
                        {canEditAdmins && !isSelf && (
                            <>
                                <button title="Edit Admin" onClick={() => { setEdit(row); editModalInstance.show(); }}><i className="la la-edit" style={{fontSize: '1.5rem'}}></i></button>
                                <button title="Delete Admin" onClick={() => { setRemove(row); deleteModalInstance.show(); }}><i className="la la-trash" style={{fontSize: '1.5rem'}}></i></button>
                            </>
                        )}
                        {isSelf && <span style={{fontSize: '0.8rem', color: '#B5B5C3', marginLeft: '0.5rem'}}>(You)</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '4rem', color: '#B5B5C3' }}>No admins found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && totalAdmins > 0 && (
          <div className="v8-pagination">
            <div className="v8-pagination-info">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}</strong>-<strong>{Math.min(currentPage * rowsPerPage, totalAdmins)}</strong> of <strong>{totalAdmins}</strong>
            </div>
            <div className="v8-pagination-controls">
                <span>Rows:</span>
                <select className="form-select form-select-sm" style={{padding: '0.5rem', borderRadius: '0.42rem', border: '1px solid #E4E6EF'}} value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
                <button className="btn-nav ms-3" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Previous</button>
                <span className="page-indicator">Page {currentPage} of {Math.max(1, totalPages)}</span>
                <button className="btn-nav" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
