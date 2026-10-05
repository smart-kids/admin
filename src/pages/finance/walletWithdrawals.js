import React, { useState, useEffect } from 'react';
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import Footer from "../../components/footer";
import DataPromise from '../../utils/data';
import { Modal } from 'react-bootstrap';

const WALLET_REQUESTS_QUERY = `
  query GetAllWithdrawalRequests {
    wallet {
      allWithdrawalRequests {
        id
        amount
        status
        adminRemarks
        createdAt
        teacher {
          id
          name
        }
        wallet {
          id
          balance
          totalEarned
        }
      }
    }
  }
`;

const PROCESS_WITHDRAWAL_MUTATION = `
  mutation ProcessWithdrawal($requestId: String!, $status: String!, $remarks: String) {
    wallet {
      processWithdrawal(requestId: $requestId, status: $status, remarks: $remarks) {
        id
        status
      }
    }
  }
`;

export default function WalletWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [processStatus, setProcessStatus] = useState('PAID');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const ds = await DataPromise;
      const res = await ds.query(WALLET_REQUESTS_QUERY);
      if (res && res.wallet && res.wallet.allWithdrawalRequests) {
        setRequests(res.wallet.allWithdrawalRequests);
      }
    } catch (err) {
      console.error(err);
      if (window.toastr) window.toastr.error("Failed to load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (e) => {
    if(e) e.preventDefault();
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const ds = await DataPromise;
      await ds.query(PROCESS_WITHDRAWAL_MUTATION, {
        requestId: selectedRequest.id,
        status: processStatus,
        remarks: remarks
      });
      if (window.toastr) window.toastr.success("Request processed successfully.");
      setModalVisible(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      if (window.toastr) window.toastr.error(err.message || "Failed to process request.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
      if (status === 'PENDING') return <span className="kt-badge kt-badge--warning kt-badge--inline kt-badge--pill">Pending</span>;
      if (status === 'PAID') return <span className="kt-badge kt-badge--success kt-badge--inline kt-badge--pill">Paid</span>;
      return <span className="kt-badge kt-badge--danger kt-badge--inline kt-badge--pill">{status}</span>;
  };

  return (
    <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
      <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
        <Navbar />
        <Subheader links={["Finance", "Teacher Withdrawals"]} />

        <div className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor" id="kt_content" style={{ minHeight: "100vh" }}>
          <div className="kt-container kt-grid__item kt-grid__item--fluid">
            
            <div className="kt-portlet kt-portlet--mobile">
                <div className="kt-portlet__head kt-portlet__head--lg">
                    <div className="kt-portlet__head-label">
                        <span className="kt-portlet__head-icon">
                            <i className="kt-font-brand flaticon-coins" />
                        </span>
                        <h3 className="kt-portlet__head-title">Teacher Wallet Withdrawals</h3>
                    </div>
                </div>

                <div className="kt-portlet__body">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-brand" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-hover table-checkable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Teacher</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(record => (
                                        <tr key={record.id}>
                                            <td>{new Date(Number(record.createdAt)).toLocaleString()}</td>
                                            <td>{record.teacher ? record.teacher.name : 'Unknown'}</td>
                                            <td>{record.amount ? `KES ${record.amount.toFixed(2)}` : '0.00'}</td>
                                            <td>{getStatusBadge(record.status)}</td>
                                            <td>{record.adminRemarks || '-'}</td>
                                            <td>
                                                {record.status === 'PENDING' && (
                                                    <button 
                                                        className="btn btn-sm btn-brand btn-elevate"
                                                        onClick={() => {
                                                            setSelectedRequest(record);
                                                            setProcessStatus('PAID');
                                                            setRemarks('');
                                                            setModalVisible(true);
                                                        }}
                                                    >
                                                        Process
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center">No withdrawal requests found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
        <Footer />
      </div>

      {modalVisible && selectedRequest && (
        <Modal show onHide={() => !processing && setModalVisible(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Process Withdrawal</Modal.Title>
            </Modal.Header>
            <form onSubmit={handleProcess}>
                <Modal.Body>
                    <div className="form-group row">
                        <label className="col-4 col-form-label"><strong>Teacher:</strong></label>
                        <div className="col-8">
                            <span className="form-control-plaintext">{selectedRequest.teacher?.name}</span>
                        </div>
                    </div>
                    <div className="form-group row">
                        <label className="col-4 col-form-label"><strong>Amount:</strong></label>
                        <div className="col-8">
                            <span className="form-control-plaintext">KES {selectedRequest.amount.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Action</label>
                        <select 
                            className="form-control" 
                            value={processStatus} 
                            onChange={(e) => setProcessStatus(e.target.value)}
                        >
                            <option value="PAID">Approve & Mark as Paid</option>
                            <option value="REJECTED">Reject & Refund</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Admin Remarks (Optional)</label>
                        <textarea 
                            className="form-control" 
                            rows="4" 
                            value={remarks} 
                            onChange={(e) => setRemarks(e.target.value)} 
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)} disabled={processing}>Cancel</button>
                    <button type="submit" className="btn btn-brand" disabled={processing}>
                        {processing ? 'Processing...' : 'Submit'}
                    </button>
                </Modal.Footer>
            </form>
        </Modal>
      )}
    </div>
  );
}
