import React from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

const StatementCard = ({ group, school, validStudentsData, totalValidExpected, totalValidPaid, totalValidBalance, feeStructures, selectedTerm, terms }) => {
    const themeColor = school?.themeColor || '#1a1a1a';
    
    // Get term name for display
    const getTermName = (termId) => {
        if (!terms || !termId) return 'All Terms';
        const term = terms.find(t => t.id === termId);
        return term ? term.name : `Term ${termId}`;
    };
    
    // Helper function to get fee structure breakdown for a specific student (same as fees.js)
    const getStudentFeeStructures = (student) => {
        if (!feeStructures || !student) {
            console.log('[StatementCard] No feeStructures or student data', { feeStructures: feeStructures?.length, student });
            return [];
        }
        
        // Debug student data structure
        console.log('[StatementCard] Student data structure:', student);
        console.log('[StatementCard] Group data structure:', group);
        
        // Try multiple ways to get the student's class ID
        let studentClassId = String(
            student.class?.id || 
            student.class || 
            student.studentClassId ||
            (student.finances && student.finances.classId) ||
            'undefined'
        );
        
        // If still undefined, try to get it from the group data
        if (studentClassId === 'undefined' && group.class) {
            studentClassId = String(group.class.id || group.class);
            console.log('[StatementCard] Using class from group:', studentClassId);
        }
        
        // If still undefined, try to find student in group.students
        if (studentClassId === 'undefined' && group.students) {
            const matchingStudent = group.students.find(s => s.names === student.names);
            if (matchingStudent && matchingStudent.class) {
                studentClassId = String(matchingStudent.class?.id || matchingStudent.class);
                console.log('[StatementCard] Found class in group.students:', studentClassId);
            }
        }
        
        const targetTermId = String(selectedTerm);
        
        console.log('[StatementCard] Getting fee structures for class:', studentClassId, 'term:', targetTermId);
        console.log('[StatementCard] Available fee structures:', feeStructures?.length, feeStructures);
        
        // Get all active fee structures for this student's class and term
        const applicableFees = feeStructures.filter(fs => {
            const feeClassId = String(fs.class?.id || fs.class);
            const feeTermId = String(fs.term?.id || fs.term);
            const matches = feeClassId === studentClassId && 
                          (!targetTermId || feeTermId === targetTermId) && 
                          fs.isActive === true;
            console.log('[StatementCard] Fee structure match:', { 
                feeClassId, 
                studentClassId, 
                feeTermId, 
                targetTermId, 
                isActive: fs.isActive, 
                matches 
            });
            return matches;
        });
        
        console.log('[StatementCard] Applicable fees found:', applicableFees.length, applicableFees);
        
        // Group by fee type and sum amounts (same as fees.js)
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
        
        const result = Object.values(feeTypeGroups).sort((a, b) => b.totalAmount - a.totalAmount);
        console.log('[StatementCard] Final fee breakdown:', result);
        return result;
    };
    
    return (
        <div className="report-card-container" style={{ 
            padding: '0.8cm 1.2cm', 
            backgroundColor: 'white', 
            minHeight: 'auto', 
            height: 'auto', 
            width: '19cm', 
            maxWidth: '19cm',
            margin: '0 auto', 
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: '#1f2937', 
            boxSizing: 'border-box',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '0.85rem'
        }}>
            {/* Header */}
            <ReportHeader school={school} title="Fees Statement" themeColor={themeColor} />

            {/* Parent Details Block */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '12px', 
                backgroundColor: '#ffffff', 
                padding: '15px', 
                borderRadius: '16px', 
                marginBottom: '0.8cm',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Billed To</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 700, color: '#111827' }}>{group.parent.name}</div>
                </div>
                <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Phone</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 700, color: '#111827' }}>{group.parent.phone}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Date Issued</div>
                    <div style={{ fontSize: '1.0rem', fontWeight: 700, color: '#111827' }}>{new Date().toLocaleDateString('en-GB')}</div>
                </div>
            </div>

            {/* Balance Brought Forward Section */}
            {group.balanceBroughtForward !== undefined && (
                <div style={{ marginBottom: '0.8cm', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', backgroundColor: '#fef3c7' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                        Balance Brought Forward (Previous Terms)
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#451a03' }}>Outstanding balance from previous terms:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400e' }}>
                            KES {Math.abs(group.balanceBroughtForward || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            )}

            
            {/* Term Selector */}
            {selectedTerm && (
                <div style={{ marginBottom: '0.6cm', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                            Term:
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 700 }}>
                            {getTermName(selectedTerm)}
                        </div>
                    </div>
                </div>
            )}

            {/* Student Breakdown Table */}
            <div style={{ marginBottom: '0.6cm', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: themeColor }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'white', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', width: '45%' }}>Student / Item</th>
                            <th style={{ padding: '8px 8px', textAlign: 'right', color: 'white', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Amount (KES)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', color: 'white', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Class Fees with detailed breakdown */}
                        {validStudentsData.map((s, idx) => {
                            const studentFeeStructures = getStudentFeeStructures(s);
                            return (
                                <React.Fragment key={'s-'+idx}>
                                    {/* Student Name Header */}
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                                        <td colSpan="3" style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.85rem', color: '#1f2937' }}>
                                            {s.names}
                                        </td>
                                    </tr>
                                    
                                    {/* Individual Fee Structures (Grouped by Type like fees.js) */}
                                    {studentFeeStructures.map((fs, fsIdx) => (
                                        <tr key={'fs-'+fsIdx} style={{ backgroundColor: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#374151' }}>
                                                <div style={{ paddingLeft: '16px' }}>
                                                    <div style={{ fontWeight: 600 }}>{fs.feeType}</div>
                                                    {fs.description && (
                                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                                                            {fs.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                                                KES {fs.totalAmount.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.8rem' }}>
                                                <span style={{ 
                                                    padding: '2px 6px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 600,
                                                    backgroundColor: '#fef2f2',
                                                    color: '#dc2626'
                                                }}>
                                                    OUTSTANDING
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    
                                                                    </React.Fragment>
                            );
                        })}

                        {/* Charges */}
                        {group.charges && group.charges.length > 0 && (
                            <React.Fragment>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                                    <td colSpan="3" style={{ padding: '8px 12px', fontWeight: 700, fontSize: '0.85rem', color: '#1f2937' }}>
                                        Additional Charges
                                    </td>
                                </tr>
                                {group.charges.map((c, idx) => (
                                    <tr key={'c-'+idx} style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#374151' }}>
                                            <div style={{ paddingLeft: '16px' }}>
                                                <div style={{ fontWeight: 600 }}>{c.chargeType?.name || c.reason}</div>
                                                {c.term?.name && (
                                                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>
                                                        Term: {c.term?.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {parseFloat(c.amount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.8rem' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '8px', 
                                                fontSize: '0.65rem', 
                                                fontWeight: 600,
                                                backgroundColor: '#fef3c7',
                                                color: '#92400e'
                                            }}>
                                                OUTSTANDING
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Transaction History Table */}
            <div style={{ marginBottom: '0.6cm' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    Transaction History (Current Term)
                </h3>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '6px 12px', textAlign: 'left', color: '#4b5563', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Date</th>
                                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#4b5563', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '40%' }}>Description</th>
                                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#4b5563', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Ref / ID</th>
                                <th style={{ padding: '6px 12px', textAlign: 'right', color: '#4b5563', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Amount (KES)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.history && group.history.length > 0 ? (
                                group.history.slice(0, 8).map((h, idx) => (
                                    <tr key={'h-'+idx} style={{ borderBottom: idx === Math.min(group.history.length - 1, 7) ? 'none' : '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#374151' }}>
                                            {new Date(h.time || h.createdAt || h.transactionDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#374151' }}>
                                            <div style={{ fontWeight: 600 }}>{h.paymentType || h.type || 'M-Pesa'}</div>
                                            {h.studentName && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>For: {h.studentName}</div>}
                                        </td>
                                        <td style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                                            {h.mpesaReceiptNumber || h.ref || '-'}
                                        </td>
                                        <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                                            {parseFloat(h.amount || h.ammount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        No transactions recorded for current term.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {group.history && group.history.length > 8 && (
                        <div style={{ padding: '6px 12px', textAlign: 'center', fontSize: '0.7rem', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                            Showing 8 of {group.history.length} current term transactions
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Instructions / Disclaimer Block */}
            <div style={{ marginBottom: '0.6cm' }}>
                <div style={{ border: '2px solid #f3f4f6', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Payment Instructions
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px' }}>M-Pesa Paybill</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>123456</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px' }}>Bank Account</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>#001234567</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px' }}>School Office</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Cash Accepted</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic' }}>
                        Please ensure timely payments to avoid service interruptions. Contact school finance office for inquiries.
                    </div>
                </div>
            </div>

            {/* Premium ShulePlus Footer - Pushed to bottom via flex */}
            <div style={{ marginTop: 'auto', paddingBottom: '0.5cm' }}>
                <ReportFooter themeColor={themeColor} validationStatus="Authentic Financial Record" />
            </div>
        </div>
    );
};

export default StatementCard;
