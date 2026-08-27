import React, { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import Data from "../../utils/data";

const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown Date';
    try {
        let parsed;
        if (typeof dateStr === 'number') {
            parsed = new Date(dateStr);
        } else if (typeof dateStr === 'string') {
            // Check if it's purely digits
            if (/^\d+$/.test(dateStr)) {
                parsed = new Date(Number(dateStr));
            } else {
                parsed = new Date(dateStr);
            }
        } else {
            // Fallback for unexpected types like objects
            parsed = new Date(String(dateStr));
        }

        if (isNaN(parsed.getTime())) {
            return 'Invalid Date (' + String(dateStr) + ')';
        }
        return parsed.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const SmartPayloadViewer = ({ payload }) => {
    if (!payload) return null;
    
    let data = payload;
    if (typeof payload === 'string') {
        try {
            data = JSON.parse(payload);
        } catch (e) {
            return <span>{payload}</span>;
        }
    }

    if (typeof data !== 'object') {
        return <span>{String(data)}</span>;
    }

    const formatKey = (key) => {
        const result = key.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const renderValue = (val) => {
        if (val === null || val === undefined) return <span className="text-muted">N/A</span>;
        if (typeof val === 'boolean') {
            return <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>{val ? 'Yes' : 'No'}</span>;
        }
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                return (
                    <div className="d-flex flex-wrap gap-2">
                        {val.length === 0 ? <span className="text-muted">Empty</span> : null}
                        {val.map((item, idx) => (
                            <span key={idx} className="badge badge-light text-dark mr-1 mb-1">
                                {typeof item === 'object' ? (item.names || item.name || item.title || item.id || 'Item') : String(item)}
                            </span>
                        ))}
                    </div>
                );
            }
            // Object
            return (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {Object.keys(val).slice(0, 5).map(k => (
                        <div key={k} className="d-flex mb-1" style={{ overflow: 'hidden' }}>
                            <strong className="text-muted mr-2">{k}:</strong>
                            <span className="text-truncate" style={{maxWidth: '150px'}}>{typeof val[k] === 'object' ? '[Object]' : String(val[k])}</span>
                        </div>
                    ))}
                    {Object.keys(val).length > 5 && <div className="text-muted mt-1">...and {Object.keys(val).length - 5} more</div>}
                </div>
            );
        }
        // Handle dates
        if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return <span>{formatDate(val)}</span>;
        }
        return <span style={{ wordBreak: 'break-word' }}>{String(val)}</span>;
    };

    const keys = Object.keys(data).filter(k => k !== 'isDeleted' && k !== 'password' && k !== '__typename');

    return (
        <div className="row m-0">
            {keys.map(key => (
                <div key={key} className="col-md-6 mb-3 px-2">
                    <div className="d-flex flex-column">
                        <span className="text-uppercase" style={{fontSize: '0.65rem', fontWeight: 700, color: '#8a8d93', letterSpacing: '0.5px'}}>
                            {formatKey(key)}
                        </span>
                        <div className="mt-1" style={{fontSize: '0.9rem', color: '#e4e6ef', fontWeight: 500}}>
                            {renderValue(data[key])}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TimelineItem = ({ log }) => {
    const [showPayload, setShowPayload] = useState(false);
    const actionColor = {
        CREATE: '#28a745',
        UPDATE: '#007bff',
        DELETE: '#dc3545',
        ARCHIVE: '#ffc107',
        RESTORE: '#17a2b8'
    }[log.action] || '#6c757d';

    const getIcon = () => {
        switch(log.action) {
            case 'CREATE': return 'la la-plus';
            case 'UPDATE': return 'la la-edit';
            case 'DELETE': return 'la la-trash';
            case 'ARCHIVE': return 'la la-archive';
            case 'RESTORE': return 'la la-undo';
            default: return 'la la-info';
        }
    };

    return (
        <div style={{ position: 'relative', marginBottom: '30px', paddingLeft: '45px' }}>
            <div style={{
                position: 'absolute',
                left: '0px',
                top: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#fff',
                border: `3px solid ${actionColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <i className={getIcon()} style={{ fontSize: '16px', color: actionColor }}></i>
            </div>
            
            <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative'
            }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ color: actionColor, fontWeight: 700, fontSize: '1.1rem' }}>
                        {log.action} <span className="text-dark" style={{fontWeight: 500}}>{log.entity}</span>
                    </h5>
                    <span style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 500 }}>
                        <i className="la la-clock-o mr-1"></i>
                        {formatDate(log.createdAt)}
                    </span>
                </div>
                
                <div className="mb-3 d-flex align-items-center">
                    <span className="badge badge-light text-dark mr-3" style={{ padding: '8px 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="la la-user mr-1 text-primary"></i> {log.userTitle || 'System User'}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        ID: <code style={{ color: '#e83e8c', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>{log.userId || 'N/A'}</code>
                    </span>
                </div>

                {log.after && (
                    <div className="mt-3">
                        <button 
                            className="btn btn-sm btn-light" 
                            onClick={() => setShowPayload(!showPayload)}
                            style={{ fontSize: '0.8rem', fontWeight: 600, padding: '4px 10px' }}
                        >
                            <i className={`la ${showPayload ? 'la-eye-slash' : 'la-eye'} mr-1`}></i>
                            {showPayload ? 'Hide Payload' : 'View Payload'}
                        </button>
                        
                        {showPayload && (
                            <div className="mt-3" style={{ 
                                background: '#1e1e2d', 
                                padding: '15px', 
                                borderRadius: '8px',
                                maxHeight: '350px', 
                                overflowX: 'hidden',
                                overflowY: 'auto' 
                            }}>
                                <SmartPayloadViewer payload={log.after} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const LogList = ({ logs, loading, type }) => {
    return (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', height: '100%' }}>
            <div className="card-header border-0 bg-transparent pt-4 pb-0">
                <h4 style={{fontWeight: 600, color: '#434349'}}>{type === 'activity' ? 'System Activity Logs' : 'System Access Logs'}</h4>
            </div>
            <div className="card-body p-4">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading logs...</p>
                    </div>
                ) : (
                    <div style={{ position: 'relative', maxWidth: '100%', margin: '0 auto' }}>
                        {/* Vertical Line */}
                        <div style={{
                            position: 'absolute',
                            left: '15px',
                            top: '0',
                            bottom: '0',
                            width: '2px',
                            background: '#e9ecef',
                            zIndex: 1
                        }}></div>
                        
                        {logs.map(log => (
                            <TimelineItem key={log.id} log={log} />
                        ))}
                        
                        {logs.length === 0 && (
                            <div className="text-center py-5 text-muted">
                                <i className="la la-history" style={{fontSize: '48px', color: '#dee2e6'}}></i>
                                <p className="mt-3">No {type} logs recorded yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ActivityLogIndex() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data load
    if (Data.activityLogs.list().length > 0) {
      // Sort logs by newest first
      const sortedLogs = [...Data.activityLogs.list()].sort((a, b) => {
          const timeA = isNaN(a.createdAt) ? new Date(a.createdAt).getTime() : Number(a.createdAt);
          const timeB = isNaN(b.createdAt) ? new Date(b.createdAt).getTime() : Number(b.createdAt);
          return timeB - timeA;
      });
      setLogs(sortedLogs);
      setLoading(false);
    } else {
      setLoading(false);
    }

    const unsub = Data.activityLogs.subscribe(({ activityLogs }) => {
      if (activityLogs) {
        const sortedLogs = [...activityLogs].sort((a, b) => {
            const timeA = isNaN(a.createdAt) ? new Date(a.createdAt).getTime() : Number(a.createdAt);
            const timeB = isNaN(b.createdAt) ? new Date(b.createdAt).getTime() : Number(b.createdAt);
            return timeB - timeA;
        });
        setLogs(sortedLogs);
        setLoading(false);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const activityLogs = logs.filter(log => log.action !== 'LOGIN');
  const accessLogs = logs.filter(log => log.action === 'LOGIN');

  return (
    <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
        <Navbar />
        <div className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor" style={{minHeight:"100vh", backgroundColor: '#f4f6f9'}}>
          <div className="kt-container kt-grid__item kt-grid__item--fluid mt-5 mb-5">
            
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 style={{fontWeight: 700, color: '#434349'}}>System Logs</h3>
                <span className="text-muted">{logs.length} Total Logs</span>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <LogList logs={activityLogs} loading={loading} type="activity" />
                </div>
                <div className="col-md-6">
                    <LogList logs={accessLogs} loading={loading} type="access" />
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
