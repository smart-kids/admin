import React, { Component } from 'react';
import Data from '../../utils/data';
import { StatCard, DistributionChart, TrendBarChart, AreaChart, RankingList } from '../../components/analytics/DashboardWidgets';
import FinanceInsightsDashboard from '../insights/FinanceInsightsDashboard';
import InsightsDashboard from '../analytics/DashboardIndex';
import AddTermModal from "../results/components/AddTermModal";
import AddClassModal from "../classes/add";
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";
import StatementCard from "./components/StatementCard";
import BulkReportSmsModal from "../../components/reports/BulkReportSmsModal";
import SmsBalanceModal from "./components/SmsBalanceModal";

// --- HELPER COMPONENTS ---

const SkeletonLoader = () => (
    <div className="p-7">
        <div className="d-flex justify-content-between mb-8">
            <div className="skeleton-line rounded" style={{ width: '250px', height: '30px', backgroundColor: '#f3f6f9' }}></div>
            <div className="d-flex justify-content-end">
                <div className="skeleton-line rounded mr-2" style={{ width: '120px', height: '30px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '120px', height: '30px', backgroundColor: '#f3f6f9' }}></div>
            </div>
        </div>
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="d-flex justify-content-between py-6 border-bottom mb-2 align-items-center">
                <div className="skeleton-line rounded" style={{ width: '18%', height: '40px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '15%', height: '20px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '10%', height: '20px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '10%', height: '20px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '10%', height: '30px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '15%', height: '20px', backgroundColor: '#f3f6f9' }}></div>
                <div className="skeleton-line rounded" style={{ width: '12%', height: '30px', backgroundColor: '#f3f6f9' }}></div>
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
        terms: Data.terms || [],
        students: [],
        payments: [],
        parents: [],
        charges: [],
        chargeTypes: [],
        feeStructures: [],

        // Filters & Search - with localStorage persistence like results management
        selectedClass: localStorage.getItem('fees_selectedClass') || "",
        selectedTerm: localStorage.getItem('fees_selectedTerm') || "",
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
        showBBFModal: false,
        selectedBBFGroup: null,
        bbfEdits: {},
        bbfBreakdowns: {},
        savingBBF: false,
        showStatementModal: false, // NEW
        editPaymentData: null,
        statementGroup: null, // NEW
        statementTab: 'statement', // 'statement' or 'sms'
        statementSmsMessage: '',
        statementSelectedTerm: localStorage.getItem('statement_selectedTerm') || "", // NEW
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

        activeTab: 'insights', // 'accounts', 'insights', 'analytics'

        // Modal states like results management
        showAddTermModal: false,
        showAddClassModal: false,
    };

    componentDidMount() {
        // Restore selections from localStorage like results management
        let restoredClass = localStorage.getItem('fees_selectedClass');
        let restoredTerm = localStorage.getItem('fees_selectedTerm');
        if (restoredClass === 'null' || restoredClass === 'undefined') restoredClass = "";
        if (restoredTerm === 'null' || restoredTerm === 'undefined') restoredTerm = "";

        this.setState({
            selectedClass: restoredClass || "",
            selectedTerm: restoredTerm || ""
        });

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
        this.unsubFeeStructures = Data.feeStructures.subscribe(({ feeStructures }) => {
            console.log("Fee Structures Update:", feeStructures?.length);
            this.updateData({ feeStructures });
        });

        this.unsubTerms = Data.terms.subscribe(({ terms }) => {
            console.log("Terms Update:", terms?.length);
            this.updateData({ terms });
        });
        this.unsubStudents = Data.students.subscribe(({ students }) => {
            this.updateData({ students });
        });
        this.unsubParents = Data.parents.subscribe(({ parents }) => {
            this.updateData({ parents });
        });

        if (Data.payments) {
            this.unsubPayments = Data.payments.subscribe(({ payments }) => {
                this.updateData({ payments });
            });
        }

        // Check for defaults as data arrives - like results management
        this.checkAutoSelect = setInterval(() => {
            if (this.state.classes.length > 0 && this.state.terms.length > 0) {
                this.autoSelectDefaults();
                clearInterval(this.checkAutoSelect);
            }
        }, 500);
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
        if (this.unsubFeeStructures) this.unsubFeeStructures();
        if (this.checkAutoSelect) clearInterval(this.checkAutoSelect);
    }

    // Auto-select defaults like results management
    autoSelectDefaults = () => {
        const { selectedClass, selectedTerm, loading } = this.state;
        const { availableClasses, availableTerms } = this.getAvailableData();
        let updates = {};
        let shouldUpdate = false;

        if (!selectedClass && availableClasses?.length > 0) {
            updates.selectedClass = String(availableClasses[0].id);
            localStorage.setItem('fees_selectedClass', updates.selectedClass);
            shouldUpdate = true;
        }

        if (!selectedTerm && availableTerms?.length > 0) {
            updates.selectedTerm = String(availableTerms[0].id);
            localStorage.setItem('fees_selectedTerm', updates.selectedTerm);
            shouldUpdate = true;
        }

        if (shouldUpdate && !loading) {
            this.setState(updates);
        }
    };

    // Pre-process payments to optimize performance
    preprocessPayments = (payments, terms, students) => {
        // Ensure terms is an array
        const safeTerms = Array.isArray(terms) ? terms : [];

        return payments.map(p => {
            let metadata = p.metadata;
            // 1. Ensure metadata is an object
            if (typeof metadata === 'string' && metadata.trim().startsWith('{')) {
                try { metadata = JSON.parse(metadata); } catch (e) { metadata = {}; }
            } else if (!metadata) {
                metadata = {};
            }

            // 2. Identify Student Name
            const pStudentId = String(p.student?.id || p.student || metadata?.studentId || "");
            const student = students.find(s => String(s.id) === pStudentId);
            const studentName = student ? student.names : 'Unallocated';

            // 3. Assign Term
            let assignedTermName = "Unknown Term";
            let assignedTermId = metadata.termId || null;
            const pTime = new Date(p.time || p.createdAt || p.transactionDate).getTime();

            if (assignedTermId) {
                const term = safeTerms.find(t => String(t.id) === String(assignedTermId));
                if (term) assignedTermName = term.name;
            } else if (!isNaN(pTime)) {
                // Automatic date-based assignment fallback
                const matchingTerm = safeTerms.find(t => {
                    const start = new Date(t.startDate).getTime();
                    const end = new Date(t.endDate).getTime();
                    return pTime >= start && pTime <= end;
                });
                if (matchingTerm) {
                    assignedTermName = matchingTerm.name;
                    assignedTermId = matchingTerm.id;
                }
            }

            return {
                ...p,
                metadata,
                assignedTerm: assignedTermName,
                assignedTermId,
                studentName,
                processedAmount: parseFloat(p.amount || p.ammount || 0)
            };
        });
    };

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
                // If payments, terms, or students updated, pre-process the payments
                if (newData.payments || newData.terms || newData.students) {
                    const processedPayments = this.preprocessPayments(
                        this.state.payments,
                        this.state.terms,
                        this.state.students
                    );
                    this.setState({ payments: processedPayments }, () => {
                        this.recalculateFinancials();
                        this.checkReadyState();
                    });
                } else {
                    this.recalculateFinancials();
                    this.checkReadyState();
                }
            });
        }
    };

    handleFilterChange = (filterName, value) => {
        this.setState({ [filterName]: value }, () => {
            localStorage.setItem(`fees_${filterName}`, value);
            this.recalculateFinancials();
        });
    };

    handleStatementTermChange = (value) => {
        this.setState({ statementSelectedTerm: value }, () => {
            localStorage.setItem('statement_selectedTerm', value);
        });
    };

    // Handle class change like results management
    handleClassChange = (classId) => {
        this.setState({ selectedClass: classId, currentPage: 1 }, this.recalculateFinancials);
        localStorage.setItem('fees_selectedClass', classId);
    };

    // componentDidUpdate for localStorage persistence like results management
    componentDidUpdate(prevProps, prevState) {
        if (this.state.selectedClass !== prevState.selectedClass) {
            localStorage.setItem('fees_selectedClass', this.state.selectedClass);
        }
        if (this.state.selectedTerm !== prevState.selectedTerm) {
            localStorage.setItem('fees_selectedTerm', this.state.selectedTerm);
        }
    }

    // Get available data like results management
    getAvailableData = () => {
        const { classes, terms } = this.state;
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const userRole = localStorage.getItem("userRole");
        // Check for enhanced user data (parents with teacher details)
        const enhancedUser = JSON.parse(localStorage.getItem("enhancedUser")) || userData;
        // Treat all parents as teachers in admin interface
        const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher' || userRole === 'parent' || userData?.userType === 'parent' || userData?.role === 'parent';
        const teacherId = enhancedUser?.teacherDetails?.id || userData?.id;

        let availableClasses = Array.isArray(classes) ? classes : [];
        let availableTerms = Array.isArray(terms) ? terms : [];

        // Filter classes based on user role like results management
        if (isTeacher && teacherId) {
            availableClasses = availableClasses.filter(cls => {
                const teacherIdFromClass = String(cls.teacher?.id || cls.teacher);
                return teacherIdFromClass === String(teacherId);
            });
        }

        return { availableClasses, availableTerms };
    };

    stopPolling = () => {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
            this.pollingTimeout = null;
        }
    };

    /**
     * CORE LOGIC: Converts raw flat lists into Grouped Parents with calculated balances.
     * Running this only when data/filters change (not every render) is key for 500+ items.
     */
    recalculateFinancials = () => {
        const { students, parents, payments, classes, terms, feeStructures, expected, charges, selectedClass, selectedTerm, searchTerm } = this.state;

        // EXIT if any core piece is missing. 
        // We allow payments to be empty, as students might not have paid yet.
        if (!students.length || !parents.length || !classes.length) {
            console.log("Exiting early: missing core data (students, parents, or classes)");
            return;
        }

        // 1. Helper: Get Fees for Class using new FeeStructure
        const getFees = (classId, termId = null) => {
            if (!classId) return 0;
            if (!feeStructures || !Array.isArray(feeStructures)) return 0;

            const targetClassId = String(classId?.id || classId);
            const targetTermId = termId || selectedTerm;

            // Get all active fee structures for this class and term
            const applicableFees = feeStructures.filter(fs =>
                String(fs.class?.id || fs.class) === targetClassId &&
                (!targetTermId || String(fs.term?.id || fs.term) === String(targetTermId)) &&
                fs.isActive === true
            );

            // Sum all applicable fees (tuition, transport, etc.)
            return applicableFees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
        };


        // 2. Helper: Get Selected Term
        const selectedTermData = terms?.find(t => t.id === selectedTerm);

        // 3. Filter Students first
        let filteredStudents = students;
        if (selectedClass) {
            const selClsId = String(selectedClass);
            filteredStudents = students.filter(s => String(s.class?.id || s.class) === selClsId);
        }

        // 4. Group by Parent
        const parentMap = {};
        let studentsWithoutParent = 0;

        filteredStudents.forEach(student => {
            const pId = String(student.parent?.id || student.parent);
            if (!pId || pId === "undefined" || pId === "null") {
                studentsWithoutParent++;
                return;
            }

            if (!parentMap[pId]) {
                const parentObj = parents.find(p => String(p.id) === pId) || student.parent;
                if (!parentObj) {
                    // Create a placeholder parent to still show the student
                    parentMap[pId] = {
                        id: pId,
                        parent: {
                            id: pId,
                            name: `Parent ${pId}`,
                            phone: 'Not assigned',
                            isPlaceholder: true
                        },
                        students: [],
                        totalExpected: 0,
                        totalPaid: 0,
                        totalBalance: 0,
                        history: [],
                        charges: []
                    };
                } else {
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
            }
            parentMap[pId].students.push(student);
        });

        // Create a special group for students without parents
        if (studentsWithoutParent > 0) {
            const studentsWithoutParentList = filteredStudents.filter(student => {
                const pId = String(student.parent?.id || student.parent);
                return !pId || pId === "undefined" || pId === "null";
            });

            if (studentsWithoutParentList.length > 0) {
                parentMap['no-parent'] = {
                    id: 'no-parent',
                    parent: {
                        id: 'no-parent',
                        name: 'Students Without Parent Assignment',
                        phone: 'N/A',
                        isSpecialGroup: true
                    },
                    students: studentsWithoutParentList,
                    totalExpected: 0,
                    totalPaid: 0,
                    totalBalance: 0,
                    history: [],
                    charges: []
                };
            }
        }

        // Map charges to parents (filtered by term if selected)
        if (charges && charges.length > 0) {
            charges.forEach(charge => {
                const parentId = String(charge.parent?.id || charge.parent);
                if (parentMap[parentId]) {
                    // Filter by term if selectedTerm is set
                    if (selectedTerm) {
                        const chargeTermId = String(charge.term?.id || charge.term || "");
                        if (chargeTermId && chargeTermId !== String(selectedTerm)) {
                            return; // Only include charges for selected term
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

            // Gather all relevant payments for this parent (now using pre-processed payments)
            const allParentPayments = payments.filter(p => {
                const paymentStudentId = String(p.student?.id || p.student || p.metadata?.studentId || "");
                const belongsToMyStudent = group.students.some(s => String(s.id) === paymentStudentId);
                const isParentPhoneMatch = normalizePhone(p.phone) === normParentPhone;
                return belongsToMyStudent || isParentPhoneMatch;
            });

            // Use pre-processed payments - no need for heavy processing here
            const processedAllPayments = allParentPayments.map(p => {
                // Handle single child assignment for studentName
                let studentName = p.studentName || 'Unallocated';
                if (isSingleChild && (studentName === 'Unallocated' || !p.student?.id || p.student?.id === "undefined")) {
                    studentName = group.students[0].names;
                }
                return { ...p, studentName };
            }).sort((a, b) => new Date(b.time || b.createdAt) - new Date(a.time || b.createdAt));

            // Filter for term History using assignedTermId only
            // And exclude failed transactions to reduce noise in active term views
            const relatedPayments = processedAllPayments.filter(p => {
                const isFailed = p.status === 'FAILED' || p.status === 'FAILED_ON_CALLBACK';
                const isPendingMpesa = p.status === 'PENDING' && p.type === 'mpesa_init';
                if (isFailed || isPendingMpesa) return false;

                // If "All Terms" is selected, we show everything (that isn't failed)
                if (!selectedTerm) return true;

                // Use our pre-calculated assignedTermId for performance
                return p.assignedTermId && String(p.assignedTermId) === String(selectedTerm);
            });


            // Distribute payments and calculate per-student balances based ONLY on current term payments
            group.students.forEach(student => {
                const classFee = getFees(student.class?.id || student.class, selectedTerm);

                const studentPayments = relatedPayments.filter(p => {
                    const pStudentId = String(p.student?.id || p.student || p.metadata?.studentId || "");
                    const targetStudentId = String(student.id);

                    if (pStudentId && pStudentId !== "undefined" && pStudentId !== "" && pStudentId !== "null" && pStudentId !== targetStudentId) return false;
                    if (isSingleChild && (!pStudentId || pStudentId === "undefined" || pStudentId === "null" || pStudentId === "")) return true;
                    return pStudentId === targetStudentId;
                });

                const paid = studentPayments.reduce((sum, p) => {
                    const isValidStatus = p.status === 'COMPLETED' || p.status === 'PENDING';
                    return isValidStatus ? sum + (p.processedAmount || 0) : sum;
                }, 0);

                student.finances = { expected: classFee, paid, balance: classFee - paid, history: studentPayments };
                group.totalExpected += classFee;
            });

            const allValidPayments = relatedPayments.filter(p => p.status === 'COMPLETED' || p.status === 'PENDING');
            group.totalPaid = allValidPayments.reduce((sum, p) => sum + (p.processedAmount || 0), 0);

            // Add custom charges to total expected
            const additionalCharges = group.charges.reduce((sum, c) => sum + Math.round(parseFloat(c.amount || 0)), 0);
            group.totalCharges = additionalCharges; // Stored so Financial Summary per student can distribute it
            group.totalExpected += additionalCharges;

            group.totalBalance = group.totalExpected - group.totalPaid;

            // 5b. Calculate Balance Brought Forward (Previous Terms)
            let balanceBroughtForward = 0;
            if (selectedTerm && terms.length > 0) {
                // Find all terms that are not the current term
                const previousTerms = terms.filter(t => t.id !== selectedTerm);

                // 1. Previous Class Fees - Calculate for each previous term using fee structures
                const prevFees = group.students.reduce((sum, s) => {
                    const studentPrevFees = previousTerms.reduce((termSum, prevTerm) => {
                        const termFee = getFees(s.class?.id || s.class, prevTerm.id);
                        return termSum + termFee;
                    }, 0);
                    return sum + studentPrevFees;
                }, 0);

                // 2. Previous Charges (Not in current term)
                const prevChargesSum = (charges || []).filter(c => {
                    const pId = String(c.parent?.id || c.parent);
                    if (pId !== group.id) return false;
                    const cTermId = String(c.term?.id || c.term || "");
                    if (cTermId) {
                        return previousTerms.some(pt => String(pt.id) === cTermId);
                    }
                    return false; // Only include charges with explicit termId
                }).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

                // 3. Previous Payments (Not in current term)
                const prevPaymentsSum = processedAllPayments.filter(p => {
                    const isFailed = p.status === 'FAILED' || p.status === 'FAILED_ON_CALLBACK';
                    const isPendingMpesa = p.status === 'PENDING' && p.type === 'mpesa_init';
                    if (isFailed || isPendingMpesa) return false;

                    return p.assignedTermId && previousTerms.some(pt => String(pt.id) === String(p.assignedTermId));
                }).reduce((sum, p) => sum + (p.processedAmount || 0), 0);

                balanceBroughtForward = (prevFees + prevChargesSum) - prevPaymentsSum;
            }

            const manualBroughtForward = group.students.reduce((sum, s) => sum + (parseFloat(s.balanceBroughtForward) || 0), 0);
            balanceBroughtForward += manualBroughtForward;

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

        this.setState({
            processedParents: filteredList
        }, () => {
            // Auto-expand the first item if none is expanded and we have items
            if (!this.state.expandedParentId && filteredList.length > 0) {
                this.setState({ expandedParentId: filteredList[0].id });
            }
        });
    };

    // --- Helper: Get Fee Structure Breakdown (Component Level) ---
    getFeeStructureBreakdown = (classId, termId = null) => {
        const { feeStructures, selectedTerm } = this.state;
        if (!classId) return [];

        const targetClassId = String(classId?.id || classId);
        const targetTermId = termId || selectedTerm;

        // Get all active fee structures for this class and term
        const applicableFees = feeStructures.filter(fs =>
            String(fs.class?.id || fs.class) === targetClassId &&
            (!targetTermId || String(fs.term?.id || fs.term) === String(targetTermId)) &&
            fs.isActive === true
        );

        // Group by fee type and sum amounts
        const feeTypeGroups = {};
        applicableFees.forEach(fs => {
            const feeType = fs.feeType || 'Other';
            if (!feeTypeGroups[feeType]) {
                feeTypeGroups[feeType] = {
                    feeType,
                    totalAmount: 0,
                    count: 0,
                    description: fs.description || ''
                };
            }
            feeTypeGroups[feeType].totalAmount += parseFloat(fs.amount) || 0;
            feeTypeGroups[feeType].count += 1;
        });

        return Object.values(feeTypeGroups).sort((a, b) => b.totalAmount - a.totalAmount);
    };

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
            if (window.toastr) window.toastr.success("Charge added successfully!");
            this.setState({ showAddChargeModal: false });
            this.recalculateFinancials();
        } catch (e) {
            if (window.toastr) window.toastr.error(e.message || "Failed to add charge");
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
            if (window.toastr) window.toastr.success("Charge updated successfully!");
            this.setState({ showEditChargeModal: false, editChargeData: null });
            this.recalculateFinancials();
        } catch (e) {
            if (window.toastr) window.toastr.error(e.message || "Failed to update charge");
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

            if (window.toastr) window.toastr.success("STK Push sent!");
        } catch (e) {
            this.setState({ paymentStatus: 'ERROR', paymentErrorMessage: e.message || "Failed" });
            if (window.toastr) window.toastr.error(e.message || "Failed");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    startPaymentPolling = (initData, amount) => {
        const pollPayment = async () => {
            try {
                const result = await Data.schools.verifyTx(initData);
                const { txStatus, message } = result;

                if (txStatus === 'COMPLETED') {
                    this.setState({ paymentStatus: 'SUCCESS' });
                    this.stopPolling();
                    if (window.toastr) window.toastr.success("Payment confirmed!");
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
        }, 180000); // 3 minutes
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
            if (window.toastr) window.toastr.success("Payment updated successfully!");
            this.setState({ showEditPaymentModal: false, editPaymentData: null });
            this.recalculateFinancials();
        } catch (e) {
            if (window.toastr) window.toastr.error(e.message || "Failed");
        } finally {
            this.setState({ processingPayment: false });
        }
    };

    restoreRecord = async (type, id) => {
        if (!window.confirm("Are you sure you want to restore this record?")) return;

        this.setState({ processingPayment: true });
        try {
            await Data[type].restore({ id });
            if (window.toastr) window.toastr.success("Record restored successfully!");
            this.recalculateFinancials();
        } catch (e) {
            if (window.toastr) window.toastr.error(e.message || "Failed to restore record");
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
            if (window.toastr) window.toastr.success("SMS Sent");
        } catch (e) { console.error(e); } finally { this.setState({ sendingSms: false }); }
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

            // Check for unallocated payments
            const unallocatedSum = (history || [])
                .filter(h => h.studentName === 'Unallocated' && h.status === 'COMPLETED')
                .reduce((sum, h) => sum + (h.processedAmount || 0), 0);

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

            // Add unallocated funds warning if applicable
            if (unallocatedSum > 0) {
                message += `\nNote: You have KES ${unallocatedSum.toLocaleString()} unallocated funds.`;
            }

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
            if (window.toastr) window.toastr.success("SMS Sent successfully!");
        } catch (e) {
            console.error(e);
            if (window.toastr) window.toastr.error("Failed to send SMS");
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
            if (window.toastr) window.toastr.success("SMS sent successfully.");
        } catch (e) {
            console.error(e);
            if (window.toastr) window.toastr.error("Failed to send SMS.");
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

    renderAdvancedInsights = () => {
        const { payments, charges, students, classes, feeStructures, selectedClass, selectedTerm, processedParents } = this.state;

        // Data processing
        const validPayments = (payments || []).filter(p => !p.status || p.status === 'COMPLETED');
        const totalCollected = validPayments.reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
        const totalCharges = (charges || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalArrears = Math.max(0, totalCharges - totalCollected);
        const collectionRate = totalCharges > 0 ? Math.round((totalCollected / totalCharges) * 100) : 0;

        // Advanced metrics
        const averagePaymentAmount = validPayments.length > 0 ? totalCollected / validPayments.length : 0;
        const paymentFrequency = validPayments.length;
        const overdueAccounts = processedParents.filter(p => p.totalBalance > 0).length;
        const healthyAccounts = processedParents.filter(p => p.totalBalance <= 0).length;

        // Payment methods breakdown
        const methods = {};
        (payments || []).forEach(p => {
            const m = p.method || p.paymentType || 'M-Pesa';
            methods[m] = (methods[m] || 0) + (parseFloat(p.amount || p.ammount) || 0);
        });
        const methodData = Object.keys(methods).map(m => ({
            name: m,
            value: methods[m],
            percentage: totalCollected > 0 ? (methods[m] / totalCollected) * 100 : 0
        }));

        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthPayments = validPayments.filter(p => {
                const pDate = new Date(p.time || p.createdAt);
                const pMonthKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
                return pMonthKey === monthKey;
            });
            const monthRevenue = monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
            monthlyTrend.push({
                month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: monthRevenue,
                transactions: monthPayments.length
            });
        }

        // Class performance analysis
        const getFees = (classId, termId = null) => {
            if (!classId || !feeStructures || !Array.isArray(feeStructures)) return 0;
            
            const targetClassId = String(classId?.id || classId);
            const targetTermId = termId || selectedTerm;
            
            // Get all active fee structures for this class and term
            const applicableFees = feeStructures.filter(fs =>
                String(fs.class?.id || fs.class) === targetClassId &&
                (!targetTermId || String(fs.term?.id || fs.term) === String(targetTermId)) &&
                fs.isActive === true
            );
            
            // Sum all applicable fees (tuition, transport, etc.)
            return applicableFees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
        };

        const classPerformance = (classes || []).map(cls => {
            const classStudents = (students || []).filter(s => s.class?.id === cls.id || s.class === cls.id);
            const classStudentIds = new Set(classStudents.map(s => s.id));
            const classPaid = validPayments.filter(p => classStudentIds.has(p.student?.id || p.student)).reduce((sum, p) => sum + (parseFloat(p.amount || p.ammount) || 0), 0);
            
            // Use fee structures for expected amounts instead of charges
            const classFeePerStudent = getFees(cls.id, selectedTerm);
            const classExpected = classFeePerStudent * classStudents.length;
            
            // Add custom charges for this class
            const classCharges = (charges || []).filter(c => {
                const chargeStudentId = String(c.student?.id || c.student);
                return classStudentIds.has(chargeStudentId);
            }).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            
            const totalExpected = classExpected + classCharges;
            const collectionRate = totalExpected > 0 ? (classPaid / totalExpected) * 100 : 0;
            
            // Debug logging for first class
            if (cls.id === (classes?.[0]?.id)) {
                console.log('Class Performance Debug:', {
                    className: cls.name,
                    classStudentsCount: classStudents.length,
                    classFeePerStudent,
                    classExpected,
                    classCharges,
                    totalExpected,
                    classPaid,
                    collectionRate,
                    feeStructuresCount: feeStructures?.length || 0,
                    selectedTerm,
                    validPaymentsCount: validPayments.length
                });
            }
            
            return {
                className: cls.name || `Class ${cls.id}`,
                studentCount: classStudents.length,
                totalCollected: classPaid,
                totalExpected,
                balance: totalExpected - classPaid,
                collectionRate,
                performance: collectionRate >= 80 ? 'Excellent' : collectionRate >= 60 ? 'Good' : collectionRate >= 40 ? 'Fair' : 'Poor'
            };
        }).sort((a, b) => b.collectionRate - a.collectionRate);

        // Aging analysis
        const agingBuckets = {
            'Current': { amount: 0, count: 0 },
            '1-30 Days': { amount: 0, count: 0 },
            '31-60 Days': { amount: 0, count: 0 },
            '61-90 Days': { amount: 0, count: 0 },
            '90+ Days': { amount: 0, count: 0 }
        };

        processedParents.forEach(parent => {
            if (parent.totalBalance > 0) {
                // Simple aging logic - in production, this would use actual payment dates
                const daysOverdue = Math.floor(Math.random() * 120); // Placeholder
                let bucket = 'Current';
                if (daysOverdue > 90) bucket = '90+ Days';
                else if (daysOverdue > 60) bucket = '61-90 Days';
                else if (daysOverdue > 30) bucket = '31-60 Days';
                else if (daysOverdue > 0) bucket = '1-30 Days';
                
                agingBuckets[bucket].amount += parent.totalBalance;
                agingBuckets[bucket].count += 1;
            }
        });

        return (
            <div className="finance-advanced-insights">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-6">
                    <div>
                        <h2 className="font-weight-bolder text-dark font-size-h2 mb-0">Advanced Insights</h2>
                        <div className="text-muted font-weight-bold font-size-sm mt-1">
                            Comprehensive financial performance insights and analysis
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <button className="btn btn-light-primary btn-sm mr-2" onClick={() => window.print()}>
                            <i className="fas fa-download mr-2"></i>Export Report
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => this.setState({ activeTab: 'accounts' })}>
                            <i className="fas fa-arrow-left mr-2"></i>Back to Accounts
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="row mb-6">
                    <div className="col-xl-3 col-lg-6">
                        <div className="card card-custom bg-white border-0 shadow-sm" style={{ 
                            borderRadius: '8px',
                            border: '1px solid #e3e6f0',
                            transition: 'all 0.2s ease'
                        }}>
                            <div className="card-body p-6">
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-50px bg-light-primary mr-4">
                                        <div className="symbol-label">
                                            <i className="fas fa-coins text-primary" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <div className="text-dark font-size-h3 font-weight-bolder mb-1">
                                            KES {totalCollected.toLocaleString()}
                                        </div>
                                        <div className="text-muted font-weight-medium" style={{ fontSize: '0.9rem' }}>
                                            Total Collections
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                        <div className="card card-custom bg-white border-0 shadow-sm" style={{ 
                            borderRadius: '8px',
                            border: '1px solid #e3e6f0',
                            transition: 'all 0.2s ease'
                        }}>
                            <div className="card-body p-6">
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-50px bg-light-danger mr-4">
                                        <div className="symbol-label">
                                            <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <div className="text-dark font-size-h3 font-weight-bolder mb-1">
                                            KES {totalArrears.toLocaleString()}
                                        </div>
                                        <div className="text-muted font-weight-medium" style={{ fontSize: '0.9rem' }}>
                                            Outstanding Balance
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                        <div className="card card-custom bg-white border-0 shadow-sm" style={{ 
                            borderRadius: '8px',
                            border: '1px solid #e3e6f0',
                            transition: 'all 0.2s ease'
                        }}>
                            <div className="card-body p-6">
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-50px bg-light-success mr-4">
                                        <div className="symbol-label">
                                            <i className="fas fa-percentage text-success" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <div className="text-dark font-size-h3 font-weight-bolder mb-1">
                                            {collectionRate}%
                                        </div>
                                        <div className="text-muted font-weight-medium" style={{ fontSize: '0.9rem' }}>
                                            Collection Rate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-3 col-lg-6">
                        <div className="card card-custom bg-white border-0 shadow-sm" style={{ 
                            borderRadius: '8px',
                            border: '1px solid #e3e6f0',
                            transition: 'all 0.2s ease'
                        }}>
                            <div className="card-body p-6">
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-50px bg-light-info mr-4">
                                        <div className="symbol-label">
                                            <i className="fas fa-chart-line text-info" style={{ fontSize: '1.5rem' }}></i>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <div className="text-dark font-size-h3 font-weight-bolder mb-1">
                                            {paymentFrequency}
                                        </div>
                                        <div className="text-muted font-weight-medium" style={{ fontSize: '0.9rem' }}>
                                            Total Transactions
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="row mb-6">
                    <div className="col-lg-8">
                        <div className="card card-custom">
                            <div className="card-header border-0 pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label font-weight-bolder text-dark">Revenue Trend</span>
                                    <span className="text-muted font-weight-bold font-size-sm mt-1">Monthly performance over last 6 months</span>
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-borderless table-vertical-center">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th className="text-right">Revenue</th>
                                                <th className="text-right">Transactions</th>
                                                <th className="text-right">Avg Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyTrend.map((month, index) => (
                                                <tr key={index}>
                                                    <td className="font-weight-bold">{month.month}</td>
                                                    <td className="text-right font-weight-bolder text-primary">KES {month.revenue.toLocaleString()}</td>
                                                    <td className="text-right">{month.transactions}</td>
                                                    <td className="text-right text-muted">
                                                        KES {month.transactions > 0 ? Math.round(month.revenue / month.transactions).toLocaleString() : 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card card-custom">
                            <div className="card-header border-0 pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label font-weight-bolder text-dark">Payment Methods</span>
                                    <span className="text-muted font-weight-bold font-size-sm mt-1">Revenue distribution</span>
                                </h3>
                            </div>
                            <div className="card-body">
                                {methodData.map((method, index) => (
                                    <div key={index} className="d-flex align-items-center justify-content-between mb-4">
                                        <div className="d-flex align-items-center">
                                            <div className={`symbol symbol-30px mr-3 ${
                                                method.name === 'M-Pesa' ? 'bg-light-success' : 
                                                method.name === 'CASH' ? 'bg-light-primary' : 'bg-light-warning'
                                            }`}>
                                                <span className="symbol-label font-size-h6 font-weight-bolder">
                                                    {method.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-weight-bolder text-dark">{method.name}</div>
                                                <div className="text-muted font-size-sm">{method.percentage.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-weight-bolder text-primary">KES {method.value.toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Class Performance */}
                <div className="row mb-6">
                    <div className="col-12">
                        <div className="card card-custom">
                            <div className="card-header border-0 pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label font-weight-bolder text-dark">Class Performance Analysis</span>
                                    <span className="text-muted font-weight-bold font-size-sm mt-1">Collection rates and balances by class</span>
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-head-custom table-vertical-center">
                                        <thead>
                                            <tr>
                                                <th>Class</th>
                                                <th className="text-right">Students</th>
                                                <th className="text-right">Expected</th>
                                                <th className="text-right">Collected</th>
                                                <th className="text-right">Balance</th>
                                                <th className="text-right">Collection Rate</th>
                                                <th className="text-center">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classPerformance.map((cls, index) => (
                                                <tr key={index}>
                                                    <td className="font-weight-bold">{cls.className}</td>
                                                    <td className="text-right">{cls.studentCount}</td>
                                                    <td className="text-right">KES {cls.totalExpected.toLocaleString()}</td>
                                                    <td className="text-right text-success font-weight-bolder">KES {cls.totalCollected.toLocaleString()}</td>
                                                    <td className={`text-right font-weight-bolder ${cls.balance > 0 ? 'text-danger' : 'text-success'}`}>
                                                        KES {cls.balance.toLocaleString()}
                                                    </td>
                                                    <td className="text-right">
                                                        <span className={`font-weight-bolder ${
                                                            cls.collectionRate >= 80 ? 'text-success' : 
                                                            cls.collectionRate >= 60 ? 'text-warning' : 'text-danger'
                                                        }`}>
                                                            {cls.collectionRate.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`badge badge-pill ${
                                                            cls.performance === 'Excellent' ? 'badge-success' :
                                                            cls.performance === 'Good' ? 'badge-primary' :
                                                            cls.performance === 'Fair' ? 'badge-warning' : 'badge-danger'
                                                        }`}>
                                                            {cls.performance}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aging Analysis */}
                <div className="row">
                    <div className="col-lg-6">
                        <div className="card card-custom">
                            <div className="card-header border-0 pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label font-weight-bolder text-dark">Aging Analysis</span>
                                    <span className="text-muted font-weight-bold font-size-sm mt-1">Outstanding balances by age</span>
                                </h3>
                            </div>
                            <div className="card-body">
                                {Object.entries(agingBuckets).map(([bucket, data], index) => (
                                    <div key={index} className="d-flex align-items-center justify-content-between mb-4">
                                        <div>
                                            <div className="font-weight-bolder text-dark">{bucket}</div>
                                            <div className="text-muted font-size-sm">{data.count} accounts</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-weight-bolder ${
                                                bucket === 'Current' ? 'text-success' :
                                                bucket === '90+ Days' ? 'text-danger' : 'text-warning'
                                            }`}>
                                                KES {data.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card card-custom">
                            <div className="card-header border-0 pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label font-weight-bolder text-dark">Account Health</span>
                                    <span className="text-muted font-weight-bold font-size-sm mt-1">Payment status overview</span>
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="d-flex flex-column">
                                    <div className="d-flex align-items-center justify-content-between mb-6">
                                        <div className="d-flex align-items-center">
                                            <div className="symbol symbol-40px bg-light-success mr-3">
                                                <span className="symbol-label text-success font-weight-bolder">
                                                    <i className="fas fa-check"></i>
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-weight-bolder text-dark">Healthy Accounts</div>
                                                <div className="text-muted font-size-sm">No outstanding balance</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-size-h3 font-weight-bolder text-success">{healthyAccounts}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="symbol symbol-40px bg-light-danger mr-3">
                                                <span className="symbol-label text-danger font-weight-bolder">
                                                    <i className="fas fa-exclamation"></i>
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-weight-bolder text-dark">Overdue Accounts</div>
                                                <div className="text-muted font-size-sm">Has outstanding balance</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-size-h3 font-weight-bolder text-danger">{overdueAccounts}</div>
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

    // Helper function to calculate BBF breakdown for a student
    getBBFBreakdown = (student, selectedTerm, terms, feeStructures, charges, payments) => {
        const breakdown = {
            previousFees: 0,
            previousFeesDetails: [], // Array of { termName, amount }
            previousCharges: 0,
            previousChargesDetails: [], // Array of { termName, description, amount }
            previousPayments: 0,
            previousPaymentsDetails: [], // Array of { termName, amount, date }
            manualBalance: parseFloat(student.balanceBroughtForward) || 0,
            systemArrears: 0,
            totalBBF: 0
        };

        if (selectedTerm && terms.length > 0) {
            const previousTerms = terms.filter(t => t.id !== selectedTerm);
            
            // 1. Previous Class Fees for this specific student
            const targetClassId = String(student.class?.id || student.class);
            previousTerms.forEach(prevTerm => {
                const applicableFees = feeStructures.filter(fs =>
                    String(fs.class?.id || fs.class) === targetClassId &&
                    String(fs.term?.id || fs.term) === String(prevTerm.id) &&
                    fs.isActive === true
                );
                const termFee = applicableFees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
                if (termFee > 0) {
                    breakdown.previousFees += termFee;
                    breakdown.previousFeesDetails.push({
                        termName: prevTerm.name,
                        amount: termFee
                    });
                }
            });

            // 2. Previous Charges for this student's parent
            const parentId = String(student.parent?.id || student.parent);
            const prevCharges = (charges || []).filter(c => {
                const cParentId = String(c.parent?.id || c.parent);
                if (cParentId !== parentId) return false;
                const cTermId = String(c.term?.id || c.term || "");
                if (cTermId) {
                    return previousTerms.some(pt => String(pt.id) === cTermId);
                }
                return false;
            });
            
            prevCharges.forEach(charge => {
                const amount = parseFloat(charge.amount || 0);
                const term = previousTerms.find(pt => String(pt.id) === String(charge.term?.id || charge.term));
                if (amount > 0) {
                    breakdown.previousCharges += amount;
                    breakdown.previousChargesDetails.push({
                        termName: term?.name || 'Unknown Term',
                        description: charge.description || charge.name || 'Additional Charge',
                        amount: amount
                    });
                }
            });

            // 3. Previous Payments for this student
            const prevPayments = payments.filter(p => {
                const isFailed = p.status === 'FAILED' || p.status === 'FAILED_ON_CALLBACK';
                const isPendingMpesa = p.status === 'PENDING' && p.type === 'mpesa_init';
                if (isFailed || isPendingMpesa) return false;

                const paymentStudentId = String(p.student?.id || p.student || p.metadata?.studentId || "");
                const targetStudentId = String(student.id);
                
                return paymentStudentId === targetStudentId && 
                       p.assignedTermId && 
                       previousTerms.some(pt => String(pt.id) === String(p.assignedTermId));
            });
            
            prevPayments.forEach(payment => {
                const amount = payment.processedAmount || 0;
                const term = previousTerms.find(pt => String(pt.id) === String(payment.assignedTermId));
                if (amount > 0) {
                    breakdown.previousPayments += amount;
                    breakdown.previousPaymentsDetails.push({
                        termName: term?.name || 'Unknown Term',
                        amount: amount,
                        date: payment.time || payment.createdAt || new Date().toISOString()
                    });
                }
            });

            // Calculate system arrears and total
            breakdown.systemArrears = (breakdown.previousFees + breakdown.previousCharges) - breakdown.previousPayments;
            breakdown.totalBBF = breakdown.systemArrears + breakdown.manualBalance;
        }

        return breakdown;
    };

    openBBFModal = (group) => {
        const bbfEdits = {};
        const bbfBreakdowns = {};
        const { selectedTerm, terms, feeStructures, charges, payments } = this.state;
        
        group.students.forEach(s => {
            // Check for undefined/null, otherwise use the value or empty string
            bbfEdits[s.id] = s.balanceBroughtForward !== undefined && s.balanceBroughtForward !== null 
                ? s.balanceBroughtForward 
                : '';
            
            // Calculate breakdown for this student
            bbfBreakdowns[s.id] = this.getBBFBreakdown(s, selectedTerm, terms, feeStructures, charges, payments);
        });
        
        this.setState({ showBBFModal: true, selectedBBFGroup: group, bbfEdits, bbfBreakdowns });
    };

    handleBBFChange = (studentId, val) => {
        this.setState(prev => ({ bbfEdits: { ...prev.bbfEdits, [studentId]: val } }));
    };

    saveBBFChanges = async () => {
        this.setState({ savingBBF: true });
        try {
            const { bbfEdits } = this.state;
            const promises = Object.entries(bbfEdits).map(([id, val]) => {
                return Data.students.update({ id, balanceBroughtForward: parseFloat(val) || 0 });
            });
            await Promise.all(promises);
            if (window.toastr) window.toastr.success("Balance Brought Forward updated");
            this.setState({ showBBFModal: false, selectedBBFGroup: null, bbfEdits: {} });
        } catch (e) {
            console.error(e);
            if (window.toastr) window.toastr.error("Failed to update Balance");
        } finally {
            this.setState({ savingBBF: false });
        }
    };

    render() {
        const {
            classes, terms, selectedClass, selectedTerm, searchTerm,
            processedParents, currentPage, itemsPerPage, expandedParentId, loading,
            showPrintView, printGroup, schoolInfo, showSmsModal, smsGroup,
            payments, charges, feeStructures, parents, students,
            statementSelectedTerm
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

            // Calculate totals for print view
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

                        <div className="kt-content kt-grid__item kt-grid__item--fluid" style={{ height: "auto" }} id="kt_content">
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
                                        feeStructures={this.state.feeStructures}
                                        selectedTerm={this.state.statementSelectedTerm}
                                        terms={this.state.terms}
                                    />
                                    {/* Debug info */}
                                    <div style={{ display: 'none' }}>
                                        Debug Info:
                                        FeeStructures: {this.state.feeStructures?.length}
                                        SelectedTerm: {this.state.selectedTerm}
                                        ValidStudents: {validStudentsData?.length}
                                        PrintGroup: {JSON.stringify(printGroup, null, 2)}
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
                    <Subheader links={["Finance"]} />

                    <div className="kt-content kt-grid__item kt-grid__item--fluid pt-0" style={{ height: "100vh" }} id="kt_content">
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
                                            <li className="nav-item">
                                                <a
                                                    className={`nav-link py-4 ${this.state.activeTab === 'advanced-insights' ? 'active' : ''}`}
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'advanced-insights' }); }}
                                                >
                                                    Advanced Insights
                                                </a>
                                            </li>
                                        </ul>

                                        <div className="card-toolbar d-flex align-items-center">
                                            <div className="dropdown dropdown-inline mr-2 d-flex align-items-center">
                                                <select className="form-control form-control-sm form-control-solid" value={selectedTerm} onChange={e => this.handleFilterChange('selectedTerm', e.target.value)}>
                                                    <option value="">Term...</option>
                                                    {this.getAvailableData().availableTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                                <div className="ml-1 d-flex">
                                                    <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/terms"} title="Configure Terms">
                                                        <i className="fa fa-cog font-size-xs"></i>
                                                    </button>
                                                    <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddTermModal: true })} title="Add Term">
                                                        <i className="fa fa-plus font-size-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="dropdown dropdown-inline mr-4 d-flex align-items-center">
                                                <select className="form-control form-control-sm form-control-solid" value={selectedClass} onChange={e => this.handleClassChange(e.target.value)}>
                                                    <option value="">Class (Students)...</option>
                                                    {this.getAvailableData().availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({(c.students && c.students.length) || 0} Students)</option>)}
                                                </select>
                                                <div className="ml-1 d-flex">
                                                    <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/classes"} title="Configure Classes">
                                                        <i className="fa fa-cog font-size-xs"></i>
                                                    </button>
                                                    <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddClassModal: true })} title="Add Class">
                                                        <i className="fa fa-plus font-size-xs"></i>
                                                    </button>
                                                </div>
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
                                                                    <th style={{ minWidth: "200px" }}>Parent Details</th>
                                                                    <th style={{ minWidth: "150px" }}>Students</th>
                                                                    <th style={{ minWidth: "120px" }}>Total Expected Payment</th>
                                                                    <th style={{ minWidth: "120px" }}>Total Paid</th>
                                                                    <th style={{ minWidth: "120px" }}>Balance</th>
                                                                    <th style={{ minWidth: "150px" }}>Last Payment</th>
                                                                    <th className="text-right" style={{ minWidth: "150px" }}>Actions</th>
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
                                                                                    <div>
                                                                                        <span className="text-dark-75 font-weight-bolder d-block font-size-lg">{group.totalExpected.toLocaleString()}</span>
                                                                                        <div className="mt-2">
                                                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                                                <span className="text-muted font-size-xs">Base Fees:</span>
                                                                                                <span className="text-muted font-size-xs font-weight-medium">
                                                                                                    {(group.totalExpected - group.totalCharges - (group.balanceBroughtForward || 0)).toLocaleString()}
                                                                                                </span>
                                                                                            </div>
                                                                                            {group.totalCharges > 0 && (
                                                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                                                    <span className="text-muted font-size-xs">Charges:</span>
                                                                                                    <span className="text-primary font-size-xs font-weight-medium">
                                                                                                        +{Math.round(group.totalCharges).toLocaleString()}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                            {group.balanceBroughtForward > 0 && (
                                                                                                <div className="d-flex justify-content-between align-items-center">
                                                                                                    <span className="text-muted font-size-xs">Brought Forward:</span>
                                                                                                    <span className="text-warning font-size-xs font-weight-medium">
                                                                                                        +{Math.round(group.balanceBroughtForward).toLocaleString()}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
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
                                                                                            <button
                                                                                                className="btn btn-icon btn-light-warning btn-sm mx-1"
                                                                                                onClick={() => this.openBBFModal(group)}
                                                                                                title="Edit Balance Brought Forward"
                                                                                            >
                                                                                                <i className="flaticon2-pen text-dark"></i>
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
                                                                                                    <div className={`alert alert-custom py-2 mb-0 shadow-sm border-0 mr-4 ${group.balanceBroughtForward > 0 ? 'alert-light-danger' : 'alert-light-success'}`} style={{ flex: 1 }}>
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
                                                                                                                <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="border rounded p-3 bg-white">
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

                                                                                                            {/* 2. Fee Structure Breakdown */}
                                                                                                            <div className="col-md-12 mb-6">
                                                                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                                                                    <h6 className="font-weight-bold mb-0">Fee Structure Breakdown</h6>
                                                                                                                    <span className="badge badge-info badge-pill">
                                                                                                                        {selectedTerm ? terms?.find(t => t.id === selectedTerm)?.name || 'Current Term' : 'All Terms'}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="border rounded p-3 bg-white">
                                                                                                                    {(() => {
                                                                                                                        const breakdown = this.getFeeStructureBreakdown(selectedClass, selectedTerm);
                                                                                                                        return breakdown.length === 0 ? (
                                                                                                                            <div className="text-muted font-size-sm">
                                                                                                                                No fee structures configured for this class/term.
                                                                                                                            </div>
                                                                                                                        ) : (
                                                                                                                            <div className="table-responsive">
                                                                                                                                <table className="table table-sm table-borderless table-vertical-center mb-0">
                                                                                                                                    <thead className="thead-light">
                                                                                                                                        <tr>
                                                                                                                                            <th className="font-size-xs font-weight-bolder text-uppercase">Fee Type</th>
                                                                                                                                            <th className="font-size-xs font-weight-bolder text-uppercase text-right" style={{ width: '100px' }}>Amount</th>
                                                                                                                                            <th className="font-size-xs font-weight-bolder text-uppercase text-center" style={{ width: '80px' }}>Count</th>
                                                                                                                                        </tr>
                                                                                                                                    </thead>
                                                                                                                                    <tbody>
                                                                                                                                        {breakdown.map((fee, index) => (
                                                                                                                                            <tr key={index} className="border-bottom">
                                                                                                                                                <td className="py-3">
                                                                                                                                                    <span className="font-weight-bolder text-dark-75 d-block">{fee.feeType}</span>
                                                                                                                                                    {fee.description && (
                                                                                                                                                        <span className="text-muted font-size-xs">{fee.description}</span>
                                                                                                                                                    )}
                                                                                                                                                </td>
                                                                                                                                                <td className="text-right font-weight-bolder text-primary py-3">
                                                                                                                                                    KES {fee.totalAmount.toLocaleString()}
                                                                                                                                                </td>
                                                                                                                                                <td className="text-center py-3">
                                                                                                                                                    <span className="badge badge-light badge-pill">{fee.count}</span>
                                                                                                                                                </td>
                                                                                                                                            </tr>
                                                                                                                                        ))}
                                                                                                                                        <tr className="border-top">
                                                                                                                                            <td className="py-3">
                                                                                                                                                <span className="font-weight-bolder text-dark">Total Expected</span>
                                                                                                                                            </td>
                                                                                                                                            <td className="text-right font-weight-bolder text-success py-3">
                                                                                                                                                KES {breakdown.reduce((sum, fee) => sum + fee.totalAmount, 0).toLocaleString()}
                                                                                                                                            </td>
                                                                                                                                            <td className="text-center py-3">
                                                                                                                                                <span className="badge badge-success badge-pill">
                                                                                                                                                    {breakdown.reduce((sum, fee) => sum + fee.count, 0)}
                                                                                                                                                </span>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </div>
                                                                                                                        );
                                                                                                                    })()}
                                                                                                                </div>
                                                                                                            </div>

                                                                                                            {/* 3. Filtered Charges */}
                                                                                                            <div className="col-md-12">
                                                                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                                                                    <h6 className="font-weight-bold mb-0">Filtered Charges</h6>
                                                                                                                    <button className="btn btn-xs btn-light-primary font-weight-bolder" onClick={() => this.openAddChargeModal(group)}>
                                                                                                                        <i className="flaticon2-plus icon-xs"></i> Add Charge
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                                <div style={{ maxHeight: '250px', overflowY: 'auto' }} className="border rounded p-3 bg-white">
                                                                                                                    {group.charges && group.charges.length === 0 ? (
                                                                                                                        <div className="text-muted font-size-sm">No charges for this filter.</div>
                                                                                                                    ) : (
                                                                                                                        <div className="table-responsive">
                                                                                                                            <table className="table table-sm table-borderless table-vertical-center mb-0">
                                                                                                                                <thead className="thead-light">
                                                                                                                                    <tr>
                                                                                                                                        <th className="font-size-xs font-weight-bolder text-uppercase">Charge/Notes</th>
                                                                                                                                        <th className="font-size-xs font-weight-bolder text-uppercase text-right" style={{ width: '100px' }}>Amount</th>
                                                                                                                                        <th className="text-right" style={{ width: '40px' }}></th>
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
                                                                                                        <div style={{ maxHeight: '520px', overflowY: 'auto' }} className="border rounded p-3 bg-white">
                                                                                                            {(!group.allHistory || group.allHistory.length === 0) && <span className="text-muted small">No payments recorded.</span>}
                                                                                                            {group.allHistory && group.allHistory.map(h => {
                                                                                                                const isFailed = h.status === 'FAILED' || h.status === 'FAILED_ON_CALLBACK';
                                                                                                                return (
                                                                                                                    <div key={h.id} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2" style={{ opacity: isFailed ? 0.35 : 1 }}>
                                                                                                                        <div className="d-flex flex-column">
                                                                                                                            <span className="text-dark-75 font-weight-bold font-size-sm">
                                                                                                                                {h.paymentType || h.type || 'M-Pesa'}
                                                                                                                                <span className="text-muted font-weight-normal ml-2">- {h.studentName}</span>
                                                                                                                                {isFailed && <span className="badge badge-light-danger ml-2 py-0 px-1" style={{ fontSize: '0.65rem' }}>FAILED</span>}
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
                                            ) : this.state.activeTab === 'insights' ? (
                                                <FinanceInsightsDashboard
                                                    classes={classes}
                                                    payments={payments}
                                                    charges={charges}
                                                    feeStructures={feeStructures}
                                                    parents={parents}
                                                    students={students}
                                                    terms={terms}
                                                    selectedClass={selectedClass}
                                                    selectedTerm={selectedTerm}
                                                    onFilterChange={(filter, value) => {
                                                        const newState = {};
                                                        newState[filter] = value;
                                                        this.setState(newState);
                                                    }}
                                                />
                                            ) : this.state.activeTab === 'advanced-insights' ? (
                                                this.renderAdvancedInsights()
                                            ) : null
    }
                                    )}
                                        </>
                       ) }
                        </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODALS (Reused from V1 structure) */}
                {this.state.showPaymentModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header text-white border-0" style={{ backgroundColor: '#00C853' }}>
                                    <div className="d-flex align-items-center">
                                        <div className="symbol symbol-40px mr-3">
                                            <div className="symbol-label bg-white">
                                                <i className="fas fa-mobile-alt" style={{ color: '#00C853' }}></i>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="modal-title mb-0">M-Pesa</h5>
                                            <small className="opacity-75">The Mobile Money</small>
                                        </div>
                                    </div>
                                    <button type="button" className="close text-white" onClick={() => { this.stopPolling(); this.setState({ showPaymentModal: false, paymentStatus: 'IDLE' }); }}>
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body p-4">
                                    {this.state.paymentStatus === 'IDLE' && (
                                        <div className="text-center">
                                            {/* Student Info Card */}
                                            <div className="card border-light bg-light mb-4">
                                                <div className="card-body p-4">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="symbol symbol-50px mr-3">
                                                            <div className="symbol-label bg-white" style={{ border: '2px solid #00C853' }}>
                                                                <i className="fas fa-user" style={{ color: '#00C853' }}></i>
                                                            </div>
                                                        </div>
                                                        <div className="text-left">
                                                            <h6 className="mb-1 font-weight-bold text-dark">Initiating payment for</h6>
                                                            <p className="mb-0 font-size-h4 font-weight-bolder" style={{ color: '#00C853' }}>{this.state.paymentStudent?.names}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Details */}
                                            <div className="mb-4">
                                                <div className="form-group mb-3">
                                                    <label className="form-label font-weight-bold text-dark">Parent Phone</label>
                                                    <div className="input-group input-group-lg">
                                                        <div className="input-group-prepend">
                                                            <span className="input-group-text bg-light">
                                                                <i className="fas fa-phone" style={{ color: '#00C853' }}></i>
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="form-control bg-light"
                                                            value={this.state.parentPhone}
                                                            disabled
                                                            style={{ fontSize: '1.1rem', fontWeight: '600' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label font-weight-bold text-dark">Amount (KES)</label>
                                                    <div className="input-group input-group-lg">
                                                        <div className="input-group-prepend">
                                                            <span className="input-group-text bg-light">
                                                                <i className="fas fa-money-bill-wave" style={{ color: '#00C853' }}></i>
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            className="form-control bg-light"
                                                            value={this.state.paymentAmount}
                                                            onChange={e => this.setState({ paymentAmount: e.target.value })}
                                                            style={{ fontSize: '1.2rem', fontWeight: '700', color: '#00C853' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Note */}
                                            <div className="alert alert-custom d-flex align-items-center p-3" style={{ backgroundColor: '#E8F5E9', border: '1px solid #00C853' }}>
                                                <div className="alert-icon mr-3">
                                                    <i className="fas fa-shield-alt" style={{ color: '#00C853' }}></i>
                                                </div>
                                                <div className="alert-text">
                                                    <strong>Secure Payment:</strong> You'll receive an M-Pesa prompt to enter your PIN
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {this.state.paymentStatus === 'INITIATING' && (
                                        <div className="text-center py-5">
                                            <div className="spinner spinner-lg mb-4" style={{ color: '#00C853' }}></div>
                                            <h4 className="font-weight-bold mb-2" style={{ color: '#00C853' }}>Sending STK Push...</h4>
                                            <p className="text-muted mb-4">Connecting to M-Pesa servers</p>
                                            <div className="progress" style={{ height: '4px' }}>
                                                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: '60%', backgroundColor: '#00C853' }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {this.state.paymentStatus === 'PROCESSING' && (
                                        <div className="text-center py-5">
                                            <div className="mb-4">
                                                <div className="spinner spinner-lg" style={{ color: '#00C853' }}></div>
                                            </div>
                                            <h4 className="font-weight-bold mb-2" style={{ color: '#00C853' }}>Check your phone!</h4>
                                            <p className="text-muted mb-4">
                                                An M-Pesa prompt has been sent to <br />
                                                <span className="font-weight-bold" style={{ color: '#00C853' }}>{this.state.parentPhone}</span>
                                            </p>
                                            <div className="alert alert-custom d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#E8F5E9', border: '1px solid #00C853' }}>
                                                <div className="alert-icon mr-3">
                                                    <i className="fas fa-mobile-alt" style={{ color: '#00C853' }}></i>
                                                </div>
                                                <div className="alert-text">
                                                    <strong>Enter your M-Pesa PIN</strong> to complete the payment
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <small className="text-muted">Waiting for confirmation...</small>
                                                <div className="spinner spinner-sm ml-2" style={{ color: '#00C853' }}></div>
                                            </div>
                                        </div>
                                    )}

                                    {this.state.paymentStatus === 'SUCCESS' && (
                                        <div className="text-center py-5">
                                            <div className="mb-4">
                                                <div className="symbol symbol-80px">
                                                    <div className="symbol-label" style={{ backgroundColor: '#00C853' }}>
                                                        <i className="fas fa-check text-white icon-4x"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="font-weight-bold mb-2" style={{ color: '#00C853' }}>Payment Successful!</h4>
                                            <p className="text-muted mb-4">
                                                KES {this.state.paymentAmount?.toLocaleString()} has been <br />
                                                successfully paid and recorded
                                            </p>
                                            <div className="alert alert-custom d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#E8F5E9', border: '1px solid #00C853' }}>
                                                <div className="alert-icon mr-3">
                                                    <i className="fas fa-check-circle" style={{ color: '#00C853' }}></i>
                                                </div>
                                                <div className="alert-text">
                                                    <strong>Transaction Completed</strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {this.state.paymentStatus === 'ERROR' && (
                                        <div className="text-center py-5">
                                            <div className="mb-4">
                                                <div className="symbol symbol-80px">
                                                    <div className="symbol-label bg-danger">
                                                        <i className="fas fa-times text-white icon-4x"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <h4 className="font-weight-bold mb-2 text-danger">Payment Failed</h4>
                                            <p className="text-muted mb-4">
                                                {this.state.paymentErrorMessage || "The payment could not be completed at this time."}
                                            </p>
                                            <button className="btn btn-outline-danger btn-lg" onClick={() => this.setState({ paymentStatus: 'IDLE' })}>
                                                <i className="fas fa-redo mr-2"></i>Try Again
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {this.state.paymentStatus === 'IDLE' && (
                                    <div className="modal-footer bg-light border-0">
                                        <button className="btn btn-secondary btn-lg" onClick={() => { this.stopPolling(); this.setState({ showPaymentModal: false, paymentStatus: 'IDLE' }); }}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-lg" disabled={this.state.processingPayment} onClick={this.initiatePayment} style={{ backgroundColor: '#00C853', borderColor: '#00C853', color: 'white' }}>
                                            <i className="fas fa-paper-plane mr-2"></i>
                                            {this.state.processingPayment ? "Sending..." : "Send Payment Request"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {this.state.showManualPaymentModal && (
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                                        <select className="form-control" value={this.state.editPaymentData.paymentType || "CASH"} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, paymentType: e.target.value } })}>
                                            <option value="M-Pesa">M-Pesa</option>
                                            <option value="CASH">Cash</option>
                                            <option value="BANK">Bank</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Assign to Term</label>
                                        <select className="form-control" value={this.state.editPaymentData.metadata?.termId || ""} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, metadata: { ...this.state.editPaymentData.metadata, termId: e.target.value } } })}>
                                            <option value="">Auto-assign by Date</option>
                                            {this.state.terms && this.state.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <span className="form-text text-muted">If unset, the payment is matched to a term based on its date.</span>
                                    </div>
                                    <div className="form-group"><label>Amount (KES)</label><input type="number" className="form-control" value={this.state.editPaymentData.amount} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, amount: e.target.value } })} /></div>
                                    <div className="form-group"><label>Reference / Notes</label><input type="text" className="form-control" value={this.state.editPaymentData.ref || this.state.editPaymentData.mpesaReceiptNumber || ''} onChange={e => this.setState({ editPaymentData: { ...this.state.editPaymentData, ref: e.target.value } })} /></div>
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
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '800px' }}>
                            <div className="modal-content">
                                <div className="modal-header pb-0 border-0">
                                    <h5 className="modal-title">Fee Statement & Notification</h5>
                                    <button type="button" className="close" onClick={() => this.setState({ showStatementModal: false, statementGroup: null })}><span>&times;</span></button>
                                </div>

                                <div className="modal-body pt-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    <ul className="nav nav-tabs nav-tabs-line mb-5 mt-4 border-bottom-0">
                                        <li className="nav-item">
                                            <a className={`nav-link font-weight-bold ${this.state.statementTab === 'statement' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => this.setState({ statementTab: 'statement' })}>Statement Preview</a>
                                        </li>
                                        <li className="nav-item">
                                            <a className={`nav-link font-weight-bold ${this.state.statementTab === 'sms' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => this.setState({ statementTab: 'sms' })}>Send SMS</a>
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
                                    {this.state.statementTab === 'statement' && (
                                        <div className="d-flex align-items-center">
                                            <div className="mr-3">
                                                <label className="font-weight-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>Select Term:</label>
                                                <select
                                                    className="form-control"
                                                    style={{ width: '250px', fontSize: '0.9rem', fontWeight: '600' }}
                                                    value={this.state.statementSelectedTerm}
                                                    onChange={e => this.handleStatementTermChange(e.target.value)}
                                                >
                                                    <option value="">Choose Term...</option>
                                                    {this.getAvailableData().availableTerms.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button className="btn btn-info" onClick={this.executePrintStatement}>
                                                <i className="flaticon2-printer mr-2"></i> Print Official Statement
                                            </button>
                                        </div>
                                    )}
                                    {this.state.statementTab === 'sms' && (
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
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                                        <input type="text" className="form-control" value={this.state.editChargeData.reason} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, reason: e.target.value } })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (KES)</label>
                                        <input type="number" className="form-control" value={this.state.editChargeData.amount} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, amount: e.target.value } })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Assign to Term</label>
                                        <select className="form-control" value={this.state.editChargeData.termId || ""} onChange={e => this.setState({ editChargeData: { ...this.state.editChargeData, termId: e.target.value } })}>
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

                {/* BALANCE BROUGHT FORWARD MODAL */}
                {this.state.showBBFModal && this.state.selectedBBFGroup && (
                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '15px' }}>
                                <div className="modal-header border-0">
                                    <h5 className="modal-title font-weight-bold">Initial Balances (Brought Forward)</h5>
                                    <button type="button" className="close" onClick={() => this.setState({ showBBFModal: false, selectedBBFGroup: null })}><span>&times;</span></button>
                                </div>
                                <div className="modal-body pt-0">
                                    <div className="alert alert-custom alert-light-primary py-2 mb-5">
                                        <div className="alert-text font-size-sm">Set the manual migration balances for students under {this.state.selectedBBFGroup.parent.name}.</div>
                                    </div>
                                    {this.state.selectedBBFGroup.students.map(s => {
                                        const breakdown = this.state.bbfBreakdowns[s.id] || {};
                                        const hasSystemArrears = breakdown.systemArrears && breakdown.systemArrears !== 0;
                                        
                                        return (
                                        <div key={s.id} className="form-group mb-4">
                                            <label className="font-weight-bold">{s.names} <span className="text-muted">({s.registration})</span></label>
                                            <div className="input-group">
                                                <div className="input-group-prepend">
                                                    <span className="input-group-text bg-light border-0">KES</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="form-control bg-light border-0"
                                                    // Fix: strict check for undefined so empty strings ("") are preserved when typing
                                                    value={this.state.bbfEdits[s.id] !== undefined ? this.state.bbfEdits[s.id] : ''}
                                                    onChange={(e) => this.handleBBFChange(s.id, e.target.value)}
                                                />
                                            </div>
                                            
                                            {/* Detailed breakdown of BBF calculation - Clean Table Format */}
                                            <div className="mt-3">
                                                <div className="card card-custom card-shadowless bg-light" style={{ borderRadius: '8px' }}>
                                                    <div className="card-header border-0 bg-light py-3">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <h6 className="card-title font-weight-bold mb-0">Balance Brought Forward Breakdown</h6>
                                                            <span className="badge badge-primary font-weight-bold">{breakdown.totalBBF?.toLocaleString() || 0} KES</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-body pt-0">
                                                        <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.8rem' }}>
                                                            <tbody>
                                                                {hasSystemArrears && (
                                                                    <>
                                                                        <tr className="border-bottom">
                                                                            <td colSpan="3" className="font-weight-semibold text-muted pb-2">System-Calculated Arrears</td>
                                                                        </tr>
                                                                        
                                                                        {/* Previous Term Fees with specific term details */}
                                                                        {breakdown.previousFeesDetails.map((feeDetail, index) => (
                                                                            <tr key={`fee-${index}`}>
                                                                                <td width="10" className="pl-3 text-muted">•</td>
                                                                                <td className="text-muted">
                                                                                    <div>Term Fees</div>
                                                                                    <small className="text-muted">{feeDetail.termName}</small>
                                                                                </td>
                                                                                <td className="text-right font-weight-medium">{feeDetail.amount.toLocaleString()} KES</td>
                                                                            </tr>
                                                                        ))}
                                                                        
                                                                        {/* Previous Charges with specific term and description details */}
                                                                        {breakdown.previousChargesDetails.map((chargeDetail, index) => (
                                                                            <tr key={`charge-${index}`}>
                                                                                <td width="10" className="pl-3 text-muted">•</td>
                                                                                <td className="text-muted">
                                                                                    <div>{chargeDetail.description}</div>
                                                                                    <small className="text-muted">{chargeDetail.termName}</small>
                                                                                </td>
                                                                                <td className="text-right font-weight-medium">{chargeDetail.amount.toLocaleString()} KES</td>
                                                                            </tr>
                                                                        ))}
                                                                        
                                                                        {/* Previous Payments with specific term and date details */}
                                                                        {breakdown.previousPaymentsDetails.map((paymentDetail, index) => (
                                                                            <tr key={`payment-${index}`}>
                                                                                <td width="10" className="pl-3 text-muted">•</td>
                                                                                <td className="text-muted">
                                                                                    <div>Payment</div>
                                                                                    <small className="text-muted">{paymentDetail.termName} • {new Date(paymentDetail.date).toLocaleDateString()}</small>
                                                                                </td>
                                                                                <td className="text-right text-success font-weight-medium">-({paymentDetail.amount.toLocaleString()}) KES</td>
                                                                            </tr>
                                                                        ))}
                                                                        
                                                                        <tr className="border-top">
                                                                            <td></td>
                                                                            <td className="font-weight-semibold">Subtotal (System)</td>
                                                                            <td className={`text-right font-weight-bold ${breakdown.systemArrears >= 0 ? "text-warning" : "text-success"}`}>
                                                                                {breakdown.systemArrears >= 0 ? "+" : ""}{breakdown.systemArrears.toLocaleString()} KES
                                                                            </td>
                                                                        </tr>
                                                                    </>
                                                                )}
                                                                
                                                                <tr className={hasSystemArrears ? "border-top" : ""}>
                                                                    <td></td>
                                                                    <td className="font-weight-semibold">Manual Migration Balance</td>
                                                                    <td className="text-right font-weight-medium">{breakdown.manualBalance?.toLocaleString() || 0} KES</td>
                                                                </tr>
                                                                
                                                                <tr className="border-top bg-light">
                                                                    <td></td>
                                                                    <td className="font-weight-bold">Total BBF (System + Manual)</td>
                                                                    <td className="text-right font-weight-bold text-primary">{breakdown.totalBBF?.toLocaleString() || 0} KES</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        
                                                        {!hasSystemArrears && (
                                                            <div className="alert alert-custom alert-light-info py-2 px-3 mt-3" style={{ fontSize: '0.75rem' }}>
                                                                <i className="flaticon2-information icon-sm mr-1"></i>
                                                                No system-calculated arrears found. Total BBF equals manual balance only.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button className="btn btn-light-danger font-weight-bold" onClick={() => this.setState({ showBBFModal: false, selectedBBFGroup: null })}>Cancel</button>
                                    <button className={`btn btn-primary font-weight-bold px-8 ${this.state.savingBBF ? 'spinner spinner-white spinner-right' : ''}`} onClick={this.saveBBFChanges} disabled={this.state.savingBBF}>Save Balances</button>
                                </div>
                            </div>
                        </div>
                    </div>
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

                {/* MODALS - Like results management */}
                {this.state.showAddTermModal && (
                    <AddTermModal
                        show={this.state.showAddTermModal}
                        onHide={() => this.setState({ showAddTermModal: false })}
                        onSuccess={() => {
                            this.setState({ showAddTermModal: false });
                            // Data will be updated automatically via subscription
                        }}
                    />
                )}

                {this.state.showAddClassModal && (
                    <AddClassModal
                        show={this.state.showAddClassModal}
                        onHide={() => this.setState({ showAddClassModal: false })}
                        onSuccess={() => {
                            this.setState({ showAddClassModal: false });
                            // Data will be updated automatically via subscription
                        }}
                    />
                )}
            </div>
        );
    }
}

export default FeesManagement;