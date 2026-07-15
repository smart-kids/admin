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
            dueDate: '',
            billingCycle: 'Monthly',
            restrictDashboardOnOverdue: false
        },
        editInvoice: null,
        showEditInvoiceModal: false,
    };

    componentDidMount() {
        // Get current user and check role
        const userData = JSON.parse(localStorage.getItem("user")) || {};
        const isSuperAdmin = userData.userType === 'sAdmin';
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
            if (selectedSchool) {
                this.loadInvoices(selectedSchool.id);
            }
        });
        
        if (selectedSchool) {
            this.loadInvoices(selectedSchool.id);
        } else {
            this.setState({ loading: false });
        }
    }

    loadInvoices = async (schoolId) => {
        this.setState({ loading: true });
        try {
            const invoices = await Data.invoices.getInvoices({ school: schoolId });
            this.setState({ invoices, loading: false });
        } catch (error) {
            console.error("Failed to load invoices", error);
            this.setState({ loading: false });
        }
    };

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

    getNextTermStartDate = () => {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const year = now.getFullYear();
        if (month < 4) return `${year}-05-01`; // Term 2 starts May 1
        if (month < 8) return `${year}-09-01`; // Term 3 starts Sept 1
        return `${year + 1}-01-01`;            // Term 1 starts Jan 1 next year
    };

    handleCreateInvoice = () => {
        const { selectedSchool, invoices } = this.state;
        
        let initialAmount = '';
        let initialDescription = '';
        
        if (selectedSchool) {
            const schoolInvoices = invoices.filter(inv => inv.schoolId === selectedSchool.id);
            if (schoolInvoices.length === 0) {
                const studentCount = selectedSchool.students?.length || selectedSchool.studentCount || 0;
                const rate = selectedSchool.ratePerStudent || 100;
                initialAmount = (studentCount * rate).toString();
                initialDescription = `Subscription for ${studentCount} students`;
            }
        }

        this.setState({ 
            showCreateInvoiceModal: true,
            newInvoice: {
                amount: initialAmount,
                description: initialDescription,
                dueDate: this.getNextTermStartDate(),
                billingCycle: 'Termly',
                restrictDashboardOnOverdue: false
            }
        });
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
            schoolId: this.state.selectedSchool?.id || 'school_001',
            billingCycle: newInvoice.billingCycle || 'Termly',
            restrictDashboardOnOverdue: newInvoice.restrictDashboardOnOverdue || false
        };

        this.setState({ 
            invoices: [invoice, ...invoices],
            totalInvoices: invoices.length + 1,
            showCreateInvoiceModal: false,
            newInvoice: {
                amount: '',
                description: '',
                schoolId: '',
                dueDate: '',
                billingCycle: 'Monthly',
                restrictDashboardOnOverdue: false
            }
        });

        successToast.show({ 
            message: `Invoice ${invoiceId} created successfully!`,
            header: 'Invoice Created'
        });
    };

    handleEditInvoice = (invoice) => {
        // Parse raw numeric amount from "KES 1,000" formatted string
        const parsedAmount = typeof invoice.amount === 'string' ? invoice.amount.replace(/[^0-9.]/g, '') : invoice.amount;
        
        // Convert "Nov 15, 2026" back to YYYY-MM-DD for date input
        let parsedDueDate = invoice.dueDate;
        if (invoice.dueDate) {
            try {
                const d = new Date(invoice.dueDate);
                if (!isNaN(d.getTime())) {
                    parsedDueDate = d.toISOString().split('T')[0];
                }
            } catch(e) {}
        }
        
        this.setState({
            editInvoice: {
                id: invoice.id,
                amount: parsedAmount,
                description: invoice.description,
                schoolId: invoice.schoolId || '',
                dueDate: parsedDueDate,
                billingCycle: invoice.billingCycle || 'Monthly',
                restrictDashboardOnOverdue: invoice.restrictDashboardOnOverdue || false
            },
            showEditInvoiceModal: true
        });
    };

    handleUpdateInvoice = () => {
        const { editInvoice, invoices } = this.state;
        
        if (!editInvoice.amount || !editInvoice.description || !editInvoice.dueDate) {
            errorToast.show({ message: 'Please fill in all required fields' });
            return;
        }

        const updatedInvoices = invoices.map(inv => {
            if (inv.id === editInvoice.id) {
                return {
                    ...inv,
                    amount: `KES ${parseInt(editInvoice.amount).toLocaleString()}`,
                    description: editInvoice.description,
                    dueDate: new Date(editInvoice.dueDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    schoolId: editInvoice.schoolId,
                    billingCycle: editInvoice.billingCycle,
                    restrictDashboardOnOverdue: editInvoice.restrictDashboardOnOverdue
                };
            }
            return inv;
        });

        this.setState({ 
            invoices: updatedInvoices,
            showEditInvoiceModal: false,
            editInvoice: null
        });

        successToast.show({ 
            message: `Invoice ${editInvoice.id} updated successfully!`,
            header: 'Invoice Updated'
        });
    };

    handleDeleteInvoice = (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            const { invoices } = this.state;
            this.setState({
                invoices: invoices.filter(inv => inv.id !== invoiceId),
                totalInvoices: this.state.totalInvoices - 1
            });
            successToast.show({ 
                message: `Invoice deleted successfully!`,
                header: 'Invoice Deleted'
            });
        }
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
        const { showBillingModal, billingPhone, selectedSchool, paymentMethod } = this.state;
        
        if (!showBillingModal) return null;

        return (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>Billing & Payments</h5>
                            <button type="button" className="close" onClick={() => this.setState({ showBillingModal: false })}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                        <div className="modal-body pt-8">
                            <div className="bg-light-primary p-6 rounded mb-8" style={{ borderRadius: '1rem' }}>
                                <div className="d-flex align-items-center mb-4">
                                    <div className="symbol symbol-50 symbol-light-primary mr-4">
                                        <span className="symbol-label font-weight-boldest" style={{ fontSize: '1.2rem' }}>{selectedSchool?.name?.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className="font-weight-boldest text-dark" style={{ fontSize: '1.1rem' }}>{selectedSchool?.name || 'School Information'}</div>
                                        <div className="text-muted font-weight-bold small">{selectedSchool?.email || 'Billing email pending'}</div>
                                    </div>
                                </div>
                                <div className="separator separator-dashed separator-border-2 mb-4"></div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="text-muted font-weight-bold small text-uppercase mb-1">Status</div>
                                        <div className="font-weight-boldest text-primary">Active Institution</div>
                                    </div>
                                    <div className="col-6 text-right">
                                        <div className="text-muted font-weight-bold small text-uppercase mb-1">Balance</div>
                                        <div className="font-weight-boldest text-success">KSH {parseFloat(selectedSchool?.financial?.balance || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Billing Phone Number</label>
                                <div className="input-group input-group-solid input-group-lg">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text border-0 bg-light"><i className="la la-phone text-primary"></i></span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 bg-light font-weight-bold" 
                                        value={billingPhone}
                                        onChange={e => this.setState({ billingPhone: e.target.value })}
                                        placeholder="07XXXXXXXX"
                                        style={{ borderRadius: '0 0.8rem 0.8rem 0' }}
                                    />
                                </div>
                                <span className="form-text text-muted font-weight-bold mt-2 small">M-Pesa prompts will be sent to this number by default.</span>
                            </div>
                            
                            <div className="form-group mb-0">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Preferred Payment Method</label>
                                <div className="row">
                                    <div className="col-6">
                                        <div 
                                            className={`p-4 rounded border ${paymentMethod === 'mpesa' ? 'border-primary bg-light-primary' : 'border-light bg-light'}`}
                                            onClick={() => this.setState({ paymentMethod: 'mpesa' })}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <i className={`la la-mobile-phone mr-3 ${paymentMethod === 'mpesa' ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '1.5rem' }}></i>
                                                <span className={`font-weight-boldest small ${paymentMethod === 'mpesa' ? 'text-primary' : 'text-muted'}`}>M-PESA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div 
                                            className={`p-4 rounded border ${paymentMethod === 'bank' ? 'border-primary bg-light-primary' : 'border-light bg-light'}`}
                                            onClick={() => this.setState({ paymentMethod: 'bank' })}
                                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <i className={`la la-bank mr-3 ${paymentMethod === 'bank' ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '1.5rem' }}></i>
                                                <span className={`font-weight-boldest small ${paymentMethod === 'bank' ? 'text-primary' : 'text-muted'}`}>BANK</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button className="btn btn-light-danger font-weight-bold px-8 py-3" onClick={() => this.setState({ showBillingModal: false })} style={{ borderRadius: '0.8rem' }}>Close</button>
                            <button className="btn btn-primary font-weight-bold px-10 py-3" onClick={this.handleSaveBillingDetails} style={{ borderRadius: '0.8rem', boxShadow: '0 4px 15px rgba(54, 153, 255, 0.3)' }}>Save Preferences</button>
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
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>Bank Transfer Details</h5>
                            <button type="button" className="close" onClick={() => this.setState({ showBankPaymentModal: false })}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                        <div className="modal-body pt-8">
                            <div className="row mb-8">
                                <div className="col-md-6">
                                    <div className="bg-light p-6 rounded h-100" style={{ borderRadius: '1rem' }}>
                                        <h6 className="font-weight-boldest text-primary text-uppercase mb-4" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Recipient Account</h6>
                                        <div className="mb-3">
                                            <div className="text-muted small font-weight-bold">Bank Name</div>
                                            <div className="font-weight-boldest text-dark">{bankPaymentDetails.bankName}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-muted small font-weight-bold">Account Name</div>
                                            <div className="font-weight-boldest text-dark">{bankPaymentDetails.accountName}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-muted small font-weight-bold">Account Number</div>
                                            <div className="font-weight-boldest text-dark" style={{ fontSize: '1.1rem' }}>{bankPaymentDetails.accountNumber}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted small font-weight-bold">Branch / SWIFT</div>
                                            <div className="font-weight-boldest text-dark">{bankPaymentDetails.branch} / {bankPaymentDetails.swiftCode}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="bg-light-primary p-6 rounded h-100" style={{ borderRadius: '1rem' }}>
                                        <h6 className="font-weight-boldest text-primary text-uppercase mb-4" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Invoice Summary</h6>
                                        <div className="mb-3">
                                            <div className="text-muted small font-weight-bold">Invoice Number</div>
                                            <div className="font-weight-boldest text-dark">#{selectedInvoice.id}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-muted small font-weight-bold">Total Amount</div>
                                            <div className="font-weight-boldest text-primary" style={{ fontSize: '1.3rem' }}>{selectedInvoice.amount}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted small font-weight-bold">Description</div>
                                            <div className="font-weight-bold text-dark-50">{selectedInvoice.description}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-0">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Transaction Reference Number</label>
                                <div className="input-group input-group-solid input-group-lg">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text border-0 bg-light"><i className="la la-file-text text-primary"></i></span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-0 bg-light font-weight-bold" 
                                        placeholder="Enter Bank Ref / Transaction ID"
                                        value={bankPaymentIdentifier}
                                        onChange={(e) => this.setState({ bankPaymentIdentifier: e.target.value })}
                                        style={{ borderRadius: '0 0.8rem 0.8rem 0' }}
                                    />
                                </div>
                                <span className="form-text text-muted font-weight-bold mt-2 small">Enter the unique reference from your bank receipt to help us verify your payment.</span>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button className="btn btn-light-danger font-weight-bold px-8 py-3" onClick={() => this.setState({ showBankPaymentModal: false })} style={{ borderRadius: '0.8rem' }}>Cancel</button>
                            <button className="btn btn-primary font-weight-bold px-10 py-3" onClick={this.handleBankPaymentSubmit} style={{ borderRadius: '0.8rem', boxShadow: '0 4px 15px rgba(54, 153, 255, 0.3)' }}>Submit Verification</button>
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
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>Generate New Invoice</h5>
                            <button type="button" className="close" onClick={() => this.setState({ showCreateInvoiceModal: false })}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                        <div className="modal-body pt-8">
                            <div className="form-group mb-6">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Amount (KES)</label>
                                <div className="input-group input-group-solid input-group-lg">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text border-0 bg-light"><i className="la la-money text-primary"></i></span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="form-control border-0 bg-light font-weight-bold" 
                                        placeholder="0.00"
                                        value={newInvoice.amount}
                                        onChange={(e) => this.setState({ newInvoice: { ...newInvoice, amount: e.target.value }})}
                                        style={{ borderRadius: '0 0.8rem 0.8rem 0' }}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group mb-6">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Service Description</label>
                                <textarea 
                                    className="form-control border-0 bg-light font-weight-bold" 
                                    rows="3"
                                    placeholder="Enter details about this invoice..."
                                    value={newInvoice.description}
                                    onChange={(e) => this.setState({ newInvoice: { ...newInvoice, description: e.target.value }})}
                                    style={{ borderRadius: '0.8rem' }}
                                ></textarea>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Due Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control border-0 bg-light font-weight-bold" 
                                            value={newInvoice.dueDate}
                                            onChange={(e) => this.setState({ newInvoice: { ...newInvoice, dueDate: e.target.value }})}
                                            style={{ borderRadius: '0.8rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row mt-6">
                                <div className="col-6">
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Billing Cycle</label>
                                        <select 
                                            className="form-control border-0 bg-light font-weight-bold" 
                                            value={newInvoice.billingCycle}
                                            onChange={(e) => this.setState({ newInvoice: { ...newInvoice, billingCycle: e.target.value }})}
                                            style={{ borderRadius: '0.8rem' }}
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Termly">Termly</option>
                                            <option value="Annually">Annually</option>
                                            <option value="One-off">One-off</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-6 d-flex align-items-end">
                                    <div className="form-group mb-0 w-100">
                                        <label className="kt-checkbox kt-checkbox--brand font-weight-bold text-dark">
                                            <input 
                                                type="checkbox" 
                                                checked={newInvoice.restrictDashboardOnOverdue}
                                                onChange={(e) => this.setState({ newInvoice: { ...newInvoice, restrictDashboardOnOverdue: e.target.checked }})}
                                            /> Restrict Dashboard if Overdue
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button className="btn btn-light-danger font-weight-bold px-8 py-3" onClick={() => this.setState({ showCreateInvoiceModal: false })} style={{ borderRadius: '0.8rem' }}>Discard</button>
                            <button className="btn btn-primary font-weight-bold px-10 py-3" onClick={this.handleSaveInvoice} style={{ borderRadius: '0.8rem', boxShadow: '0 4px 15px rgba(54, 153, 255, 0.3)' }}>Create Invoice</button>
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    renderEditInvoiceModal = () => {
        const { showEditInvoiceModal, editInvoice } = this.state;
        
        if (!showEditInvoiceModal || !editInvoice) return null;

        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '1.2rem' }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>Edit Invoice #{editInvoice.id}</h5>
                            <button type="button" className="close" onClick={() => this.setState({ showEditInvoiceModal: false })}>
                                <i className="ki ki-close"></i>
                            </button>
                        </div>
                        <div className="modal-body pt-8">
                            <div className="form-group mb-6">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Amount (KES)</label>
                                <div className="input-group input-group-solid input-group-lg">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text border-0 bg-light"><i className="la la-money text-primary"></i></span>
                                    </div>
                                    <input 
                                        type="number" 
                                        className="form-control border-0 bg-light font-weight-bold" 
                                        placeholder="0.00"
                                        value={editInvoice.amount}
                                        onChange={(e) => this.setState({ editInvoice: { ...editInvoice, amount: e.target.value }})}
                                        style={{ borderRadius: '0 0.8rem 0.8rem 0' }}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group mb-6">
                                <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Service Description</label>
                                <textarea 
                                    className="form-control border-0 bg-light font-weight-bold" 
                                    rows="3"
                                    placeholder="Enter details about this invoice..."
                                    value={editInvoice.description}
                                    onChange={(e) => this.setState({ editInvoice: { ...editInvoice, description: e.target.value }})}
                                    style={{ borderRadius: '0.8rem' }}
                                ></textarea>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Due Date</label>
                                        <input 
                                            type="date" 
                                            className="form-control border-0 bg-light font-weight-bold" 
                                            value={editInvoice.dueDate}
                                            onChange={(e) => this.setState({ editInvoice: { ...editInvoice, dueDate: e.target.value }})}
                                            style={{ borderRadius: '0.8rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row mt-6">
                                <div className="col-6">
                                    <div className="form-group mb-0">
                                        <label className="font-weight-bold text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Billing Cycle</label>
                                        <select 
                                            className="form-control border-0 bg-light font-weight-bold" 
                                            value={editInvoice.billingCycle}
                                            onChange={(e) => this.setState({ editInvoice: { ...editInvoice, billingCycle: e.target.value }})}
                                            style={{ borderRadius: '0.8rem' }}
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Termly">Termly</option>
                                            <option value="Annually">Annually</option>
                                            <option value="One-off">One-off</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-6 d-flex align-items-end">
                                    <div className="form-group mb-0 w-100">
                                        <label className="kt-checkbox kt-checkbox--brand font-weight-bold text-dark">
                                            <input 
                                                type="checkbox" 
                                                checked={editInvoice.restrictDashboardOnOverdue}
                                                onChange={(e) => this.setState({ editInvoice: { ...editInvoice, restrictDashboardOnOverdue: e.target.checked }})}
                                            /> Restrict Dashboard if Overdue
                                            <span></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0">
                            <button className="btn btn-light-danger font-weight-bold px-8 py-3" onClick={() => this.setState({ showEditInvoiceModal: false })} style={{ borderRadius: '0.8rem' }}>Discard</button>
                            <button className="btn btn-primary font-weight-bold px-10 py-3" onClick={this.handleUpdateInvoice} style={{ borderRadius: '0.8rem', boxShadow: '0 4px 15px rgba(54, 153, 255, 0.3)' }}>Update Invoice</button>
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

        const parseAmount = str => parseInt((str || '').toString().replace(/[^0-9]/g, '')) || 0;
        const totalOutstanding = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + parseAmount(i.amount), 0);
        const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + parseAmount(i.amount), 0);
        
        // Find next due invoice
        const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' && i.dueDate);
        unpaidInvoices.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const nextDue = unpaidInvoices.length > 0 ? unpaidInvoices[0] : null;

        return (
            <div>
                {/* Billing Information */}
                {this.renderBillingInfo()}
                
                {/* SaaS Billing Dashboard Summary Cards */}
                <div className="row mb-6">
                    <div className="col-md-4">
                        <div className="kt-portlet kt-portlet--height-fluid bg-light-danger" style={{ borderRadius: '1rem', border: '1px solid #ffe2e5' }}>
                            <div className="kt-portlet__body p-5 d-flex flex-column justify-content-center">
                                <span className="text-danger font-weight-boldest text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Total Outstanding</span>
                                <span className="font-weight-boldest text-dark" style={{ fontSize: '2rem' }}>KES {totalOutstanding.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="kt-portlet kt-portlet--height-fluid bg-light-success" style={{ borderRadius: '1rem', border: '1px solid #c9f7f5' }}>
                            <div className="kt-portlet__body p-5 d-flex flex-column justify-content-center">
                                <span className="text-success font-weight-boldest text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Total Paid</span>
                                <span className="font-weight-boldest text-dark" style={{ fontSize: '2rem' }}>KES {totalPaid.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="kt-portlet kt-portlet--height-fluid bg-light-warning" style={{ borderRadius: '1rem', border: '1px solid #fff4de' }}>
                            <div className="kt-portlet__body p-5 d-flex flex-column justify-content-center">
                                <span className="text-warning font-weight-boldest text-uppercase mb-2" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Next Invoice Due</span>
                                <span className="font-weight-boldest text-dark" style={{ fontSize: '1.5rem' }}>{nextDue ? nextDue.dueDate : 'No pending invoices'}</span>
                                {nextDue && <span className="text-muted font-weight-bold small mt-1">{nextDue.amount}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Historical Invoices */}
                <div className="kt-portlet" style={{ borderRadius: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div className="kt-portlet__head border-bottom-0 pt-6 pb-2">
                        <div className="kt-portlet__head-label">
                            <h3 className="kt-portlet__head-title font-weight-boldest" style={{ fontSize: '1.4rem' }}>
                                <i className="la la-file-invoice-dollar mr-2 text-primary" style={{ fontSize: '1.8rem', verticalAlign: 'middle' }}></i> Invoices
                            </h3>
                        </div>
                    </div>
                    <div className="kt-portlet__body">
                        <div className="row">
                            {currentInvoices.map(invoice => (
                                <div className="col-12 mb-4" key={invoice.id}>
                                    <div className="d-flex align-items-center justify-content-between p-5 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ebedf2', transition: 'all 0.2s ease' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                        <div className="d-flex align-items-center">
                                            <div className={`symbol symbol-50 mr-4 ${invoice.status === 'Paid' ? 'symbol-light-success' : invoice.status === 'Unpaid' ? 'symbol-light-danger' : 'symbol-light-warning'}`}>
                                                <span className="symbol-label">
                                                    <i className={`la ${invoice.status === 'Paid' ? 'la-check-circle' : invoice.status === 'Unpaid' ? 'la-exclamation-circle' : 'la-clock-o'}`} style={{ fontSize: '1.8rem' }}></i>
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="font-weight-boldest text-dark mb-1">Invoice #{invoice.id}</h5>
                                                <div className="text-muted font-weight-bold small">
                                                    Created: {invoice.created} <span className="mx-2">•</span> Due: {invoice.dueDate}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex align-items-center">
                                            <div className="text-right mr-6">
                                                <div className="font-weight-boldest text-dark" style={{ fontSize: '1.2rem' }}>{invoice.amount}</div>
                                                <span className={`label label-inline font-weight-bold label-light-${invoice.status === 'Paid' ? 'success' : invoice.status === 'Unpaid' ? 'danger' : 'warning'}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                            
                                            <div className="d-flex gap-2">
                                                {!this.state.isSuperAdmin && invoice.status === 'Unpaid' && (
                                                    <button className="btn btn-success font-weight-bold py-2 px-4 rounded-pill shadow-sm" onClick={() => this.handlePayInvoice(invoice)}>
                                                        Pay Now
                                                    </button>
                                                )}
                                                {this.state.isSuperAdmin && invoice.status === 'Pending Confirmation' && (
                                                    <button className="btn btn-info font-weight-bold py-2 px-4 rounded-pill shadow-sm" onClick={() => this.handleConfirmBankPayment(invoice)}>
                                                        Confirm
                                                    </button>
                                                )}
                                                
                                                <div className="dropdown dropdown-inline ml-2">
                                                    <button type="button" className="btn btn-light btn-icon btn-sm rounded-circle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" onClick={(e) => {
                                                        const dropdown = e.currentTarget.nextElementSibling;
                                                        dropdown.classList.toggle('show');
                                                    }}>
                                                        <i className="ki ki-bold-more-ver"></i>
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-right" onClick={(e) => e.currentTarget.classList.remove('show')}>
                                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); this.handleViewInvoice(invoice); }}><i className="la la-eye text-primary mr-2"></i> View</a>
                                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); this.handlePrintInvoice(invoice); }}><i className="la la-print text-primary mr-2"></i> Print</a>
                                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); this.handleEmailInvoice(invoice); }}><i className="la la-envelope text-primary mr-2"></i> Email</a>
                                                        {this.state.isSuperAdmin && (
                                                            <>
                                                                <div className="dropdown-divider"></div>
                                                                <a className="dropdown-item text-primary" href="#" onClick={(e) => { e.preventDefault(); this.handleEditInvoice(invoice); }}><i className="la la-edit text-primary mr-2"></i> Edit</a>
                                                                <a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); this.handleDeleteInvoice(invoice.id); }}><i className="la la-trash text-danger mr-2"></i> Delete</a>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {currentInvoices.length === 0 && (
                            <div className="text-center py-10">
                                <i className="la la-file-invoice text-muted" style={{ fontSize: '4rem' }}></i>
                                <h4 className="mt-4 text-dark font-weight-bold">No Invoices Found</h4>
                                <p className="text-muted">There are no invoices available for this school yet.</p>
                            </div>
                        )}
                        
                        {currentInvoices.length > 0 && (
                            <Pagination
                                total={totalInvoices}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={this.handlePageChange}
                            />
                        )}
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
                                                <p><strong>Due Date:</strong> {printInvoice.dueDate}</p>
                                                <p><strong>Billing Period:</strong> {printInvoice.billingCycle || 'Monthly'} Subscription</p>
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
                            {this.renderEditInvoiceModal()}
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
