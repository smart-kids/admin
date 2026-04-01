import React, { useState, useEffect, useRef } from 'react';
import Data from '../../utils/data';

export default function InstitutionalDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [emailRequest, setEmailRequest] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [bankInstructions, setBankInstructions] = useState(false);

  // Form states
  const [depositForm, setDepositForm] = useState({
    amount: '',
    paymentMethod: 'bank',
    depositorName: '',
    depositorEmail: '',
    depositorPhone: '',
    reference: '',
    description: '',
    purpose: 'fees'
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const response = await Data.institutionalDeposits.getPage({
        page: 1,
        limit: 50,
        sort: { key: 'createdAt', direction: 'descending' }
      });
      setDeposits(response.deposits || []);
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    try {
      const depositData = {
        ...depositForm,
        amount: parseFloat(depositForm.amount),
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: 'institutional'
      };

      const response = await Data.institutionalDeposits.create(depositData);
      
      // Generate receipt
      const receipt = {
        ...response,
        receiptNumber: `INST-${Date.now()}`,
        processedAt: new Date().toISOString(),
        status: 'pending'
      };

      setDeposits(prev => [receipt, ...prev]);
      setShowDepositModal(false);
      setSelectedDeposit(receipt);
      setShowReceiptModal(true);
      
      // Reset form
      setDepositForm({
        amount: '',
        paymentMethod: 'bank',
        depositorName: '',
        depositorEmail: '',
        depositorPhone: '',
        reference: '',
        description: '',
        purpose: 'fees'
      });
    } catch (error) {
      console.error('Failed to create deposit:', error);
      alert('Failed to process deposit. Please try again.');
    }
  };

  const handleEmailReceipt = async () => {
    if (!selectedDeposit || !emailAddress) return;
    
    try {
      setEmailRequest(true);
      await Data.communication.email.create({
        to: emailAddress,
        subject: `Institutional Deposit Receipt - ${selectedDeposit.receiptNumber}`,
        message: generateReceiptEmail(selectedDeposit),
        attachments: [generateReceiptPDF(selectedDeposit)]
      });
      
      alert('Receipt sent successfully!');
      setEmailAddress('');
      setEmailRequest(false);
    } catch (error) {
      console.error('Failed to send receipt:', error);
      alert('Failed to send receipt. Please try again.');
      setEmailRequest(false);
    }
  };

  const generateReceiptEmail = (deposit) => {
    return `
      <h2>Institutional Deposit Receipt</h2>
      <p><strong>Receipt Number:</strong> ${deposit.receiptNumber}</p>
      <p><strong>Date:</strong> ${new Date(deposit.createdAt).toLocaleDateString()}</p>
      <p><strong>Amount:</strong> KES ${deposit.amount.toLocaleString()}</p>
      <p><strong>Depositor:</strong> ${deposit.depositorName}</p>
      <p><strong>Payment Method:</strong> ${deposit.paymentMethod}</p>
      <p><strong>Reference:</strong> ${deposit.reference}</p>
      <p><strong>Description:</strong> ${deposit.description}</p>
      <p><strong>Status:</strong> ${deposit.status}</p>
      <hr>
      <p>Thank you for your institutional deposit. This receipt serves as proof of payment.</p>
    `;
  };

  const generateReceiptPDF = (deposit) => {
    // This would generate a PDF - for now return URL
    return `/api/receipts/${deposit.receiptNumber}.pdf`;
  };

  const printReceipt = () => {
    if (!selectedDeposit) return;
    window.print();
  };

  const handleInputChange = (e) => {
    setDepositForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-10">
        <div className="spinner spinner-primary mr-3"></div>
        Loading institutional deposits...
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>{`
        .deposit-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .deposit-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          margin-bottom: 30px;
          text-align: center;
        }
        .deposit-form {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        .bank-instructions {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #007bff;
          margin-bottom: 20px;
        }
        .receipt-modal {
          background: white;
          padding: 30px;
          border-radius: 15px;
          max-width: 600px;
          margin: 50px auto;
        }
        .receipt-header {
          background: #28a745;
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin-bottom: 20px;
        }
        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-success {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .deposit-list {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .deposit-item {
          padding: 20px;
          border-bottom: 1px solid #eee;
          transition: all 0.3s ease;
        }
        .deposit-item:hover {
          background: #f8f9fa;
        }
        .amount-display {
          font-size: 1.5rem;
          font-weight: bold;
          color: #28a745;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-modal, .receipt-modal * {
            visibility: visible;
          }
          .receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="deposit-container">
        {/* Header */}
        <div className="deposit-header">
          <h1>Institutional Finance Portal</h1>
          <p>Secure and transparent institutional payment processing</p>
        </div>

        {/* Bank Deposit Instructions */}
        <div className="bank-instructions">
          <h3><i className="la la-university"></i> Bank Deposit Instructions</h3>
          <div className="row">
            <div className="col-md-6">
              <h5>Bank Details:</h5>
              <ul>
                <li><strong>Bank:</strong> Equity Bank Kenya</li>
                <li><strong>Account Name:</strong> Smart Kids School Ltd</li>
                <li><strong>Account Number:</strong> 00802934567890</li>
                <li><strong>Branch:</strong> Westlands Branch</li>
                <li><strong>Swift Code:</strong> EQBLKENA</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h5>Deposit Process:</h5>
              <ol>
                <li>Visit any Equity Bank branch</li>
                <li>Fill deposit slip with school account details</li>
                <li>Deposit cash or cheque</li>
                <li>Keep your deposit receipt</li>
                <li>Return here to record your deposit</li>
                <li>Receive official receipt instantly</li>
              </ol>
            </div>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setBankInstructions(!bankInstructions)}
          >
            {bankInstructions ? 'Hide' : 'Show'} Detailed Instructions
          </button>
        </div>

        {/* Deposit Form */}
        <div className="deposit-form">
          <h3><i className="la la-money-bill"></i> Record Institutional Deposit</h3>
          <form onSubmit={handleDepositSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Amount (KES)</label>
                  <input
                    type="number"
                    name="amount"
                    className="form-control"
                    value={depositForm.amount}
                    onChange={handleInputChange}
                    required
                    min="100"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="form-control"
                    value={depositForm.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="bank">Bank Deposit</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="cheque">Cheque</option>
                    <option value="transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Depositor Name</label>
                  <input
                    type="text"
                    name="depositorName"
                    className="form-control"
                    value={depositForm.depositorName}
                    onChange={handleInputChange}
                    required
                    placeholder="Full name of depositor"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="depositorEmail"
                    className="form-control"
                    value={depositForm.depositorEmail}
                    onChange={handleInputChange}
                    placeholder="depositor@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="depositorPhone"
                    className="form-control"
                    value={depositForm.depositorPhone}
                    onChange={handleInputChange}
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Reference Number</label>
                  <input
                    type="text"
                    name="reference"
                    className="form-control"
                    value={depositForm.reference}
                    onChange={handleInputChange}
                    placeholder="Bank slip or transaction number"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Purpose</label>
                  <select
                    name="purpose"
                    className="form-control"
                    value={depositForm.purpose}
                    onChange={handleInputChange}
                  >
                    <option value="fees">School Fees</option>
                    <option value="development">Development Fund</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="books">Books & Materials</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={depositForm.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional details about this deposit"
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button type="submit" className="btn-primary">
                <i className="la la-check-circle"></i> Process Deposit & Generate Receipt
              </button>
            </div>
          </form>
        </div>

        {/* Recent Deposits */}
        <div className="deposit-list">
          <h3><i className="la la-history"></i> Recent Institutional Deposits</h3>
          {deposits.length === 0 ? (
            <div className="text-center p-10">
              <i className="la la-inbox" style={{fontSize: '3rem', color: '#ddd'}}></i>
              <p>No deposits recorded yet</p>
            </div>
          ) : (
            deposits.map(deposit => (
              <div key={deposit.id} className="deposit-item">
                <div className="row">
                  <div className="col-md-8">
                    <h5>{deposit.depositorName}</h5>
                    <p className="text-muted">{deposit.description}</p>
                    <small className="text-muted">
                      <i className="la la-calendar"></i> {new Date(deposit.createdAt).toLocaleDateString()}
                      <span className="ml-3"><i className="la la-credit-card"></i> {deposit.paymentMethod}</span>
                    </small>
                  </div>
                  <div className="col-md-4 text-right">
                    <div className="amount-display">KES {deposit.amount.toLocaleString()}</div>
                    <span className={`badge badge-${deposit.status === 'completed' ? 'success' : 'warning'}`}>
                      {deposit.status}
                    </span>
                    <br />
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => {
                        setSelectedDeposit(deposit);
                        setShowReceiptModal(true);
                      }}
                    >
                      <i className="la la-receipt"></i> View Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedDeposit && (
        <div className="receipt-modal">
          <div className="receipt-header">
            <h2><i className="la la-check-circle"></i> Institutional Deposit Receipt</h2>
            <p>Receipt Number: {selectedDeposit.receiptNumber}</p>
          </div>
          
          <div className="receipt-body">
            <div className="row">
              <div className="col-md-6">
                <h5>Deposit Information</h5>
                <table className="table">
                  <tr><td><strong>Date:</strong></td><td>{new Date(selectedDeposit.createdAt).toLocaleDateString()}</td></tr>
                  <tr><td><strong>Amount:</strong></td><td>KES {selectedDeposit.amount.toLocaleString()}</td></tr>
                  <tr><td><strong>Depositor:</strong></td><td>{selectedDeposit.depositorName}</td></tr>
                  <tr><td><strong>Payment Method:</strong></td><td>{selectedDeposit.paymentMethod}</td></tr>
                  <tr><td><strong>Reference:</strong></td><td>{selectedDeposit.reference}</td></tr>
                  <tr><td><strong>Purpose:</strong></td><td>{selectedDeposit.purpose}</td></tr>
                </table>
              </div>
              <div className="col-md-6">
                <h5>Actions</h5>
                <div className="text-center">
                  <button className="btn-success mb-2" onClick={printReceipt}>
                    <i className="la la-print"></i> Print Receipt
                  </button>
                  <br />
                  <button className="btn-primary mb-2" onClick={() => setReviewMode(!reviewMode)}>
                    <i className="la fa-eye"></i> {reviewMode ? 'Hide' : 'Show'} Review
                  </button>
                  <br />
                  <button className="btn-secondary" onClick={() => setEmailRequest(!emailRequest)}>
                    <i className="la la-envelope"></i> Email Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Email Request Section */}
            {emailRequest && (
              <div className="mt-4 p-3" style={{background: '#f8f9fa', borderRadius: '10px'}}>
                <h5><i className="la la-envelope"></i> Send Receipt via Email</h5>
                <div className="row">
                  <div className="col-md-8">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <button className="btn-primary" onClick={handleEmailReceipt} disabled={emailRequest}>
                      {emailRequest ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Review Section */}
            {reviewMode && (
              <div className="mt-4 p-3" style={{background: '#fff3cd', borderRadius: '10px'}}>
                <h5><i className="la fa-star"></i> Receipt Review</h5>
                <div className="row">
                  <div className="col-md-6">
                    <h6>Accuracy Check</h6>
                    <div className="form-check">
                      <label className="form-check-label">
                        <input type="checkbox" /> Amount is correct
                      </label>
                    </div>
                    <div className="form-check">
                      <label className="form-check-label">
                        <input type="checkbox" /> Name is correct
                      </label>
                    </div>
                    <div className="form-check">
                      <label className="form-check-label">
                        <input type="checkbox" /> Reference matches
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Comments</h6>
                    <textarea className="form-control" rows="3" placeholder="Add review comments..."></textarea>
                    <button className="btn-success mt-2">
                      <i className="la fa-check"></i> Approve Receipt
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-4">
            <button className="btn-secondary" onClick={() => setShowReceiptModal(false)}>
              <i className="la fa-times"></i> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
