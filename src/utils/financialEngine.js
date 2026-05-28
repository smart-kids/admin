/**
 * Financial Engine Utility
 * Provides a unified source of truth for financial calculations across ShulePlus.
 * Ensures parity between Fees Management, Insights Dashboards, and Collection Reports.
 */

export const SUCCESSFUL_STATUSES = ['COMPLETED', 'PAID', 'SUCCESS', 'SUCCESSFUL', 'APPROVED', 'CLEARED', 'PENDING'];

/**
 * Validates if a payment should be counted towards collected totals.
 */
export const isSuccessfulPayment = (payment) => {
    if (!payment) return false;
    
    const status = (payment.status || "").toUpperCase();
    const type = (payment.type || "").toLowerCase();
    
    // Exclude failed ones
    if (status.includes('FAILED')) return false;
    
    // Check if status is in our successful list
    const isBasicSuccess = SUCCESSFUL_STATUSES.includes(status);
    
    // Special handling for M-Pesa init pending (not actually paid yet)
    if (status === 'PENDING' && type === 'mpesa_init') return false;
    
    return isBasicSuccess || !status; // Treat missing status as success if it reached here
};

/**
 * Calculates base fees for a class/term from fee structures.
 */
export const getFeesForClass = (classId, termId, feeStructures) => {
    if (!classId || !feeStructures || !Array.isArray(feeStructures)) return 0;
    
    const targetClassId = String(classId?.id || classId);
    const targetTermId = String(termId || "");
    
    const applicableFees = feeStructures.filter(fs =>
        String(fs.class?.id || fs.class) === targetClassId &&
        (!targetTermId || String(fs.term?.id || fs.term) === targetTermId) &&
        fs.isActive === true
    );
    
    return applicableFees.reduce((total, fs) => total + (parseFloat(fs.amount) || 0), 0);
};

/**
 * Extracts term number from name (e.g., "Term 1 2024" -> 1)
 */
const extractTermNumber = (termName) => {
    if (!termName) return 0;
    const match = termName.match(/Term (\d+)/i);
    return match ? parseInt(match[1]) : 0;
};

/**
 * Calculates Balance Brought Forward (Arrears) for a group.
 */
export const calculateBBF = (group, terms, currentTermId, charges, processedAllPayments, feeStructures) => {
    if (!currentTermId || !terms || terms.length === 0) return 0;
    
    const currentTerm = terms.find(t => String(t.id) === String(currentTermId));
    const currentTermOrder = currentTerm?.order || extractTermNumber(currentTerm?.name || '') || 0;
    
    const previousTerms = terms
        .filter(t => {
            if (String(t.id) === String(currentTermId)) return false;
            const termOrder = t.order || extractTermNumber(t.name || '') || 0;
            return termOrder < currentTermOrder;
        })
        .sort((a, b) => {
            const orderA = a.order || extractTermNumber(a.name || '') || 0;
            const orderB = b.order || extractTermNumber(b.name || '') || 0;
            return orderA - orderB;
        });

    let balanceBroughtForward = 0;

    previousTerms.forEach(prevTerm => {
        // 1. Expected fees for this previous term
        const termExpectedFees = group.students.reduce((sum, s) => {
            const termFee = getFeesForClass(s.class?.id || s.class, prevTerm.id, feeStructures);
            return sum + termFee;
        }, 0);

        // 2. Charges for this previous term
        const termCharges = (charges || []).filter(c => {
            const pId = String(c.parent?.id || c.parent);
            if (pId !== String(group.id)) return false;
            const cTermId = String(c.term?.id || c.term || "");
            return cTermId === String(prevTerm.id);
        }).reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        // 3. Payments for this previous term
        const termPayments = processedAllPayments.filter(p => {
            if (!isSuccessfulPayment(p)) return false;
            return String(p.assignedTermId) === String(prevTerm.id);
        }).reduce((sum, p) => sum + (p.processedAmount || parseFloat(p.amount || p.ammount || 0)), 0);

        // Net balance for this term = (Fees + Charges) - Payments
        const termBalance = (termExpectedFees + termCharges) - termPayments;
        balanceBroughtForward += termBalance;
    });

    return balanceBroughtForward;
};

/**
 * Main calculation engine.
 * Takes raw data and filters, returns processed parents and global metrics.
 */
export const calculateFinancials = (params = {}) => {
    const students = Array.isArray(params.students) ? params.students : [];
    const parents = Array.isArray(params.parents) ? params.parents : [];
    const payments = Array.isArray(params.payments) ? params.payments : [];
    const classes = Array.isArray(params.classes) ? params.classes : [];
    const terms = Array.isArray(params.terms) ? params.terms : [];
    const feeStructures = Array.isArray(params.feeStructures) ? params.feeStructures : [];
    const charges = Array.isArray(params.charges) ? params.charges : [];
    
    const {
        selectedClass,
        selectedTerm,
        searchTerm = "",
        alphabetFilter = ""
    } = params;

    if (!students.length || !parents.length || !classes.length) {
        return { processedParents: [], fullyProcessedParents: [], globalFinancialMetrics: null };
    }

    // 1. Group by Parent (Using ALL students for the term to allow cross-class comparisons in insights)
    const parentMap = {};
    students.forEach(student => {
        const pId = String(student.parent?.id || student.parent);
        if (!pId || pId === "undefined" || pId === "null") return;

        if (!parentMap[pId]) {
            const parentObj = parents.find(p => String(p.id) === pId) || student.parent;
            parentMap[pId] = {
                id: pId,
                parent: { ...parentObj },
                students: [],
                totalExpected: 0,
                totalPaid: 0,
                totalBalance: 0,
                totalCharges: 0,
                balanceBroughtForward: 0,
                history: [],
                allHistory: []
            };
        }
        parentMap[pId].students.push(student);
    });

    const normalizePhone = (p) => p ? p.replace(/\D/g, '').slice(-9) : '';

    // 3. Map charges and payments
    const processedList = Object.values(parentMap).map(group => {
        const normParentPhone = normalizePhone(group.parent.phone);
        const studentCount = group.students.length;
        const isSingleChild = studentCount === 1;

        const getStudentId = (p) => {
            let sId = "";
            if (p.student && typeof p.student === 'object') {
                sId = p.student.id || "";
            } else if (p.student) {
                sId = p.student || "";
            }
            return String(sId);
        };

        // All history for this parent
        const allParentPayments = payments.filter(p => {
            const paymentStudentId = getStudentId(p);
            const belongsToMyStudent = group.students.some(s => String(s.id) === paymentStudentId);
            const isParentPhoneMatch = normalizePhone(p.phone) === normParentPhone;
            return belongsToMyStudent || isParentPhoneMatch;
        });

        const processedAllPayments = allParentPayments.map(p => {
            const amount = parseFloat(p.amount || p.ammount || 0);
            const pStudentId = getStudentId(p);
            
            // If single child, treat unallocated payments as belonging to that child
            let sName = p.studentName;
            if (isSingleChild && group.students?.[0] && (!pStudentId || pStudentId === "" || pStudentId === "null" || pStudentId === "undefined")) {
                sName = group.students[0].names;
            }

            return {
                ...p,
                processedAmount: amount,
                studentName: sName
            };
        });

        // 1. Initial Pass: Expected Fees and Directly Assigned Payments
        let totalStudentPaid = 0;
        group.students.forEach(student => {
            const classFee = getFeesForClass(student.class?.id || student.class, selectedTerm, feeStructures);
            
            const studentTermPayments = processedAllPayments.filter(p => {
                if (!isSuccessfulPayment(p)) return false;
                if (selectedTerm && String(p.assignedTermId) !== String(selectedTerm)) return false;
                
                const pStudentId = getStudentId(p);
                const targetStudentId = String(student.id);

                if (pStudentId && pStudentId !== "undefined" && pStudentId !== "" && pStudentId !== "null" && pStudentId !== targetStudentId) return false;
                
                // If single child, take all unassigned payments.
                if (isSingleChild && (!pStudentId || pStudentId === "undefined" || pStudentId === "null" || pStudentId === "")) return true;
                
                return pStudentId === targetStudentId;
            });

            const paid = studentTermPayments.reduce((sum, p) => sum + p.processedAmount, 0);
            student.finances = { 
                expected: classFee, 
                totalExpected: classFee,
                paid, 
                balance: classFee - paid, 
                history: [...studentTermPayments],
                charges: 0,
                bbf: 0
            };
            group.totalExpected += classFee;
            totalStudentPaid += paid;
            group.history = [...group.history, ...studentTermPayments];
        });

        // 2. Add charges for current term (Identify assigned vs shared)
        const termCharges = (charges || []).filter(c => {
            const pId = String(c.parent?.id || c.parent);
            if (pId !== group.id) return false;
            if (selectedTerm) {
                const cTermId = String(c.term?.id || c.term || "");
                if (cTermId !== String(selectedTerm)) return false;
            }
            return true;
        });

        const assignedCharges = termCharges.filter(c => c.student?.id || c.student);
        const sharedCharges = termCharges.filter(c => !c.student?.id && !c.student);
        const sharedChargeTotal = sharedCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const perStudentSharedCharge = sharedChargeTotal / studentCount;

        group.students.forEach(student => {
            const myAssignedCharges = assignedCharges.filter(c => String(c.student?.id || c.student) === String(student.id));
            const myAssignedTotal = myAssignedCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
            
            student.finances.charges = myAssignedTotal + perStudentSharedCharge;
            student.finances.totalExpected += student.finances.charges;
            student.finances.balance += student.finances.charges;
        });

        group.totalCharges = termCharges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        group.totalExpected += group.totalCharges;
        group.charges = termCharges;

        // 3. Handle unassigned payments for multi-student groups (Waterfall Allocation)
        if (!isSingleChild) {
            const unassignedPayments = processedAllPayments.filter(p => {
                if (!isSuccessfulPayment(p)) return false;
                if (selectedTerm && String(p.assignedTermId) !== String(selectedTerm)) return false;
                const pStudentId = getStudentId(p);
                return !pStudentId || pStudentId === "undefined" || pStudentId === "null" || pStudentId === "";
            });
            
            let unassignedRemaining = unassignedPayments.reduce((sum, p) => sum + p.processedAmount, 0);
            
            if (unassignedRemaining > 0) {
                // Waterfall: Fill up students with debt first
                group.students.forEach(student => {
                    if (unassignedRemaining <= 0) return;
                    const canAbsorb = Math.max(0, student.finances.balance);
                    const applied = Math.min(canAbsorb, unassignedRemaining);
                    
                    student.finances.paid += applied;
                    student.finances.balance -= applied;
                    unassignedRemaining -= applied;
                    
                    // Show in history but mark as allocated from pool? 
                    // For now just append unassigned payments to all students history if they got a share
                    if (applied > 0) {
                        student.finances.history = [...student.finances.history, ...unassignedPayments];
                    }
                });
                
                // If there is STILL money left (overpayment), give it to the first student
                if (unassignedRemaining > 0 && group.students[0]) {
                    group.students[0].finances.paid += unassignedRemaining;
                    group.students[0].finances.balance -= unassignedRemaining;
                }

                totalStudentPaid += unassignedPayments.reduce((sum, p) => sum + p.processedAmount, 0);
                group.history = [...group.history, ...unassignedPayments];
            }
        }
        group.totalPaid = totalStudentPaid;

        // 4. Calculate and Distribute BBF
        const bbfTotal = calculateBBF(group, terms, selectedTerm, charges, processedAllPayments, feeStructures);
        const manualBBFTotal = group.students.reduce((sum, s) => sum + (parseFloat(s.balanceBroughtForward) || 0), 0);
        const totalBBF = bbfTotal + manualBBFTotal;
        
        group.balanceBroughtForward = totalBBF;
        const perStudentBBF = totalBBF / studentCount;

        group.students.forEach(student => {
            student.finances.bbf = perStudentBBF;
            student.finances.totalExpected += perStudentBBF;
            student.finances.balance += perStudentBBF;
        });

        group.totalBalance = (group.totalExpected - group.totalPaid) + group.balanceBroughtForward;
        group.allHistory = processedAllPayments;

        return group;
    });


    // 4. Apply Search/Alphabet/Class Filters
    const termLower = searchTerm.toLowerCase();
    const filteredList = processedList.filter(g => {
        if (selectedClass) {
            const selClsId = String(selectedClass);
            if (!g.students.some(s => String(s.class?.id || s.class) === selClsId)) return false;
        }
        if (searchTerm) {
            const matchesSearch = g.parent.name?.toLowerCase().includes(termLower) ||
                                g.parent.phone?.includes(termLower) ||
                                g.students.some(s => 
                                    s.names?.toLowerCase().includes(termLower) ||
                                    s.admNo?.toLowerCase().includes(termLower) ||
                                    s.registration?.toLowerCase().includes(termLower) ||
                                    s.class?.name?.toLowerCase().includes(termLower)
                                ) ||
                                g.totalExpected?.toString().includes(termLower) ||
                                g.totalPaid?.toString().includes(termLower) ||
                                g.totalBalance?.toString().includes(termLower);
            if (!matchesSearch) return false;
        }
        if (alphabetFilter) {
            const firstLetter = (g.parent.name || '').trim().charAt(0).toUpperCase();
            if (firstLetter !== alphabetFilter) return false;
        }
        return true;
    });

    // 5. Global Metrics (Reflects current filters for the KPI cards)
    const globalExpected = filteredList.reduce((sum, g) => sum + g.totalExpected, 0);
    const globalPaid = filteredList.reduce((sum, g) => sum + g.totalPaid, 0);
    const globalBalance = filteredList.reduce((sum, g) => sum + g.totalBalance, 0);
    const globalStudentCount = filteredList.reduce((sum, g) => sum + g.students.length, 0);

    const globalFinancialMetrics = {
        totalExpected: globalExpected,
        totalPaid: globalPaid,
        totalBalance: globalBalance,
        studentCount: globalStudentCount,
        collectionRate: globalExpected > 0 ? (globalPaid / globalExpected) * 100 : 0
    };

    return {
        processedParents: filteredList,
        fullyProcessedParents: processedList,
        globalFinancialMetrics
    };
};

/**
 * Aggregates parent-grouped data into class-level performance metrics.
 * Useful for insights and class-based reports.
 */
export const aggregateByClass = (fullyProcessedParents, classes) => {
    const safeParents = Array.isArray(fullyProcessedParents) ? fullyProcessedParents : [];
    const safeClasses = Array.isArray(classes) ? classes : [];
    const classGroups = {};
    
    // Initialize with all classes to ensure a complete matrix (important for heatmap/charts)
    safeClasses.forEach(cls => {
        const classId = String(cls.id);
        classGroups[classId] = {
            classId,
            className: cls.name || `Class ${classId}`,
            students: [],
            totalExpected: 0,
            totalPaid: 0,
            totalBalance: 0,
            totalCharges: 0,
            balanceBroughtForward: 0,
            collectionRate: 0,
            history: [],
            charges: []
        };
    });
    
    safeParents.forEach(group => {
        group.students.forEach((student, index) => {
            const classId = String(student.class?.id || student.class);
            const classGroup = classGroups[classId];
            if (!classGroup) return; // Skip if class not in master list
            
            classGroup.students.push(student);
            classGroup.totalExpected += (student.finances?.totalExpected || student.finances?.expected || 0);
            classGroup.totalPaid += (student.finances?.paid || 0);
            classGroup.totalBalance += (student.finances?.balance || 0);
            classGroup.totalCharges += (student.finances?.charges || 0);
            classGroup.balanceBroughtForward += (student.finances?.bbf || 0);
            classGroup.history = [...classGroup.history, ...(student.finances?.history || [])];
            classGroup.charges = [...classGroup.charges, ...(index === 0 ? group.charges || [] : [])];
        });
    });

    // Finalize rates and performance
    Object.values(classGroups).forEach(group => {
        group.id = group.classId; // compatibility alias
        group.studentCount = group.students?.length || 0; // alias
        group.totalCollected = group.totalPaid; // compatibility alias
        group.balance = group.totalBalance; // compatibility alias
        group.collectionRate = group.totalExpected > 0 ? (group.totalPaid / group.totalExpected) * 100 : 0;
        group.performance = group.collectionRate >= 80 ? 'Excellent' : 
                          group.collectionRate >= 60 ? 'Good' : 
                          group.collectionRate >= 40 ? 'Fair' : 'Poor';
    });

    return Object.values(classGroups).sort((a, b) => a.className.localeCompare(b.className));
};
