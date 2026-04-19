import React from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

const StatementCard = ({ group, school, validStudentsData, totalValidExpected, totalValidPaid, totalValidBalance }) => {
    const themeColor = school?.themeColor || '#1a1a1a';
    
    return (
        <div className="report-card-container" style={{ 
            padding: '1.0cm 1.5cm', 
            backgroundColor: 'white', 
            minHeight: 'auto', 
            height: 'auto', 
            width: '21cm', 
            margin: '0 auto', 
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: '#1f2937', 
            boxSizing: 'border-box',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column'
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

            {/* Fee Breakdown Summary */}
            <div style={{ marginBottom: '0.8cm', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: themeColor }}>
                            <th style={{ padding: '12px 18px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', width: '40%' }}>Student / Charge</th>
                            <th style={{ padding: '12px 10px', textAlign: 'right', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Amount (KES)</th>
                            <th style={{ padding: '12px 10px', textAlign: 'right', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Class Fees */}
                        {validStudentsData.map((s, idx) => (
                            <tr key={'s-'+idx} style={{ backgroundColor: '#fff', borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px 18px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                                    <div>{s.names}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                        Class Fee • {s.finances?.expected?.toLocaleString() || '0'} KES
                                    </div>
                                </td>
                                <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700 }}>
                                    {s.finances?.expected?.toLocaleString() || '0'}
                                </td>
                                <td style={{ padding: '10px 18px', textAlign: 'right', fontSize: '0.85rem' }}>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 600,
                                        backgroundColor: s.finances?.balance > 0 ? '#fef2f2' : '#dc2626',
                                        color: s.finances?.balance > 0 ? '#dc2626' : '#059669'
                                    }}>
                                        {s.finances?.balance > 0 ? 'OUTSTANDING' : 'PAID'}
                                    </span>
                                </td>
                            </tr>
                        ))}

                        {/* Charges */}
                        {group.charges && group.charges.length > 0 && group.charges.map((c, idx) => (
                            <tr key={'c-'+idx} style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px 18px', fontWeight: 600, fontSize: '0.9rem', color: '#6b7280' }}>
                                    <div>Charge: {c.chargeType?.name || c.reason}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                                        {c.term?.name || 'Current term'}
                                    </div>
                                </td>
                                <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700 }}>
                                    {parseFloat(c.amount || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '10px 18px', textAlign: 'right', fontSize: '0.85rem' }}>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 600,
                                        backgroundColor: '#fef3c7',
                                        color: '#92400e'
                                    }}>
                                        OUTSTANDING
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        {/* Balance Brought Forward */}
                        {group.balanceBroughtForward !== undefined && (
                            <tr style={{ backgroundColor: '#fef3c7' }}>
                                <td colSpan="3" style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.85rem', color: '#92400e' }}>
                                    Balance Brought Forward (Previous Terms)
                                </td>
                                <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '1.1rem', fontWeight: 700, color: '#92400e' }}>
                                    KES {Math.abs(group.balanceBroughtForward || 0).toLocaleString()}
                                </td>
                            </tr>
                        )}

                        {/* Current Term Summary */}
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <td colSpan="3" style={{ padding: '14px 18px', fontWeight: 800, fontSize: '0.85rem', color: '#374151' }}>
                                Current Term Summary
                            </td>
                        </tr>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                            <td style={{ padding: '8px 18px', fontSize: '0.8rem', color: '#6b7280' }}>
                                Fee Structures Total
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                                {totalValidExpected.toLocaleString()}
                            </td>
                            <td style={{ padding: '8px 18px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                                {totalValidPaid.toLocaleString()}
                            </td>
                        </tr>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                            <td style={{ padding: '8px 18px', fontSize: '0.8rem', color: '#6b7280' }}>
                                Charges Total
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                                {group.charges?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '8px 18px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                                -
                            </td>
                        </tr>
                        <tr style={{ backgroundColor: themeColor, borderTop: '2px solid #1f2937' }}>
                            <td style={{ padding: '12px 18px', fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
                                <strong>Total Outstanding Balance</strong>
                            </td>
                            <td colSpan="2" style={{ padding: '12px 18px', textAlign: 'right', fontSize: '1.3rem', fontWeight: 900, color: 'white' }}>
                                KES {totalValidBalance.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Final Summary Section */}
            <div style={{ marginBottom: '0.8cm', border: '2px solid #1f2937', borderRadius: '12px', padding: '15px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.0rem', fontWeight: 700, color: '#1f2937' }}>
                    Account Summary
                </h4>
                
                {/* Balance Brought Forward */}
                {group.balanceBroughtForward !== undefined && (
                    <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                <strong>Balance Brought Forward:</strong>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: group.balanceBroughtForward < 0 ? '#dc2626' : '#059669' }}>
                                KES {Math.abs(group.balanceBroughtForward || 0).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px' }}>
                            Outstanding balance from previous terms
                        </div>
                    </div>
                )}

                {/* Current Term Summary */}
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Fee Structures</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#374151' }}>
                                KES {totalValidExpected.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Charges</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#374151' }}>
                                KES {group.charges?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Current Term Balance</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: (totalValidExpected - totalValidPaid) < 0 ? '#dc2626' : '#059669' }}>
                                KES {(totalValidExpected - totalValidPaid).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#6b7280' }}>
                        Current Term: Fee Structures + Charges - Paid
                    </div>
                </div>

                {/* Final Balance */}
                <div style={{ padding: '12px', backgroundColor: themeColor, borderRadius: '8px', border: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                        <div>
                            <div style={{ fontSize: '1.0rem', fontWeight: 700 }}>
                                <strong>Total Outstanding Balance</strong>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                                KES {totalValidBalance.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', textAlign: 'right' }}>
                            Current Term + Balance Brought Forward
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History Table */}
            <div style={{ marginBottom: '0.8cm' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Transaction History
                </h3>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '8px 18px', textAlign: 'left', color: '#4b5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Date</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#4b5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', width: '40%' }}>Description</th>
                                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#4b5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Ref / ID</th>
                                <th style={{ padding: '8px 18px', textAlign: 'right', color: '#4b5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', width: '20%' }}>Amount (KES)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.history && group.history.length > 0 ? (
                                group.history.map((h, idx) => (
                                    <tr key={'h-'+idx} style={{ borderBottom: idx === group.history.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '8px 18px', fontSize: '0.8rem', color: '#374151' }}>
                                            {new Date(h.time || h.createdAt || h.transactionDate).toLocaleDateString('en-GB')}
                                        </td>
                                        <td style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#374151' }}>
                                            <div style={{ fontWeight: 600 }}>{h.paymentType || h.type || 'M-Pesa'}</div>
                                            {h.studentName && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>For: {h.studentName}</div>}
                                        </td>
                                        <td style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>
                                            {h.mpesaReceiptNumber || h.ref || '-'}
                                        </td>
                                        <td style={{ padding: '8px 18px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                                            {parseFloat(h.amount || h.ammount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                        No transactions recorded for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Instructions / Disclaimer Block */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '1.0cm' }}>
                <div style={{ flex: 1, border: '2px solid #f3f4f6', padding: '15px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Account Status & Payment Instructions
                    </h5>
                    <div style={{ marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>
                            <strong>Final Outstanding Balance:</strong> KES {totalValidBalance.toLocaleString()}
                        </p>
                        {group.balanceBroughtForward !== undefined && (
                            <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.3 }}>
                                Includes KES {Math.abs(group.balanceBroughtForward || 0).toLocaleString()} balance brought forward from previous terms
                            </p>
                        )}
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h6 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 700, color: '#1f2937' }}>
                            Payment Methods Accepted:
                        </h6>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#374151', lineHeight: 1.5 }}>
                            <li style={{ marginBottom: '4px' }}>M-Pesa Paybill: <strong>123456</strong></li>
                            <li style={{ marginBottom: '4px' }}>Bank Deposit: <strong>Account #001234567</strong> at Equity Bank</li>
                            <li style={{ marginBottom: '4px' }}>School Office: <strong>Cash payments accepted</strong> during school hours</li>
                        </ul>
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4, fontStyle: 'italic' }}>
                        Please ensure timely payments to avoid service interruptions. For any inquiries about this statement, contact the school finance office.
                    </p>
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
