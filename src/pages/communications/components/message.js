import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Handlebars from 'handlebars';
import Data from '../../../utils/data';

// --- HANDLEBARS CONFIG ---
Handlebars.registerHelper("fallback", (value, fallback) => {
    return value ? new Handlebars.SafeString(value) : fallback;
});

// --- STYLES ---
const STYLES = `
  /* Layout & Scroll */
  .composer-container { height: calc(100vh - 140px); background: #f4f6f9; display: flex; flex-direction: column; }
  .custom-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
  .custom-scroll::-webkit-scrollbar { width: 5px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 20px; }

  /* Audience Column */
  .audience-panel { background: white; border-right: 1px solid #eef0f8; height: 100%; display: flex; flex-direction: column; }
  .contact-item {
    display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f8f9fa; cursor: pointer; transition: all 0.15s;
  }
  .contact-item:hover { background: #fbfbfd; }
  .contact-item.selected { background: #f0f7ff; border-left: 4px solid #5d78ff; }
  .contact-avatar {
    width: 35px; height: 35px; background: #f0f2f5; color: #5e6278;
    border-radius: 6px; display: flex; align-items: center; justifyContent: center;
    font-weight: 600; font-size: 0.9rem; margin-right: 12px;
  }
  .contact-item.selected .contact-avatar { background: #5d78ff; color: white; }

  /* Editor Column */
  .editor-panel { padding: 25px; height: 100%; overflow-y: hidden; }
  .editor-card { background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; }
  
  /* Text Area */
  .message-area {
    border: 1px solid #eef0f8; border-radius: 8px; padding: 20px;
    font-size: 1rem; line-height: 1.6; color: #3f4254;
    resize: none; width: 100%; flex-grow: 1; transition: border 0.2s;
  }
  .message-area:focus { outline: none; border-color: #5d78ff; box-shadow: 0 0 0 3px rgba(93, 120, 255, 0.1); }

  /* Variable Chips */
  .var-chip {
    background: #e8f4ff; color: #007bff; padding: 6px 12px; border-radius: 50px;
    font-size: 0.75rem; font-weight: 600; cursor: pointer; border: 1px solid transparent;
    transition: 0.2s; user-select: none; margin-right: 8px; margin-bottom: 5px; display: inline-block;
  }
  .var-chip:hover { background: #007bff; color: white; transform: translateY(-1px); }

  /* Phone Preview */
  .phone-frame {
    background: #1e1e2d; border-radius: 35px; padding: 10px;
    width: 300px; height: 600px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
    display: flex; flex-direction: column; margin: auto;
  }
  .phone-screen {
    background: #eef0f8; border-radius: 25px; overflow: hidden;
    flex-grow: 1; display: flex; flex-direction: column; position: relative;
  }
  .phone-notch {
    height: 25px; background: white; text-align: center; font-size: 10px; color: #b5b5c3;
    display: flex; align-items: center; justify-content: space-between; padding: 0 15px; flex-shrink: 0;
  }
  .phone-header {
    background: white; border-bottom: 1px solid #ebedf2; padding: 10px 15px;
    display: flex; align-items: center; flex-shrink: 0;
  }
  .phone-body {
    flex-grow: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column;
  }
  /* Scrollbar inside phone */
  .phone-body::-webkit-scrollbar { width: 4px; }
  .phone-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

  .msg-container {
    display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 15px;
  }
  .msg-label {
    font-size: 0.65rem; color: #999; margin-bottom: 2px; margin-right: 5px; font-weight: 600;
  }
  .msg-bubble {
    background: white; padding: 10px 14px; border-radius: 15px 15px 4px 15px;
    font-size: 0.85rem; color: #3f4254; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    white-space: pre-wrap; max-width: 100%; text-align: left;
  }
`;

// --- HELPER: Mask Phone ---
const maskPhone = (phone) => {
  return phone || '';
};

const getInitials = (name = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

// --- COMPONENT: Pre-Flight Check Modal ---
const PreFlightModal = ({ isOpen, onClose, onConfirm, recipientCount, messageLength, currentBalance }) => {
    if (!isOpen) return null;

    const COST_PER_SMS = 2.0;
    const CHARS_PER_SEGMENT = 160;

    const segments = messageLength > 0 ? Math.ceil(messageLength / CHARS_PER_SEGMENT) : 1;
    const totalCost = segments * recipientCount * COST_PER_SMS;
    const remainingBalance = currentBalance - totalCost;
    const isInsufficient = remainingBalance < 0;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title font-weight-bold">Confirm Campaign</h5>
                        <button type="button" className="close" onClick={onClose}><span>&times;</span></button>
                    </div>
                    <div className="modal-body">
                        <div className="d-flex justify-content-between mb-4 px-2">
                            <div className="text-center">
                                <h3 className="font-weight-bold mb-0">{recipientCount}</h3>
                                <small className="text-muted">Recipients</small>
                            </div>
                            <div className="text-center border-left border-right px-4">
                                <h3 className="font-weight-bold mb-0">{segments}</h3>
                                <small className="text-muted">SMS Parts</small>
                            </div>
                            <div className="text-center">
                                <h3 className="font-weight-bold mb-0 text-primary">KES {totalCost.toFixed(2)}</h3>
                                <small className="text-muted">Total Cost</small>
                            </div>
                        </div>

                        <div className={`alert alert-outline-${isInsufficient ? 'danger' : 'success'} alert-bold`} role="alert">
                            <div className="alert-icon"><i className={`flaticon-${isInsufficient ? 'warning' : 'piggy-bank'}`}></i></div>
                            <div className="alert-text">
                                Current Balance: <strong>KES {currentBalance.toFixed(2)}</strong>
                                {isInsufficient && (
                                    <div className="mt-1">
                                        You are short by <strong>KES {Math.abs(remainingBalance).toFixed(2)}</strong>.
                                    </div>
                                )}
                            </div>
                        </div>

                        {isInsufficient ? (
                            <div className="text-muted small mt-3">
                                <p><strong>Warning:</strong> Proceeding without sufficient funds will likely result in failed messages.</p>
                            </div>
                        ) : (
                            <p className="text-muted small mt-3 text-center">Your balance is sufficient to cover this campaign.</p>
                        )}
                    </div>
                    <div className="modal-footer bg-light">
                        {isInsufficient && (
                            <button type="button" className="btn btn-warning shadow-sm mr-auto" onClick={() => window.open("/finance/topup", "_blank")}>
                                <i className="fa fa-wallet"></i> Top Up Balance
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className={`btn btn-${isInsufficient ? 'danger' : 'brand'} btn-elevate`} onClick={onConfirm}>
                            {isInsufficient ? 'Proceed Anyway' : 'Confirm & Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: Delivery Report Modal ---
const DeliveryReportModal = ({ isOpen, onClose, isLoading, reportData, onRetry, recipientMap }) => {
    const [retrySelection, setRetrySelection] = useState(new Set());

    useEffect(() => {
        if (reportData && reportData.failedSends) {
            setRetrySelection(new Set(reportData.failedSends.map(f => f.parentId)));
        }
    }, [reportData]);

    if (!isOpen) return null;

    const toggleRetryItem = (id) => {
        const newSet = new Set(retrySelection);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setRetrySelection(newSet);
    };

    const getName = (id) => {
        if(recipientMap && recipientMap.has(id)) return recipientMap.get(id).name;
        return 'Unknown Recipient';
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{isLoading ? 'Sending Messages...' : 'Delivery Report'}</h5>
                        {!isLoading && <button type="button" className="close" onClick={onClose}><span>&times;</span></button>}
                    </div>
                    <div className="modal-body" style={{ minHeight: '200px' }}>
                        {isLoading ? (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5">
                                <div className="kt-spinner kt-spinner--v2 kt-spinner--lg kt-spinner--brand"></div>
                                <h6 className="mt-4 text-muted">Dispatching to provider...</h6>
                            </div>
                        ) : (
                            <div className="report-content">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="alert alert-solid-success alert-bold mb-0">
                                            <div className="alert-text">
                                                <h6 className="mb-0">Successful</h6>
                                                <span className="display-4 font-weight-bold">{reportData.successfulSends.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className={`alert alert-solid-${reportData.failedSends.length > 0 ? 'danger' : 'secondary'} alert-bold mb-0`}>
                                            <div className="alert-text">
                                                <h6 className="mb-0">Failed</h6>
                                                <span className="display-4 font-weight-bold">{reportData.failedSends.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {reportData.failedSends.length > 0 ? (
                                    <div>
                                        <h6 className="text-danger font-weight-bold mb-3 border-bottom pb-2">Failed Deliveries ({reportData.failedSends.length})</h6>
                                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            <table className="table table-head-bg-brand table-hover">
                                                <thead>
                                                    <tr>
                                                        <th style={{width: '50px'}}>
                                                            <label className="kt-checkbox kt-checkbox--single kt-checkbox--solid">
                                                                <input type="checkbox" checked={retrySelection.size === reportData.failedSends.length}
                                                                    onChange={(e) => setRetrySelection(e.target.checked ? new Set(reportData.failedSends.map(f => f.parentId)) : new Set())} />
                                                                <span></span>
                                                            </label>
                                                        </th>
                                                        <th>Recipient</th>
                                                        <th>Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.failedSends.map((fail, idx) => (
                                                        <tr key={idx} className={retrySelection.has(fail.parentId) ? 'bg-light-danger' : ''}>
                                                            <td>
                                                                <label className="kt-checkbox kt-checkbox--single kt-checkbox--danger">
                                                                    <input type="checkbox" checked={retrySelection.has(fail.parentId)} onChange={() => toggleRetryItem(fail.parentId)} />
                                                                    <span></span>
                                                                </label>
                                                            </td>
                                                            <td>
                                                                <div className="font-weight-bold">{getName(fail.parentId)}</div>
                                                                <div className="small text-muted monospace">{fail.phone}</div>
                                                            </td>
                                                            <td className="text-danger small">{fail.error}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="la la-check-circle text-success" style={{fontSize: '4rem'}}></i>
                                        <h5 className="mt-3 text-success">All Sent Successfully!</h5>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {!isLoading && (
                        <div className="modal-footer bg-light">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            {reportData && reportData.failedSends && reportData.failedSends.length > 0 && (
                                <button type="button" className="btn btn-danger btn-elevate" onClick={() => onRetry(Array.from(retrySelection))} disabled={retrySelection.size === 0}>
                                    <i className="la la-refresh"></i> Retry ({retrySelection.size})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Audience Selector (Left Column) ---
const AudienceSelector = ({ 
    activeTab, onTabChange, displayList, selectedIds, onSelectOne, onSelectAll, 
    searchTerm, onSearchChange, classes, routes, subFilterId, onSubFilterIdChange,
    totalCount, isLoading, hasMore, onLoadMore, isMobile
}) => {
    const allOnPageSelected = displayList.length > 0 && displayList.every(i => selectedIds.has(i.id));

    return (
        <div className="audience-panel" style={isMobile ? { height: 'auto', borderRight: 'none' } : null}>
            <div className="p-4 border-bottom">
                <h5 className="font-weight-bold text-dark mb-3">Select Audience</h5>
                
                {/* Tabs */}
                <div className="btn-group w-100 mb-3 shadow-sm" role="group">
                    {[
                        { id: 'parents', label: 'All Parents' }, 
                        { id: 'classes', label: 'By Class' }, 
                        { id: 'routes', label: 'By Route' },
                        { id: 'staff', label: 'Staff' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            className={`btn btn-sm ${activeTab === tab.id ? 'btn-success text-white' : 'btn-white text-muted'}`}
                            onClick={() => onTabChange(tab.id)}
                            style={{fontWeight: 600, border: '1px solid #ebedf2'}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sub-Filters */}
                {(activeTab === 'classes' || activeTab === 'routes') && (
                    <div className="mb-3">
                        <select className="form-control form-control-sm bg-light border-0 font-weight-bold text-dark-50" value={subFilterId} onChange={onSubFilterIdChange}>
                            {activeTab === 'classes' && classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            {activeTab === 'routes' && routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Search */}
                <div className="input-group">
                    <div className="input-group-prepend"><span className="input-group-text bg-white border-right-0"><i className="la la-search"></i></span></div>
                    <input type="text" className="form-control border-left-0 pl-0" placeholder="Search name..." value={searchTerm} onChange={onSearchChange} />
                </div>
            </div>

            {/* Header / Select All */}
            <div className="d-flex justify-content-between align-items-center px-4 py-2 bg-light border-bottom">
                <label className="checkbox checkbox-success mb-0 font-weight-bold font-size-sm">
                    <input type="checkbox" checked={allOnPageSelected} onChange={(e) => onSelectAll(e.target.checked)} disabled={displayList.length === 0}/>
                    <span></span> &nbsp; Select All ({displayList.length})
                </label>
                <span className="label label-light-success label-inline font-weight-bold">{selectedIds.size} Selected</span>
            </div>

            {/* List */}
            <div className="flex-grow-1 custom-scroll" style={isMobile ? { overflowY: 'visible', maxHeight: 'none' } : { overflowY: 'auto' }}>
                {displayList.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                        <div key={item.id} className={`contact-item ${isSelected ? 'selected' : ''}`} onClick={() => onSelectOne(item.id, !isSelected)}>
                            <div className="contact-avatar">{getInitials(item.name)}</div>
                            <div className="flex-grow-1" style={{minWidth: 0}}>
                                <div className="text-dark-75 font-weight-bold font-size-sm text-truncate">{item.name}</div>
                                <div className="text-muted font-size-xs">{maskPhone(item.phone)}</div>
                            </div>
                            {isSelected && <i className="la la-check-circle text-success icon-lg"></i>}
                        </div>
                    );
                })}
                
                {isLoading && <div className="text-center py-3"><div className="kt-spinner kt-spinner--brand kt-spinner--sm"></div></div>}
                
                {!isLoading && hasMore && !searchTerm && (
                    <div className="text-center py-3 border-top">
                       <button className="btn btn-sm btn-light btn-pill font-weight-bold" onClick={onLoadMore}>Load More</button>
                    </div>
                )}

                {!isLoading && displayList.length === 0 && (
                    <div className="text-center py-5 text-muted font-size-sm">No contacts found</div>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: Workspace (Right Column) ---
const Workspace = ({ 
    messageTemplate, onMessageChange, onSend, selectedCount, previewMessages, 
    messageType, onMessageTypeChange, schoolName, onInsertVariable 
}) => {
    const chars = messageTemplate.length;
    const segments = Math.ceil(chars / 160);

    return (
        <div className="editor-panel">
            <div className="editor-card">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
                    <h3 className="font-weight-bold m-0 text-dark">Compose Message</h3>
                    <div className="btn-group">
                        <button className={`btn btn-sm font-weight-bold ${messageType === 'sms' ? 'btn-light-success text-success' : 'btn-light text-muted'}`} onClick={() => onMessageTypeChange('sms')}>SMS</button>
                        <button className={`btn btn-sm font-weight-bold ${messageType === 'email' ? 'btn-light-primary text-primary' : 'btn-light text-muted'}`} onClick={() => onMessageTypeChange('email')}>Email</button>
                    </div>
                </div>

                <div className="row no-gutters flex-grow-1">
                    
                    {/* INPUT AREA */}
                    <div className="col-lg-7 d-flex flex-column p-4 border-right">
                        
                        {/* Variable Chips */}
                        <div className="mb-3">
                            <span className="text-muted font-size-xs font-weight-bold text-uppercase mr-3">Variables:</span>
                            <span className="var-chip" onClick={() => onInsertVariable('{{recipient.name}}')}>Parent Name</span>
                            <span className="var-chip" onClick={() => onInsertVariable("{{fallback student.names 'your child'}}")}>Student Name</span>
                            <span className="var-chip" onClick={() => onInsertVariable("{{school.name}}")}>School Name</span>
                        </div>

                        {/* Textarea */}
                        <textarea 
                            className="message-area"
                            placeholder={`Type your ${messageType.toUpperCase()} here... e.g. Hello {{recipient.name}}`}
                            value={messageTemplate}
                            onChange={onMessageChange}
                            spellCheck="false"
                        ></textarea>

                        {/* Footer / Stats */}
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="text-muted font-size-sm">
                                <strong>{chars}</strong> chars 
                                {messageType === 'sms' && <span className="ml-2 pl-2 border-left">~{segments} Segment(s)</span>}
                            </div>
                            <button 
                                className="btn btn-success font-weight-bold px-5 shadow-sm" 
                                disabled={selectedCount === 0}
                                onClick={onSend}
                            >
                                Send to {selectedCount} Recipients <i className="la la-paper-plane ml-2"></i>
                            </button>
                        </div>
                    </div>

                    {/* PHONE PREVIEW (UPDATED: Scrollable List) */}
                    <div className="col-lg-5 p-4 d-none d-lg-flex align-items-center justify-content-center bg-light">
                        <div className="phone-frame">
                            <div className="phone-screen">
                                <div className="phone-notch">
                                    <span>9:41</span>
                                    <span><i className="fa fa-wifi font-size-xs mr-1"></i> <i className="fa fa-battery-full font-size-xs"></i></span>
                                </div>
                                <div className="phone-header">
                                    <div className="symbol symbol-30 symbol-circle symbol-light-success mr-3"><span className="symbol-label">S</span></div>
                                    <div>
                                        <div className="font-size-sm font-weight-bold text-dark">{schoolName || "School Admin"}</div>
                                        <div className="font-size-xs text-muted">{selectedCount} Recipient(s)</div>
                                    </div>
                                </div>
                                
                                <div className="phone-body bg-light-primary">
                                    {selectedCount === 0 ? (
                                        <div className="text-center text-muted mt-5 opacity-50">
                                            <i className="flaticon2-group icon-2x mb-2"></i>
                                            <div className="font-size-xs">Select recipients to preview messages</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center my-3"><span className="badge badge-light font-weight-normal text-muted p-2 rounded">Today</span></div>
                                            
                                            {/* Scrollable list of all preview messages */}
                                            {previewMessages.map((msg) => (
                                                <div key={msg.id} className="msg-container">
                                                    <div className="msg-label">
                                                        {msg.name} ({maskPhone(msg.phone)})
                                                    </div>
                                                    <div className="msg-bubble">
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MessageComposer() {
  // Mobile / Viewport State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 991);
  const [mobileTab, setMobileTab] = useState('audience'); // 'audience', 'compose', 'preview'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 991);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data
  const [classes, setClasses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolName, setSchoolName] = useState("Our School");
  const [schoolBalance, setSchoolBalance] = useState(0);
  
  // List State
  const [displayList, setDisplayList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 50;
  const [hasMore, setHasMore] = useState(false);

  // Filters & Selection
  const [activeTab, setActiveTab] = useState('parents'); 
  const [subFilterId, setSubFilterId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Message & Modals
  const [messageTemplate, setMessageTemplate] = useState("Hello {{recipient.name}},\n\nThis is a message from {{school.name}} regarding {{fallback student.names 'your child'}}.");
  const [messageType, setMessageType] = useState('sms');
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // --- 1. Load Core Data ---
  useEffect(() => {
    // School Details
    const unsubSchool = Data.schools.subscribe(({ selectedSchool }) => {
        if (selectedSchool) {
            setSchoolName(selectedSchool.name || "School");
            if (selectedSchool.financial) setSchoolBalance(selectedSchool.financial.balance || 0);
        }
    });

    const unsubClasses = Data.classes.subscribe(({ classes }) => setClasses(classes || []));
    const unsubRoutes = Data.routes.subscribe(({ routes }) => setRoutes(routes || []));
    const unsubTeachers = Data.teachers.subscribe(({ teachers }) => setTeachers(teachers || []));
    
    return () => { 
        if(unsubClasses) unsubClasses(); 
        if(unsubRoutes) unsubRoutes(); 
        if(unsubTeachers) unsubTeachers(); 
        if(unsubSchool) unsubSchool();
    };
  }, []);

  // --- 2. Fetch Recipient List (Pagination) ---
  const fetchRecipients = useCallback(async (isLoadMore = false) => {
    setIsLoadingList(true);
    let newList = [];
    let newTotal = 0;
    try {
      if (activeTab === 'parents') {
        const result = await Data.parents.getPage({ page: isLoadMore ? page + 1 : 1, limit: ROWS_PER_PAGE });
        newList = result.parents;
        newTotal = result.totalCount;
        
        if (isLoadMore) {
          setDisplayList(prev => [...prev, ...newList]);
          setPage(prev => prev + 1);
        } else {
          setDisplayList(newList);
          setPage(1);
        }
        setHasMore((isLoadMore ? displayList.length + newList.length : newList.length) < newTotal);
        setTotalCount(newTotal);

      } else if (activeTab === 'classes' && subFilterId) {
        const targetClass = classes.find(c => c.id === subFilterId);
        if (targetClass?.students) {
           const map = new Map();
           targetClass.students.forEach(s => s.parent && map.set(s.parent.id, { ...s.parent, students: [s] }));
           newList = Array.from(map.values());
        }
        setDisplayList(newList);
        setHasMore(false);
        setTotalCount(newList.length);

      } else if (activeTab === 'routes' && subFilterId) {
        const targetRoute = routes.find(r => r.id === subFilterId);
        if (targetRoute?.students) {
            const map = new Map();
            targetRoute.students.forEach(s => s.parent && map.set(s.parent.id, { ...s.parent, students: [s] }));
            newList = Array.from(map.values());
        }
        setDisplayList(newList);
        setHasMore(false);
        setTotalCount(newList.length);

      } else if (activeTab === 'staff') {
        newList = teachers;
        setDisplayList(newList);
        setHasMore(false);
        setTotalCount(newList.length);
      } else {
        setDisplayList([]);
      }
    } catch (e) { console.error(e); } finally { setIsLoadingList(false); }
  }, [activeTab, subFilterId, page, classes, routes, teachers, displayList.length]);

  // --- 3. Reload List on Filter Change ---
  useEffect(() => {
    setSelectedIds(new Set());
    setPage(1);
    
    // Auto-select first item for sub-filters if empty
    if (activeTab === 'classes' && !subFilterId && classes.length) setSubFilterId(classes[0].id);
    else if (activeTab === 'routes' && !subFilterId && routes.length) setSubFilterId(routes[0].id);
    
    fetchRecipients(false);
  }, [activeTab, subFilterId, classes, routes]); 

  // --- 4. Filtering Logic (Client-side search) ---
  const filteredList = useMemo(() => {
    if (!searchTerm) return displayList;
    return displayList.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [displayList, searchTerm]);

  // --- 5. Generate Preview (ARRAY) ---
  const previewMessages = useMemo(() => {
    if (selectedIds.size === 0) return [];
    try {
        const template = Handlebars.compile(messageTemplate);
        
        // Map ALL selected IDs to preview objects
        return Array.from(selectedIds).map(id => {
            const contact = displayList.find(c => c.id === id);
            if (!contact) return null;
            
            const context = {
                recipient: contact,
                parent: contact,
                student: contact.students?.[0] || {},
                school: { name: schoolName }
            };
            
            return {
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                text: template(context)
            };
        }).filter(Boolean); // Remove nulls
    } catch (e) { return [{ id: 'err', name: 'System', text: "Template Error" }]; }
  }, [messageTemplate, selectedIds, displayList, schoolName]);

  // --- 6. Recipient Map for Reports ---
  const recipientMap = useMemo(() => {
    const map = new Map();
    displayList.forEach(item => map.set(item.id, item));
    return map;
  }, [displayList]);

  // --- ACTIONS ---
  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? new Set(filteredList.map(i => i.id)) : new Set());
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        checked ? next.add(id) : next.delete(id);
        return next;
    });
  };

  const insertVariable = (varCode) => {
    setMessageTemplate(prev => prev + " " + varCode);
  };

  const onPreFlightClick = () => {
    if (selectedIds.size === 0) return alert("Please select recipients.");
    setShowPreFlight(true);
  }

  const performSend = async (idsToProcess) => {
    setIsSending(true);
    setReportData(null);
    try {
      const payload = {
        school: localStorage.getItem("school"),
        message: messageTemplate,
        parents: idsToProcess
      };
      const result = await Data.communication.sms.create(payload);
      setReportData(result.sms.send);
      setIsSending(false);
      // Clear selection if successful run
      if (result.sms.send.failedCount === 0 && idsToProcess.length === selectedIds.size) {
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error("Failed to send:", error);
      setIsSending(false);
      setReportData({
          success: false,
          successfulSends: [],
          failedSends: idsToProcess.map(id => ({ parentId: id, phone: 'Unknown', error: error.message || 'System Error' }))
      });
    }
  };

  const onConfirmSend = () => {
    setShowPreFlight(false);
    setShowReportModal(true);
    performSend(Array.from(selectedIds));
  };

  const handleRetry = (failedIds) => {
      performSend(failedIds);
  };

  return (
    <div className="composer-container">
        <style>{STYLES}</style>

        {isMobile && (
            <div style={{
                display: 'flex',
                background: 'white',
                borderBottom: '1px solid #ebedf2',
                padding: '8px 12px',
                gap: '8px',
                zIndex: 10
            }}>
                <button 
                    onClick={() => setMobileTab('audience')}
                    style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: '8px',
                        border: 'none',
                        background: mobileTab === 'audience' ? '#eef0f8' : 'transparent',
                        color: mobileTab === 'audience' ? '#5d78ff' : '#7e8299',
                        fontWeight: '700',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <i className="la la-group" style={{ fontSize: '15px' }}></i>
                    Audience {selectedIds.size > 0 && <span style={{ background: '#5d78ff', color: 'white', fontSize: '9px', padding: '1px 5px', borderRadius: '50px', fontWeight: 'bold' }}>{selectedIds.size}</span>}
                </button>
                <button 
                    onClick={() => setMobileTab('composer')}
                    style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: '8px',
                        border: 'none',
                        background: mobileTab === 'composer' ? '#eef0f8' : 'transparent',
                        color: mobileTab === 'composer' ? '#5d78ff' : '#7e8299',
                        fontWeight: '700',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <i className="la la-edit" style={{ fontSize: '15px' }}></i>
                    Composer
                </button>
            </div>
        )}

        {isMobile ? (
            <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden', background: '#f4f6f9' }}>
                {mobileTab === 'audience' && (
                    <div className="h-100" style={{ display: 'flex', flexDirection: 'column' }}>
                        <AudienceSelector 
                            activeTab={activeTab} 
                            onTabChange={t => { setActiveTab(t); setSubFilterId(''); setSearchTerm(''); }}
                            displayList={filteredList}
                            selectedIds={selectedIds}
                            onSelectAll={handleSelectAll}
                            onSelectOne={handleSelectOne}
                            searchTerm={searchTerm}
                            onSearchChange={e => setSearchTerm(e.target.value)}
                            classes={classes}
                            routes={routes}
                            subFilterId={subFilterId}
                            onSubFilterIdChange={e => setSubFilterId(e.target.value)}
                            totalCount={totalCount}
                            isLoading={isLoadingList}
                            hasMore={hasMore}
                            onLoadMore={() => fetchRecipients(true)}
                            isMobile={isMobile}
                        />
                    </div>
                )}

                {mobileTab === 'compose' && (
                    <div className="flex-grow-1 custom-scroll" style={{ overflowY: 'auto', padding: '16px', background: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Message Type Selector */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="font-weight-bold m-0 text-dark">Message Type</h5>
                            <div className="btn-group">
                                <button className={`btn btn-sm font-weight-bold ${messageType === 'sms' ? 'btn-light-success text-success' : 'btn-light text-muted'}`} onClick={() => setMessageType('sms')}>SMS</button>
                                <button className={`btn btn-sm font-weight-bold ${messageType === 'email' ? 'btn-light-primary text-primary' : 'btn-light text-muted'}`} onClick={() => setMessageType('email')}>Email</button>
                            </div>
                        </div>

                        {/* Variables Selector */}
                        <div className="mb-3">
                            <div className="text-muted font-size-xs font-weight-bold text-uppercase mb-2">Variables (Tap to insert):</div>
                            <div className="d-flex flex-wrap" style={{ gap: '6px' }}>
                                <span className="var-chip" style={{ margin: 0 }} onClick={() => insertVariable('{{recipient.name}}')}>Parent Name</span>
                                <span className="var-chip" style={{ margin: 0 }} onClick={() => insertVariable("{{fallback student.names 'your child'}}")}>Student Name</span>
                                <span className="var-chip" style={{ margin: 0 }} onClick={() => insertVariable("{{school.name}}")}>School Name</span>
                            </div>
                        </div>

                        {/* Message Template Textarea */}
                        <div className="flex-grow-1 mb-3" style={{ display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
                            <textarea 
                                className="message-area"
                                style={{ minHeight: '150px', border: '1px solid #ebedf2', borderRadius: '8px', padding: '12px', flexGrow: 1 }}
                                placeholder={`Type your ${messageType.toUpperCase()} here... e.g. Hello {{recipient.name}}`}
                                value={messageTemplate}
                                onChange={e => setMessageTemplate(e.target.value)}
                                spellCheck="false"
                            ></textarea>
                        </div>

                        {/* Stats & Actions */}
                        <div className="d-flex flex-column gap-2 mt-auto">
                            <div className="text-muted font-size-xs d-flex justify-content-between mb-2">
                                <span>Chars: <strong>{messageTemplate.length}</strong></span>
                                {messageType === 'sms' && <span>SMS Parts: <strong>{Math.ceil(messageTemplate.length / 160)}</strong></span>}
                            </div>
                            <button 
                                className="btn btn-success font-weight-bold btn-lg w-100 shadow-sm" 
                                disabled={selectedIds.size === 0}
                                onClick={onPreFlightClick}
                                style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <span>Send to {selectedIds.size} Recipients</span>
                                <i className="la la-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                )}

                {mobileTab === 'preview' && (
                    <div className="flex-grow-1 custom-scroll" style={{ overflowY: 'auto', padding: '12px', background: '#f4f6f9' }}>
                        <div className="phone-frame" style={{ width: '100%', height: 'auto', minHeight: '400px', boxShadow: 'none', background: 'transparent', padding: 0 }}>
                            <div className="phone-screen" style={{ borderRadius: '12px', border: '1px solid #ebedf2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <div className="phone-header" style={{ padding: '12px 16px', background: 'white', display: 'flex', alignItems: 'center' }}>
                                    <div className="symbol symbol-30 symbol-circle symbol-light-success mr-3" style={{ width: '30px', height: '30px', background: '#e8fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}><span className="symbol-label font-weight-bold text-success" style={{ fontSize: '12px' }}>S</span></div>
                                    <div>
                                        <div className="font-size-sm font-weight-bold text-dark">{schoolName}</div>
                                        <div className="font-size-xs text-muted">{selectedIds.size} Recipient(s)</div>
                                    </div>
                                </div>
                                <div className="phone-body bg-light-primary" style={{ padding: '12px', minHeight: '350px', maxHeight: '420px', overflowY: 'auto', flexGrow: 1 }}>
                                    {selectedIds.size === 0 ? (
                                        <div className="text-center text-muted mt-5 py-5 opacity-50">
                                            <i className="flaticon2-group icon-2x mb-2 d-block"></i>
                                            <div className="font-size-xs">Select recipients under the "Audience" tab to preview customized messages.</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center my-2"><span className="badge badge-light font-weight-normal text-muted p-1 px-2 rounded" style={{ fontSize: '10px' }}>Today</span></div>
                                            {previewMessages.map((msg) => (
                                                <div key={msg.id} className="msg-container" style={{ marginBottom: '12px' }}>
                                                    <div className="msg-label" style={{ fontSize: '0.6rem', color: '#7e8299' }}>
                                                        {msg.name} ({maskPhone(msg.phone)})
                                                    </div>
                                                    <div className="msg-bubble" style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '12px 12px 4px 12px' }}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="row h-100 no-gutters">
                {/* Left Column */}
                <div className="col-lg-4 col-xl-3 h-100" style={{ borderRight: '1px solid #ebedf2' }}>
                    <AudienceSelector 
                        activeTab={activeTab} 
                        onTabChange={t => { setActiveTab(t); setSubFilterId(''); setSearchTerm(''); }}
                        displayList={filteredList}
                        selectedIds={selectedIds}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleSelectOne}
                        searchTerm={searchTerm}
                        onSearchChange={e => setSearchTerm(e.target.value)}
                        classes={classes}
                        routes={routes}
                        subFilterId={subFilterId}
                        onSubFilterIdChange={e => setSubFilterId(e.target.value)}
                        totalCount={totalCount}
                        isLoading={isLoadingList}
                        hasMore={hasMore}
                        onLoadMore={() => fetchRecipients(true)}
                        isMobile={isMobile}
                    />
                </div>
                {/* Right Column */}
                <div className="col-lg-8 col-xl-9 h-100">
                    <Workspace 
                        messageTemplate={messageTemplate}
                        onMessageChange={e => setMessageTemplate(e.target.value)}
                        selectedCount={selectedIds.size}
                        previewMessages={previewMessages}
                        messageType={messageType}
                        onMessageTypeChange={setMessageType}
                        schoolName={schoolName}
                        onInsertVariable={insertVariable}
                        onSend={onPreFlightClick}
                    />
                </div>
            </div>
        )}

        {/* --- MODALS --- */}
        <PreFlightModal
            isOpen={showPreFlight}
            onClose={() => setShowPreFlight(false)}
            onConfirm={onConfirmSend}
            recipientCount={selectedIds.size}
            messageLength={messageTemplate.length}
            currentBalance={schoolBalance}
        />

        <DeliveryReportModal 
            isOpen={showReportModal}
            onClose={() => { setShowReportModal(false); setReportData(null); }}
            isLoading={isSending}
            reportData={reportData}
            onRetry={handleRetry}
            recipientMap={recipientMap}
        />
    </div>
  );
}