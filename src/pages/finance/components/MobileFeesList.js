import React from 'react';

const MobileFeesList = ({
    parents,
    expandedParentId,
    onToggleRow,
    onPrintStatement,
    onSendSms,
    onEditBBF,
    onRestoreRecord,
    renderExpandedDetails,
    maskPhone,
    loading
}) => {
    return (
        <div className={`d-flex flex-column ${loading ? 'opacity-70' : ''}`} style={{ minHeight: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                <span className="text-dark-75 font-weight-bolder" style={{ fontSize: '1.1rem' }}>Accounts Roster</span>
                <span className="label label-light-primary label-inline font-weight-bolder py-3 px-4" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>
                    {loading ? '...' : `${parents.length} Accounts`}
                </span>
            </div>
            
            <div className="d-flex flex-column" style={{ gap: '15px' }}>
                {parents.map(group => {
                    const hasArrears = group.totalBalance > 0;
                    const lastPayment = group.history.length > 0 ? group.history[0] : null;
                    const isExpanded = expandedParentId === group.id;
                    
                    return (
                        <div key={group.id} className="card card-custom shadow-sm border-0" style={{ overflow: 'hidden' }}>
                            {/* Compact Header */}
                            <div className="card-header border-0 pt-4 pb-2 px-4" style={{ minHeight: 'auto' }}>
                                <div className="d-flex justify-content-between align-items-center w-100">
                                    <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                                        <div className="symbol symbol-40 symbol-light-success mr-3 flex-shrink-0">
                                            <span className="symbol-label font-weight-boldest">{group.parent.name?.[0] || 'P'}</span>
                                        </div>
                                        <div className="d-flex flex-column text-truncate">
                                            <span className="text-dark-75 font-weight-boldest text-truncate" style={{ fontSize: '1.05rem' }}>
                                                {group.parent.name}
                                                {group.parent.isDeleted && <span className="label label-inline label-light-danger ml-2 font-size-xs px-1 py-0">Archived</span>}
                                            </span>
                                            <span className="text-muted font-size-xs font-weight-bold">{maskPhone(group.parent.phone)}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column text-right flex-shrink-0 pl-2">
                                        <span className={`font-weight-boldest ${hasArrears ? 'text-danger' : 'text-success'}`} style={{ fontSize: '1.2rem' }}>
                                            KSH {group.totalBalance.toLocaleString()}
                                        </span>
                                        <span className="text-muted text-uppercase font-weight-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Total Bal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Body: Alerts & Compact Student Breakdown */}
                            <div className="card-body py-2 px-4">
                                {/* Alerts */}
                                {group.balanceBroughtForward !== 0 && (
                                    <div className={`alert alert-custom py-1 px-3 mb-2 border-0 ${group.balanceBroughtForward > 0 ? 'bg-light-danger' : 'bg-light-success'}`} style={{ minHeight: 'auto' }}>
                                        <div className="alert-text font-size-xs d-flex align-items-center">
                                            <i className={`flaticon2-${group.balanceBroughtForward > 0 ? 'warning' : 'check-mark'} icon-sm mr-2 ${group.balanceBroughtForward > 0 ? 'text-danger' : 'text-success'}`}></i>
                                            <span className="font-weight-bolder mr-1">BBF:</span> KSH {group.balanceBroughtForward.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                                {(() => {
                                    const unallocatedSum = group.history
                                        .filter(h => h.isUnallocated && h.status === 'COMPLETED')
                                        .reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
                                    if (unallocatedSum > 0) {
                                        return (
                                            <div className="alert alert-custom bg-light-warning py-1 px-3 mb-2 border-0" style={{ minHeight: 'auto' }}>
                                                <div className="alert-text font-size-xs d-flex align-items-center">
                                                    <i className="flaticon-warning icon-sm mr-2 text-warning"></i>
                                                    <span className="font-weight-bolder mr-1">Unallocated:</span> KSH {unallocatedSum.toLocaleString()}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Student List */}
                                <div className="d-flex flex-column bg-light rounded px-3 py-2" style={{ gap: '6px' }}>
                                    {group.students.map((student, sIdx) => {
                                        const hasUnallocated = sIdx === 0 && group.history.some(h => h.isUnallocated && h.status === 'COMPLETED');
                                        return (
                                            <div key={student.id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-white last-child-no-border">
                                                <div className="d-flex flex-column text-truncate pr-2">
                                                    <span className="text-dark-75 font-weight-bold text-truncate" style={{ fontSize: '0.95rem' }}>
                                                        {student.names}
                                                    </span>
                                                    <div className="d-flex align-items-center mt-1 text-muted font-weight-bold" style={{ fontSize: '0.75rem', gap: '8px' }}>
                                                        <span className="label label-inline label-secondary font-weight-bolder" style={{ padding: '2px 6px', height: 'auto', fontSize: '0.7rem' }}>
                                                            {student.class?.name || student.studentClassId || 'No Class'}
                                                        </span>
                                                        <span>Exp: KSH {student.finances?.expected?.toLocaleString() || 0}</span>
                                                        <span className="text-success">Pd: KSH {student.finances?.paid?.toLocaleString() || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column text-right flex-shrink-0">
                                                    <span className={`font-weight-bolder ${student.finances?.balance > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '1.05rem' }}>
                                                        KSH {student.finances?.balance?.toLocaleString() || 0}
                                                    </span>
                                                    {hasUnallocated && <span className="text-warning font-weight-bold mt-1" style={{ fontSize: '0.65rem' }}>+ Unalloc</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="card-footer border-0 pt-2 pb-3 px-4 d-flex justify-content-between align-items-center bg-transparent">
                                <div className="d-flex flex-column">
                                    <span className="text-muted font-weight-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>LAST PAYMENT</span>
                                    {lastPayment ? (
                                        <span className="text-dark-75 font-weight-bold" style={{ fontSize: '0.8rem' }}>
                                            KSH {parseFloat(lastPayment.amount).toLocaleString()} <span className="text-muted font-weight-normal ml-1">on {new Date(lastPayment.time || lastPayment.createdAt).toLocaleDateString()}</span>
                                        </span>
                                    ) : (
                                        <span className="text-muted font-size-sm">None</span>
                                    )}
                                </div>
                                
                                {group.parent.isDeleted ? (
                                    <button className="btn btn-light-warning btn-sm font-weight-bold py-1 px-2" onClick={() => onRestoreRecord(group.parent.id)}>
                                        <i className="flaticon2-refresh mr-1 icon-sm"></i> Restore
                                    </button>
                                ) : (
                                    <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                                        <button 
                                            className={`btn btn-sm font-weight-bold py-1 px-3 ${isExpanded ? 'btn-light-danger' : 'btn-light-primary'}`} 
                                            onClick={() => onToggleRow(group.id)}
                                        >
                                            {isExpanded ? 'Hide Details' : 'More Details'}
                                        </button>
                                        <button className="btn btn-icon btn-light-info btn-sm" style={{ width: '30px', height: '30px' }} onClick={() => onSendSms(group)} title="Send SMS balance">
                                            <i className="flaticon2-paper-plane icon-sm"></i>
                                        </button>
                                        <button className="btn btn-icon btn-light-warning btn-sm" style={{ width: '30px', height: '30px' }} onClick={() => onEditBBF(group)} title="Edit Balance Brought Forward">
                                            <i className="flaticon2-pen icon-sm"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Expanded Details Section */}
                            {isExpanded && renderExpandedDetails && (
                                <div className="card-body bg-light-primary border-top py-4 px-3" style={{ transition: 'all 0.3s ease-in-out' }}>
                                    {renderExpandedDetails(group)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {parents.length === 0 && !loading && (
                <div className="text-center py-10 bg-light rounded text-muted font-weight-bold">
                    No accounts found matching your criteria.
                </div>
            )}
        </div>
    );
};

export default MobileFeesList;

