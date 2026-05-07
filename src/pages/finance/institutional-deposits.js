import React, { Component } from "react";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import Footer from "../../components/footer";
import Data from "../../utils/data";
import ErrorToast from "../finance/components/error-toast";
import SuccessToast from "../schools/components/success-toast";

// Initialize toast instances
const errorToast = new ErrorToast();
const successToast = new SuccessToast();

// Generate unique modal ID
const billingModalNumber = Math.random().toString().split(".")[1];

// --- HELPER COMPONENTS ---

const SkeletonLoader = () => (
    <div className="p-7">
        <div className="d-flex justify-content-between mb-8">
            <div className="skeleton-line rounded" style={{width: '250px', height: '30px', backgroundColor: '#f3f6f9'}}></div>
            <div className="d-flex justify-content-end">
                <div className="skeleton-line rounded mr-2" style={{width: '120px', height: '30px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '120px', height: '30px', backgroundColor: '#f3f6f9'}}></div>
            </div>
        </div>
        {[1,2,3,4,5].map(i => (
            <div key={i} className="d-flex justify-content-between py-6 border-bottom mb-2 align-items-center">
                <div className="skeleton-line rounded" style={{width: '18%', height: '40px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '15%', height: '20px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '10%', height: '20px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '10%', height: '20px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '10%', height: '30px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '15%', height: '20px', backgroundColor: '#f3f6f9'}}></div>
                <div className="skeleton-line rounded" style={{width: '12%', height: '30px', backgroundColor: '#f3f6f9'}}></div>
            </div>
        ))}
        <style>{`
            .skeleton-line { animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 0.4; } 100% { opacity: 0.8; } }
        `}</style>
    </div>
);

const Pagination = ({ total, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) return null;

    let pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className="d-flex justify-content-center mt-4">
            <nav>
                <ul className="pagination">
                    {start > 1 && (
                        <li className="page-item">
                            <button className="page-link" onClick={() => onPageChange(start - 1)}>←</button>
                        </li>
                    )}
                    {pages.map(page => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
                        </li>
                    ))}
                    {end < totalPages && (
                        <li className="page-item">
                            <button className="page-link" onClick={() => onPageChange(end + 1)}>→</button>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
};

// --- MAIN COMPONENT ---

class InstitutionalDeposits extends Component {
    state = {
        invoices: [],
        loading: false,
        currentPage: 1,
        itemsPerPage: 10,
        totalInvoices: 13,
        showInvoiceModal: false,
        selectedInvoice: null,
        showEmailModal: false,
        emailRecipient: '',
        emailSubject: '',
        emailMessage: '',
        showPrintView: false,
        printInvoice: null,
        schoolInfo: null,
        showCreateInvoiceModal: false,
        showBillingModal: false,
        showBankPaymentModal: false,
        showBankConfirmationModal: false,
        billingPhone: '',
        paymentMethod: 'mpesa', // 'mpesa' or 'bank'
        bankPaymentDetails: {
            bankName: 'Family Bank',
            accountName: 'Shule Plus',
            accountNumber: '024000062139',
            branch: 'Ruiru Branch',
            swiftCode: 'FABLKENA'
        },
        bankPaymentIdentifier: '',
        currentUser: null,
        isSuperAdmin: false,
        selectedSchool: null,
        newInvoice: {
            amount: '',
            description: '',
            schoolId: '',
            dueDate: ''
        }
    };

    componentDidMount() {
        // Get current user and check role
        const userData = JSON.parse(localStorage.getItem("user")) || {};
        const isSuperAdmin = userData.userType === 'super_admin' || userData.userType === 'superadmin' || userData.role === 'super_admin' || userData.isSuperAdmin;
        const savedBillingPhone = localStorage.getItem('billingPhone') || '';
        const savedPaymentMethod = localStorage.getItem('paymentMethod') || 'mpesa';
        
        // Get selected school
        const selectedSchool = Data.schools.getSelected();
        
        this.setState({ 
            currentUser: userData,
            isSuperAdmin: isSuperAdmin,
            billingPhone: savedBillingPhone,
            paymentMethod: savedPaymentMethod,
            selectedSchool: selectedSchool
        });
        
        // Subscribe to school changes
        this.schoolsSubscription = Data.schools.subscribe(({ selectedSchool }) => {
            this.setState({ selectedSchool });
        });
        
        // Simulate loading
        setTimeout(() => {
            this.setState({ loading: false });
        }, 1000);
    }

    componentWillUnmount() {
        if (this.schoolsSubscription) {
            this.schoolsSubscription();
        }
    }

    handlePageChange = (page) => {
        this.setState({ currentPage: page });
    };

    handleViewInvoice = (invoice) => {
        this.setState({ selectedInvoice: invoice, showInvoiceModal: true });
    };

    togglePrintView = () => {
        this.setState(prev => ({ showPrintView: !prev.showPrintView }));
    };

    handlePrint = () => {
        window.print();
    };

    handlePrintInvoice = (invoice) => {
        this.setState({ printInvoice: invoice, showPrintView: true });
    };

    handleEmailInvoice = (invoice) => {
        this.setState({ 
            selectedInvoice: invoice, 
            showEmailModal: true,
            emailSubject: `Invoice ${invoice.id} - Smart Kids School`,
            emailMessage: `Please find attached invoice ${invoice.id} for ${invoice.amount} dated ${invoice.created}.`
        });
    };

    handleSendEmail = () => {
        const { selectedInvoice, emailRecipient, emailSubject, emailMessage } = this.state;
        
        // Simulate sending email
        alert(`Invoice ${selectedInvoice.id} has been sent to ${emailRecipient}`);
        
        this.setState({ 
            showEmailModal: false, 
            emailRecipient: '', 
            emailSubject: '', 
            emailMessage: '',
            selectedInvoice: null
        });
    };

    handleCreateInvoice = () => {
        this.setState({ showCreateInvoiceModal: true });
    };

    handleSaveInvoice = () => {
        const { newInvoice, invoices } = this.state;
        
        if (!newInvoice.amount || !newInvoice.description || !newInvoice.dueDate) {
            errorToast.show({ message: 'Please fill in all required fields' });
            return;
        }

        const invoiceId = Date.now().toString();
        const createdDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const invoice = {
            id: invoiceId,
            status: 'Unpaid',
            created: createdDate,
            amount: `KES ${parseInt(newInvoice.amount).toLocaleString()}`,
            description: newInvoice.description,
            dueDate: new Date(newInvoice.dueDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            schoolId: newInvoice.schoolId || 'school_001'
        };

        this.setState({ 
            invoices: [invoice, ...invoices],
            totalInvoices: invoices.length + 1,
            showCreateInvoiceModal: false,
            newInvoice: {
                amount: '',
                description: '',
                schoolId: '',
                dueDate: ''
            }
        });

        successToast.show({ 
            message: `Invoice ${invoiceId} created successfully!`,
            header: 'Invoice Created'
        });
    };

    handlePayInvoice = (invoice) => {
        const paymentMethod = this.state.paymentMethod || localStorage.getItem('paymentMethod') || 'mpesa';
        const billingPhone = this.state.billingPhone || localStorage.getItem('billingPhone') || '';
        
        if (paymentMethod === 'mpesa' && !billingPhone) {
            errorToast.show({ message: 'Please set up your M-Pesa billing number first' });
            this.handleManageBilling();
            return;
        }
        
        if (paymentMethod === 'bank') {
            this.setState({ selectedInvoice: invoice, showBankPaymentModal: true });
        } else {
            this.setState({ selectedInvoice: invoice, showPaymentModal: true });
        }
    };

    handleConfirmPayment = () => {
        const { selectedInvoice, billingPhone } = this.state;
        
        if (!billingPhone || billingPhone.length < 10) {
            errorToast.show({ message: 'Please enter a valid M-Pesa phone number' });
            return;
        }

        // Simulate M-Pesa STK Push
        successToast.show({ 
            message: `M-Pesa payment of ${selectedInvoice.amount} initiated to ${billingPhone}. Please check your phone for the STK push prompt.`,
            header: 'Payment Initiated'
        });

        this.setState({ showPaymentModal: false });
    };


    handlePayWithSavedCard = (cardId) => {
        // For now, just show a success message with the card used
        const cardName = cardId === 'visa_4242' ? 'Visa ending in 4242' : 'Mastercard ending in 8888';
        
        successToast.show({ 
            message: `Payment initiated with ${cardName}. You will be redirected to the secure payment gateway.`,
            header: 'Card Payment'
        });
        
        // Close bank payment modal after initiating card payment
        this.setState({ showBankPaymentModal: false });
    };

    handleBankPaymentSubmit = () => {
        const { bankPaymentIdentifier, selectedInvoice } = this.state;
        
        if (!bankPaymentIdentifier || !bankPaymentIdentifier.trim()) {
            errorToast.show({ message: 'Please enter the transaction reference number' });
            return;
        }
        
        // Update invoice with bank payment pending status
        const updatedInvoices = this.state.invoices.map(inv => {
            if (inv.id === selectedInvoice.id) {
                return { 
                    ...inv, 
                    status: 'Pending Confirmation',
                    paymentMethod: 'bank',
                    paymentIdentifier: bankPaymentIdentifier.trim(),
                    paymentDate: new Date().toISOString()
                };
            }
            return inv;
        });

        this.setState({ 
            invoices: updatedInvoices,
            showBankPaymentModal: false,
            selectedInvoice: null,
            bankPaymentIdentifier: ''
        });

        successToast.show({ 
            message: `Bank payment reference ${bankPaymentIdentifier} submitted. Awaiting admin confirmation.`,
            header: 'Payment Submitted'
        });
    };

    handleConfirmBankPayment = (invoice) => {
        // Update invoice status to Paid
        const updatedInvoices = this.state.invoices.map(inv => {
            if (inv.id === invoice.id) {
                return { 
                    ...inv, 
                    status: 'Paid',
                    confirmedBy: this.state.currentUser?.name || 'Super Admin',
                    confirmedDate: new Date().toISOString()
                };
            }
            return inv;
        });

        this.setState({ 
            invoices: updatedInvoices
        });

        successToast.show({ 
            message: `Payment for invoice ${invoice.id} confirmed successfully!`,
            header: 'Payment Confirmed'
        });
    };

    handleCardPayment = () => {
        // For now, just show a success message - in real implementation this would integrate with a payment gateway
        successToast.show({ 
            message: 'Card payment initiated. You will be redirected to the secure payment gateway.',
            header: 'Card Payment'
        });
        
        // Close billing modal after initiating card payment
        this.setState({ showBillingModal: false });
    };

    handleManageBilling = () => {
        this.setState({ showBillingModal: true });
    };

    handleSaveBillingDetails = () => {
        const { billingPhone, paymentMethod, selectedSchool } = this.state;
        
        if (paymentMethod === 'mpesa' && (!billingPhone || !billingPhone.trim())) {
            errorToast.show({ message: 'Please enter a valid M-Pesa phone number' });
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('paymentMethod', paymentMethod);
        if (paymentMethod === 'mpesa') {
            localStorage.setItem('billingPhone', billingPhone.trim());
        }
        
        // Update school data if available
        if (selectedSchool) {
            Data.schools.update({
                id: selectedSchool.id,
                phone: paymentMethod === 'mpesa' ? billingPhone.trim() : selectedSchool.phone,
                paymentMethod: paymentMethod
            });
        }
        
        this.setState({ 
            billingPhone: paymentMethod === 'mpesa' ? billingPhone.trim() : billingPhone,
            showBillingModal: false 
        });
        
        successToast.show({ 
            message: `${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Transfer'} payment method saved successfully!`,
            header: 'Payment Settings Updated'
        });
    };

    renderBillingInfo = () => {
        const { isSuperAdmin, billingPhone } = this.state;
        
        return (
            <div className="row mb-6">
                <div className="col-12">
                    <div className="kt-portlet kt-portlet--height-fluid">
                        <div className="kt-portlet__head kt-portlet__head--noborder">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">
                                    <i className="la la-info-circle"></i> Billing Management
                                </h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <div className="alert alert-info">
                                <p className="mb-2">
                                    We've moved your billing period to start on the 1st of each month. 
                                    Your previous billing period was closed and invoiced, so you may have just received an invoice for it. 
                                    Your next invoice will be issued on the 1st of next month.
                                </p>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="kt-font-bold">Billing & payment methods</h5>
                                    <p className="kt-font-sm text-muted">
                                        Manage your payment methods, billing address, invoices, and VAT details
                                    </p>
                                    {billingPhone && (
                                        <p className="kt-font-sm text-success">
                                            <i className="la la-phone"></i> Billing Phone: {billingPhone}
                                        </p>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    {!isSuperAdmin && (
                                        <button className="btn btn-label-brand btn-bold" onClick={this.handleManageBilling}>
                                            <i className="la la-cog"></i> Manage billing
                                        </button>
                                    )}
                                    {isSuperAdmin && (
                                        <button className="btn btn-success btn-bold" onClick={this.handleCreateInvoice}>
                                            <i className="la la-plus"></i> Create Invoice
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderInvoiceModal = () => {
        const { selectedInvoice, showInvoiceModal } = this.state;
        
        if (!showInvoiceModal || !selectedInvoice) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="la la-file-invoice"></i> Invoice #{selectedInvoice.id}
                            </h4>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showInvoiceModal: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="invoice-preview">
                                <div className="text-center mb-4">
                                    <h3>SHULE PLUS</h3>
                                    <p className="text-muted">Invoice # {selectedInvoice.id}</p>
                                </div>
                                
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h6>Invoice Details</h6>
                                        <p><strong>Invoice Number:</strong> {selectedInvoice.id}</p>
                                        <p><strong>Date Created:</strong> {selectedInvoice.created}</p>
                                        <p><strong>Due Date:</strong> {selectedInvoice.created}</p>
                                    </div>
                                    <div className="col-md-6 text-right">
                                        <h6>Amount Due</h6>
                                        <h2 className="text-success">{selectedInvoice.amount}</h2>
                                        <span className="badge badge-success">{selectedInvoice.status}</span>
                                    </div>
                                </div>
                                
                                <div className="table-responsive mb-4">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Monthly Subscription - Smart Kids School</td>
                                                <td className="text-right">{selectedInvoice.amount}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total</strong></td>
                                                <td className="text-right"><strong>{selectedInvoice.amount}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="text-center text-muted">
                                    <p>Thank you for your business!</p>
                                    <p>For questions, please contact billing@smartkids.school</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({ showInvoiceModal: false })}
                            >
                                Close
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={() => this.handlePrintInvoice(selectedInvoice)}
                            >
                                <i className="la la-print"></i> Print
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-success"
                                onClick={() => {
                                    this.setState({ showInvoiceModal: false });
                                    this.handleEmailInvoice(selectedInvoice);
                                }}
                            >
                                <i className="la la-envelope"></i> Send Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderEmailModal = () => {
        const { showEmailModal, emailRecipient, emailSubject, emailMessage } = this.state;
        
        if (!showEmailModal) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="la la-envelope"></i> Send Invoice via Email
                            </h4>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showEmailModal: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Email Recipient</label>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="Enter email address"
                                    value={emailRecipient}
                                    onChange={(e) => this.setState({ emailRecipient: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={emailSubject}
                                    onChange={(e) => this.setState({ emailSubject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea 
                                    className="form-control" 
                                    rows="4"
                                    value={emailMessage}
                                    onChange={(e) => this.setState({ emailMessage: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({ showEmailModal: false })}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-success"
                                onClick={this.handleSendEmail}
                                disabled={!emailRecipient}
                            >
                                <i className="la la-paper-plane"></i> Send Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderBillingModal = () => {
        const { showBillingModal, billingPhone, selectedSchool } = this.state;
        
        if (!showBillingModal) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid #f3f4f6', padding: '24px 32px' }}>
                            <h5 className="modal-title" style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                <i className="flaticon2-settings text-primary mr-3" style={{ fontSize: '24px' }}></i>
                                Billing Management
                            </h5>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showBillingModal: false })}
                                style={{ fontSize: '24px', color: '#6b7280', background: 'none', border: 'none', padding: '0' }}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                           
                            
                            <div className="form-group mb-4">
                               
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className={`payment-method-card ${this.state.paymentMethod === 'mpesa' ? 'selected' : ''}`} onClick={() => this.setState({ paymentMethod: 'mpesa' })}>
                                            <div className="payment-method-header">
                                                <div className={`payment-radio ${this.state.paymentMethod === 'mpesa' ? 'checked' : ''}`}>
                                                    <span className="radio-inner"></span>
                                                </div>
                                                <div className="payment-icon">
                                                    <i className="flaticon2-smart-phone"></i>
                                                </div>
                                                <div className="payment-title">
                                                    <h6 className="mb-0">M-Pesa</h6>
                                                    <small className="text-muted">Instant mobile payments</small>
                                                </div>
                                            </div>
                                            <div className="payment-method-body">
                                                <ul className="list-unstyled mb-0">
                                                    <li className="d-flex align-items-center mb-1">
                                                        <i className="flaticon2-check-mark text-success mr-2"></i>
                                                        <small>Instant confirmation</small>
                                                    </li>
                                                    <li className="d-flex align-items-center">
                                                        <i className="flaticon2-check-mark text-success mr-2"></i>
                                                        <small>Mobile money transfer</small>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className={`payment-method-card ${this.state.paymentMethod === 'bank' ? 'selected' : ''}`} onClick={() => this.setState({ paymentMethod: 'bank' })}>
                                            <div className="payment-method-header">
                                                <div className={`payment-radio ${this.state.paymentMethod === 'bank' ? 'checked' : ''}`}>
                                                    <span className="radio-inner"></span>
                                                </div>
                                                <div className="payment-icon">
                                                    <i className="flaticon2-bank"></i>
                                                </div>
                                                <div className="payment-title">
                                                    <h6 className="mb-0">Bank Transfer</h6>
                                                    <small className="text-muted">Direct bank deposit</small>
                                                </div>
                                            </div>
                                            <div className="payment-method-body">
                                                <ul className="list-unstyled mb-0">
                                                    <li className="d-flex align-items-center mb-1">
                                                        <i className="flaticon2-check-mark text-success mr-2"></i>
                                                        <small>Bank account transfer</small>
                                                    </li>
                                                    <li className="d-flex align-items-center">
                                                        <i className="flaticon2-check-mark text-success mr-2"></i>
                                                        <small>Admin confirmation required</small>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <style jsx>{`
                                    .payment-method-card {
                                        border: 2px solid #e5e7eb;
                                        border-radius: 12px;
                                        padding: 16px;
                                        cursor: pointer;
                                        transition: all 0.3s ease;
                                        background: white;
                                        position: relative;
                                        overflow: hidden;
                                    }
                                    
                                    .payment-method-card:hover {
                                        border-color: #3699ff;
                                        box-shadow: 0 4px 12px rgba(54, 153, 255, 0.15);
                                        transform: translateY(-2px);
                                    }
                                    
                                    .payment-method-card.selected {
                                        border-color: #3699ff;
                                        background: #f8fbff;
                                        box-shadow: 0 6px 20px rgba(54, 153, 255, 0.25);
                                    }
                                    
                                    .payment-method-header {
                                        display: flex;
                                        align-items: center;
                                        margin-bottom: 12px;
                                    }
                                    
                                    .payment-radio {
                                        width: 20px;
                                        height: 20px;
                                        border: 2px solid #d1d5db;
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                        transition: all 0.3s ease;
                                    }
                                    
                                    .payment-radio.checked {
                                        border-color: #3699ff;
                                        background: #3699ff;
                                    }
                                    
                                    .radio-inner {
                                        width: 8px;
                                        height: 8px;
                                        background: white;
                                        border-radius: 50%;
                                        opacity: 0;
                                        transition: opacity 0.3s ease;
                                    }
                                    
                                    .payment-radio.checked .radio-inner {
                                        opacity: 1;
                                    }
                                    
                                    .payment-icon {
                                        width: 40px;
                                        height: 40px;
                                        background: #3699ff;
                                        border-radius: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin-right: 12px;
                                    }
                                    
                                    .payment-icon i {
                                        color: white;
                                        font-size: 18px;
                                    }
                                    
                                    .payment-title {
                                        flex: 1;
                                    }
                                    
                                    .payment-method-card.selected .payment-icon {
                                        background: #3699ff;
                                        box-shadow: 0 4px 12px rgba(54, 153, 255, 0.3);
                                    }
                                `}</style>
                            </div>
                            
                            {this.state.paymentMethod === 'bank' ? (
                                <div className="form-group mb-4">
                                    <label className="font-weight-bold text-dark">
                                        <i className="flaticon2-bank mr-2"></i>
                                        Bank Transfer Details
                                    </label>
                                    <div className="row">
                                        <div className="col-md-7">
                                            <div className="bg-light p-3 rounded">
                                                <div className="font-size-sm text-dark mb-2">
                                                    <strong>Bank:</strong> {this.state.bankPaymentDetails.bankName}
                                                </div>
                                                <div className="font-size-sm text-dark mb-2">
                                                    <strong>Account Name:</strong> {this.state.bankPaymentDetails.accountName}
                                                </div>
                                                <div className="font-size-sm text-dark mb-2">
                                                    <strong>Account Number:</strong> {this.state.bankPaymentDetails.accountNumber}
                                                </div>
                                                <div className="font-size-sm text-dark mb-2">
                                                    <strong>Branch:</strong> {this.state.bankPaymentDetails.branch}
                                                </div>
                                                <div className="font-size-sm text-dark">
                                                    <strong>SWIFT Code:</strong> {this.state.bankPaymentDetails.swiftCode}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5">
                                            <label className="font-weight-bold text-dark mb-2">
                                                <i className="flaticon2-credit-card mr-2"></i>
                                                Card Payment
                                            </label>
                                            <div className="bg-light p-3 rounded">
                                                <div className="form-group mb-3">
                                                    <small className="text-muted">Card Number</small>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="1234 5678 9012 3456"
                                                        maxLength={19}
                                                    />
                                                </div>
                                                <div className="row">
                                                    <div className="col-6">
                                                        <div className="form-group mb-3">
                                                            <small className="text-muted">MM/YY</small>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="12/25"
                                                                maxLength={5}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="form-group mb-3">
                                                            <small className="text-muted">CVV</small>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                placeholder="123"
                                                                maxLength={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group mb-3">
                                                    <small className="text-muted">Cardholder Name</small>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <button 
                                                    className="btn btn-sm btn-primary btn-block"
                                                    onClick={() => this.handleCardPayment()}
                                                >
                                                    <i className="flaticon2-pay mr-2"></i>
                                                    Pay with Card
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="form-group mb-4">
                                    <label className="font-weight-bold text-dark">
                                        <i className="flaticon2-phone mr-2"></i>
                                        M-Pesa Billing Number
                                    </label>
                                    <div className="input-group">
                                        <div className="input-group-prepend">
                                            <span className="input-group-text">
                                                <i className="flaticon2-smart-phone"></i>
                                            </span>
                                        </div>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Enter M-Pesa number (e.g., 07XX XXX XXX)"
                                            value={billingPhone}
                                            onChange={(e) => this.setState({ billingPhone: e.target.value })}
                                            pattern="[0-9]{10}"
                                            maxLength={10}
                                        />
                                    </div>
                                    <small className="text-muted font-size-xs mt-2 d-block">
                                        Enter the 10-digit M-Pesa number without country code (e.g., 0724736012)
                                    </small>
                                </div>
                            )}
                            
                            
                            
                           
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({ showBillingModal: false })}
                            >
                                <i className="flaticon2-cross mr-2"></i>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={this.handleSaveBillingDetails}
                                disabled={(this.state.paymentMethod === 'mpesa' && (!billingPhone || billingPhone.length !== 10))}
                            >
                                <i className="flaticon2-check-mark mr-2"></i>
                                Save Payment Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderBankPaymentModal = () => {
        const { showBankPaymentModal, bankPaymentIdentifier, selectedInvoice, bankPaymentDetails } = this.state;
        
        if (!showBankPaymentModal || !selectedInvoice) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="flaticon2-bank text-primary mr-2"></i>
                                Bank Transfer Payment
                            </h5>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showBankPaymentModal: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            
                            
                            <div className="form-group mb-4">
                                <div className="row">
                                    <div className="col-md-6">
                                        <label className="font-weight-bold text-dark">
                                            <i className="flaticon2-bank mr-2"></i>
                                            Bank Transfer Details
                                        </label>
                                        <div className="bg-light p-3 rounded">
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Bank:</strong> {bankPaymentDetails.bankName}
                                            </div>
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Account Name:</strong> {bankPaymentDetails.accountName}
                                            </div>
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Account Number:</strong> {bankPaymentDetails.accountNumber}
                                            </div>
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Branch:</strong> {bankPaymentDetails.branch}
                                            </div>
                                            <div className="font-size-sm text-dark">
                                                <strong>SWIFT Code:</strong> {bankPaymentDetails.swiftCode}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="font-weight-bold text-dark">
                                            <i className="flaticon2-file mr-2"></i>
                                            Invoice Details
                                        </label>
                                        <div className="bg-light p-3 rounded">
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Invoice Number:</strong> {selectedInvoice.id}
                                            </div>
                                            <div className="font-size-sm text-dark mb-2">
                                                <strong>Amount:</strong> {selectedInvoice.amount}
                                            </div>
                                            <div className="font-size-sm text-dark">
                                                <strong>Description:</strong> {selectedInvoice.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label className="font-weight-bold text-dark">
                                    <i className="flaticon2-credit-card mr-2"></i>
                                    Saved Cards
                                </label>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card mb-3" style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex align-items-center">
                                                        <i className="flaticon2-visa text-primary mr-2" style={{ fontSize: '24px' }}></i>
                                                        <div>
                                                            <div className="font-weight-bold text-dark">Visa ending in 4242</div>
                                                            <small className="text-muted">Expires 12/25</small>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => this.handlePayWithSavedCard('visa_4242')}
                                                    >
                                                        <i className="flaticon2-pay mr-1"></i> Pay
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card mb-3" style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex align-items-center">
                                                        <i className="flaticon2-mastercard text-warning mr-2" style={{ fontSize: '24px' }}></i>
                                                        <div>
                                                            <div className="font-weight-bold text-dark">Mastercard ending in 8888</div>
                                                            <small className="text-muted">Expires 09/24</small>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => this.handlePayWithSavedCard('mastercard_8888')}
                                                    >
                                                        <i className="flaticon2-pay mr-1"></i> Pay
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-3">
                                    <button className="btn btn-outline-primary btn-sm">
                                        <i className="flaticon2-plus mr-2"></i> Add New Card
                                    </button>
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label className="font-weight-bold text-dark">
                                    <i className="flaticon2-tag mr-2"></i>
                                    Transaction Reference Number
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter transaction reference (e.g., M-Pesa transaction ID, bank reference)"
                                    value={bankPaymentIdentifier}
                                    onChange={(e) => this.setState({ bankPaymentIdentifier: e.target.value })}
                                />
                                <small className="text-muted font-size-xs mt-2 d-block">
                                    Enter the reference number from your bank transfer or M-Pesa transaction
                                </small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({ showBankPaymentModal: false })}
                            >
                                <i className="flaticon2-cross mr-2"></i>
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={this.handleBankPaymentSubmit}
                                disabled={!bankPaymentIdentifier || !bankPaymentIdentifier.trim()}
                            >
                                <i className="flaticon2-check-mark mr-2"></i>
                                Submit Payment Reference
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderCreateInvoiceModal = () => {
        const { showCreateInvoiceModal, newInvoice } = this.state;
        
        if (!showCreateInvoiceModal) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="la la-plus"></i> Create New Invoice
                            </h4>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showCreateInvoiceModal: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Amount (KES)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    placeholder="Enter amount in KES"
                                    value={newInvoice.amount}
                                    onChange={(e) => this.setState({ 
                                        newInvoice: { ...newInvoice, amount: e.target.value }
                                    })}
                                    step="100"
                                    min="0"
                                />
                                <small className="form-text text-muted">Enter amount in Kenyan Shillings (e.g., 45000)</small>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3"
                                    placeholder="Enter invoice description (e.g., Term 2 Subscription, SMS Bundle, Teacher Training)"
                                    value={newInvoice.description}
                                    onChange={(e) => this.setState({ 
                                        newInvoice: { ...newInvoice, description: e.target.value }
                                    })}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>School ID</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Enter school ID (e.g., school_001)"
                                    value={newInvoice.schoolId}
                                    onChange={(e) => this.setState({ 
                                        newInvoice: { ...newInvoice, schoolId: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={newInvoice.dueDate}
                                    onChange={(e) => this.setState({ 
                                        newInvoice: { ...newInvoice, dueDate: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({ showCreateInvoiceModal: false })}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-success"
                                onClick={this.handleSaveInvoice}
                            >
                                <i className="la la-save"></i> Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    renderPaymentModal = () => {
        const { showPaymentModal, selectedInvoice, billingPhone } = this.state;
        
        if (!showPaymentModal || !selectedInvoice) return null;

        return (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>Settling Invoice</h5>
                            <button type="button" className="close" onClick={() => this.setState({ showPaymentModal: false })}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                        <div className="modal-body pt-8">
                            <div className="d-flex align-items-center bg-light-primary p-5 rounded mb-8" style={{ borderRadius: '1rem' }}>
                                <div className="symbol symbol-50 symbol-light-primary mr-4">
                                    <span className="symbol-label"><i className="flaticon2-file-1 text-primary" style={{ fontSize: '1.5rem' }}></i></span>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="font-weight-boldest text-dark" style={{ fontSize: '1.1rem' }}>{selectedInvoice.description}</div>
                                    <div className="text-muted font-weight-bold">Invoice #{selectedInvoice.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-weight-boldest text-primary" style={{ fontSize: '1.3rem' }}>{selectedInvoice.amount}</div>
                                    <div className="text-muted small font-weight-bold">DUE {selectedInvoice.dueDate}</div>
                                </div>
                            </div>

                            <div className="form-group mb-8">
                                <label className="font-weight-bold text-muted text-uppercase mb-3" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>M-Pesa Confirmation Number</label>
                                <div className="input-group input-group-lg input-group-solid">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text border-0 bg-light"><i className="la la-phone text-primary"></i></span>
                                    </div>
                                    <input 
                                        type="tel" 
                                        className="form-control border-0 bg-light font-weight-boldest" 
                                        value={billingPhone}
                                        onChange={e => this.setState({ billingPhone: e.target.value })}
                                        placeholder="07XXXXXXXX"
                                        style={{ borderRadius: '0 0.8rem 0.8rem 0' }}
                                    />
                                </div>
                                <div className="d-flex justify-content-between mt-3">
                                    <span className="text-muted font-weight-bold small">STK Push will be sent to this number</span>
                                    <a href="#" className="text-primary font-weight-bold small" onClick={(e) => { e.preventDefault(); this.handleManageBilling(); }}>Change default</a>
                                </div>
                            </div>

                            <div className="bg-light-warning p-5 rounded d-flex" style={{ borderRadius: '0.8rem' }}>
                                <i className="flaticon-info text-warning mr-4 mt-1"></i>
                                <div className="font-weight-bold text-dark-50" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Ensure your phone is unlocked and near you. You will be prompted to enter your <span className="text-dark">M-Pesa PIN</span> to complete the payment.
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button className="btn btn-light-danger font-weight-bold px-8 py-3" onClick={() => this.setState({ showPaymentModal: false })} style={{ borderRadius: '0.8rem' }}>Cancel</button>
                            <button className="btn btn-success font-weight-bold px-12 py-3" onClick={this.handleConfirmPayment} style={{ borderRadius: '0.8rem', boxShadow: '0 4px 15px rgba(27, 197, 189, 0.3)' }}>
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    renderInvoicesList = () => {
        const { invoices, loading, currentPage, itemsPerPage, totalInvoices } = this.state;

        if (loading) {
            return <SkeletonLoader />;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentInvoices = invoices.slice(startIndex, endIndex);

        return (
            <div>
                {/* Billing Information */}
                {this.renderBillingInfo()}
                
                {/* Historical Invoices */}
                <div className="kt-portlet">
                    <div className="kt-portlet__head">
                        <div className="kt-portlet__head-label">
                            <h3 className="kt-portlet__head-title">
                                <i className="la la-history"></i> Historical invoices
                            </h3>
                        </div>
                        <div className="kt-portlet__head-toolbar">
                            <span className="kt-font-sm text-muted">
                                These invoices were created before May 1, 2026. New invoices are available through the manage billing link above. 
                                Please download any old invoices you need, they won't be available in the dashboard anymore.
                            </span>
                        </div>
                    </div>
                    <div className="kt-portlet__body">
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Number</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Due Date</th>
                                        <th>Age</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentInvoices.map(invoice => (
                                        <tr key={invoice.id}>
                                            <td>
                                                <span className="kt-font-bold">
                                                    {invoice.id}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`kt-badge kt-badge--${
                                                    invoice.status === 'Paid' ? 'success' : 
                                                    invoice.status === 'Pending Confirmation' ? 'warning' : 
                                                    invoice.status === 'Unpaid' ? 'danger' : 'secondary'
                                                }`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td>{invoice.created}</td>
                                            <td>{invoice.dueDate}</td>
                                            <td>
                                                {(() => {
                                                    const createdDate = new Date(invoice.created);
                                                    const today = new Date();
                                                    const diffTime = Math.abs(today - createdDate);
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <span className={`kt-font-bold ${diffDays > 30 ? 'text-danger' : diffDays > 14 ? 'text-warning' : 'text-success'}`}>
                                                            {diffDays} days
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-1">
                                                    {/* Pay button - more prominent for unpaid invoices */}
                                                    {!this.state.isSuperAdmin && invoice.status === 'Unpaid' && (
                                                        <button 
                                                            className="btn btn-sm btn-success font-weight-bold"
                                                            title="Pay Invoice"
                                                            onClick={() => this.handlePayInvoice(invoice)}
                                                            style={{ minWidth: '80px', fontSize: '12px', padding: '6px 12px' }}
                                                        >
                                                            <i className="la la-credit-card"></i> Pay
                                                        </button>
                                                    )}
                                                    {this.state.isSuperAdmin && invoice.status === 'Pending Confirmation' && (
                                                        <button 
                                                            className="btn btn-sm btn-info font-weight-bold"
                                                            title="Confirm Payment"
                                                            onClick={() => this.handleConfirmBankPayment(invoice)}
                                                            style={{ minWidth: '100px', fontSize: '12px', padding: '6px 12px' }}
                                                        >
                                                            <i className="la la-check"></i> Confirm
                                                        </button>
                                                    )}
                                                    {/* Other actions - smaller icons */}
                                                    <div className="btn-group">
                                                        <button 
                                                            className="btn btn-sm btn-clean btn-icon btn-icon-md"
                                                            title="View Invoice"
                                                            onClick={() => this.handleViewInvoice(invoice)}
                                                        >
                                                            <i className="la la-eye"></i>
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-clean btn-icon btn-icon-md"
                                                            title="Print Invoice"
                                                            onClick={() => this.handlePrintInvoice(invoice)}
                                                        >
                                                            <i className="la la-print"></i>
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-clean btn-icon btn-icon-md"
                                                            title="Send via Email"
                                                            onClick={() => this.handleEmailInvoice(invoice)}
                                                        >
                                                            <i className="la la-envelope"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <Pagination
                            total={totalInvoices}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={this.handlePageChange}
                        />
                    </div>
                </div>
            </div>
        );
    };

    renderPrintView = () => {
        const { printInvoice, schoolInfo } = this.state;
        
        if (!printInvoice) return null;

        return (
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
                    <Navbar />
                    <Subheader links={["Finance", "Invoice Statement"]} />

                    <div className="kt-content kt-grid__item kt-grid__item--fluid" style={{ height: "auto" }} id="kt_content">
                        <div className="kt-container">
                            <div className="d-print-none p-4 border-bottom mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm">
                                <button className="btn btn-secondary" onClick={this.togglePrintView}>
                                    <i className="fa fa-arrow-left"></i> Back to Billing
                                </button>
                                <div>
                                    <h4 className="m-0 font-weight-bold">Invoice Preview</h4>
                                </div>
                                <div>
                                    <button className="btn btn-primary" onClick={this.handlePrint}>
                                        <i className="fa fa-print mr-2"></i> Print Invoice
                                    </button>
                                </div>
                            </div>
                            <div id="print-area" style={{ backgroundColor: '#f3f4f6', paddingTop: '20px', paddingBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <div className="invoice-preview-card" style={{ 
                                    backgroundColor: 'white', 
                                    padding: '40px', 
                                    borderRadius: '8px', 
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                    width: '100%',
                                    maxWidth: '800px'
                                }}>
                                    <div className="text-center mb-6">
                                        <h2 className="mb-2">Shule Plus</h2>
                                        <h4 className="text-muted">Invoice #{printInvoice.id}</h4>
                                        <p className="text-muted">Billing & Invoice Management</p>
                                    </div>
                                    
                                    <div className="row mb-6">
                                        <div className="col-md-6">
                                            <h6 className="mb-3">Invoice Details</h6>
                                            <div className="invoice-details">
                                                <p><strong>Invoice Number:</strong> {printInvoice.id}</p>
                                                <p><strong>Date Created:</strong> {printInvoice.created}</p>
                                                <p><strong>Due Date:</strong> {printInvoice.created}</p>
                                                <p><strong>Billing Period:</strong> Monthly Subscription</p>
                                                <p><strong>Payment Method:</strong> Auto-debit</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6 text-right">
                                            <h6 className="mb-3">Amount Due</h6>
                                            <h2 className="text-success mb-3">{printInvoice.amount}</h2>
                                            <span className="badge badge-success badge-lg">{printInvoice.status}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="table-responsive mb-6">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th className="text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Monthly Subscription - Shule Plus</td>
                                                    <td className="text-right font-weight-bold">{printInvoice.amount}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Total</strong></td>
                                                    <td className="text-right font-weight-bold">{printInvoice.amount}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="text-center text-muted border-top pt-4">
                                        <p className="mb-2">Thank you for your business!</p>
                                        <p className="mb-2">For questions, please contact billing@smartkids.school</p>
                                        <p className="small">Shule Plus - Educational Excellence</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>{`
                    @media print {
                        /* Hide UI Clutter */
                        #kt_header, #kt_header_mobile, #kt_header_secondary, .kt-subheader, .kt-footer, .kt-aside, .d-print-none { 
                            display: none !important; 
                        }
                        
                        /* Reset Layout for Print */
                        body, html { 
                            background: white !important; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                        }
                        
                        #kt_wrapper, .kt-content, .kt-container, #print-area { 
                            background: white !important; 
                            padding: 0 !important; 
                            margin: 0 !important; 
                            width: 100% !important; 
                            max-width: 100% !important; 
                            display: block !important;
                            border: none !important;
                        }

                        #print-area {
                            padding-top: 20px !important;
                            margin-top: 0 !important;
                        }

                        /* Ensure Invoice Card fills space */
                        .invoice-preview-card { 
                            page-break-after: auto; 
                            width: 100% !important; 
                            max-width: none !important;
                            height: auto !important; 
                            border: none !important; 
                            margin: 0 !important; 
                            padding: 20px !important; 
                            box-shadow: none !important; 
                        }
                    }
                `}</style>
            </div>
        );
    };

    render() {
        const { showPrintView } = this.state;
        
        if (showPrintView) {
            return this.renderPrintView();
        }

        return (
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div
                    className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
                    id="kt_wrapper"
                >
                    <Navbar />
                    <div style={{ marginTop: '65px' }}>
                        <Subheader title="Finance" breadcrumbs={[{ title: "Institutional Deposits", url: "#" }]} />
                    </div>

                    <div
                        className="kt-content kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
                        style={{ height: "auto", minHeight: 'calc(100vh - 120px)' }}
                        id="kt_content"
                    >

                        <div className="kt-container  kt-grid__item kt-grid__item--fluid">
                            {this.renderInvoicesList()}
                            {this.renderInvoiceModal()}
                            {this.renderEmailModal()}
                            {this.renderCreateInvoiceModal()}
                            {this.renderPaymentModal()}
                            {this.renderBillingModal()}
                            {this.renderBankPaymentModal()}
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }
}

export default InstitutionalDeposits;
