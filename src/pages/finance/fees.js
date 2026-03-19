import React, { Component } from "react";
import Data from "../../utils/data";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import SmsBalanceModal from './components/SmsBalanceModal';
import StatementCard from './components/StatementCard';
import BulkReportSmsModal from "../../components/reports/BulkReportSmsModal";
import { StatCard, DistributionChart, TrendBarChart, AreaChart, RankingList } from "../../components/analytics/DashboardWidgets";

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
        <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex flex-wrap py-2 mr-3">
                <button 
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1" 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                >
                    <i className="ki ki-bold-arrow-back icon-xs"></i>
                </button>
                
                {pages.map(p => (
                    <button 
                        key={p} 
                        className={`btn btn-icon btn-sm border-0 mr-2 my-1 ${currentPage === p ? 'btn-hover-primary active btn-primary' : 'btn-light-primary'}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}

                <button 
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1" 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                >
                    <i className="ki ki-bold-arrow-next icon-xs"></i>
                </button>
            </div>
            <span className="text-muted font-weight-bold mr-4">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total}
            </span>
        </div>
    );
};

// --- MAIN COMPONENT ---

class FeesManagement extends Component {
    state = {
        // Raw Data
        classes: [],
        terms: [],
        students: [],
        payments: [],
        parents: [],
        charges: [],
        chargeTypes: [],
        
        // Filters & Search
        selectedClass: "",
        selectedTerm: "",
        searchTerm: "",
        
        // Processed Data (for performance)
        processedParents: [],
        
        // Pagination
        currentPage: 1,
        itemsPerPage: 15,
        
        loading: true,
        
        // Modals & UI
        expandedParentId: null, // For table row expansion
        showPaymentModal: false,
        showManualPaymentModal: false,
        showEditPaymentModal: false,
        showStatementModal: false, // NEW
        editPaymentData: null,
        statementGroup: null, // NEW
        statementTab: 'statement', // 'statement' or 'sms'
        statementSmsMessage: '',
        paymentStudent: null,
        paymentAmount: 0, // Kept this as it was in the original state, not explicitly removed by instruction
        parentPhone: "",
        processingPayment: false,
        manualPaymentMethod: "CASH",
        manualPaymentNotes: "",
        sendingSms: false,
        
        // M-Pesa Workflow
        paymentStatus: 'IDLE', // IDLE, INITIATING, PROCESSING, SUCCESS, ERROR
        initData: null,
        paymentErrorMessage: "",
        
        showEditPaymentModal: false,
        showAddChargeModal: false,
        showEditChargeModal: false,
        selectedChargeType: "",
        chargeNotes: "",
        selectedChargeTermId: "",
        editPaymentData: null,
        editChargeData: null,
        showBulkSmsModal: false,
        bulkSmsRecipients: [],

        activeTab: 'accounts', // 'accounts' or 'insights'
    };
    
    componentDidMount() {
        console.log("FeesManagement Mounted");
        this.unsubClasses = Data.classes.subscribe(({ classes }) => {
            console.log("Classes Update:", classes?.length);
            this.updateData({ classes, loading: !classes?.length });
        });

        this.unsubSchools = Data.schools.subscribe(({ selectedSchool }) => {
            console.log("School Info Update:", selectedSchool?.name);
            this.setState({ schoolInfo: selectedSchool });
        });
        this.unsubChargeTypes = Data.chargeTypes.subscribe(({ chargeTypes }) => {
            this.updateData({ chargeTypes });
        });
        this.unsubCharges = Data.charges.subscribe(({ charges }) => {
            this.updateData({ charges });
        });
        this.unsubTerms = Data.terms?.subscribe(({ terms }) => {
            console.log("Terms Update:", terms?.length);
            const update = { terms };
            // Removed auto-selection of latest term to default to "All Terms"
            this.updateData(update);
        });
        this.unsubStudents = Data.students.subscribe(({ students }) => {
            console.log("Students Update:", students?.length);
            this.updateData({ students });
        });
        this.unsubParents = Data.parents.subscribe(({ parents }) => {
            console.log("Parents Update:", parents?.length);
            this.updateData({ parents });
        });
        
        if (Data.payments) {
            this.unsubPayments = Data.payments.subscribe(({ payments }) => {
                console.log("Payments Update:", payments?.length);
                this.updateData({ payments });
            });
        } else {
            console.warn("Data.payments is NOT DEFINED");
        }
    }

    checkReadyState = () => {
        const { students, classes, loading } = this.state;
        if (loading && students.length > 0 && classes.length > 0) {
            this.setState({ loading: false });
        }
    };

    componentWillUnmount() {
        if (this.unsubClasses) this.unsubClasses();
        if (this.unsubSchools) this.unsubSchools();
        if (this.unsubTerms) this.unsubTerms();
        if (this.unsubStudents) this.unsubStudents();
        if (this.unsubParents) this.unsubParents();
        if (this.unsubPayments) this.unsubPayments();
        if (this.unsubChargeTypes) this.unsubChargeTypes();
        if (this.unsubCharges) this.unsubCharges();
    }

    // Centralized update handler to trigger recalculation
    updateData = (newData) => {
        console.log("Updating State with keys:", Object.keys(newData));
        
        // Only update if new data actually contains items, 
        // or if we don't have that data in state yet.
        const cleanData = {};
        Object.keys(newData).forEach(key => {
            const val = newData[key];
            if (Array.isArray(val)) {
                // Prevent overwriting existing data with empty arrays from initial subscriptions
                if (val.length > 0 || !this.state[key] || this.state[key].length === 0) {
                    cleanData[key] = val;
                }
            } else {
                cleanData[key] = val;
            }
        });

        if (Object.keys(cleanData).length > 0) {
            this.setState(cleanData, () => {
                console.log("State updated, recalculating financials...");
                this.recalculateFinancials();
                this.checkReadyState();
            });
        }
    };

    handleFilterChange = (key, value) => {
        this.setState({ [key]: value, currentPage: 1 }, this.recalculateFinancials);
    };

    /**
     * CORE LOGIC: Converts raw flat lists into Grouped Parents with calculated balances.
     * Running this only when data/filters change (not every render) is key for 500+ items.
     */
    recalculateFinancials = () => {
        const { students, parents, payments, classes, terms, expected, charges, selectedClass, selectedTerm, searchTerm } = this.state;
        
        console.log("Recalculate Stats:", { 
            students: students.length, 
            parents: parents.length, 
            payments: payments.length, 
            classes: classes.length,
            charges: charges?.length || 0,
            selectedTerm
        });

        // EXIT if any core piece is missing. 
        // We allow payments to be empty, as students might not have paid yet.
        if (!students.length || !parents.length || !classes.length) {
            console.log("Exiting early: missing core data (students, parents, or classes)");
            return;
        }

        // 1. Helper: Get Fee for Class
        const getFees = (classId) => {
            if (!classId) return 0;
            const targetId = String(classId?.id || classId);
            const cls = classes.find(c => String(c.id) === targetId);
            return cls ? (cls.feeAmount || 0) : 0;
        };

        // 2. Helper: Term Date Range
        const term = terms?.find(t => t.id === selectedTerm);
        let dateRange = null;
        if (term?.startDate && term?.endDate) {
            dateRange = { start: new Date(term.startDate).getTime(), end: new Date(term.endDate).getTime() };
            console.log("Using Date Range:", term.name, dateRange);
        }

        // 3. Filter Students first
        let filteredStudents = students;
        if (selectedClass) {
            const selClsId = String(selectedClass);
            filteredStudents = students.filter(s => String(s.class?.id || s.class) === selClsId);
            console.log("Filtered by Class Students:", filteredStudents.length);
        }

        // 4. Group by Parent
        const parentMap = {};
        
        filteredStudents.forEach(student => {
            const pId = String(student.parent?.id || student.parent);
            if (!pId || pId === "undefined" || pId === "null") return;

            if (!parentMap[pId]) {
                const parentObj = parents.find(p => String(p.id) === pId) || student.parent;
                if (!parentObj) return;
                
                parentMap[pId] = {
                    id: pId,
                    parent: { ...parentObj }, // Clone to avoid mutation issues
                    students: [],
                    totalExpected: 0,
                    totalPaid: 0,
                    totalBalance: 0,
                    history: [],
                    charges: []
                };

                // CRITICAL: If the parent object is missing a phone, try to find it in the flat parents list
                if (!parentMap[pId].parent.phone) {
                    const fullParent = parents.find(p => String(p.id) === pId);
                    if (fullParent?.phone) parentMap[pId].parent.phone = fullParent.phone;
                }
            }
            parentMap[pId].students.push(student);
        });

        console.log("Parent Groups Created:", Object.keys(parentMap).length);

        // Map charges to parents (filtered by term if selected)
        if (charges && charges.length > 0) {
            charges.forEach(charge => {
                const parentId = String(charge.parent?.id || charge.parent);
                if (parentMap[parentId]) {
                    // Filter by term if selectedTerm is set
                    if (selectedTerm) {
                        const chargeTermId = String(charge.term?.id || charge.term || "");
                        if (chargeTermId && chargeTermId !== String(selectedTerm)) {
                            // Only filter out if it HAS a termId that doesn't match. 
                            // If it has NO termId, check date range fallback.
                            if (chargeTermId) return; 

                            if (dateRange) {
                                const chargeTime = new Date(charge.time || charge.createdAt).getTime();
                                if (chargeTime < dateRange.start || chargeTime > dateRange.end) return;
                            }
                        }
                    }
                    parentMap[parentId].charges.push(charge);
                }
            });
        }

        // 5. Calculate Finances per Parent Group
        let grandTotalExpected = 0;
        let grandTotalPaid = 0;
        let grandTotalBalance = 0;

        const processedList = Object.values(parentMap).map(group => {
            const normalizePhone = (p) => p ? p.replace(/\D/g, '').slice(-9) : '';
            const normParentPhone = normalizePhone(group.parent.phone);
            const isSingleChild = group.students.length === 1;

            // Gather all relevant payments for this parent
            const allParentPayments = payments.filter(p => {
                const paymentStudentId = String(p.student?.id || p.student || p.metadata?.studentId || "");
                const belongsToMyStudent = group.students.some(s => String(s.id) === paymentStudentId);
                const isParentPhoneMatch = normalizePhone(p.phone) === normParentPhone;
                return belongsToMyStudent || isParentPhoneMatch;
            });

            // Assign terms to all payments based on terms configuration
            const processedAllPayments = allParentPayments.map(p => {
                let metadata = p.metadata;
                if (typeof metadata === 'string' && metadata.trim().startsWith('{')) {
                    try {
                        metadata = JSON.parse(metadata);
                    } catch (e) {
                        console.error("Failed to parse metadata string:", metadata, e);
                    }
                } else if (metadata && typeof metadata === 'object' && metadata.manual) {
                    // It's already an object, likely from a local update or a smart backend
                }

                let pTerm = "Unknown Term";
                const pTime = new Date(p.time || p.createdAt || p.transactionDate).getTime();
                
                // 1. First check if a manual term was explicitly assigned
                if (metadata && metadata.termId) {
                    const explicitTerm = terms?.find(t => String(t.id) === String(metadata.termId));
                    if (explicitTerm) pTerm = explicitTerm.name;
                } else if (!isNaN(pTime)) {
                    // 2. Fallback to automatic date-based assignment
                    const matchingTerm = terms?.find(t => {
                        const start = new Date(t.startDate).getTime();
                        const end = new Date(t.endDate).getTime();
                        return pTime >= start && pTime <= end;
                    });
                    if (matchingTerm) pTerm = matchingTerm.name;
                }
                
                // Also assign studentName
                const pStudentId = String(p.student?.id || p.student || metadata?.studentId || "");
                const matchingStudent = group.students.find(s => String(s.id) === pStudentId);
                let studentName = matchingStudent ? matchingStudent.names : 'Unallocated';
                
                if (isSingleChild && (studentName === 'Unallocated' || !pStudentId || pStudentId === "undefined")) {
                    studentName = group.students[0].names;
                }

                return { ...p, metadata, assignedTerm: pTerm, studentName };
            }).sort((a,b) => new Date(b.time || b.createdAt) - new Date(a.time || a.createdAt));

            // Filter for term History based on dateRange OR explicit termId
            // And exclude failed transactions to reduce noise in active term views
            const relatedPayments = processedAllPayments.filter(p => {
                const isFailed = p.status === 'FAILED' || p.status === 'FAILED_ON_CALLBACK';
                const isPendingMpesa = p.status === 'PENDING' && p.type === 'mpesa_init';
                if (isFailed || isPendingMpesa) return false;

                // If "All Terms" is selected, we show everything (that isn't failed)
                if (!selectedTerm) return true;

                // If a specific term is selected:
                // 1. If the payment has an explicitly mapped term, trust that
                if (p.metadata?.termId) {
                    return String(p.metadata.termId) === String(selectedTerm);
                }

                // 2. Otherwise, use the Time filter fallback
                if (dateRange) {
                    const rawDate = p.time || p.createdAt || p.transactionDate;
                    if (!rawDate) return true; 
                    const t = new Date(rawDate).getTime();
                    if (t < dateRange.start || t > dateRange.end) return false;
                }
                
                // If we have a selectedTerm but no dateRange and no termId, 
                // we'll keep it just in case, but usually we filter it out.
                // However, the above logic covers most cases.
                return true;
            });

            if (relatedPayments.length > 0) {
                console.log(`Parent ${group.parent.name} has ${relatedPayments.length} related payments`);
            }

            // Distribute payments and calculate per-student balances based ONLY on current term payments
            group.students.forEach(student => {
                const classFee = getFees(student.class?.id || student.class);
                
                const studentPayments = relatedPayments.filter(p => {
                    const pStudentId = String(p.student?.id || p.student || p.metadata?.studentId || "");
                    const targetStudentId = String(student.id);
                    
                    if (pStudentId && pStudentId !== "undefined" && pStudentId !== "" && pStudentId !== "null" && pStudentId !== targetStudentId) return false; 
                    if (isSingleChild && (!pStudentId || pStudentId === "undefined" || pStudentId === "null" || pStudentId === "")) return true; 
                    return pStudentId === targetStudentId;
                });

                const paid = studentPayments.reduce((sum, p) => {
                    const isValidStatus = p.status === 'COMPLETED' || p.status === 'PENDING';
                    return isValidStatus ? sum + parseFloat(p.amount || p.ammount || 0) : sum;
                }, 0);
                
                student.finances = { expected: classFee, paid, balance: classFee - paid, history: studentPayments };
                group.totalExpected += classFee;
            });

            const allValidPayments = relatedPayments.filter(p => p.status === 'COMPLETED' || p.status === 'PENDING');
            group.totalPaid = allValidPayments.reduce((sum, p) => sum + parseFloat(p.amount || p.ammount || 0), 0);
            
            // Add custom charges to total expected
            const additionalCharges = group.charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            group.totalCharges = additionalCharges; // Stored so Financial Summary per student can distribute it
            group.totalExpected += additionalCharges;
            
            group.totalBalance = group.totalExpected - group.totalPaid;

            // 5b. Calculate Balance Brought Forward (Previous Terms)
            let balanceBroughtForward = 0;
            if (selectedTerm && dateRange && terms.length > 0) {
                // Find all terms that ended BEFORE the current term started
                const previousTerms = terms.filter(t => {
                    const tEnd = new Date(t.endDate).getTime();
                    return tEnd < dateRange.start && t.id !== selectedTerm;
                });

                // 1. Previous Class Fees
                const prevFees = group.students.reduce((sum, s) => {
                    const fee = getFees(s.class?.id || s.class);
                    return sum + (fee * previousTerms.length);
                }, 0);

                // 2. Previous Charges (Not in current term)
                const prevChargesSum = (charges || []).filter(c => {
                    const pId = String(c.parent?.id || c.parent);
                    if (pId !== group.id) return false;
                    const cTermId = String(c.term?.id || c.term || "");
                    if (cTermId) {
                        return previousTerms.some(pt => String(pt.id) === cTermId);
                    }
                    const cTime = new Date(c.time || c.createdAt).getTime();
                    return cTime < dateRange.start;
                }).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

                // 3. Previous Payments (Not in current term)
                const prevPaymentsSum = processedAllPayments.filter(p => {
                    const isFailed = p.status === 'FAILED' || p.status === 'FAILED_ON_CALLBACK';
                    const isPendingMpesa = p.status === 'PENDING' && p.type === 'mpesa_init';
                    if (isFailed || isPendingMpesa) return false;

                    if (p.metadata?.termId) {
                        return previousTerms.some(pt => String(pt.id) === String(p.metadata.termId));
                    }
                    const rawDate = p.time || p.createdAt || p.transactionDate;
                    if (!rawDate) return false;
                    const t = new Date(rawDate).getTime();
                    return t < dateRange.start;
                }).reduce((sum, p) => sum + parseFloat(p.amount || p.ammount || 0), 0);

                balanceBroughtForward = (prevFees + prevChargesSum) - prevPaymentsSum;
            }

            group.balanceBroughtForward = balanceBroughtForward;
            group.totalBalance += balanceBroughtForward; // Add BBF to the total outstanding balance
            
            group.history = relatedPayments;
            group.allHistory = processedAllPayments;

            return group;
        });

        // 6. Apply Search Filter
        const termLower = searchTerm.toLowerCase();
        const filteredList = processedList.filter(g => {
            if (!searchTerm) return true;
            if (g.parent.name?.toLowerCase().includes(termLower)) return true;
            if (g.parent.phone?.includes(termLower)) return true;
            // Search inside students
            return g.students.some(s => s.names?.toLowerCase().includes(termLower));
        });

        // 7. Calculate Grand Totals (Stats) - Removed analytics section
        // filteredList.forEach(g => {
        //     grandTotalExpected += g.totalExpected;
        //     grandTotalPaid += g.totalPaid;
        //     grandTotalBalance += g.totalBalance;
        // });

        this.setState({ 
            processedParents: filteredList
        }, () => {
            // Auto-expand the first item if none is expanded and we have items
            if (!this.state.expandedParentId && filteredList.length > 0) {
                this.setState({ expandedParentId: filteredList[0].id });
            }
        });
    };

    // --- Actions ---

    toggleRow = (parentId) => {
        this.setState(prev => ({ expandedParentId: prev.expandedParentId === parentId ? null : parentId }));
    };

    openPaymentModal = (parentGroup) => {
        this.setState({
            showPaymentModal: true,
            showManualPaymentModal: false,
            paymentStudent: null,
            selectedStudentId: "",
            paymentStudents: parentGroup.students,
            paymentAmount: parentGroup.totalBalance > 0 ? parentGroup.totalBalance : 0,
            parentPhone: parentGroup.parent.phone,
            manualPaymentMethod: "CASH",
            manualPaymentNotes: "",
            manualPaymentTermId: "",
            parentGroup
        });
    };

    openManualPaymentModal = (parentGroup) => {
        this.setState({
            showPaymentModal: false,
            showManualPaymentModal: true,
            paymentStudent: null,
            selectedStudentId: "",
            paymentStudents: parentGroup.students,
            paymentAmount: parentGroup.totalBalance > 0 ? parentGroup.totalBalance : 0,
            parentPhone: parentGroup.parent.phone,
            manualPaymentMethod: "CASH",
            manualPaymentNotes: "",
            manualPaymentTermId: "",
            parentGroup
        });
    };

    openAddChargeModal = (parentGroup) => {
        this.setState({
            showAddChargeModal: true,
            parentGroup,
            selectedChargeType: "",
            chargeNotes: "",
            selectedChargeTermId: this.state.selectedTerm || ""
        });
    };

    openEditChargeModal = (charge, parentGroup) => {
        this.setState({
            showEditChargeModal: true,
            parentGroup,
            editChargeData: {
                ...charge,
                termId: charge.term?.id || charge.term || ""
            }
        });
    };

    recordCharge = async () => {
        const { selectedChargeType, chargeNotes, parentGroup, selectedTerm } = this.state;
        if (!selectedChargeType || !parentGroup) return;

        const chargeType = this.state.chargeTypes.find(c => String(c.id) === String(selectedChargeType));
        if (!chargeType) return;

        this.setState({ processingPayment: true });
        try {
            await Data.charges.create({
                school: localStorage.getItem('school'),
                parent: parentGroup.id,
                amount: parseFloat(chargeType.amount),
                reason: chargeNotes || chargeType.name,
                chargeType: selectedChargeType,
                time: new Date().toISOString(),
                term: this.state.selectedChargeTermId || undefined
            });
            if(window.toastr) window.toastr.success("Charge added successfully!");
            this.setState({ showAddChargeModal: false });
            this.recalculateFinancials();
        } catch (e) {
            if(window.toastr) window.toastr.error(e.message || "Failed to add charge");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    updateCharge = async () => {
        const { editChargeData } = this.state;
        if (!editChargeData) return;

        this.setState({ processingPayment: true });
        try {
            await Data.charges.update({
                id: editChargeData.id,
                reason: editChargeData.reason,
                amount: String(editChargeData.amount),
                term: editChargeData.termId || undefined
            });
            if(window.toastr) window.toastr.success("Charge updated successfully!");
            this.setState({ showEditChargeModal: false, editChargeData: null });
            this.recalculateFinancials();
        } catch (e) {
            if(window.toastr) window.toastr.error(e.message || "Failed to update charge");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    deletePayment = async (payment) => {
        if (!window.confirm(`Are you sure you want to delete this payment of KES ${parseFloat(payment.amount || 0).toLocaleString()}?`)) return;

        this.setState({ processingPayment: true });
        try {
            await Data.payments.delete(payment);
            if (window.toastr) window.toastr.success("Payment deleted successfully");
            this.recalculateFinancials();
        } catch (e) {
            if (window.toastr) window.toastr.error(e.message || "Failed to delete payment");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    initiatePayment = async () => {
        const { paymentAmount, parentPhone, selectedStudentId } = this.state;
        if (!parentPhone) return window.toastr && window.toastr.error("Parent phone missing");
        
        this.setState({ processingPayment: true, paymentStatus: 'INITIATING', paymentErrorMessage: "" });
        try {
            const result = await Data.schools.charge(parentPhone, paymentAmount, { studentId: selectedStudentId });
            
            // charge() returns response.payments.init: { id, CheckoutRequestID, MerchantRequestID }
            const initData = result?.payments?.init;
            if (result?.errors || !initData) {
                throw new Error(result?.errors?.[0]?.message || 'Failed to initiate payment.');
            }

            this.setState({ paymentStatus: 'PROCESSING', initData });
            this.startPaymentPolling(initData, paymentAmount);
            
            if(window.toastr) window.toastr.success("STK Push sent!");
        } catch (e) {
            this.setState({ paymentStatus: 'ERROR', paymentErrorMessage: e.message || "Failed" });
            if(window.toastr) window.toastr.error(e.message || "Failed");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    startPaymentPolling = (initData, amount) => {
        const pollPayment = async () => {
            try {
                const result = await Data.schools.verifyTx(initData);
                if (result?.errors || !result?.payments?.confirm) return;

                const { status: txStatus, message } = result.payments.confirm;
                
                if (txStatus === 'COMPLETED') {
                    this.setState({ paymentStatus: 'SUCCESS' });
                    this.stopPolling();
                    if(window.toastr) window.toastr.success("Payment confirmed!");
                    this.recalculateFinancials();
                    // Close modal after success
                    setTimeout(() => {
                        this.setState({ showPaymentModal: false, paymentStatus: 'IDLE' });
                    }, 2000);
                } else if (txStatus && txStatus.startsWith('FAILED')) {
                    this.setState({ paymentStatus: 'ERROR', paymentErrorMessage: message || 'Payment failed.' });
                    this.stopPolling();
                }
            } catch (error) {
                console.error('Payment polling error:', error);
            }
        };

        // Start polling every 3 seconds
        this.pollingInterval = setInterval(pollPayment, 3000);
        
        // Timeout after 3 minutes
        this.pollingTimeout = setTimeout(() => {
            this.stopPolling();
            if (this.state.paymentStatus === 'PROCESSING') {
                this.setState({ paymentStatus: 'ERROR', paymentErrorMessage: 'Payment timed out. Please check your phone.' });
            }
        }, 180000);
    };
    
    recordManualPayment = async () => {
        const { paymentAmount, parentPhone, manualPaymentMethod, manualPaymentNotes, manualPaymentTermId, selectedStudentId } = this.state;
        if (!parentPhone) return window.toastr && window.toastr.error("Parent phone required");
        
        this.setState({ processingPayment: true });
        try {
            await Data.payments.create({
                school: localStorage.getItem('school'),
                phone: parentPhone,
                amount: String(paymentAmount),
                status: 'COMPLETED',
                type: 'fees_manual',
                paymentType: manualPaymentMethod,
                student: selectedStudentId,
                time: new Date().toISOString(),
                ref: manualPaymentNotes || 'Manual Entry',
                resultDesc: `Manual: ${manualPaymentMethod}`,
                metadata: { 
                    manual: true, 
                    studentId: selectedStudentId, 
                    method: manualPaymentMethod,
                    termId: manualPaymentTermId || undefined,
                    studentName: this.state.paymentStudent?.names 
                }
            });
            if(window.toastr) window.toastr.success("Recorded successfully!");
            this.setState({ showManualPaymentModal: false });
            this.recalculateFinancials();
        } catch (e) {
            if(window.toastr) window.toastr.error(e.message || "Failed");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    openEditPaymentModal = (payment) => {
        let parsedMetadata = payment.metadata || {};
        if (typeof parsedMetadata === 'string') {
            try {
                parsedMetadata = JSON.parse(parsedMetadata);
            } catch (e) {
                console.error("Failed to parse metadata in edit modal", e);
                parsedMetadata = {};
            }
        }
        
        this.setState({
            showEditPaymentModal: true,
            editPaymentData: { 
                ...payment,
                metadata: parsedMetadata 
            }
        });
    };

    updatePayment = async () => {
        const { editPaymentData } = this.state;
        if (!editPaymentData || !editPaymentData.id) return;
        
        this.setState({ processingPayment: true });
        try {
            await Data.payments.update({
                id: editPaymentData.id,
                amount: String(editPaymentData.amount),
                paymentType: editPaymentData.paymentType,
                ref: editPaymentData.ref || editPaymentData.mpesaReceiptNumber,
                time: editPaymentData.time || editPaymentData.createdAt,
                metadata: { 
                    ...editPaymentData.metadata, 
                    method: editPaymentData.paymentType,
                    termId: editPaymentData.metadata?.termId // Ensure termId is passed back
                }
            });
            if(window.toastr) window.toastr.success("Payment updated successfully!");
            this.setState({ showEditPaymentModal: false, editPaymentData: null });
            this.recalculateFinancials();
        } catch (e) {
            if(window.toastr) window.toastr.error(e.message || "Failed");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    restoreRecord = async (type, id) => {
        if (!window.confirm("Are you sure you want to restore this record?")) return;
        
        this.setState({ processingPayment: true });
        try {
            await Data[type].restore({ id });
            if(window.toastr) window.toastr.success("Record restored successfully!");
            this.recalculateFinancials();
        } catch (e) {
            if(window.toastr) window.toastr.error(e.message || "Failed to restore record");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    // Keep the Print/SMS logic from V1, but reference the processed data structure
    sendBalanceSms = async (group) => {
        const { students, parent, totalBalance } = group;
        if (!parent?.phone) return;
        this.setState({ sendingSms: true });
        const studentNames = students.map(s => s.names).join(", ");
        const msg = `Dear Parent, fee balance for ${studentNames} is KES ${totalBalance.toLocaleString()}. Please clear it.`;
        try {
            await Data.communication.sms.create({ phone: parent.phone, message: msg });
            if(window.toastr) window.toastr.success("SMS Sent");
        } catch(e) { console.error(e); } finally { this.setState({ sendingSms: false }); }
    };

    initiateBulkFinanceSms = () => {
        const { processedParents, selectedTerm, terms } = this.state;
        const currentTerm = terms?.find(t => t.id === selectedTerm) || { name: 'Term' };

        if (!processedParents.length) {
            if (window.toastr) window.toastr.warning("No parents found with current filters.");
            return;
        }

        const recipients = processedParents.map(group => {
            const { students, parent, totalBalance, totalExpected, totalPaid, charges, history } = group;
            if (!parent) return null;

            const studentNames = students.map(s => s.names).join(", ");

            // Build comprehensive statement message
            let message = `--- FEE STATEMENT ---\n`;
            message += `Parent: ${parent.name || 'Parent'}\n`;
            message += `Period: ${selectedTerm ? currentTerm.name : 'All Terms'}\n\n`;

            // Per-student fee breakdown
            students.forEach(s => {
                const sf = s.finances || {};
                message += `${s.names}:\n`;
                message += `  Expected: KES ${(sf.expected || 0).toLocaleString()}\n`;
                message += `  Paid: KES ${(sf.paid || 0).toLocaleString()}\n`;
                message += `  Balance: KES ${(sf.balance || 0).toLocaleString()}\n`;
            });

            // Additional charges
            if (charges && charges.length > 0) {
                message += `\nAdditional Charges:\n`;
                charges.forEach(c => {
                    message += `  ${c.chargeType?.name || c.reason}: KES ${parseFloat(c.amount || 0).toLocaleString()}\n`;
                });
            }

            // Last payment
            const lastPayment = (history || []).filter(h => h.status === 'COMPLETED')[0];
            if (lastPayment) {
                const pDate = new Date(lastPayment.time || lastPayment.createdAt).toLocaleDateString('en-GB');
                message += `\nLast Payment: KES ${parseFloat(lastPayment.amount || 0).toLocaleString()} on ${pDate}`;
                if (lastPayment.mpesaReceiptNumber || lastPayment.ref) {
                    message += ` (${lastPayment.mpesaReceiptNumber || lastPayment.ref})`;
                }
                message += '\n';
            }

            message += `\nTotal Balance: KES ${totalBalance.toLocaleString()}\n`;
            message += `Please clear your balance. Contact the school for inquiries.`;

            return {
                id: group.id,
                parentId: group.id,
                name: parent.name || 'Parent',
                phone: parent.phone || '',
                studentNames: studentNames,
                message
            };
        }).filter(r => r !== null);

        this.setState({
            showBulkSmsModal: true,
            bulkSmsRecipients: recipients
        });
    };

    handleBulkSmsSend = async (finalMessages) => {
        let sentCount = 0;
        let failCount = 0;

        for (const msgObj of finalMessages) {
            try {
                await Data.communication.sms.create({
                    phone: msgObj.phone,
                    message: msgObj.message
                });
                sentCount++;
            } catch (e) {
                console.error(`Failed to send SMS to ${msgObj.phone}:`, e);
                failCount++;
            }
        }

        if (window.toastr) {
            if (failCount === 0) window.toastr.success(`Successfully sent ${sentCount} messages.`);
            else window.toastr.warning(`Sent ${sentCount}, Failed ${failCount}.`);
        }
    };

    handleSaveParentPhone = async (parentId, newPhone) => {
        if (!parentId || !newPhone) return;
        await Data.parents.update({ id: parentId, phone: newPhone });
    };

    showStatementPreview = (group) => {
        const { students, totalBalance } = group;
        const studentNames = students.map(s => s.names).join(", ");
        const defaultMsg = `Dear Parent, fee balance for ${studentNames} is KES ${totalBalance.toLocaleString()}. Please clear it.`;
        
        this.setState({
            showStatementModal: true,
            statementGroup: group,
            statementTab: 'statement',
            statementSmsMessage: defaultMsg
        });
    };

    sendStatementSms = async () => {
        const { statementGroup, statementSmsMessage } = this.state;
        if (!statementGroup || !statementGroup.parent?.phone) return;
        
        this.setState({ sendingSms: true });
        try {
            await Data.communication.sms.create({ phone: statementGroup.parent.phone, message: statementSmsMessage });
            if(window.toastr) window.toastr.success("SMS Sent successfully!");
        } catch(e) { 
            console.error(e); 
            if(window.toastr) window.toastr.error("Failed to send SMS");
        } finally { 
            this.setState({ sendingSms: false }); 
            this.setState({ showStatementModal: false, statementGroup: null });
        }
    };

    sendBalanceSms = (group) => {
        if (!group) return;
        this.setState({ showSmsModal: true, smsGroup: group });
    };

    handleSendSms = async (message) => {
        try {
            await Data.communication.sms.create({
                phone: this.state.smsGroup.parent.phone,
                message: message
            });
            if(window.toastr) window.toastr.success("SMS sent successfully.");
        } catch (e) {
            console.error(e);
            if(window.toastr) window.toastr.error("Failed to send SMS.");
        }
    };

    executePrintStatement = () => {
         const { statementGroup } = this.state;
         if (!statementGroup) return;
         
         // Instead of window.print builder, use our new component view
         this.setState({ showPrintView: true, printGroup: statementGroup, showStatementModal: false, statementGroup: null });
    };

    showStatementPreview = (group) => {
        this.setState({ showPrintView: true, printGroup: group });
    };

    togglePrintView = () => {
        this.setState(prev => ({ showPrintView: !prev.showPrintView }));
    };

    handlePrint = () => {
        window.print();
    };

    renderInsights = () => {
        const { payments, charges, students, classes } = this.state;
        
        const validPayments = (payments || []).filter(p => !p.status || p.status === 'COMPLETED');
        const totalCollected = validPayments.reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
        const totalCharges = (charges || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalArrears = Math.max(0, totalCharges - totalCollected);
        const collectionRate = totalCharges > 0 ? Math.round((totalCollected / totalCharges) * 100) : 0;

        // 2. Payment Methods split
        const methods = {};
        (payments || []).forEach(p => {
            const m = p.method || p.paymentType || 'M-Pesa';
            methods[m] = (methods[m] || 0) + (parseFloat(p.amount || p.ammount) || 0);
        });
        const methodData = Object.keys(methods).map(m => ({
            label: m,
            value: methods[m],
            color: m === 'M-Pesa' ? '#3699ff' : m === 'CASH' ? '#10b981' : '#f6c23e'
        }));

        // 3. Arrears by class (Ranking)
        const classArrears = (classes || []).map(cls => {
            const classStudents = (students || []).filter(s => s.class?.id === cls.id || s.class === cls.id);
            const classStudentIds = new Set(classStudents.map(s => s.id));
            const classPaid = validPayments.filter(p => classStudentIds.has(p.student?.id || p.student)).reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
            const classExpected = (charges || []).filter(c => classStudentIds.has(c.student?.id || c.student)).reduce((sum, c) => sum + parseFloat(c.amount), 0);
            return {
                label: cls.name,
                subtext: `${classStudents.length} Students`,
                value: Math.max(0, classExpected - classPaid),
                color: '#e74c3c'
            };
        }).filter(c => c.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);

        // 4. Revenue Trend (Last 7 days)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const dayPayments = validPayments.filter(p => {
                const pDate = new Date(p.time || p.createdAt);
                return pDate.toDateString() === d.toDateString();
            });
            const sum = dayPayments.reduce((acc, p) => acc + (parseFloat(p.amount || p.ammount) || 0), 0);
            days.push({ label: dateStr, value: sum });
        }

        return (
            <div className="animate__animated animate__fadeInUp">
                {/* ROW 1: MISSION CONTROL STATS */}
                <div className="row">
                    <div className="col-md-3">
                        <StatCard title="Total Collections" value={`KES ${totalCollected.toLocaleString()}`} icon="flaticon2-shopping-cart-1" color="#10b981" trend={12} />
                    </div>
                    <div className="col-md-3">
                        <StatCard title="Total Arrears" value={`KES ${totalArrears.toLocaleString()}`} icon="flaticon2-warning" color="#e74c3c" trend={-5} />
                    </div>
                    <div className="col-md-3">
                        <StatCard title="Collection Rate" value={`${collectionRate}%`} icon="flaticon2-line-chart" color="#3699ff" trend={3} />
                    </div>
                    <div className="col-md-3">
                        <StatCard title="Fee Targets" value={`KES ${totalCharges.toLocaleString()}`} icon="flaticon2-correct" color="#f6c23e" subtext="Expected revenue" />
                    </div>
                </div>

                {/* ROW 2: PRIMARY ANALYTICS (3 COLUMNS) */}
                <div className="row mt-4">
                    <div className="col-lg-4">
                        <DistributionChart title="Payment Methods (KES)" data={methodData} />
                    </div>
                    <div className="col-lg-4">
                        <TrendBarChart title="Arrears by Class" data={classArrears.map(c => ({ label: c.label, value: c.value, color: c.color }))} />
                    </div>
                    <div className="col-lg-4">
                        <AreaChart title="Daily Revenue Trend" data={days} color="#10b981" />
                    </div>
                </div>

                {/* ROW 3: RANKINGS */}
                <div className="row mt-4">
                    <div className="col-lg-12">
                        <RankingList title="Critical Outstanding Balances" data={classArrears} valuePrefix="KES " height={400} />
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const { 
            classes, terms, selectedClass, selectedTerm, searchTerm, 
            processedParents, currentPage, itemsPerPage, expandedParentId, loading,
            showPrintView, printGroup, schoolInfo, showSmsModal, smsGroup
        } = this.state;

        if (showPrintView && printGroup) {
            const isValidPayment = (p) => p.type === 'fees_manual' || p.metadata?.manual === true || p.status === 'COMPLETED';

            const validStudentsData = printGroup.students.map(s => {
                const validHistory = s.finances.history.filter(isValidPayment);
                const validPaid = validHistory.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                return {
                    names: s.names,
                    expected: s.finances.expected,
                    paid: validPaid,
                    balance: s.finances.expected - validPaid,
                    history: validHistory
                };
            });
            
            const totalClassFees = validStudentsData.reduce((sum, s) => sum + s.expected, 0);
            const totalCharges = printGroup.charges ? printGroup.charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) : 0;
            const totalValidExpected = totalClassFees + totalCharges;
            const totalValidPaid = validStudentsData.reduce((sum, s) => sum + s.paid, 0);
            const totalValidBalance = totalValidExpected - totalValidPaid;

            return (
              <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
                  <Navbar />
                  <Subheader links={["Finance", "Fees Statement"]} />

                  <div className="kt-content kt-grid__item kt-grid__item--fluid" style={{height:"auto"}} id="kt_content">
                    <div className="kt-container">
                        <div className="d-print-none p-4 border-bottom mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm">
                            <button className="btn btn-secondary" onClick={this.togglePrintView}>
                                <i className="fa fa-arrow-left"></i> Back to Fees
                            </button>
                            <div>
                                <h4 className="m-0 font-weight-bold">Statement Preview</h4>
                            </div>
                            <div>
                                <button className="btn btn-primary" onClick={this.handlePrint}>
                                    <i className="fa fa-print mr-2"></i> Print Statement
                                </button>
                            </div>
                        </div>
                        <div id="print-area" style={{ backgroundColor: '#f3f4f6', paddingTop: '20px', paddingBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                            <StatementCard 
                                group={printGroup} 
                                school={schoolInfo} 
                                validStudentsData={validStudentsData} 
                                totalValidExpected={totalValidExpected} 
                                totalValidPaid={totalValidPaid} 
                                totalValidBalance={totalValidBalance} 
                            />
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
                              padding-top: 0 !important;
                              margin-top: 0 !important;
                          }

                           /* Ensure Statement Card fills space */
                          .report-card-container { 
                              page-break-after: auto; 
                              width: 100% !important; 
                              max-width: none !important;
                              height: auto !important; 
                              min-height: 28cm; 
                              border: none !important; 
                              margin: 0 !important; 
                              padding: 1.0cm 1.5cm !important; 
                              box-shadow: none !important; 
                          }
                      }
                  `}</style>
                </div>
              </div>
            );
        }

        // Pagination Logic
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = processedParents.slice(indexOfFirstItem, indexOfLastItem);

        return (
          <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
              <Navbar />

              <div className="kt-content kt-grid__item kt-grid__item--fluid pt-0" style={{height:"100vh"}} id="kt_content">
                <div className="kt-container pt-0">
                    <div className="card card-custom gutter-b">
                        <div className="card-header border-0 pt-5 pb-2 d-flex flex-column align-items-stretch">
                            <div className="mb-4 d-flex flex-column">
                                <h1 className="font-weight-bolder text-dark font-size-h3 mb-0">Fees Management</h1>
                                <div className="text-muted font-weight-bold font-size-sm mt-1">Manage student balances and payments</div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                                <ul className="nav nav-tabs nav-tabs-line nav-bold nav-tabs-line-2x border-0 mb-0">
                                    <li className="nav-item">
                                        <a 
                                            className={`nav-link py-4 ${this.state.activeTab === 'accounts' ? 'active' : ''}`} 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'accounts' }); }}
                                        >
                                            Accounts List
                                        </a>
                                    </li>
                                    <li className="nav-item">
                                        <a 
                                            className={`nav-link py-4 ${this.state.activeTab === 'insights' ? 'active' : ''}`} 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'insights' }); }}
                                        >
                                            Financial Insights
                                        </a>
                                    </li>
                                </ul>

                                <div className="card-toolbar d-flex align-items-center">
                                    <div className="dropdown dropdown-inline mr-2">
                                        <select className="form-control form-control-sm form-control-solid" value={selectedTerm} onChange={e => this.handleFilterChange('selectedTerm', e.target.value)}>
                                            <option value="">Term...</option>
                                            {terms && terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="dropdown dropdown-inline mr-4">
                                        <select className="form-control form-control-sm form-control-solid" value={selectedClass} onChange={e => this.handleFilterChange('selectedClass', e.target.value)}>
                                            <option value="">Class...</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <button 
                                        className="btn btn-sm btn-primary font-weight-bold"
                                        onClick={this.initiateBulkFinanceSms}
                                        disabled={loading || processedParents.length === 0}
                                    >
                                        <i className="fa fa-sms"></i> Bulk SMS
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card-body py-0">
                            {loading ? <SkeletonLoader /> : (
                            <>
                            {/* SEARCH & FILTER */}
                            <div className="input-icon input-icon-right mb-5">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Search Parent Name, Phone, or Student Name..." 
                                    value={searchTerm}
                                    onChange={e => this.handleFilterChange('searchTerm', e.target.value)}
                                />
                                <span><i className="flaticon2-search-1 icon-md"></i></span>
                            </div>

                            {/* MAIN TABLE */}
                            {this.state.activeTab === 'accounts' ? (
                                <>
                                <div className="table-responsive">
                                <table className="table table-head-custom table-vertical-center" id="kt_advance_table_widget_1">
                                    <thead>
                                        <tr className="text-left">
                                            <th style={{minWidth: "200px"}}>Parent Details</th>
                                            <th style={{minWidth: "150px"}}>Students</th>
                                            <th style={{minWidth: "120px"}}>Total Expected Payment</th>
                                            <th style={{minWidth: "120px"}}>Total Paid</th>
                                            <th style={{minWidth: "120px"}}>Balance</th>
                                            <th style={{minWidth: "150px"}}>Last Payment</th>
                                            <th className="text-right" style={{minWidth: "150px"}}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(group => {
                                            const isExpanded = expandedParentId === group.id;
                                            const hasArrears = group.totalBalance > 0;
                                            const lastPayment = group.history.length > 0 ? group.history[0] : null;
                                            const completedPayments = group.history.filter(p => p.status === 'COMPLETED').length;
                                            
                                            return (
                                                <React.Fragment key={group.id}>
                                                    <tr className={`${isExpanded ? "bg-light-primary" : ""}`}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="symbol symbol-40 symbol-light-success flex-shrink-0">
                                                                    <span className="symbol-label font-size-h5 font-weight-bold">{group.parent.name?.[0]}</span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-dark-75 font-weight-bolder font-size-lg mb-0">
                                                                        {group.parent.name}
                                                                        {group.parent.isDeleted && <span className="label label-inline label-light-danger ml-2">Archived</span>}
                                                                    </div>
                                                                    <span className="text-muted font-weight-bold text-hover-primary">{group.parent.phone}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="text-dark-75 font-weight-bolder d-block font-size-lg">{group.students.length} Student(s)</span>
                                                            <span className="text-muted font-weight-bold">{group.students.map(s => s.names.split(' ')[0]).join(', ')}</span>
                                                        </td>
                                                        <td>
                                                            <span className="text-dark-75 font-weight-bolder d-block font-size-lg">{group.totalExpected.toLocaleString()}</span>
                                                            <span className="text-muted font-size-xs">
                                                                Current: {(group.totalExpected - group.totalCharges - (group.balanceBroughtForward || 0)).toLocaleString()} 
                                                                {group.totalCharges > 0 && ` + Charges: ${group.totalCharges.toLocaleString()}`}
                                                                {group.balanceBroughtForward && group.balanceBroughtForward !== 0 && ` + Brought Forward: ${group.balanceBroughtForward.toLocaleString()}`}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex flex-column">
                                                                <span className="text-success font-weight-bolder font-size-lg">{group.totalPaid.toLocaleString()}</span>
                                                                <span className="text-muted font-size-xs">{completedPayments} payments</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`label label-lg label-inline font-weight-bold py-4 ${hasArrears ? 'label-light-danger' : 'label-light-success'}`}>
                                                                {group.totalBalance.toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {lastPayment ? (
                                                                <div className="d-flex flex-column">
                                                                    <span className="text-dark-75 font-weight-bold font-size-sm">
                                                                        {new Date(lastPayment.time || lastPayment.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="text-muted font-size-xs">
                                                                        KES {parseFloat(lastPayment.amount).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted font-size-sm">No payments</span>
                                                            )}
                                                        </td>
                                                        <td className="text-right pr-0">
                                                            {group.parent.isDeleted ? (
                                                                <button 
                                                                    className="btn btn-icon btn-light-warning btn-sm mx-1" 
                                                                    onClick={() => this.restoreRecord('parents', group.parent.id)}
                                                                    title="Restore Parent"
                                                                >
                                                                    <i className="flaticon2-refresh"></i>
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button 
                                                                        className="btn btn-icon btn-light-primary btn-sm mx-1" 
                                                                        onClick={() => this.toggleRow(group.id)}
                                                                        title="View Details"
                                                                    >
                                                                        <i className={`flaticon2-${isExpanded ? 'up' : 'down'}`}></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-icon btn-light-success btn-sm mx-1"
                                                                        onClick={() => this.showStatementPreview(group)}
                                                                        title="Print Statement"
                                                                    >
                                                                        <i className="fa fa-print text-dark"></i>
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-icon btn-light-info btn-sm mx-1"
                                                                        onClick={() => this.sendBalanceSms(group)}
                                                                        title="Send SMS balance"
                                                                    >
                                                                        <i className="flaticon2-paper-plane"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* EXPANDED DETAILS ROW */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="7" className="bg-light-primary pl-10 pr-10 pb-5">
                                                                <div className="row mt-3">
                                                                    <div className="col-md-12 mb-5 d-flex gap-4">
                                                                        {/* BALANCE BROUGHT FORWARD ALERT */}
                                                                        {group.balanceBroughtForward !== 0 && (
                                                                            <div className={`alert alert-custom py-2 mb-0 shadow-sm border-0 mr-4 ${group.balanceBroughtForward > 0 ? 'alert-light-danger' : 'alert-light-success'}`} style={{flex: 1}}>
                                                                                <div className="alert-icon"><i className={`flaticon2-${group.balanceBroughtForward > 0 ? 'warning' : 'check-mark'} ${group.balanceBroughtForward > 0 ? 'text-danger' : 'text-success'}`}></i></div>
                                                                                <div className="alert-text font-size-sm">
                                                                                    <span className="font-weight-bolder">Balance Brought Forward:</span> KES {group.balanceBroughtForward.toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* UNALLOCATED ALERT for multi-child families */}
                                                                        {(() => {
                                                                            const unallocatedSum = group.history
                                                                                .filter(h => h.studentName === 'Unallocated' && h.status === 'COMPLETED')
                                                                                .reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
                                                                            if (unallocatedSum > 0 && group.students.length > 1) {
                                                                                return (
                                                                                    <div className="alert alert-custom alert-light-warning py-2 mb-0 shadow-sm border-0">
                                                                                        <div className="alert-icon"><i className="flaticon-warning text-warning"></i></div>
                                                                                        <div className="alert-text font-size-sm">
                                                                                            <span className="font-weight-bolder">KES {unallocatedSum.toLocaleString()}</span> is unallocated.
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                    <div className="col-md-12">
                                                                        <div className="row">
                                                                            {/* LEFT COLUMN: Filtered Views */}
                                                                            <div className="col-md-7">
                                                                                <div className="row">
                                                                                    {/* 1. Filtered Term Payments */}
                                                                                    <div className="col-md-12 mb-6">
                                                                                        <h6 className="font-weight-bold mb-3 d-flex justify-content-between align-items-center">
                                                                                            Filtered Term Payments
                                                                                                                             <div className="d-flex">
                                                                                                 <button className="btn btn-xs btn-light-success mr-1" onClick={() => this.openManualPaymentModal(group)} title="Record Cash Payment">
                                                                                                     <i className="flaticon2-plus icon-xs"></i> Record
                                                                                                 </button>
                                                                                                 <button className="btn btn-xs btn-light-primary" onClick={() => this.openPaymentModal(group)} title="Request M-Pesa Payment">
                                                                                                     <i className="fa fa-mobile-alt icon-xs"></i> M-Pesa
                                                                                                 </button>
                                                                                             </div>
                                                                                        </h6>
                                                                                        <div style={{maxHeight: '250px', overflowY: 'auto'}} className="border rounded p-3 bg-white">
                                                                                            {group.history.length === 0 && <span className="text-muted small">No payments in this term.</span>}
                                                                                            {group.history.map(h => (
                                                                                                <div key={h.id} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                                                                                    <div className="d-flex flex-column">
                                                                                                        <span className="text-dark-75 font-weight-bold font-size-sm">
                                                                                                            {h.paymentType || h.type || 'M-Pesa'} 
                                                                                                            <span className="text-muted font-weight-normal ml-2">- {h.studentName}</span>
                                                                                                        </span>
                                                                                                        <span className="text-muted font-size-xs">{new Date(h.time || h.createdAt).toLocaleDateString()}</span>
                                                                                                        <span className="text-muted font-size-xs">{h.mpesaReceiptNumber || h.ref}</span>
                                                                                                    </div>
                                                                                                    <div className="d-flex align-items-center">
                                                                                                        <span className="text-success font-weight-bolder font-size-sm mr-2">KES {parseFloat(h.amount || h.ammount || 0).toLocaleString()}</span>
                                                                                                        <button className="btn btn-icon btn-xs btn-light-primary" onClick={() => this.openEditPaymentModal(h)} title="Edit"><i className="flaticon2-pen"></i></button>
                                                                                                        <button className="btn btn-icon btn-xs btn-light-danger ml-1" onClick={() => this.deletePayment(h)} title="Delete"><i className="flaticon2-trash"></i></button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 2. Filtered Charges */}
                                                                                    <div className="col-md-12">
                                                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                                                            <h6 className="font-weight-bold mb-0">Filtered Charges</h6>
                                                                                            <button className="btn btn-xs btn-light-primary font-weight-bolder" onClick={() => this.openAddChargeModal(group)}>
                                                                                                <i className="flaticon2-plus icon-xs"></i> Add Charge
                                                                                            </button>
                                                                                        </div>
                                                                                        <div style={{maxHeight: '250px', overflowY: 'auto'}} className="border rounded p-3 bg-white">
                                                                                            {group.charges && group.charges.length === 0 ? (
                                                                                                <div className="text-muted font-size-sm">No charges for this filter.</div>
                                                                                            ) : (
                                                                                                <div className="table-responsive">
                                                                                                    <table className="table table-sm table-borderless table-vertical-center mb-0">
                                                                                                        <thead className="thead-light">
                                                                                                            <tr>
                                                                                                                <th className="font-size-xs font-weight-bolder text-uppercase">Charge/Notes</th>
                                                                                                                <th className="font-size-xs font-weight-bolder text-uppercase text-right" style={{ width: '100px'}}>Amount</th>
                                                                                                                <th className="text-right" style={{ width: '40px'}}></th>
                                                                                                            </tr>
                                                                                                        </thead>
                                                                                                        <tbody>
                                                                                                            {group.charges && group.charges.map(c => (
                                                                                                                <tr key={c.id} className="border-bottom">
                                                                                                                    <td className="py-3">
                                                                                                                        <span className="font-weight-bolder text-dark-75 d-block">{c.chargeType?.name || c.reason || 'Manual Charge'}</span>
                                                                                                                        {c.reason && c.reason !== c.chargeType?.name && (
                                                                                                                            <span className="text-muted font-size-xs d-block">{c.reason}</span>
                                                                                                                        )}
                                                                                                                        <span className="text-muted font-size-xs">{new Date(c.time || c.createdAt).toLocaleDateString()}</span>
                                                                                                                    </td>
                                                                                                                    <td className="text-right font-weight-bolder text-danger py-3">KES {parseFloat(c.amount).toLocaleString()}</td>
                                                                                                                    <td className="text-right py-3">
                                                                                                                        <button className="btn btn-icon btn-xs btn-light-primary" onClick={() => this.openEditChargeModal(c, group)} title="Edit"><i className="flaticon2-pen"></i></button>
                                                                                                                    </td>
                                                                                                                </tr>
                                                                                                            ))}
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* RIGHT COLUMN: All Payment History */}
                                                                            <div className="col-md-5 border-left">
                                                                                <h6 className="font-weight-bold mb-3 d-flex justify-content-between align-items-center">
                                                                                    All Payments History
                                                                                    <button className="btn btn-xs btn-light-primary" onClick={() => this.showStatementPreview(group)} title="Print Statement">
                                                                                        <i className="flaticon2-printer icon-xs"></i>
                                                                                    </button>
                                                                                </h6>
                                                                                <div style={{maxHeight: '520px', overflowY: 'auto'}} className="border rounded p-3 bg-white">
                                                                                    {(!group.allHistory || group.allHistory.length === 0) && <span className="text-muted small">No payments recorded.</span>}
                                                                                    {group.allHistory && group.allHistory.map(h => {
                                                                                        const isFailed = h.status === 'FAILED' || h.status === 'FAILED_ON_CALLBACK';
                                                                                        return (
                                                                                        <div key={h.id} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2" style={{ opacity: isFailed ? 0.35 : 1 }}>
                                                                                            <div className="d-flex flex-column">
                                                                                                <span className="text-dark-75 font-weight-bold font-size-sm">
                                                                                                    {h.paymentType || h.type || 'M-Pesa'} 
                                                                                                    <span className="text-muted font-weight-normal ml-2">- {h.studentName}</span>
                                                                                                    {isFailed && <span className="badge badge-light-danger ml-2 py-0 px-1" style={{fontSize: '0.65rem'}}>FAILED</span>}
                                                                                                    {!isFailed && <span className="badge badge-light-secondary ml-2 py-0 px-1 font-size-xs">{h.assignedTerm || 'Term'}</span>}
                                                                                                </span>
                                                                                                <span className="text-muted font-size-xs">{new Date(h.time || h.createdAt).toLocaleDateString()}</span>
                                                                                            </div>
                                                                                            <div className="d-flex align-items-center">
                                                                                                <span className={`${isFailed ? 'text-muted text-decoration-line-through' : 'text-success'} font-weight-bolder font-size-sm mr-2`}>
                                                                                                    KES {parseFloat(h.amount || h.ammount || 0).toLocaleString()}
                                                                                                </span>
                                                                                                <button className="btn btn-icon btn-xs btn-light-primary" onClick={() => this.openEditPaymentModal(h)} title="Edit" disabled={isFailed}><i className="flaticon2-pen"></i></button>
                                                                                                <button className="btn btn-icon btn-xs btn-light-danger ml-1" onClick={() => this.deletePayment(h)} title="Delete" disabled={isFailed}><i className="flaticon2-trash"></i></button>
                                                                                            </div>
                                                                                        </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                          

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        {currentItems.length === 0 && (
                                            <tr><td colSpan="6" className="text-center py-5 text-muted">No records found matching filters.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGINATION */}
                            <div className="card-footer d-flex justify-content-between border-0 pt-5 pb-5 pl-0 pr-0">
                                <Pagination 
                                    total={processedParents.length} 
                                    itemsPerPage={itemsPerPage} 
                                    currentPage={currentPage} 
                                    onPageChange={(p) => this.setState({ currentPage: p })} 
                                />
                            </div>
                                </>
                            ) : (
                                this.renderInsights()
                            )}
                            </>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* MODALS (Reused from V1 structure) */}
            {this.state.showPaymentModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">M-Pesa Push</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showPaymentModal: false })}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                {this.state.paymentStatus === 'IDLE' && (
                                    <>
                                        <p>Initiating payment for <strong>{this.state.paymentStudent?.names}</strong></p>
                                        <div className="form-group"><label>Parent Phone</label><input type="text" className="form-control" value={this.state.parentPhone} disabled /></div>
                                        <div className="form-group"><label>Amount (KES)</label><input type="number" className="form-control" value={this.state.paymentAmount} onChange={e => this.setState({ paymentAmount: e.target.value })} /></div>
                                    </>
                                )}

                                {this.state.paymentStatus === 'INITIATING' && (
                                    <div className="text-center py-5">
                                        <div className="spinner spinner-primary spinner-lg mb-4"></div>
                                        <p className="font-weight-bold">Sending STK Push...</p>
                                        <p className="text-muted">Connecting to M-Pesa</p>
                                    </div>
                                )}

                                {this.state.paymentStatus === 'PROCESSING' && (
                                    <div className="text-center py-5">
                                        <div className="spinner spinner-success spinner-lg mb-4"></div>
                                        <p className="font-weight-bold mb-1">Check your phone!</p>
                                        <p className="text-muted mb-4">An M-Pesa prompt has been sent to <strong>{this.state.parentPhone}</strong>. Enter your PIN to complete the payment.</p>
                                        <div className="alert alert-light-primary mb-0" role="alert">
                                            <div className="alert-text">Waiting for confirmation...</div>
                                        </div>
                                    </div>
                                )}

                                {this.state.paymentStatus === 'SUCCESS' && (
                                    <div className="text-center py-5">
                                        <div className="text-success mb-4"><i className="fa fa-check-circle icon-3x"></i></div>
                                        <h4 className="font-weight-bold mb-1">Payment Successful!</h4>
                                        <p className="text-muted">The payment has been confirmed and recorded.</p>
                                    </div>
                                )}

                                {this.state.paymentStatus === 'ERROR' && (
                                    <div className="text-center py-5">
                                        <div className="text-danger mb-4"><i className="fa fa-exclamation-circle icon-3x"></i></div>
                                        <h4 className="font-weight-bold mb-1">Payment Failed</h4>
                                        <p className="text-muted mb-4">{this.state.paymentErrorMessage || "The payment could not be completed at this time."}</p>
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => this.setState({ paymentStatus: 'IDLE' })}>Try Again</button>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { this.stopPolling(); this.setState({ showPaymentModal: false, paymentStatus: 'IDLE' }); }}>{this.state.paymentStatus === 'SUCCESS' ? "Close" : "Cancel"}</button>
                                {this.state.paymentStatus === 'IDLE' && (
                                    <button className="btn btn-primary" disabled={this.state.processingPayment} onClick={this.initiatePayment}>{this.state.processingPayment ? "Sending..." : "Send Request"}</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {this.state.showManualPaymentModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Record Manual Payment</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showManualPaymentModal: false })}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <p>Recording payment for <strong>{this.state.paymentStudent?.names}</strong></p>
                                <div className="form-group">
                                    <label>Method</label>
                                    <select className="form-control" value={this.state.manualPaymentMethod} onChange={e => this.setState({ manualPaymentMethod: e.target.value })}>
                                        <option value="M-Pesa">M-Pesa</option>
                                        <option value="CASH">Cash</option>
                                        <option value="BANK">Bank</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assign to Term</label>
                                    <select className="form-control" value={this.state.manualPaymentTermId} onChange={e => this.setState({ manualPaymentTermId: e.target.value })}>
                                        <option value="">Auto-assign by Date</option>
                                        {this.state.terms && this.state.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <span className="form-text text-muted">If unset, the payment is matched to a term based on its date.</span>
                                </div>
                                <div className="form-group"><label>Amount (KES)</label><input type="number" className="form-control" value={this.state.paymentAmount} onChange={e => this.setState({ paymentAmount: e.target.value })} /></div>
                                <div className="form-group"><label>Reference / Notes</label><input type="text" className="form-control" value={this.state.manualPaymentNotes} onChange={e => this.setState({ manualPaymentNotes: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => this.setState({ showManualPaymentModal: false })}>Cancel</button>
                                <button className="btn btn-success" disabled={this.state.processingPayment} onClick={this.recordManualPayment}>{this.state.processingPayment ? "Saving..." : "Record"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {this.state.showEditPaymentModal && this.state.editPaymentData && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Payment</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showEditPaymentModal: false, editPaymentData: null })}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <p>Editing payment for <strong>{this.state.editPaymentData.studentName}</strong></p>
                                <div className="form-group">
                                    <label>Method</label>
                                    <select className="form-control" value={this.state.editPaymentData.paymentType || "CASH"} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, paymentType: e.target.value }})}>
                                        <option value="M-Pesa">M-Pesa</option>
                                        <option value="CASH">Cash</option>
                                        <option value="BANK">Bank</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assign to Term</label>
                                    <select className="form-control" value={this.state.editPaymentData.metadata?.termId || ""} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, metadata: { ...this.state.editPaymentData.metadata, termId: e.target.value } }})}>
                                        <option value="">Auto-assign by Date</option>
                                        {this.state.terms && this.state.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <span className="form-text text-muted">If unset, the payment is matched to a term based on its date.</span>
                                </div>
                                <div className="form-group"><label>Amount (KES)</label><input type="number" className="form-control" value={this.state.editPaymentData.amount} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, amount: e.target.value }})} /></div>
                                <div className="form-group"><label>Reference / Notes</label><input type="text" className="form-control" value={this.state.editPaymentData.ref || this.state.editPaymentData.mpesaReceiptNumber || ''} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, ref: e.target.value }})} /></div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => this.setState({ showEditPaymentModal: false, editPaymentData: null })}>Cancel</button>
                                <button className="btn btn-success" disabled={this.state.processingPayment} onClick={this.updatePayment}>{this.state.processingPayment ? "Saving..." : "Update Payment"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {this.state.showStatementModal && this.state.statementGroup && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '800px' }}>
                        <div className="modal-content">
                            <div className="modal-header pb-0 border-0">
                                <h5 className="modal-title">Fee Statement & Notification</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showStatementModal: false, statementGroup: null })}><span>&times;</span></button>
                            </div>
                            
                            <div className="modal-body pt-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <ul className="nav nav-tabs nav-tabs-line mb-5 mt-4 border-bottom-0">
                                    <li className="nav-item">
                                        <a className={`nav-link font-weight-bold ${this.state.statementTab === 'statement' ? 'active' : ''}`} style={{cursor: 'pointer'}} onClick={() => this.setState({ statementTab: 'statement' })}>Statement Preview</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className={`nav-link font-weight-bold ${this.state.statementTab === 'sms' ? 'active' : ''}`} style={{cursor: 'pointer'}} onClick={() => this.setState({ statementTab: 'sms' })}>Send SMS</a>
                                    </li>
                                </ul>

                                {this.state.statementTab === 'statement' && (
                                    <div>
                                        <div className="alert alert-custom alert-light-info shadow-sm mb-5 border-0">
                                            <div className="alert-icon"><i className="flaticon-information text-info"></i></div>
                                            <div className="alert-text font-size-sm">
                                                This statement includes <strong>manual payments</strong> and <strong>successful M-Pesa</strong> transactions. Failed payments are excluded.
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h6>Parent: <strong>{this.state.statementGroup.parent.name}</strong> ({this.state.statementGroup.parent.phone})</h6>
                                        </div>

                                        <h6 className="font-weight-bold border-bottom pb-2">Student Balances</h6>
                                        <table className="table table-bordered table-sm mb-5">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Expected</th>
                                                    <th>Total Paid</th>
                                                    <th>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.statementGroup.students.map(s => {
                                                    const validHistory = s.finances.history.filter(p => p.status === 'COMPLETED');
                                                    const validPaid = validHistory.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                                                    const balance = s.finances.expected - validPaid;
                                                    return (
                                                        <tr key={s.id}>
                                                            <td>
                                                                {s.names}
                                                                {s.isDeleted && <span className="label label-inline label-light-danger ml-2">Archived</span>}
                                                            </td>
                                                            <td>KES {s.finances.expected.toLocaleString()}</td>
                                                            <td className="text-success">KES {validPaid.toLocaleString()}</td>
                                                            <td className={balance > 0 ? 'text-danger' : 'text-success'}>KES {balance.toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        <h6 className="font-weight-bold border-bottom pb-2">Valid Transaction History</h6>
                                        <table className="table table-bordered table-sm">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Student</th>
                                                    <th>Method</th>
                                                    <th>Amount</th>
                                                    <th>Ref</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.statementGroup.history.filter(p => p.type === 'fees_manual' || p.metadata?.manual === true || p.status === 'COMPLETED').length === 0 && (
                                                    <tr><td colSpan="5" className="text-center text-muted py-3">No valid payments recorded.</td></tr>
                                                )}
                                                {this.state.statementGroup.history.filter(p => p.type === 'fees_manual' || p.metadata?.manual === true || p.status === 'COMPLETED').map(h => (
                                                    <tr key={h.id}>
                                                        <td>{new Date(h.time || h.createdAt).toLocaleDateString()}</td>
                                                        <td>{h.studentName}</td>
                                                        <td>{h.paymentType || (h.type === 'fees_manual' ? 'Cash' : 'M-Pesa')}</td>
                                                        <td className="text-success">+KES {parseFloat(h.amount).toLocaleString()}</td>
                                                        <td>{h.ref || h.mpesaReceiptNumber || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {this.state.statementTab === 'sms' && (
                                    <div className="pt-3">
                                        <div className="form-group">
                                            <label className="font-weight-bold">To: <strong>{this.state.statementGroup.parent.name}</strong> ({this.state.statementGroup.parent.phone})</label>
                                            <textarea 
                                                className="form-control mt-2" 
                                                rows="5" 
                                                value={this.state.statementSmsMessage} 
                                                onChange={e => this.setState({ statementSmsMessage: e.target.value })}
                                            ></textarea>
                                            <span className="form-text text-muted">You can edit the message before sending.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer bg-light p-3">
                                <button className="btn btn-secondary" onClick={() => this.setState({ showStatementModal: false, statementGroup: null })}>Close</button>
                                {this.state.statementTab === 'statement' ? (
                                    <button className="btn btn-info" onClick={this.executePrintStatement}><i className="flaticon2-printer mr-2"></i> Print Official Statement</button>
                                ) : (
                                    <button className="btn btn-primary" onClick={this.sendStatementSms} disabled={this.state.sendingSms}>
                                        <i className="flaticon2-paper-plane mr-2"></i> {this.state.sendingSms ? "Sending..." : "Send SMS"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {this.state.showAddChargeModal && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Charge</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showAddChargeModal: false })}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <p>Adding charge for <strong>{this.state.parentGroup?.parent?.name}</strong></p>
                                <div className="form-group">
                                    <label>Charge Type</label>
                                    <select className="form-control" value={this.state.selectedChargeType} onChange={e => this.setState({ selectedChargeType: e.target.value })}>
                                        <option value="">Select Charge Type</option>
                                        {this.state.chargeTypes && this.state.chargeTypes.map(c => <option key={c.id} value={c.id}>{c.name} (KES {c.amount})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Assign to Term</label>
                                    <select className="form-control" value={this.state.selectedChargeTermId} onChange={e => this.setState({ selectedChargeTermId: e.target.value })}>
                                        <option value="">No Term</option>
                                        {this.state.terms && this.state.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Notes (Optional)</label><input type="text" className="form-control" value={this.state.chargeNotes} onChange={e => this.setState({ chargeNotes: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => this.setState({ showAddChargeModal: false })}>Cancel</button>
                                <button className="btn btn-primary" disabled={this.state.processingPayment || !this.state.selectedChargeType} onClick={this.recordCharge}>{this.state.processingPayment ? "Saving..." : "Add Charge"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {this.state.showEditChargeModal && this.state.editChargeData && (
                <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Charge</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showEditChargeModal: false, editChargeData: null })}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <p>Editing charge for <strong>{this.state.parentGroup?.parent?.name}</strong></p>
                                <div className="form-group">
                                    <label>Reason / Notes</label>
                                    <input type="text" className="form-control" value={this.state.editChargeData.reason} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, reason: e.target.value }})} />
                                </div>
                                <div className="form-group">
                                    <label>Amount (KES)</label>
                                    <input type="number" className="form-control" value={this.state.editChargeData.amount} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, amount: e.target.value }})} />
                                </div>
                                <div className="form-group">
                                    <label>Assign to Term</label>
                                    <select className="form-control" value={this.state.editChargeData.termId || ""} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, termId: e.target.value }})}>
                                        <option value="">No Term</option>
                                        {this.state.terms && this.state.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => this.setState({ showEditChargeModal: false, editChargeData: null })}>Cancel</button>
                                <button className="btn btn-success" disabled={this.state.processingPayment} onClick={this.updateCharge}>{this.state.processingPayment ? "Saving..." : "Update Charge"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. SMS Modal */}
            {this.state.showSmsModal && (
                <SmsBalanceModal
                    show={this.state.showSmsModal}
                    group={this.state.smsGroup}
                    onClose={() => this.setState({ showSmsModal: false, smsGroup: null })}
                    onSend={this.handleSendSms}
                />
            )}

            {this.state.showBulkSmsModal && (
                <BulkReportSmsModal
                    show={this.state.showBulkSmsModal}
                    title="Bulk Fee Balance SMS"
                    onClose={() => this.setState({ showBulkSmsModal: false })}
                    recipients={this.state.bulkSmsRecipients}
                    onSend={this.handleBulkSmsSend}
                    onSavePhone={this.handleSaveParentPhone}
                />
            )}
          </div>
        );
    }
}

export default FeesManagement;