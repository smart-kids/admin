import React, { useState, useEffect } from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

const PlanningPrintView = ({ 
    school, 
    teacher, 
    subject, 
    grade, 
    term, 
    schemes = [], 
    lessons = [], 
    records = [], 
    iep = [],
    orientation = 'portrait'
}) => {
    
    const themeColor = school?.themeColor || '#5867dd';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    
    const getPrintStyles = () => {
        const baseStyles = {
            backgroundColor: 'white', 
            width: orientation === 'landscape' ? '100%' : '100%',
            maxWidth: orientation === 'landscape' ? 'none' : '29.7cm', 
            margin: '0 auto', 
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: '#1e293b',
            boxSizing: 'border-box',
            paddingBottom: '2cm',
            lineHeight: 1.4
        };
        return baseStyles;
    };

    return (
        <div className="planning-print-root" style={getPrintStyles()}>
            <div className="report-card-container" style={{ padding: orientation === 'landscape' ? '0.3cm 0.8cm' : '0.5cm 1cm' }}>
                {/* 1. Header */}
                <ReportHeader school={school} title="TEACHER PLANNING PORTFOLIO" themeColor={themeColor} />

                {/* 2. Document Context Block */}
                <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '15px', 
                    marginBottom: '15px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 18px',
                    backgroundColor: '#f8fafc',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                }}>
                    <div style={{ flex: '1 1 20%' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Subject & Grade</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{subject?.name || 'N/A'} - {grade?.name || 'N/A'}</div>
                    </div>
                    <div style={{ flex: '1 1 20%' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Academic Term</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{term?.name || 'N/A'}</div>
                    </div>
                    <div style={{ flex: '1 1 30%' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Prepared By</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{teacher?.name || 'Subject Teacher'}</div>
                        {teacher?.tsc_number && (
                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>TSC No: {teacher.tsc_number}</div>
                        )}
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{teacher?.email} {teacher?.phone && `| ${teacher.phone}`}</div>
                    </div>
                    <div style={{ flex: '1 1 20%' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Date Generated</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{today}</div>
                    </div>
                </div>

                {/* 3. SCHEMES OF WORK SECTION */}
                {schemes.length > 0 && (
                    <div className="print-section" style={{ 
                        pageBreakAfter: 'always', 
                        breakAfter: 'page', // Force schemes to end on first page
                        marginBottom: '1cm' 
                    }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: `2px solid ${themeColor}`, paddingBottom: '6px', marginBottom: '10px', color: themeColor }}>
                            I. SCHEMES OF WORK
                        </h2>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                <thead style={{ backgroundColor: '#f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '8%', textAlign: 'left' }}>WK/LS</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '18%', textAlign: 'left' }}>Strand & Sub-strand</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '44%', textAlign: 'left' }}>Learning Outcomes & Experiences</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '30%', textAlign: 'left' }}>Resources & Methods</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schemes.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <td style={{ padding: '6px', verticalAlign: 'top', fontWeight: 700 }}>
                                                Wk {s.week}<br/><span style={{ color: '#64748b', fontWeight: 400 }}>Lsn {s.lessonnumber}</span>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{s.strand}</div>
                                                <div style={{ color: '#475569' }}>{s.substrands}</div>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>OUTCOMES: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: s.learningoutcomes }}></span>
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>EXPERIENCES: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: s.learningexperience }}></span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>RESOURCES: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: s.learningresources }}></span>
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>METHODS & ASSESSMENT: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: s.assessment }}></span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. LESSON PLANS SECTION (Narrative Style) */}
                {lessons.length > 0 && (
                    <div className="print-section" style={{ marginBottom: '1cm' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: `2px solid ${themeColor}`, paddingBottom: '6px', marginBottom: '15px', color: themeColor }}>
                            II. DAILY LESSON PLANS
                        </h2>
                        {lessons.map((lp, idx) => (
                            <div key={idx} style={{ 
                                marginBottom: '15px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                padding: '15px',
                                pageBreakInside: 'avoid',
                                breakInside: 'avoid'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Lesson: {lp.strand}</h3>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{lp.substrands}</div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '12px' }}>
                                    <div style={{ flex: '1 1 45%' }}>
                                        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Learning Outcomes</h4>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: lp.learningoutcomes }}></div>
                                    </div>
                                    <div style={{ flex: '1 1 45%' }}>
                                        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Key Enquiry Questions</h4>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: lp.keyenquiringquestions }}></div>
                                    </div>
                                </div>

                                {/* Stack phases vertically instead of columns to give more space to content */}
                                <div className="lesson-phases" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>1. Introduction</h4>
                                        <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: lp.introduction }}></div>
                                    </div>
                                    <div style={{ padding: '10px', borderLeft: `3px solid ${themeColor}`, background: '#fff', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>2. Lesson Development</h4>
                                        <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: lp.lessondevelopment }}></div>
                                    </div>
                                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>3. Conclusion</h4>
                                        <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: lp.conclusion }}></div>
                                        {lp.extendedactivity && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                                                <strong>Extended:</strong> <span dangerouslySetInnerHTML={{ __html: lp.extendedactivity }}></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {lp.reflection && (
                                    <div style={{ marginTop: '12px', fontStyle: 'italic', color: '#475569', fontSize: '0.75rem', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                        <strong>Teacher's Reflection:</strong> <span dangerouslySetInnerHTML={{ __html: lp.reflection }}></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 5. RECORDS OF WORK */}
                {records.length > 0 && (
                    <div className="print-section" style={{ marginBottom: '1cm' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: `2px solid ${themeColor}`, paddingBottom: '6px', marginBottom: '15px', color: themeColor }}>
                            III. RECORDS OF WORK
                        </h2>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                                <thead style={{ backgroundColor: '#f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '12%', textAlign: 'left' }}>Date / Wk</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '25%', textAlign: 'left' }}>Work Covered</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '53%', textAlign: 'left' }}>Details & Activities</th>
                                        <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0', width: '10%', textAlign: 'left' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700 }}>{r.dateofteaching || 'N/A'}</div>
                                                <div style={{ color: '#64748b' }}>Week {r.week}</div>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{r.strand}</div>
                                                <div style={{ color: '#475569' }}>{r.lessoncovered}</div>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>ACTIVITIES: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: r.keyactivities }}></span>
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>ASSIGNMENTS: </span>
                                                    <span dangerouslySetInnerHTML={{ __html: r.assignments }}></span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '6px', verticalAlign: 'top', textAlign: 'center' }}>
                                                <div style={{ color: '#10b981', fontWeight: 700 }}>COMPLETED</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. IEP TEMPLATES (Profile Style) */}
                {iep.length > 0 && (
                    <div className="print-section">
                        <h2 style={{ fontSize: '0.9rem', fontWeight: 800, borderBottom: `2px solid ${themeColor}`, paddingBottom: '6px', marginBottom: '15px', color: themeColor }}>
                            IV. INDIVIDUALIZED EDUCATION PLANS (IEP)
                        </h2>
                        {iep.map((item, idx) => (
                            <div key={idx} style={{ 
                                marginBottom: '15px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                pageBreakInside: 'avoid',
                                breakInside: 'avoid'
                            }}>
                                <div style={{ backgroundColor: themeColor, color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Learner: {item.student?.names || 'N/A'}</h3>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{item.strand} - {item.substrands}</div>
                                </div>
                                
                                {/* Reduce to 2 columns or stack to give more content space */}
                                <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ flex: '1 1 45%', padding: '10px', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                                        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>Areas of Need</h4>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.needs }}></div>
                                    </div>
                                    <div style={{ flex: '1 1 45%', padding: '10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                                        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', marginBottom: '4px' }}>Areas of Strength</h4>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.strengths }}></div>
                                    </div>
                                    <div style={{ flex: '1 1 100%', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                        <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>Outcomes & Experiences</h4>
                                        <div style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                                            <strong>Outcome:</strong>
                                            <span dangerouslySetInnerHTML={{ __html: item.outcome }}></span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem' }}>
                                            <strong>Experience:</strong>
                                            <span dangerouslySetInnerHTML={{ __html: item.experience }}></span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', padding: '10px 15px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                    <div style={{ flex: '1 1 30%' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Resources</div>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.resources }}></div>
                                    </div>
                                    <div style={{ flex: '1 1 30%' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Methods</div>
                                        <div style={{ fontSize: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.methods }}></div>
                                    </div>
                                    <div style={{ flex: '1 1 30%' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Duration</div>
                                        <div style={{ fontSize: '0.75rem' }}>Init: {item.initiationDate}<br/>Term: {item.terminationDate}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Sign-off Block */}
                <div style={{ 
                    marginTop: '1.5cm', 
                    display: 'flex', 
                    justifyContent: 'space-around',
                    paddingTop: '15px',
                    borderTop: '2px solid #f1f5f9',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                }}>
                    <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '30px' }}></div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '6px' }}>SUBJECT TEACHER SIGNATURE</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Date: ........................................</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '30px' }}></div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '6px' }}>HEAD OF DEPARTMENT (HOD)</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Date: ........................................</div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1cm' }}>
                    <ReportFooter themeColor={themeColor} validationStatus="Authenticated Curriculum Record" />
                </div>
            </div>
            
            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    .planning-print-root {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: ${orientation === 'landscape' ? '0.3cm 0.8cm' : '0.5cm 1cm'} !important;
                    }
                    
                    .report-card-container {
                        padding: ${orientation === 'landscape' ? '0.3cm 0.8cm' : '0.5cm 1cm'} !important;
                    }
                    
                    table {
                        font-size: ${orientation === 'landscape' ? '0.6rem' : '0.7rem'} !important;
                    }
                    
                    th, td {
                        padding: ${orientation === 'landscape' ? '4px' : '6px'} !important;
                    }

                    @page {
                        size: A4 ${orientation};
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
};

export default PlanningPrintView;
