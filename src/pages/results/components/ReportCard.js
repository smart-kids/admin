import React from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

import Data from '../../../utils/data';

const ReportCard = ({ student, term, assessments, subjects, rubrics, assessmentTypes, school: propSchool }) => {
    const school = propSchool || Data.schools.getSelected();
    const themeColor = school?.themeColor || '#1a1a1a';
    
    // Helper to find score for a specific subject and assessment type
    const getScore = (subjectId, typeId) => {
        const a = assessments?.find(a => 
            (a.student === student.id || a.student?.id === student.id) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.term === term.id || a.term?.id === term.id) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId)
        );
        return a ? parseFloat(a.score) : null;
    };

    const getRubric = (score) => {
        if (score === "" || score === null || isNaN(score)) return null;
        const s = parseFloat(score);
        return (rubrics || []).find(r => s >= r.minScore && s <= r.maxScore);
    };

    // Calculate totals and averages
    const sortedAssessmentTypes = [...(assessmentTypes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

    const subjectRows = subjects.map(subject => {
        let subjectOverallScore = 0;
        let hasAnyScore = false;
        
        const typeScores = sortedAssessmentTypes.map(type => {
            const score = getScore(subject.id, type.id);
            const pct = type.percentage || 0;
            // Assuming outOf is 100 for now, or find it if we can
            const assessment = assessments.find(a => 
                (a.student === student.id || a.student?.id === student.id) &&
                (a.subject === subject.id || a.subject?.id === subject.id) &&
                (a.assessmentType === type.id || a.assessmentType?.id === type.id)
            );
            const outOf = assessment?.outOf || 100;
            const contribution = (score !== null && outOf > 0) ? (score / outOf) * pct : null;
            
            if (contribution !== null) {
                subjectOverallScore += contribution;
                hasAnyScore = true;
            }
            
            return { type, score, contribution, pct };
        });

        const overallRubric = hasAnyScore ? getRubric(subjectOverallScore) : null;

        // Group comments for this subject
        const personalizedComments = assessments
            .filter(a => 
                (a.student === student.id || a.student?.id === student.id) &&
                (a.subject === subject.id || a.subject?.id === subject.id) &&
                (a.term === term.id || a.term?.id === term.id) &&
                a.teachersComment
            )
            .map(a => a.teachersComment);

        const allComments = [...new Set([...personalizedComments, (overallRubric?.teachersComment ? [overallRubric.teachersComment] : [])].flat())];

        return {
            subject,
            typeScores,
            overallScore: subjectOverallScore,
            overallRubric,
            hasAnyScore,
            teachersComment: allComments.length > 0 ? allComments.join(' ') : '-'
        };
    });

    const weightedSubjectsCount = subjectRows.filter(r => r.hasAnyScore).length;
    const totalWeightedPercentage = weightedSubjectsCount > 0 ? subjectRows.reduce((sum, row) => sum + row.overallScore, 0) : 0;

    // Calculate Total Pts by summing rubric points (same logic as ResultsGrid)
    let totalPoints = 0;
    subjectRows.forEach(row => {
        if (row.overallRubric?.points) {
            totalPoints += parseFloat(row.overallRubric.points);
        }
    });

    return (
        <div className="report-card-container" style={{ 
            padding: '1.0cm 1.5cm', 
            backgroundColor: 'white', 
            minHeight: 'auto', 
            height: 'auto', 
            width: '21cm', 
            margin: '2cm auto', 
            position: 'relative',
            fontFamily: "'Inter', 'Roboto', sans-serif",
            color: '#1f2937', 
            boxSizing: 'border-box',
            boxShadow: '0 0 30px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Premium Header Layout */}
            <ReportHeader school={school} title="STUDENT REPORT" themeColor={themeColor} />

            {/* Student Infographic Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '15px', 
                backgroundColor: '#ffffff', 
                padding: '20px', 
                borderRadius: '16px', 
                marginBottom: '0.8cm',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Name</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{student.names}</div>
                </div>
                <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>REG NO.</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{student.registration || '---'}</div>
                </div>
                <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>CLASS / GRADE</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{student.class?.name || student.class_name || 'N/A'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>TERM</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{term?.name || 'N/A'}</div>
                </div>
            </div>

            {/* Premium Results Table */}
            <div style={{ marginBottom: '0.8cm', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: themeColor }}>
                            <th style={{ padding: '12px 18px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Learning Area / Subject</th>
                            {sortedAssessmentTypes?.map(type => (
                                <th key={type.id} style={{ padding: '12px 10px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{type.name} ({type.percentage}%)</th>
                            ))}
                            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Overall</th>
                            <th style={{ padding: '12px 18px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Remarks & Teacher's Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectRows.map((row, idx) => (
                            <React.Fragment key={idx}>
                                <tr style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                    <td style={{ padding: '10px 18px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>
                                    {row.subject.name}
                                </td>
                                 {row.typeScores.map((ts, tIdx) => (
                                    <td key={tIdx} style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.0rem', color: '#111827' }}>{ts.score !== null ? ts.score : '-'}</span>
                                            {ts.contribution !== null && (
                                                <span style={{ fontSize: '0.7rem', color: themeColor, fontWeight: 800 }}>
                                                    {ts.contribution.toFixed(1)}/{ts.pct}%
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                ))}
                                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                                    {row.hasAnyScore && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: themeColor }}>{row.overallScore.toFixed(1)}%</span>
                                            {row.overallRubric && (
                                                <span className="label label-inline label-light-primary font-weight-boldest" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                                    {row.overallRubric.label}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '10px 18px', borderBottom: '1px solid #f3f4f6', fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic', maxWidth: '200px' }}>
                                    {row.teachersComment}
                                </td>
                            </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 900, fontSize: '0.9rem', color: '#111827' }} colSpan={1 + (sortedAssessmentTypes?.length || 0)}>
                                Total Pts
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 900, fontSize: '1.3rem', color: themeColor }} colSpan={2}>
                                {totalPoints || '-'}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Performance Metrics & Trend Blocks */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '1.0cm' }}>
                <div style={{ flex: 1, border: '2px solid #f3f4f6', padding: '15px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Performance Overview
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Total Points:</span>
                            <span style={{ fontWeight: 800, color: themeColor, fontSize: '0.95rem' }}>{totalPoints || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Learning Areas Graded:</span>
                            <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{subjects.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Learning Trend Status:</span>
                            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Progress</span>
                        </div>
                    </div>
                </div>
                
                <div style={{ flex: 1.5, border: '2px solid #f3f4f6', padding: '15px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Academic Progress Trend
                    </h5>
                    {(() => {
                        const historyMap = {};
                        if (assessments && Array.isArray(assessments)) {
                            assessments.forEach(a => {
                                const sId = a.student?.id || a.student;
                                if (sId !== student.id) return;
                                const tId = a.term?.id || a.term;
                                const tName = a.term?.name || 'Term';
                                if (!historyMap[tId]) historyMap[tId] = { name: tName, total: 0, count: 0 };
                                const val = parseFloat(a.score);
                                if (!isNaN(val)) { historyMap[tId].total += val; historyMap[tId].count++; }
                            });
                        }
                        const data = Object.values(historyMap).map(d => ({ name: d.name, value: d.count ? Math.round(d.total/d.count) : 0 }));
                        if (data.length === 0) data.push({ name: term?.name || 'Current', value: Math.round(totalWeightedPercentage) || 0 });
                        const width = 350, height = 110, padding = 25, maxVal = 100;
                        if (data.length < 2) return <div style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>Historic trend data will appear here over time.</div>;
                        const points = data.map((d, i) => {
                            const x = padding + (i * ((width - 2 * padding) / (data.length - 1)));
                            const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
                            return `${x},${y}`;
                        }).join(' ');
                        return (
                            <div style={{ height: height }}>
                                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                                    <defs>
                                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: themeColor, stopOpacity: 0.2 }} />
                                            <stop offset="100%" style={{ stopColor: themeColor, stopOpacity: 0 }} />
                                        </linearGradient>
                                    </defs>
                                    <polyline fill="none" stroke="#e5e7eb" strokeWidth="1" points={`${padding},${height-padding} ${width-padding},${height-padding}`} />
                                    <polyline fill="none" stroke={themeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
                                    {data.map((d, i) => {
                                        const x = padding + (i * ((width - 2 * padding) / (data.length - 1)));
                                        const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
                                        return (
                                            <g key={i}>
                                                <circle cx={x} cy={y} r="6" fill="white" stroke={themeColor} strokeWidth="3" />
                                                <text x={x} y={height - 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#9ca3af">{d.name.substring(0,8)}</text>
                                                <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="900" fill={themeColor}>{d.value}%</text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Signature Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5cm', marginBottom: '1.0cm', padding: '0 1cm' }}>
                <div style={{ width: '220px', textAlign: 'center' }}>
                    <div style={{ height: '40px' }}></div>
                    <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '0.85rem', textTransform: 'uppercase' }}>Class Teacher</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>Signature & Date</p>
                    </div>
                </div>
                <div style={{ width: '220px', textAlign: 'center' }}>
                    <div style={{ height: '40px' }}></div>
                    <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '0.85rem', textTransform: 'uppercase' }}>Principal</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>Official Stamp & Date</p>
                    </div>
                </div>
            </div>

            {/* Premium ShulePlus Footer - Pushed to bottom via flex */}
            <div style={{ marginTop: 'auto', paddingBottom: '0.5cm' }}>
                <ReportFooter themeColor={themeColor} validationStatus="Authentic Record" />
            </div>
        </div>
    );
};

export default ReportCard;
