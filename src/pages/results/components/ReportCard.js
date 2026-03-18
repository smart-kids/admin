import React from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

import Data from '../../../utils/data';

const ReportCard = ({ student, term, assessments, subjects, rubrics, assessmentTypes, school: propSchool }) => {
    const school = propSchool || Data.schools.getSelected();
    const themeColor = school?.themeColor || '#1a1a1a';
    
    // Helper to find the full assessment for a specific subject and assessment type
    const getAssessment = (subjectId, typeId) => {
        return assessments.find(a => 
            (a.student === student.id || a.student?.id === student.id) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.term === term.id || a.term?.id === term.id) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId)
        );
    };

    const getScore = (subjectId, typeId) => {
        const a = getAssessment(subjectId, typeId);
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
        let overallScore = 0;
        let hasAnyScore = false;

        const typeScores = sortedAssessmentTypes.map(type => {
            const assessment = getAssessment(subject.id, type.id);
            const score = assessment ? parseFloat(assessment.score) : null;
            const outOf = assessment ? (parseFloat(assessment.outOf) || 100) : 100;
            const pct = type.percentage || 0;
            const contribution = (score !== null && !isNaN(score) && outOf > 0) ? (score / outOf) * pct : null;
            if (contribution !== null) { overallScore += contribution; hasAnyScore = true; }
            return { type, score, outOf, contribution, pct };
        });

        const overallRubric = hasAnyScore ? getRubric(overallScore) : null;

        return {
            subject,
            typeScores,
            overallScore: hasAnyScore ? overallScore : null,
            overallRubric
        };
    });

    const totalOverallPoints = subjectRows.reduce((sum, row) => sum + (row.overallScore || 0), 0);

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
                                <th key={type.id} style={{ padding: '12px 10px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    {type.name} {type.percentage ? `(${type.percentage}%)` : ''}
                                </th>
                            ))}
                            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Overall</th>
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
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>
                                                {ts.score !== null ? ts.score : '-'}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 500 }}>
                                                / {ts.outOf}
                                            </span>
                                            {ts.contribution !== null && (
                                                <div style={{ fontSize: '0.7rem', color: '#3699ff', fontWeight: 800 }}>
                                                    {ts.contribution.toFixed(1)}<span style={{ fontWeight: 500, color: '#9ca3af' }}>/{ts.pct}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                ))}
                                {/* Overall rubric column */}
                                <td style={{ padding: '10px 10px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                                    {row.overallScore !== null ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: themeColor }}>
                                                {row.overallScore.toFixed(1)}%
                                            </span>
                                            {row.overallRubric && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                    <div style={{ fontSize: '0.7rem', color: themeColor, fontWeight: 900, textTransform: 'uppercase', lineHeight: '1.2', border: `1px solid ${themeColor}`, borderRadius: '4px', padding: '1px 6px', backgroundColor: `${themeColor}12` }}>
                                                        {row.overallRubric.label}
                                                    </div>
                                                    {row.overallRubric.teachersComment && (
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3f4254', lineHeight: '1.3', textAlign: 'center', wordBreak: 'break-word', maxWidth: '90px' }}>
                                                            {row.overallRubric.teachersComment}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : '-'}
                                </td>
                            </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 900, fontSize: '0.9rem', color: '#111827' }} colSpan={1 + (sortedAssessmentTypes?.length || 0)}>
                                AGGREGATE SUMMARY
                            </td>
                            <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 900, fontSize: '1.3rem', color: themeColor }}>
                                {totalOverallPoints.toFixed(1)}%
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
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Overall Points Earned:</span>
                            <span style={{ fontWeight: 800, color: themeColor, fontSize: '0.95rem' }}>{totalOverallPoints}</span>
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
                        if (data.length === 0) data.push({ name: term?.name || 'Current', value: parseInt(totalOverallPoints) || 0 });
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
