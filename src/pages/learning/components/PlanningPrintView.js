import React from 'react';
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
    iep = [] 
}) => {
    const themeColor = school?.themeColor || '#5867dd';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="planning-print-root" style={{ 
            backgroundColor: 'white', 
            minHeight: '29.7cm', 
            width: '21cm', 
            margin: '0 auto', 
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: '#1e293b',
            boxSizing: 'border-box',
            paddingBottom: '2.5cm'
        }}>
            <div className="report-card-container" style={{ padding: '2.5cm 2cm' }}>
                {/* 1. Header */}
                <ReportHeader school={school} title="TEACHER PLANNING PORTFOLIO" themeColor={themeColor} />

                {/* 2. Document Context Block */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '20px', 
                    marginBottom: '1cm',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px',
                    backgroundColor: '#f8fafc'
                }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Subject & Grade</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{subject?.name || 'N/A'} - {grade?.name || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Academic Term</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{term?.name || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Prepared By</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{teacher?.name || 'Subject Teacher'}</div>
                        {teacher?.tsc_number && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>TSC No: {teacher.tsc_number}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{teacher?.email} {teacher?.phone && `| ${teacher.phone}`}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Date Generated</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{today}</div>
                    </div>
                </div>

                {/* 3. SCHEMES OF WORK SECTION */}
                {schemes.length > 0 && (
                    <div className="print-section" style={{ marginBottom: '1.5cm', pageBreakAfter: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: `3px solid ${themeColor}`, paddingBottom: '8px', marginBottom: '15px', color: themeColor }}>
                            I. SCHEMES OF WORK
                        </h2>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead style={{ backgroundColor: '#f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '10%' }}>WK/LS</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '25%' }}>Strand / Sub-strand</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '40%' }}>Learning Outcomes & Experiences</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '25%' }}>Resources & Methods</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schemes.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', verticalAlign: 'top', fontWeight: 700, textAlign: 'center' }}>
                                                Wk {s.week}<br/><span style={{ color: '#64748b', fontWeight: 400 }}>Lsn {s.lessonnumber}</span>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{s.strand}</div>
                                                <div style={{ color: '#475569' }}>{s.substrands}</div>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <strong>Outcomes:</strong>
                                                    <div dangerouslySetInnerHTML={{ __html: s.learningoutcomes }}></div>
                                                </div>
                                                <div>
                                                    <strong>Experiences:</strong>
                                                    <div dangerouslySetInnerHTML={{ __html: s.learningexperience }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '8px' }}>
                                                    <strong>Resources:</strong>
                                                    <div dangerouslySetInnerHTML={{ __html: s.learningresources }}></div>
                                                </div>
                                                <div>
                                                    <strong>Methods:</strong>
                                                    <div dangerouslySetInnerHTML={{ __html: s.assessment }}></div>
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
                    <div className="print-section" style={{ marginBottom: '1.5cm' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: `3px solid ${themeColor}`, paddingBottom: '8px', marginBottom: '20px', color: themeColor }}>
                            II. DAILY LESSON PLANS
                        </h2>
                        {lessons.map((lp, idx) => (
                            <div key={idx} style={{ 
                                marginBottom: '1cm', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '16px', 
                                padding: '24px',
                                pageBreakInside: 'avoid'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Lesson: {lp.strand}</h3>
                                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{lp.substrands}</div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Learning Outcomes</h4>
                                        <div style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: lp.learningoutcomes }}></div>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Key Enquiry Questions</h4>
                                        <div style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: lp.keyenquiringquestions }}></div>
                                    </div>
                                </div>

                                <div className="lesson-phases">
                                    <div style={{ marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>1. Introduction</h4>
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: lp.introduction }}></div>
                                    </div>
                                    <div style={{ marginBottom: '15px', padding: '15px', borderLeft: `4px solid ${themeColor}` }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>2. Lesson Development</h4>
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: lp.lessondevelopment }}></div>
                                    </div>
                                    <div style={{ marginBottom: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>3. Conclusion & Extended Activity</h4>
                                        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: lp.conclusion }}></div>
                                        {lp.extendedactivity && (
                                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                                                <strong>Extended:</strong> <span dangerouslySetInnerHTML={{ __html: lp.extendedactivity }}></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {lp.reflection && (
                                    <div style={{ marginTop: '15px', fontStyle: 'italic', color: '#475569', fontSize: '0.85rem', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <strong>Teacher's Reflection:</strong> <span dangerouslySetInnerHTML={{ __html: lp.reflection }}></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 5. RECORDS OF WORK */}
                {records.length > 0 && (
                    <div className="print-section" style={{ marginBottom: '1.5cm' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: `3px solid ${themeColor}`, paddingBottom: '8px', marginBottom: '15px', color: themeColor }}>
                            III. RECORDS OF WORK
                        </h2>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead style={{ backgroundColor: '#f1f5f9' }}>
                                    <tr>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '15%' }}>Date / Wk</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '30%' }}>Work Covered</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '40%' }}>Details & Activities</th>
                                        <th style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', width: '15%' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700 }}>{r.dateofteaching || 'N/A'}</div>
                                                <div style={{ color: '#64748b' }}>Week {r.week}</div>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{r.strand}</div>
                                                <div style={{ color: '#475569' }}>{r.lessoncovered}</div>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <strong>Activities:</strong> <span dangerouslySetInnerHTML={{ __html: r.keyactivities }}></span>
                                                </div>
                                                <div>
                                                    <strong>Assignments:</strong> <span dangerouslySetInnerHTML={{ __html: r.assignments }}></span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
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
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: `3px solid ${themeColor}`, paddingBottom: '8px', marginBottom: '20px', color: themeColor }}>
                            IV. INDIVIDUALIZED EDUCATION PLANS (IEP)
                        </h2>
                        {iep.map((item, idx) => (
                            <div key={idx} style={{ 
                                marginBottom: '1cm', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '16px', 
                                overflow: 'hidden',
                                pageBreakInside: 'avoid'
                            }}>
                                <div style={{ backgroundColor: themeColor, color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Learner: {item.student?.names || 'N/A'}</h3>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{item.strand} - {item.substrands}</div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '6px' }}>Areas of Need</h4>
                                            <div style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: item.needs }}></div>
                                        </div>
                                        <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', marginBottom: '6px' }}>Areas of Strength</h4>
                                            <div style={{ fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: item.strengths }}></div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Specific Learning Outcomes & Experiences</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>Outcome:</strong>
                                                <div dangerouslySetInnerHTML={{ __html: item.outcome }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>Experience:</strong>
                                                <div dangerouslySetInnerHTML={{ __html: item.experience }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Resources</div>
                                            <div style={{ fontSize: '0.8rem' }} dangerouslySetInnerHTML={{ __html: item.resources }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Methods</div>
                                            <div style={{ fontSize: '0.8rem' }} dangerouslySetInnerHTML={{ __html: item.methods }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Duration</div>
                                            <div style={{ fontSize: '0.8rem' }}>Init: {item.initiationDate}<br/>Term: {item.terminationDate}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Sign-off Block */}
                <div style={{ 
                    marginTop: '2cm', 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '40px',
                    paddingTop: '20px',
                    borderTop: '2px solid #f1f5f9'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '40px' }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>SUBJECT TEACHER SIGNATURE</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: ........................................</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '1px solid #1e293b', height: '40px' }}></div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>HEAD OF DEPARTMENT (HOD)</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Date: ........................................</div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1cm' }}>
                    <ReportFooter themeColor={themeColor} validationStatus="Authenticated Curriculum Record" />
                </div>
            </div>
        </div>
    );
};

export default PlanningPrintView;
