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
        bankInstructions: false,
        showMpesaModal: false,
        // Statistics data
        userStats: {
            students: 0,
            parents: 0,
            teachers: 0,
            admins: 0
        },
        learningStats: {
            totalAttempts: 0,
            completedAttempts: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            totalTime: 0 // in minutes
        },
        billingInfo: {
            totalUsageTime: 0,
            estimatedCost: 0,
            ratePerMinute: 2 // KES per minute
        }
    };

    componentDidMount() {
        this.fetchDeposits();
        this.fetchStatistics();
        
        // Subscribe to data changes
        this.unsubscribeStudents = Data.students.subscribe(() => this.updateUserStats());
        this.unsubscribeParents = Data.parents.subscribe(() => this.updateUserStats());
        this.unsubscribeTeachers = Data.teachers.subscribe(() => this.updateUserStats());
        this.unsubscribeAdmins = Data.admins.subscribe(() => this.updateUserStats());
        this.unsubscribeLessonAttempts = Data.lessonAttempts.subscribe(() => this.updateLearningStats());
        this.unsubscribeAttemptEvents = Data.attemptEvents.subscribe(() => this.updateLearningStats());
    }

    componentWillUnmount() {
        // Clean up subscriptions
        if (this.unsubscribeStudents) this.unsubscribeStudents();
        if (this.unsubscribeParents) this.unsubscribeParents();
        if (this.unsubscribeTeachers) this.unsubscribeTeachers();
        if (this.unsubscribeAdmins) this.unsubscribeAdmins();
        if (this.unsubscribeLessonAttempts) this.unsubscribeLessonAttempts();
        if (this.unsubscribeAttemptEvents) this.unsubscribeAttemptEvents();
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

    fetchStatistics = () => {
        this.updateUserStats();
        this.updateLearningStats();
    };

    updateUserStats = () => {
        const students = Data.students.list() || [];
        const parents = Data.parents.list() || [];
        const teachers = Data.teachers.list() || [];
        const admins = Data.admins.list() || [];

        this.setState({
            userStats: {
                students: students.length,
                parents: parents.length,
                teachers: teachers.length,
                admins: admins.length
            }
        });
    };

    updateLearningStats = () => {
        const lessonAttempts = Data.lessonAttempts.list() || [];
        const attemptEvents = Data.attemptEvents.list() || [];
        
        const completedAttempts = lessonAttempts.filter(attempt => attempt.status === 'completed');
        const totalQuestions = attemptEvents.filter(event => event.eventType === 'answer').length;
        const correctAnswers = attemptEvents.filter(event => event.eventType === 'answer' && event.isCorrect).length;
        
        // Calculate total time spent on learning
        let totalTimeInMinutes = 0;
        lessonAttempts.forEach(attempt => {
            if (attempt.startedAt && attempt.completedAt) {
                const startTime = new Date(attempt.startedAt);
                const endTime = new Date(attempt.completedAt);
                const durationMinutes = (endTime - startTime) / (1000 * 60);
                totalTimeInMinutes += durationMinutes;
            }
        });

        const estimatedCost = totalTimeInMinutes * this.state.billingInfo.ratePerMinute;

        this.setState({
            learningStats: {
                totalAttempts: lessonAttempts.length,
                completedAttempts: completedAttempts.length,
                totalQuestions,
                correctAnswers,
                totalTime: Math.round(totalTimeInMinutes)
            },
            billingInfo: {
                totalUsageTime: Math.round(totalTimeInMinutes),
                estimatedCost: Math.round(estimatedCost),
                ratePerMinute: this.state.billingInfo.ratePerMinute
            }
        });
    };

    handleMpesaDeposit = () => {
        this.setState({ showMpesaModal: true });
    };

    handleMpesaSubmit = async (depositData) => {
        try {
            const response = await Data.institutionalDeposits.createWithMpesa(depositData);
            
            // Show success message
            alert('M-Pesa payment initiated! Please complete the payment on your phone.');
            
            // Close modal and refresh deposits
            this.setState({ showMpesaModal: false });
            this.fetchDeposits();
        } catch (error) {
            console.error('M-Pesa deposit failed:', error);
            alert('Failed to initiate M-Pesa payment. Please try again.');
        }
    };

    renderStatisticsCards = () => {
        const { userStats, learningStats, billingInfo } = this.state;
        
        // Get all entity counts from Data
        const students = Data.students.list() || [];
        const parents = Data.parents.list() || [];
        const teachers = Data.teachers.list() || [];
        const admins = Data.admins.list() || [];
        const grades = Data.grades.list() || [];
        const subjects = Data.subjects.list() || [];
        const topics = Data.topics.list() || [];
        const questions = Data.questions.list() || [];
        const payments = Data.payments.list() || [];
        const charges = Data.charges.list() || [];
        const classes = Data.classes.list() || [];
        const buses = Data.buses.list() || [];
        const routes = Data.routes.list() || [];
        const trips = Data.trips.list() || [];
        const events = Data.events.list() || [];
        const complaints = Data.complaints.list() || [];
        const schedules = Data.schedules.list() || [];
        const books = Data.books.list() || [];
        const lessonAttempts = Data.lessonAttempts.list() || [];
        const attemptEvents = Data.attemptEvents.list() || [];
        const smsEvents = Data.smsEvents.list() || [];
        const assessmentTypes = Data.assessmentTypes.list() || [];
        const assessmentRubrics = Data.assessmentRubrics.list() || [];
        
        // Calculate processed records
        const totalProcessedRecords = students.length + parents.length + teachers.length + admins.length + 
                                   grades.length + subjects.length + topics.length + questions.length + 
                                   payments.length + charges.length + classes.length + buses.length + 
                                   routes.length + trips.length + events.length + complaints.length + 
                                   schedules.length + books.length + lessonAttempts.length + 
                                   attemptEvents.length + smsEvents.length + assessmentTypes.length + 
                                   assessmentRubrics.length;
        
        return (
            <div className="row mb-4">
                {/* Entity Statistics */}
                <div className="col-xl-6 col-lg-12">
                    <div className="kt-portlet kt-portlet--height-fluid">
                        <div className="kt-portlet__head kt-portlet__head--noborder">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">📊 Entity Statistics</h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <div className="row">
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-brand kt-font-xl">{students.length}</div>
                                        <div className="kt-font-sm">Students</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-info kt-font-xl">{parents.length}</div>
                                        <div className="kt-font-sm">Parents</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-warning kt-font-xl">{teachers.length}</div>
                                        <div className="kt-font-sm">Teachers</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-success kt-font-xl">{admins.length}</div>
                                        <div className="kt-font-sm">Admins</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-primary kt-font-xl">{classes.length}</div>
                                        <div className="kt-font-sm">Classes</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-danger kt-font-xl">{grades.length}</div>
                                        <div className="kt-font-sm">Grades</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-metal kt-font-xl">{subjects.length}</div>
                                        <div className="kt-font-sm">Subjects</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-focus kt-font-xl">{topics.length}</div>
                                        <div className="kt-font-sm">Topics</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-warning kt-font-xl">{questions.length}</div>
                                        <div className="kt-font-sm">Questions</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-success kt-font-xl">{payments.length}</div>
                                        <div className="kt-font-sm">Payments</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-info kt-font-xl">{charges.length}</div>
                                        <div className="kt-font-sm">Charges</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-brand kt-font-xl">{buses.length}</div>
                                        <div className="kt-font-sm">Buses</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-primary kt-font-xl">{routes.length}</div>
                                        <div className="kt-font-sm">Routes</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-danger kt-font-xl">{trips.length}</div>
                                        <div className="kt-font-sm">Trips</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-metal kt-font-xl">{events.length}</div>
                                        <div className="kt-font-sm">Events</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-focus kt-font-xl">{complaints.length}</div>
                                        <div className="kt-font-sm">Complaints</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-warning kt-font-xl">{schedules.length}</div>
                                        <div className="kt-font-sm">Schedules</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-success kt-font-xl">{books.length}</div>
                                        <div className="kt-font-sm">Books</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-info kt-font-xl">{lessonAttempts.length}</div>
                                        <div className="kt-font-sm">Lesson Attempts</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-brand kt-font-xl">{attemptEvents.length}</div>
                                        <div className="kt-font-sm">Attempt Events</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-primary kt-font-xl">{smsEvents.length}</div>
                                        <div className="kt-font-sm">SMS Events</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-danger kt-font-xl">{assessmentTypes.length}</div>
                                        <div className="kt-font-sm">Assessment Types</div>
                                    </div>
                                </div>
                                <div className="col-md-4 col-sm-6">
                                    <div className="text-center p-3">
                                        <div className="kt-font-metal kt-font-xl">{assessmentRubrics.length}</div>
                                        <div className="kt-font-sm">Assessment Rubrics</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* System Overview */}
                <div className="col-xl-3 col-lg-6">
                    <div className="kt-portlet kt-portlet--height-fluid">
                        <div className="kt-portlet__head kt-portlet__head--noborder">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">📈 System Overview</h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <div className="text-center mb-4">
                                <div className="kt-font-xxl kt-font-bold kt-font-primary">{totalProcessedRecords.toLocaleString()}</div>
                                <div className="kt-font-sm mt-2">Total Processed Records</div>
                            </div>
                            <div className="row">
                                <div className="col-6">
                                    <div className="text-center">
                                        <div className="kt-font-lg kt-font-success">{learningStats.totalAttempts}</div>
                                        <div className="kt-font-sm">Learning Attempts</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="text-center">
                                        <div className="kt-font-lg kt-font-info">{learningStats.completedAttempts}</div>
                                        <div className="kt-font-sm">Completed</div>
                                    </div>
                                </div>
                                <div className="col-6 mt-3">
                                    <div className="text-center">
                                        <div className="kt-font-lg kt-font-warning">{learningStats.totalQuestions}</div>
                                        <div className="kt-font-sm">Questions Answered</div>
                                    </div>
                                </div>
                                <div className="col-6 mt-3">
                                    <div className="text-center">
                                        <div className="kt-font-lg kt-font-brand">{learningStats.correctAnswers}</div>
                                        <div className="kt-font-sm">Correct Answers</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Usage & Billing */}
                <div className="col-xl-3 col-lg-6">
                    <div className="kt-portlet kt-portlet--height-fluid">
                        <div className="kt-portlet__head kt-portlet__head--noborder">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">💰 Usage & Billing</h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <div className="text-center mb-4">
                                <div className="kt-font-xxl kt-font-bold kt-font-primary">
                                    {Math.floor(learningStats.totalTime / 60)}h {learningStats.totalTime % 60}m
                                </div>
                                <div className="kt-font-sm mt-2">Total Learning Time</div>
                                <div className="progress progress-sm mt-3">
                                    <div className="progress-bar bg-primary" style={{width: '75%'}}></div>
                                </div>
                                <div className="kt-font-sm mt-2">This month</div>
                            </div>
                            <div className="text-center">
                                <div className="kt-font-xxl kt-font-bold kt-font-danger">KES {billingInfo.estimatedCost.toLocaleString()}</div>
                                <div className="kt-font-sm mt-2">Estimated Cost</div>
                                <div className="kt-font-sm mt-3">Rate: KES {billingInfo.ratePerMinute}/min</div>
                                <div className="kt-font-sm">Based on {billingInfo.totalUsageTime} minutes</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Quick Actions */}
                <div className="col-xl-3 col-lg-6">
                    <div className="kt-portlet kt-portlet--height-fluid">
                        <div className="kt-portlet__head kt-portlet__head--noborder">
                            <div className="kt-portlet__head-label">
                                <h3 className="kt-portlet__head-title">🚀 Quick Actions</h3>
                            </div>
                        </div>
                        <div className="kt-portlet__body">
                            <div className="text-center">
                                <button 
                                    className="btn btn-label-success btn-bold btn-lg mb-3 btn-block"
                                    onClick={this.handleMpesaDeposit}
                                >
                                    <i className="la la-mobile"></i> M-Pesa Deposit
                                </button>
                                <button 
                                    className="btn btn-label-brand btn-bold btn-lg mb-3 btn-block"
                                    onClick={() => this.setState({ bankInstructions: true })}
                                >
                                    <i className="la la-university"></i> Bank Deposit
                                </button>
                                <div className="mt-4">
                                    <h6 className="kt-font-bold">📞 Bank Details</h6>
                                    <div className="kt-font-sm">
                                        <div><strong>Bank:</strong> Equity Bank Kenya</div>
                                        <div><strong>Account:</strong> 00802934567890</div>
                                        <div><strong>Name:</strong> Smart Kids School Ltd</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
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
            <div>
                {/* Statistics Cards */}
                {this.renderStatisticsCards()}
                
                {/* Deposits Table */}
                <div className="kt-portlet">
                    <div className="kt-portlet__head">
                        <div className="kt-portlet__head-label">
                            <h3 className="kt-portlet__head-title">Institutional Deposits</h3>
                        </div>
                        <div className="kt-portlet__head-toolbar">
                            <button 
                                className="btn btn-label-success btn-bold mr-2"
                                onClick={this.handleMpesaDeposit}
                            >
                                <i className="la la-mobile"></i> M-Pesa Deposit
                            </button>
                            <button 
                                className="btn btn-label-brand btn-bold"
                                onClick={() => this.setState({ bankInstructions: true })}
                            >
                                <i className="la la-university"></i> Bank Deposit
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
                                                <span className={`kt-badge kt-badge--${deposit.paymentMethod === 'mpesa' ? 'success' : deposit.paymentMethod === 'bank' ? 'primary' : 'info'}`}>
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
            </div>
        );
    };

    renderMpesaModal = () => {
        return (
            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="la la-mobile"></i> M-Pesa Deposit
                            </h4>
                            <button 
                                type="button" 
                                className="close" 
                                onClick={() => this.setState({ showMpesaModal: false })}
                            >
                                <span>&times;</span>
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            this.handleMpesaSubmit({
                                amount: formData.get('amount'),
                                phone: formData.get('phone'),
                                depositorName: formData.get('depositorName'),
                                purpose: formData.get('purpose')
                            });
                        }}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Depositor Name</label>
                                    <input 
                                        type="text" 
                                        name="depositorName"
                                        className="form-control" 
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount (KES)</label>
                                    <input 
                                        type="number" 
                                        name="amount"
                                        className="form-control" 
                                        placeholder="Enter amount"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>M-Pesa Phone Number</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        className="form-control" 
                                        placeholder="254XXXXXXXXX"
                                        pattern="254[0-9]{9}"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Purpose</label>
                                    <select name="purpose" className="form-control">
                                        <option value="institutional_deposit">Institutional Deposit</option>
                                        <option value="fees">School Fees</option>
                                        <option value="development">Development Fund</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="alert alert-info">
                                    <i className="la la-info-circle"></i> 
                                    You will receive an M-Pesa STK push on your phone to complete this payment.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => this.setState({ showMpesaModal: false })}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-success">
                                    <i className="la la-mobile"></i> Initiate Payment
                                </button>
                            </div>
                        </form>
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
                            {this.state.bankInstructions && this.renderBankInstructions()}
                            {this.state.showMpesaModal && this.renderMpesaModal()}
                            {!this.state.bankInstructions && !this.state.showMpesaModal && this.renderDepositsList()}
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }
}

export default InstitutionalDeposits;
