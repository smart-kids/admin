import React, { useState } from "react";
import { withRouter } from "react-router";
import MpesaPaymentModal from "./deposit"; 
import Data from "../../utils/data"; 
import moment from "moment";

// --- HELPERS ---
const getTxTime = (payment) => {
    return payment.createdAt || payment.metadata?.initiatedAt || payment.time || new Date();
};

const getCompletionTime = (payment) => {
    return payment.updatedAt || payment.metadata?.updatedAt || payment.time;
};

// --- SUB-COMPONENT: Stat Card ---
const StatCard = ({ title, value, icon, color, subtext, action }) => (
    <div className="col-md-3">
        <div className="card card-custom bg-white border-0 shadow-sm mb-4" style={{height: '100%', minHeight: '120px'}}>
            <div className="card-body p-4 d-flex flex-column justify-content-center">
                <div className="d-flex align-items-center mb-3">
                    <div className={`symbol symbol-40 symbol-light-${color} mr-3`}>
                        <span className="symbol-label">
                            <i className={`fa fa-${icon} text-${color} icon-md`}></i>
                        </span>
                    </div>
                    <div>
                        <div className="text-dark font-weight-bolder font-size-h5 mb-0">{value}</div>
                        <div className="text-muted font-size-xs font-weight-bold">{title}</div>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    {subtext && <span className={`text-${color} font-size-sm font-weight-bold opacity-70`}>{subtext}</span>}
                    {action && action}
                </div>
            </div>
        </div>
    </div>
);

// --- SUB-COMPONENT: Status Badge ---
const StatusBadge = ({ status }) => {
  const map = {
    COMPLETED: { css: 'success', label: 'Paid', icon: 'check' },
    PENDING: { css: 'primary', label: 'Processing', icon: 'spinner fa-spin' },
    FAILED: { css: 'danger', label: 'Failed', icon: 'times' },
    FAILED_ON_CALLBACK: { css: 'danger', label: 'Failed', icon: 'times' },
    CANCELLED: { css: 'warning', label: 'Cancelled', icon: 'ban' },
    FLAGGED_AMOUNT_MISMATCH: { css: 'danger', label: 'Mismatch', icon: 'exclamation-triangle' },
    FAILED_ON_INITIATION: { css: 'danger', label: 'Net Error', icon: 'wifi' }
  };
  
  const cur = map[status] || { css: 'secondary', label: status || 'Unknown', icon: 'question' };
  
  return (
    <span className={`badge badge-light-${cur.css} badge-pill font-weight-bolder px-3 py-2`}>
        <i className={`fa fa-${cur.icon} mr-1`}></i> {cur.label}
    </span>
  );
};

// --- SUB-COMPONENT: Loading Skeleton ---
const TableSkeleton = () => (
    <tr className="animated fadeIn">
        <td colSpan="7">
            <div className="d-flex align-items-center py-3">
                <div className="mr-3">
                    <div className="skeleton-box" style={{width: '35px', height: '35px', borderRadius: '50%', background: '#f3f6f9'}}></div>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                        <div className="skeleton-box mb-1" style={{width: '30%', height: '12px', background: '#f3f6f9', borderRadius: '4px'}}></div>
                        <div className="skeleton-box" style={{width: '15%', height: '12px', background: '#f3f6f9', borderRadius: '4px'}}></div>
                    </div>
                    <div className="skeleton-box" style={{width: '20%', height: '8px', background: '#f8f9fb', borderRadius: '4px'}}></div>
                </div>
            </div>
        </td>
    </tr>
);

// --- SUB-COMPONENT: Transaction Timeline (Accordion) ---
const TransactionDetails = ({ payment }) => {
    const isCompleted = payment.status === 'COMPLETED';
    const metadata = payment.metadata || {};
    const stkResponse = metadata.stkPushResponse || {};
    const resultMessage = payment.resultDesc || stkResponse.ResponseDescription || payment.errorMessage;

    return (
        <div className="row p-3">
            {/* Audit Trail */}
            <div className="col-md-7 border-right">
                <h6 className="text-uppercase text-muted font-size-xs font-weight-bold mb-4">Transaction Lifecycle</h6>
                <div className="timeline-minimal">
                    <div className="d-flex mb-4">
                        <div className="symbol symbol-35 symbol-light-primary mr-3">
                            <span className="symbol-label font-weight-bold">1</span>
                        </div>
                        <div>
                            <div className="text-dark-75 font-weight-bold">Request Initiated</div>
                            <div className="text-muted font-size-sm">System requested KES {payment.amount} from {payment.phone}.</div>
                            <div className="text-muted font-size-xs mt-1">{moment(getTxTime(payment)).format("DD MMM, hh:mm:ss A")}</div>
                        </div>
                    </div>

                    {payment.checkoutRequestID && (
                        <div className="d-flex mb-4">
                            <div className="symbol symbol-35 symbol-light-info mr-3">
                                <span className="symbol-label font-weight-bold">2</span>
                            </div>
                            <div>
                                <div className="text-dark-75 font-weight-bold">Sent to Safaricom</div>
                                <div className="text-muted font-size-sm">{metadata.stkPushResponse?.CustomerMessage || "Prompt sent to user."}</div>
                            </div>
                        </div>
                    )}

                    <div className="d-flex">
                        <div className={`symbol symbol-35 symbol-light-${isCompleted ? 'success' : 'danger'} mr-3`}>
                            <span className="symbol-label font-weight-bold">3</span>
                        </div>
                        <div>
                            <div className="text-dark-75 font-weight-bold">{isCompleted ? 'Payment Confirmed' : 'Callback Received'}</div>
                            <div className={`font-size-sm ${isCompleted ? 'text-success' : 'text-danger'}`}>
                                {resultMessage || (isCompleted ? "Transaction completed successfully." : "Transaction failed.")}
                            </div>
                            <div className="text-muted font-size-xs mt-1">
                                {getCompletionTime(payment) ? moment(getCompletionTime(payment)).format("hh:mm:ss A") : 'Pending...'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Technical Metadata */}
            <div className="col-md-5 pl-md-4 mt-3 mt-md-0">
                <h6 className="text-uppercase text-muted font-size-xs font-weight-bold mb-4">Technical Details</h6>
                <table className="table table-sm table-borderless text-muted font-size-sm">
                    <tbody>
                        <tr><td>M-Pesa Ref:</td><td className="text-right text-dark font-weight-bold text-monospace">{payment.mpesaReceiptNumber || payment.ref || "---"}</td></tr>
                        <tr><td>Checkout ID:</td><td className="text-right text-monospace text-truncate" style={{maxWidth: '150px'}} title={payment.checkoutRequestID}>{payment.checkoutRequestID || 'N/A'}</td></tr>
                        <tr><td>Result Code:</td><td className="text-right"><code>{stkResponse.ResponseCode || payment.resultCode || '...'}</code></td></tr>
                    </tbody>
                </table>
                <div className="mt-3 bg-light rounded p-2">
                    <details>
                        <summary className="text-primary font-size-xs font-weight-bold cursor-pointer">View Raw JSON</summary>
                        <pre className="mt-2 text-muted" style={{fontSize: '10px', maxHeight: '100px', overflow: 'auto'}}>{JSON.stringify(metadata, null, 2)}</pre>
                    </details>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
class PaymentsDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.modalRef = React.createRef();
    this.state = {
      payments: [],
      filteredPayments: [], 
      schoolData: null, // Stores balance info
      expandedId: null,
      searchTerm: "",
      isLoading: true
    };
  }

  componentDidMount() {
    this.collectData();
    // Subscribe to both data sources
    this.unsubscribePayments = Data.payments.subscribe(this.handleDataUpdate);
    this.unsubscribeSchools = Data.schools.subscribe(this.handleDataUpdate);
  }

  componentWillUnmount() {
    if (this.unsubscribePayments) this.unsubscribePayments();
    if (this.unsubscribeSchools) this.unsubscribeSchools();
  }

  collectData = () => {
    const allPayments = Data.payments.list() || [];
    const rawPayments = allPayments.filter(p => p.type === 'bulksms' || p.metadata?.type === 'bulksms');
    const schoolData = Data.schools.getSelected();

    // Smart Loading Logic
    const isActuallyLoading = allPayments.length === 0 && (!schoolData || !schoolData.id);

    const sortedPayments = [...rawPayments].sort((a, b) => {
        const timeA = new Date(getTxTime(a));
        const timeB = new Date(getTxTime(b));
        return timeB - timeA;
    });

    this.setState(prevState => ({
      payments: sortedPayments,
      schoolData: schoolData,
      filteredPayments: this.filterPayments(sortedPayments, prevState.searchTerm),
      isLoading: isActuallyLoading
    }));
  }

  handleDataUpdate = () => {
    this.collectData();
  };

  filterPayments = (list, term) => {
    if (!term) return list;
    const lower = term.toLowerCase();
    return list.filter(p => 
      (p.phone || '').includes(lower) ||
      (p.mpesaReceiptNumber || p.ref || '').toLowerCase().includes(lower) ||
      (p.status || '').toLowerCase().includes(lower)
    );
  };

  onSearch = e => {
    const searchTerm = e.target.value;
    this.setState({ 
      searchTerm, 
      filteredPayments: this.filterPayments(this.state.payments, searchTerm) 
    });
  };

  toggleRow = (id) => {
    this.setState(prev => ({
      expandedId: prev.expandedId === id ? null : id
    }));
  };

  // --- Calculations for Top Cards ---
  getMetrics = () => {
    const { payments, schoolData } = this.state;
    
    // 1. Balance (From School Data)
    const currentBalance = schoolData?.financial?.balance || 0;
    
    // 2. Total Collected (From Payments History)
    const totalCollected = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 3. SMS Estimate
    const smsCost = 2.0;
    const smsCapacity = Math.floor(currentBalance / smsCost);

    // 4. Success Rate
    const totalTx = payments.length;
    const successTx = payments.filter(p => p.status === 'COMPLETED').length;
    const successRate = totalTx > 0 ? Math.round((successTx / totalTx) * 100) : 0;

    return { currentBalance, totalCollected, smsCapacity, successRate };
  }

  render() {
    const { filteredPayments, expandedId, searchTerm, isLoading } = this.state;
    const metrics = this.getMetrics();

    return (
      <div className="d-flex flex-column">
        
        {/* === TOP METRICS ROW === */}
        <div className="row mb-2">
            <StatCard 
                title="Wallet Balance" 
                value={`KES ${metrics.currentBalance.toLocaleString()}`} 
                icon="wallet" 
                color="success"
                subtext="Available Funds"
                action={
                    <button className="btn btn-xs btn-light-success font-weight-bold" onClick={() => this.modalRef.current.show()}>Top Up</button>
                }
            />
            <StatCard 
                title="SMS Capacity" 
                value={`~${metrics.smsCapacity.toLocaleString()}`} 
                icon="comment-alt" 
                color="primary"
                subtext="Messages Left"
            />
            <StatCard 
                title="Total Deposits" 
                value={`KES ${metrics.totalCollected.toLocaleString()}`} 
                icon="piggy-bank" 
                color="info"
                subtext="Lifetime Collected"
            />
            <StatCard 
                title="Payment Success" 
                value={`${metrics.successRate}%`} 
                icon="chart-line" 
                color={metrics.successRate > 80 ? 'success' : 'warning'}
                subtext="Conversion Rate"
            />
        </div>

        {/* === MAIN TABLE PORTLET === */}
        <div className="kt-portlet kt-portlet--mobile shadow-sm">
            <div className="kt-portlet__head border-bottom-0 pt-4">
            <div className="kt-portlet__head-label">
                <span className="kt-portlet__head-icon"><i className="flaticon2-list-3 text-dark"></i></span>
                <h3 className="kt-portlet__head-title font-weight-bolder text-dark">
                Transactions
                <small className="text-muted ml-2">Live M-Pesa Feed</small>
                </h3>
            </div>
            <div className="kt-portlet__head-toolbar">
                <button className="btn btn-brand btn-sm font-weight-bold btn-elevate" onClick={() => this.modalRef.current.show()}>
                <i className="fa fa-plus mr-1"></i> New Deposit
                </button>
            </div>
            </div>

            <div className="kt-portlet__body pt-2">
            {/* SEARCH */}
            <div className="mb-4 d-flex align-items-center">
                <div className="input-icon input-icon-right" style={{width: '300px'}}>
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search phone, ref..." 
                    value={searchTerm}
                    onChange={this.onSearch}
                    style={{background: '#f3f6f9', border: 'none'}}
                />
                <span className="input-icon__icon input-icon__icon--right">
                    <span><i className="la la-search"></i></span>
                </span>
                </div>
            </div>

            {/* TABLE */}
            <div className="table-responsive">
                <table className="table table-hover table-vertical-center">
                <thead className="thead-light">
                    <tr className="text-uppercase text-muted font-size-sm letter-spacing-1">
                    <th style={{width: '50px'}}>#</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Payer</th>
                    <th>Reference</th>
                    <th className="text-right">Time</th>
                    <th style={{width: '50px'}}></th>
                    </tr>
                </thead>
                <tbody>
                    
                    {isLoading && (
                        <>
                        <TableSkeleton />
                        <TableSkeleton />
                        <TableSkeleton />
                        </>
                    )}

                    {!isLoading && filteredPayments.map((payment, index) => {
                        const isExpanded = expandedId === payment.id;
                        const isFraud = payment.status === 'FLAGGED_AMOUNT_MISMATCH';
                        const txTime = getTxTime(payment);
                        
                        return (
                            <React.Fragment key={payment.id}>
                                <tr 
                                    onClick={() => this.toggleRow(payment.id)} 
                                    style={{
                                        cursor: 'pointer', 
                                        backgroundColor: isExpanded ? '#f8f9fb' : 'transparent', 
                                        borderLeft: isFraud ? '4px solid #fd3995' : 'none'
                                    }}
                                >
                                    <td className="text-muted font-size-xs">{index + 1}</td>
                                    <td><StatusBadge status={payment.status} /></td>
                                    <td>
                                        <span className="text-dark font-weight-bolder font-size-lg">
                                            KES {payment.amount}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-dark-75 font-weight-bold d-block">{payment.phone}</span>
                                        <span className="text-muted font-size-xs">
                                            {payment.checkoutRequestID ? 'Automated' : 'Manual'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-dark-50 font-weight-bold font-monospace">
                                            {payment.mpesaReceiptNumber || payment.ref || '---'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <span className="text-muted font-weight-bold font-size-sm">
                                            {moment(txTime).fromNow()}
                                        </span>
                                    </td>
                                    <td className="text-center text-muted">
                                        <i className={`fa fa-chevron-${isExpanded ? 'up' : 'down'} font-size-xs`}></i>
                                    </td>
                                </tr>

                                {isExpanded && (
                                    <tr className="animated fadeIn">
                                        <td colSpan="7" className="p-0 bg-white" style={{borderTop: 'none', borderBottom: '2px solid #f0f3ff'}}>
                                            <TransactionDetails payment={payment} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {!isLoading && filteredPayments.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center text-muted py-5">
                                <span className="d-block font-size-lg">No transactions found</span>
                                <span className="font-size-sm">Try adjusting your search or create a new deposit.</span>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
            </div>

            <MpesaPaymentModal 
                ref={this.modalRef} 
                onPaymentSuccess={this.handleDataUpdate} // Refresh data on success
            />
        </div>
      </div>
    );
  }
}

export default withRouter(PaymentsDashboard);