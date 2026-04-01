import React, { Component } from "react";
import Data from "../../utils/data";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import Footer from "../../components/footer";

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
        deposits: [],
        loading: true,
        currentPage: 1,
        itemsPerPage: 15,
        totalDeposits: 0,
        showDepositModal: false,
        bankInstructions: false
    };

    componentDidMount() {
        this.fetchDeposits();
    }

    fetchDeposits = async () => {
        this.setState({ loading: true });
        try {
            const response = await Data.institutionalDeposits.getPage({
                page: this.state.currentPage,
                limit: this.state.itemsPerPage,
                sort: { key: 'createdAt', direction: 'descending' }
            });
            this.setState({
                deposits: response.deposits || [],
                totalDeposits: response.totalCount || 0,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch deposits:', error);
            this.setState({ loading: false });
        }
    };

    handlePageChange = (page) => {
        this.setState({ currentPage: page }, () => {
            this.fetchDeposits();
        });
    };

    handleDepositClick = () => {
        // Navigate to external bank deposit page or show instructions
        this.setState({ bankInstructions: true });
    };

    renderDepositsList = () => {
        const { deposits, loading, currentPage, itemsPerPage, totalDeposits } = this.state;

        if (loading) {
            return <SkeletonLoader />;
        }

        if (deposits.length === 0) {
            return (
                <div className="text-center p-10">
                    <i className="la la-inbox" style={{ fontSize: '3rem', color: '#ddd' }}></i>
                    <p className="mt-4" style={{ color: '#999' }}>No institutional deposits found</p>
                </div>
            );
        }

        return (
            <div className="kt-portlet">
                <div className="kt-portlet__head">
                    <div className="kt-portlet__head-label">
                        <h3 className="kt-portlet__head-title">Institutional Deposits</h3>
                    </div>
                    <div className="kt-portlet__head-toolbar">
                        <button 
                            className="btn btn-label-brand btn-bold"
                            onClick={this.handleDepositClick}
                        >
                            <i className="la la-plus"></i> New Deposit
                        </button>
                    </div>
                </div>
                <div className="kt-portlet__body">
                    <div className="kt-section">
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Receipt #</th>
                                        <th>Date</th>
                                        <th>Depositor</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deposits.map(deposit => (
                                        <tr key={deposit.id}>
                                            <td>
                                                <span className="kt-badge kt-badge--success">
                                                    {deposit.receiptNumber || `INST-${deposit.id}`}
                                                </span>
                                            </td>
                                            <td>{new Date(deposit.createdAt).toLocaleDateString()}</td>
                                            <td>{deposit.depositorName}</td>
                                            <td>
                                                <span className="kt-font-bold kt-font-success">
                                                    KES {deposit.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`kt-badge kt-badge--${deposit.paymentMethod === 'bank' ? 'primary' : 'info'}`}>
                                                    {deposit.paymentMethod?.toUpperCase() || 'BANK'}
                                                </span>
                                            </td>
                                            <td>{deposit.purpose || 'fees'}</td>
                                            <td>
                                                <span className={`kt-badge kt-badge--${deposit.status === 'completed' ? 'success' : 'warning'}`}>
                                                    {deposit.status || 'pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-clean btn-icon btn-icon-md"
                                                    title="View Receipt"
                                                    onClick={() => this.viewReceipt(deposit)}
                                                >
                                                    <i className="la la-eye"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-clean btn-icon btn-icon-md ml-1"
                                                    title="Download Receipt"
                                                    onClick={() => this.downloadReceipt(deposit)}
                                                >
                                                    <i className="la la-download"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <Pagination
                            total={totalDeposits}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={this.handlePageChange}
                        />
                    </div>
                </div>
            </div>
        );
    };

    renderBankInstructions = () => {
        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="la la-university"></i> Bank Deposit Instructions
                            </h4>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ bankInstructions: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="kt-portlet kt-portlet--height-fluid">
                                        <div className="kt-portlet__head">
                                            <div className="kt-portlet__head-label">
                                                <h5 className="kt-portlet__head-title">Bank Details</h5>
                                            </div>
                                        </div>
                                        <div className="kt-portlet__body">
                                            <table className="table">
                                                <tr><td><strong>Bank:</strong></td><td>Equity Bank Kenya</td></tr>
                                                <tr><td><strong>Account Name:</strong></td><td>Smart Kids School Ltd</td></tr>
                                                <tr><td><strong>Account Number:</strong></td><td>00802934567890</td></tr>
                                                <tr><td><strong>Branch:</strong></td><td>Westlands Branch</td></tr>
                                                <tr><td><strong>Swift Code:</strong></td><td>EQBLKENA</td></tr>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="kt-portlet kt-portlet--height-fluid">
                                        <div className="kt-portlet__head">
                                            <div className="kt-portlet__head-label">
                                                <h5 className="kt-portlet__head-title">Deposit Process</h5>
                                            </div>
                                        </div>
                                        <div className="kt-portlet__body">
                                            <ol>
                                                <li>Visit any Equity Bank branch</li>
                                                <li>Fill deposit slip with school account details</li>
                                                <li>Deposit cash or cheque</li>
                                                <li>Keep your deposit receipt</li>
                                                <li>Return here to record your deposit</li>
                                                <li>Receive official receipt instantly</li>
                                            </ol>
                                            <div className="text-center mt-4">
                                                <button 
                                                    className="btn btn-label-brand btn-bold btn-lg"
                                                    onClick={() => window.open('/finance/fees', '_blank')}
                                                >
                                                    <i className="la la-external-link"></i> Go to Fee Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    viewReceipt = (deposit) => {
        // Open receipt in new window or modal
        const receiptUrl = `/finance/institutional-deposits/receipt/${deposit.id}`;
        window.open(receiptUrl, '_blank');
    };

    downloadReceipt = (deposit) => {
        // Download PDF receipt
        const receiptUrl = `/finance/institutional-deposits/download/${deposit.id}`;
        window.open(receiptUrl, '_blank');
    };

    render() {
        return (
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div
                    className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper"
                    id="kt_wrapper"
                >
                    <Navbar />
                    <Subheader links={["Finance", "Institutional Deposits"]} />

                    <div
                        className="kt-content  kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor"
                        style={{height:"100vh"}}
                        id="kt_content"
                    >
                        <div className="kt-container  kt-grid__item kt-grid__item--fluid">
                            {this.state.bankInstructions ? this.renderBankInstructions() : this.renderDepositsList()}
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }
}

export default InstitutionalDeposits;
