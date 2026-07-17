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
                                maxHeight: '250px', 
                                overflowY: 'auto' 
                            }}>
                                <pre className="mb-0" style={{ color: '#a2a5b9', fontSize: '0.85rem', margin: 0 }}>
                                    <code>{JSON.stringify(log.after, null, 2)}</code>
                                </pre>
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

  return (
    <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
        <Navbar />
        <div className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor" style={{height:"100vh", backgroundColor: '#f4f6f9'}}>
          <div className="kt-container kt-grid__item kt-grid__item--fluid mt-5 mb-5">
            
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 style={{fontWeight: 700, color: '#434349'}}>System Activity Log</h3>
                <span className="text-muted">{logs.length} Total Activities</span>
            </div>

            <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <div className="card-body p-5">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">Loading activity logs...</p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
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
                                    <p className="mt-3">No activity logs recorded yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
