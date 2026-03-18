import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import Data from "../../../utils/data";

/** 
 * DetailedPerformanceAnalytics
 * A premium SVG-based analytics component showing cross-term trends 
 * and assessment type performance.
 */
const DetailedPerformanceAnalytics = ({ student, subjects, currentAssessments, allAssessments, allTerms, assessmentTypes, rubrics, lessonAttempts = [], attemptEvents = [], themeColor = '#3699ff' }) => {
    
    // 1. Data Processing
    const studentAll = useMemo(() => {
        return (allAssessments || []).filter(a => (a.student === student.id || a.student?.id === student.id));
    }, [allAssessments, student.id]);

    const studentLessons = useMemo(() => {
        return (lessonAttempts || []).filter(l => l.userId === student.id || l.student === student.id || l.student?.id === student.id);
    }, [lessonAttempts, student.id]);

    const multiTermBars = useMemo(() => {
        const sortedTerms = [...(allTerms || [])].sort((a,b) => (a.order || 0) - (b.order || 0));
        return subjects.map(subj => {
            const termScores = sortedTerms.map(term => {
                const a = studentAll.find(a => (a.subject === subj.id || a.subject?.id === subj.id) && (a.term === term.id || a.term?.id === term.id));
                return {
                    termId: term.id,
                    termName: term.name,
                    score: a ? (parseFloat(a.score) || 0) : null
                };
            });
            // Primary score (current term) for the main bar
            const currentA = currentAssessments.find(a => (a.subject === subj.id || a.subject?.id === subj.id) && (a.student === student.id || a.student?.id === student.id));
            const currentScore = currentA ? (parseFloat(currentA.score) || 0) : 0;
            
            return { 
                name: subj.name, 
                currentScore,
                termScores 
            };
        }).filter(b => b.currentScore > 0 || b.termScores.some(ts => ts.score !== null));
    }, [subjects, allTerms, studentAll, currentAssessments, student.id]);

    // Revision Summary
    const revisionInsights = useMemo(() => {
        const completed = studentLessons.filter(l => l.status === 'COMPLETED');
        const avgScore = completed.length > 0 ? (completed.reduce((sum, l) => sum + (l.finalScore || 0), 0) / completed.length) : 0;
        
        // Current bars for relative strengths (calculated on the fly for insights)
        const currentBars = multiTermBars.map(b => ({ name: b.name, score: b.currentScore })).filter(b => b.score > 0);

        const sortedScores = [...currentBars].sort((a,b) => b.score - a.score);
        const strengths = sortedScores.slice(0, 2).map(s => s.name);
        const weaknesses = sortedScores.slice(-2).reverse().map(s => s.name);

        return {
            totalAttempts: studentLessons.length,
            completedCount: completed.length,
            revisionAvg: Math.round(avgScore),
            strengths,
            weaknesses,
            currentBars
        };
    }, [studentLessons, multiTermBars]);

    // Cross-Term Trends (Line Chart Data)
    const trendData = useMemo(() => {
        const sortedTerms = (allTerms || []).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        return sortedTerms.map(term => {
            const termAssessments = studentAll.filter(a => (a.term === term.id || a.term?.id === term.id));
            const total = termAssessments.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0);
            const avg = termAssessments.length > 0 ? (total / termAssessments.length) : 0;
            
            // Shorten name: "Term 1 2024" -> "T1 '24"
            const parts = term.name.split(' ');
            let shortName = term.name;
            if (parts.length >= 3) shortName = `${parts[0][0]}${parts[1]} '${parts[parts.length-1].slice(-2)}`;
            else if (parts.length === 2) shortName = `${parts[0][0]}${parts[1]}`;
            
            return { term: shortName, avg, fullTerm: term.name };
        }).filter(d => d.avg > 0);
    }, [allTerms, studentAll]);

    // 2. Chart Rendering (Line Chart SVG)
    const renderTrendChart = () => {
        if (trendData.length < 2) return <div className="text-muted small p-4 bg-light rounded text-center">Insufficient historical data for trend analysis.</div>;
        
        const width = 320;
        const height = 120;
        const padding = 25;
        const maxAvg = 100;
        
        const points = trendData.map((d, i) => {
            const x = padding + (i * (width - 2 * padding) / (trendData.length - 1));
            const y = height - padding - (d.avg / maxAvg * (height - 2 * padding));
            return { x, y, avg: d.avg, term: d.term };
        });

        const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
        const areaD = `${pathD} L ${points[points.length-1].x} ${height-padding} L ${points[0].x} ${height-padding} Z`;

        return (
            <div style={{ position: 'relative' }}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#f3f4f6" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#f3f4f6" />
                    <path d={areaD} fill="url(#trendGradient)" opacity="0.1" />
                    <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={themeColor} />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path d={pathD} fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={themeColor} strokeWidth="2" />
                            <text x={p.x} y={height - 5} fontSize="9" fill="#9ca3af" textAnchor="middle">{p.term}</text>
                            <text x={p.x} y={p.y - 8} fontSize="10" fontWeight="700" fill={themeColor} textAnchor="middle">{Math.round(p.avg)}%</text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    useEffect(() => {
        if (student.id) {
            Data.assessments.getForStudent(student.id);
        }
    }, [student.id]);

    // Cross-Term Performance Matrix Data
    const crossTermMatrix = useMemo(() => {
        const sortedTerms = [...(allTerms || [])].sort((a,b) => (a.order || 0) - (b.order || 0));
        return sortedTerms.map(term => {
            const termAss = studentAll.filter(a => (a.term === term.id || a.term?.id === term.id));
            const subjectScores = subjects.map(subj => {
                const a = termAss.find(a => (a.subject === subj.id || a.subject?.id === subj.id));
                return a ? parseFloat(a.score) : null;
            });
            const termAvg = subjectScores.filter(s => s !== null).length > 0 
                ? (subjectScores.reduce((sum, s) => sum + (s || 0), 0) / subjectScores.filter(s => s !== null).length) 
                : 0;
            return { term, subjectScores, termAvg };
        }).filter(d => d.subjectScores.some(s => s !== null)); // Only show terms with data
    }, [allTerms, studentAll, subjects]);

    return (
        <div style={{ padding: '20px 24px', background: '#f9fafc', borderTop: '3px solid #3699ff' }}>
            <div className="row">

                {/* === LEFT PANEL === */}
                <div className="col-lg-6 pr-lg-6">

                    {/* Subject Performance Analytics (Multi-Term) */}
                    <div className="card card-custom card-shadowless bg-white mb-4" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
                        <div className="card-body p-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b5b5c3', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Subject Performance Across Terms
                                </div>
                                <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: themeColor, marginRight: '4px' }}></div>
                                        <span style={{ fontSize: '0.65rem', color: '#7e8299', fontWeight: 700 }}>Current</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b5b5c3', marginRight: '4px' }}></div>
                                        <span style={{ fontSize: '0.65rem', color: '#7e8299', fontWeight: 700 }}>Historical</span>
                                    </div>
                                </div>
                            </div>
                            {multiTermBars.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {multiTermBars.map((item, i) => {
                                        const currentRubric = (rubrics || []).find(r => item.currentScore >= r.minScore && item.currentScore <= r.maxScore);
                                        const colorMap = { 'EE': '#10b981', 'ME': '#3699ff', 'AE': '#f6c23e', 'BE': '#e74c3c' };
                                        const primaryColor = currentRubric ? (colorMap[currentRubric.label] || themeColor) : themeColor;
                                        
                                        return (
                                            <div key={i}>
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3f4254' }}>
                                                        {item.name}
                                                    </span>
                                                    <div className="d-flex align-items-center">
                                                        {currentRubric && (
                                                            <span className="mr-2 px-2 py-0 border rounded" style={{ fontSize: '0.62rem', fontWeight: 900, color: primaryColor, borderColor: primaryColor, backgroundColor: `${primaryColor}10` }}>
                                                                {currentRubric.label}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3f4254' }}>
                                                            {Math.round(item.currentScore)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex flex-column" style={{ gap: '6px' }}>
                                                    {/* Main Bar (Current Term) */}
                                                    <div style={{ height: '8px', background: '#f3f6f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${item.currentScore}%`, height: '100%', background: primaryColor, borderRadius: '10px', transition: 'width 0.8s ease' }} />
                                                    </div>
                                                    
                                                    {/* Term Comparison Spark Bars */}
                                                    <div className="d-flex align-items-end" style={{ gap: '3px', height: '24px', padding: '0 2px' }}>
                                                        {item.termScores.map((ts, idx) => {
                                                            const hasData = ts.score !== null;
                                                            const isCurrent = item.currentScore > 0 && Math.abs(ts.score - item.currentScore) < 0.1; // Simple heuristic if we don't have currentTermId here easily
                                                            
                                                            return (
                                                                <div 
                                                                    key={idx} 
                                                                    style={{ 
                                                                        flex: 1, 
                                                                        height: '100%', 
                                                                        display: 'flex', 
                                                                        flexDirection: 'column', 
                                                                        justifyContent: 'flex-end',
                                                                        opacity: hasData ? 1 : 0.3
                                                                    }}
                                                                    title={`${ts.termName}: ${hasData ? Math.round(ts.score) + '%' : 'No Data'}`}
                                                                >
                                                                    <div style={{ 
                                                                        height: hasData ? `${ts.score}%` : '2px', 
                                                                        background: isCurrent ? primaryColor : '#e1e3ea',
                                                                        borderRadius: '1px',
                                                                        transition: 'height 0.5s ease'
                                                                    }} />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-muted small p-4 text-center bg-light rounded">Insufficient subject data for multi-term comparison.</div>
                            )}
                        </div>
                    </div>

                    {/* Progress Trend Chart */}
                    <div className="card card-custom card-shadowless bg-white" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
                        <div className="card-body p-5">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b5b5c3', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Weighted Progress
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="text-muted font-weight-bold font-size-xs mr-2">Previous:</span>
                                    <span className="text-dark-75 font-weight-boldest font-size-sm mr-4">{Math.round(trendData[trendData.length-2]?.avg || 0)}%</span>
                                    <span className="text-muted font-weight-bold font-size-xs mr-2">Current:</span>
                                    <span className="text-primary font-weight-boldest font-size-sm">{Math.round(trendData[trendData.length-1]?.avg || 0)}%</span>
                                </div>
                            </div>
                            {renderTrendChart()}
                        </div>
                    </div>

                </div>

                {/* === RIGHT PANEL === */}
                <div className="col-lg-6 pl-lg-6">

                    {/* Mobile Revision Stats */}
                    <div className="card card-custom card-shadowless bg-white mb-4" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
                        <div className="card-body p-5">
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b5b5c3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                Mobile Revision
                            </div>
                            <div className="row">
                                <div className="col-6">
                                    <div className="d-flex flex-column bg-light-primary p-4 rounded" style={{ borderLeft: '3px solid #3699ff' }}>
                                        <span className="text-primary font-weight-boldest font-size-h3">{revisionInsights.totalAttempts}</span>
                                        <span className="text-muted font-weight-bold font-size-xs text-uppercase">Attempts</span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex flex-column bg-light-success p-4 rounded" style={{ borderLeft: '3px solid #10b981' }}>
                                        <span className="text-success font-weight-boldest font-size-h3">{revisionInsights.revisionAvg}%</span>
                                        <span className="text-muted font-weight-bold font-size-xs text-uppercase">Avg Score</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Insights (Strengths / Weaknesses) */}
                    <div className="card card-custom card-shadowless bg-white mb-4" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
                        <div className="card-body p-5">
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b5b5c3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                Performance Insights
                            </div>
                            <div className="row">
                                <div className="col-6">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="flaticon2-check-mark text-success mr-2" style={{ fontSize: '0.8rem' }}></i>
                                        <span className="font-weight-boldest text-dark-75 font-size-xs text-uppercase">Strengths</span>
                                    </div>
                                    <div className="d-flex flex-wrap" style={{ gap: '4px' }}>
                                        {revisionInsights.strengths.length > 0 ? revisionInsights.strengths.map((s, i) => (
                                            <span key={i} className="label label-inline label-light-success font-weight-bold" style={{ fontSize: '0.65rem' }}>{s}</span>
                                        )) : <span className="text-muted font-size-xs">N/A</span>}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="flaticon2-warning text-danger mr-2" style={{ fontSize: '0.8rem' }}></i>
                                        <span className="font-weight-boldest text-dark-75 font-size-xs text-uppercase">Focus Areas</span>
                                    </div>
                                    <div className="d-flex flex-wrap" style={{ gap: '4px' }}>
                                        {revisionInsights.weaknesses.length > 0 ? revisionInsights.weaknesses.map((s, i) => (
                                            <span key={i} className="label label-inline label-light-danger font-weight-bold" style={{ fontSize: '0.65rem' }}>{s}</span>
                                        )) : <span className="text-muted font-size-xs">N/A</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cross-Term Sub-Matrix Table */}
                    <div className="card card-custom card-shadowless bg-white" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
                        <div className="card-body p-5">
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b5b5c3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                Cross-Term Comparison
                            </div>
                            <div className="table-responsive">
                                <table className="table table-borderless table-vertical-center mb-0">
                                    <thead>
                                        <tr>
                                            <th className="p-0" style={{ minWidth: '80px' }}>Term</th>
                                            {subjects.map(s => (
                                                <th key={s.id} className="p-0 text-center" style={{ minWidth: '40px' }}>
                                                    <span className="text-muted font-weight-bold font-size-xs d-block">{s.name.slice(0,3)}</span>
                                                </th>
                                            ))}
                                            <th className="p-0 text-right" style={{ minWidth: '40px' }}>Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {crossTermMatrix.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: i === crossTermMatrix.length - 1 ? 'none' : '1px solid #f3f6f9' }}>
                                                <td className="pl-0 py-2">
                                                    <span className="text-dark-75 font-weight-bolder d-block font-size-xs">{row.term.name}</span>
                                                </td>
                                                {row.subjectScores.map((score, j) => (
                                                    <td key={j} className="text-center py-2">
                                                        <span className={`font-weight-bold font-size-xs ${score === null ? 'text-muted opacity-30' : 'text-dark-75'}`}>
                                                            {score !== null ? Math.round(score) : '-'}
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="pr-0 py-2 text-right text-primary font-weight-boldest font-size-xs">
                                                    {Math.round(row.termAvg)}%
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
        </div>
    );
};

const SkeletonRow = ({ subjectsCount }) => (
    <tr className="skeleton-row">
        <td className="pl-4 py-3"><div className="skeleton-placeholder" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div></td>
        <td style={{ position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#fff', borderRight: '1px solid #ebedf3', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
            <div className="skeleton-placeholder" style={{ width: '150px', height: '20px' }}></div>
        </td>
        {Array.from({ length: subjectsCount }).map((_, i) => (
            <td key={i} className="p-4">
                <div className="d-flex flex-row justify-content-center" style={{ gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="skeleton-placeholder mb-2" style={{ width: '60px', height: '35px' }}></div>
                    </div>
                </div>
            </td>
        ))}
        <td style={{ position: 'sticky', right: '120px', zIndex: 10, backgroundColor: '#fff', borderLeft: '1px solid #ebedf3', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>
            <div className="skeleton-placeholder mx-auto" style={{ width: '40px', height: '25px' }}></div>
        </td>
        <td style={{ position: 'sticky', right: 0, zIndex: 10, backgroundColor: '#fff' }}>
            <div className="d-flex justify-content-center">
                <div className="skeleton-placeholder mr-2" style={{ width: '30px', height: '30px' }}></div>
                <div className="skeleton-placeholder" style={{ width: '30px', height: '30px' }}></div>
            </div>
        </td>
        <style>{`
            .skeleton-row .skeleton-placeholder {
                background: #f3f6f9;
                border-radius: 4px;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
            .results-table-container { transition: opacity 0.3s ease; }
        `}</style>
    </tr>
);

const ResultsGrid = ({ students, subjects, assessments, allAssessments, allTerms, assessmentTypes, rubrics, updates, onScoreChange, onRemarkChange, onCommentChange, onOutOfChange, onBlur, onPrintSingle, onSendSms, loading, lessonAttempts = [], attemptEvents = [] }) => {
    const [expandedStudents, setExpandedStudents] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [selectedLetter, setSelectedLetter] = useState(null);

    const sortedAssessmentTypes = useMemo(() => {
        return [...(assessmentTypes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [assessmentTypes]);

    const toggleStudent = useCallback((studentId) => {
        setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    }, []);

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');


    // Helper to get score for a cell
    const getScore = (studentId, subjectId, typeId) => {
        const updateKey = `${studentId}-${subjectId}-${typeId}-score`;
        if (updates && updates.hasOwnProperty(updateKey)) {
            return updates[updateKey];
        }
        const assessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? assessment.score : "";
    };

    const getRemark = (studentId, subjectId, typeId) => {
        const updateKey = `${studentId}-${subjectId}-${typeId}-remark`;
        if (updates && updates.hasOwnProperty(updateKey)) {
            return updates[updateKey];
        }
        const assessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? (assessment.remarks || assessment.remark || "") : "";
    };

    const getComment = (studentId, subjectId, typeId) => {
        const updateKey = `${studentId}-${subjectId}-${typeId}-comment`;
        if (updates && updates.hasOwnProperty(updateKey)) {
            return updates[updateKey];
        }
        const assessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? (assessment.teachersComment || "") : "";
    };

    const getOutOf = (studentId, subjectId, typeId) => {
        const updateKey = `${studentId}-${subjectId}-${typeId}-outOf`;
        if (updates && updates.hasOwnProperty(updateKey)) {
            return updates[updateKey];
        }
        const assessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? (assessment.outOf ?? "100") : "100";
    };

    const getRubric = (score) => {
        if (score === "" || score === null || isNaN(score)) return null;
        const s = parseFloat(score);
        return (rubrics || []).find(r => s >= r.minScore && s <= r.maxScore);
    };

    const filteredStudents = useMemo(() => {
        let result = students || [];
        
        // 1. Search term filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(s => 
                (s.names || '').toLowerCase().includes(lowerSearch) || 
                (s.admNo || '').toLowerCase().includes(lowerSearch) ||
                (s.registration || '').toLowerCase().includes(lowerSearch) ||
                (s.parent?.name || '').toLowerCase().includes(lowerSearch) ||
                (s.parent?.phone || '').includes(lowerSearch)
            );
        }

        // 2. Alphabetical filter
        if (selectedLetter) {
            result = result.filter(s => (s.names || '').trim().toUpperCase().startsWith(selectedLetter));
        }

        return result;
    }, [students, searchTerm, selectedLetter]);

    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedLetter, rowsPerPage]);

    const getRubricColor = (rubric) => {
        if (!rubric) return '#3699ff';
        const colors = { 'EE': '#10b981', 'ME': '#3699ff', 'AE': '#f6c23e', 'BE': '#e74c3c' };
        return colors[rubric.label] || '#3699ff';
    };

    return (
        <div className={`d-flex flex-column results-table-container ${loading ? 'opacity-70' : ''}`} style={{ minHeight: '400px' }}>
            {/* Alphabetical Quick Filter */}
            <div className="d-flex flex-wrap mb-4 p-2 bg-light rounded" style={{ gap: '4px' }}>
                <button 
                    className={`btn btn-xs font-weight-boldest ${selectedLetter === null ? 'btn-primary' : 'btn-light-primary text-primary'}`}
                    onClick={() => setSelectedLetter(null)}
                    style={{ minWidth: '40px' }}
                >
                    ALL
                </button>
                {letters.map(letter => (
                    <button 
                        key={letter}
                        className={`btn btn-xs font-weight-boldest ${selectedLetter === letter ? 'btn-primary' : 'btn-light-primary text-primary'}`}
                        onClick={() => setSelectedLetter(letter)}
                        style={{ minWidth: '32px' }}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* Search Bar & Controls */}
            <div className="d-flex justify-content-between align-items-center mb-6">
                <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                    <div style={{ width: '350px' }}>
                        <div className="input-icon input-icon-right">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Name, ADM No..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span><i className="flaticon2-search-1 icon-md text-muted"></i></span>
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="text-muted font-weight-bold mr-2" style={{ fontSize: '0.8rem' }}>Show:</span>
                        <select 
                            className="form-control form-control-sm font-weight-boldest" 
                            style={{ width: '80px', borderRadius: '8px' }}
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                        >
                            <option value={15}>15</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={1000}>All</option>
                        </select>
                    </div>
                </div>
                <div className="text-muted font-weight-bold">
                    {loading ? 'Updating results...' : `Found ${filteredStudents.length} students`}
                </div>
            </div>

            <div className="table-responsive flex-grow-1" style={{ position: 'relative', overflow: 'auto', maxHeight: 'calc(100vh - 380px)', border: '1px solid #ebedf3', borderRadius: '8px' }}>
                <table className="table table-head-custom table-vertical-center" id="kt_advance_table_widget_1" style={{ borderCollapse: 'separate', borderSpacing: 0, whiteSpace: 'nowrap' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#f3f6f9' }}>
                        <tr className="text-left text-uppercase">
                            <th style={{ width: '10px', backgroundColor: '#f3f6f9' }} className="pl-0"></th>
                            <th style={{ minWidth: '220px', position: 'sticky', left: 0, zIndex: 101, backgroundColor: '#f3f6f9', borderRight: '1px solid #ebedf3', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>Details</th>
                            {subjects?.map(subj => (
                                <th key={subj.id} className="text-center" style={{ minWidth: '150px', backgroundColor: '#f3f6f9' }}>{subj.name}</th>
                            ))}
                            <th className="text-center" style={{ minWidth: '100px', backgroundColor: '#f3f6f9', position: 'sticky', right: '120px', zIndex: 101, borderLeft: '1px solid #ebedf3', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>Total Pts</th>
                            <th className="text-right" style={{ minWidth: '120px', backgroundColor: '#f3f6f9', position: 'sticky', right: 0, zIndex: 101 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStudents.map(student => {
                            let totalPoints = 0;
                            const isExpanded = !!expandedStudents[student.id];

                            return (
                                <React.Fragment key={student.id}>
                                    {/* STUDENT ROW (TOP LEVEL INPUTS) */}
                                    <tr className={`border-bottom ${isExpanded ? 'bg-light-primary' : 'bg-white'}`} style={{ transition: 'background-color 0.2s' }}>
                                        <td className="pl-4 py-3" style={{ backgroundColor: isExpanded ? '#f1faff' : '#fff' }}>
                                            <div className="symbol symbol-35 symbol-light-success">
                                                <span className="symbol-label font-size-h6 font-weight-bold">{student.names?.[0] || 'S'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3" style={{ position: 'sticky', left: 0, zIndex: 50, backgroundColor: isExpanded ? '#f1faff' : '#fff', borderRight: '1px solid #ebedf3', boxShadow: '2px 0 5px rgba(0,0,0,0.05)' }}>
                                            <div className="d-flex flex-column">
                                                <span className="text-dark-75 font-weight-bolder font-size-sm">{student.names}</span>
                                                <div className="d-flex align-items-center mt-1">
                                                    <span className="text-muted font-weight-bold font-size-xs">{student.admNo || student.registration}</span>
                                                    <span className="label label-dot label-secondary ml-2 mr-2"></span>
                                                    <span className="text-muted font-weight-bold font-size-xs text-uppercase">{student.parent?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {subjects?.map(subj => {
                                            // Compute overall weighted score for this subject
                                            let overallScore = 0;
                                            let hasAnyScore = false;

                                            return (
                                                <td key={subj.id} className="text-center py-4" style={{ backgroundColor: isExpanded ? '#f1faff' : '#fff', borderRight: '2px solid #ebedf3' }}>
                                                    <div className="d-flex flex-row justify-content-center align-items-start" style={{ gap: '12px' }}>
                                                        {sortedAssessmentTypes?.map(type => {
                                                            const val = getScore(student.id, subj.id, type.id);
                                                            const outOfVal = getOutOf(student.id, subj.id, type.id);
                                                            const isScoreUpdated = updates?.hasOwnProperty(`${student.id}-${subj.id}-${type.id}-score`);
                                                            const isOutOfUpdated = updates?.hasOwnProperty(`${student.id}-${subj.id}-${type.id}-outOf`);

                                                            const score = parseFloat(val);
                                                            const outOf = parseFloat(outOfVal) || 100;
                                                            const pct = type.percentage || 0;
                                                            const contribution = (!isNaN(score) && outOf > 0) ? (score / outOf) * pct : null;
                                                            if (contribution !== null) { overallScore += contribution; hasAnyScore = true; }

                                                            return (
                                                                <div key={type.id} className="d-flex flex-column align-items-center" style={{ minWidth: '70px' }}>
                                                                    {/* Assessment type name */}
                                                                    <div className="text-muted font-weight-bold font-size-xs mb-1" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '70px' }} title={type.name}>
                                                                        {type.name} {pct > 0 ? `(${pct}%)` : ''}
                                                                    </div>

                                                                    {/* Score input */}
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm text-center font-weight-boldest px-1"
                                                                        value={val}
                                                                        placeholder="Score"
                                                                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })}
                                                                        onBlur={onBlur ? () => onBlur() : undefined}
                                                                        onChange={(e) => onScoreChange(student.id, subj.id, type.id, e.target.value)}
                                                                        style={{ 
                                                                            width: '65px', 
                                                                            height: '32px', 
                                                                            fontSize: '1rem',
                                                                            borderRadius: '6px',
                                                                            border: isScoreUpdated ? '2px solid #f6c23e' : '1px solid #ebedf3',
                                                                            background: isScoreUpdated ? '#fff8dd' : '#f8f9fb',
                                                                            marginBottom: '3px'
                                                                        }}
                                                                    />

                                                                    {/* outOf input */}
                                                                    <div className="d-flex flex-column align-items-center w-100 justify-content-center">
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm text-center px-1"
                                                                            value={outOfVal}
                                                                            placeholder="Out of"
                                                                            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })}
                                                                            onBlur={onBlur ? () => onBlur() : undefined}
                                                                            onChange={(e) => onOutOfChange && onOutOfChange(student.id, subj.id, type.id, e.target.value)}
                                                                            style={{ 
                                                                                width: '65px', 
                                                                                height: '26px', 
                                                                                fontSize: '0.8rem',
                                                                                borderRadius: '6px',
                                                                                border: isOutOfUpdated ? '2px solid #f6c23e' : '1px solid #ebedf3',
                                                                                background: isOutOfUpdated ? '#fff8dd' : '#f0f2f7',
                                                                                color: '#6c757d'
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Weighted contribution */}
                                                                    {contribution !== null && (
                                                                        <div className="mt-1 text-center" style={{ fontSize: '10px', color: '#3699ff', fontWeight: 800, lineHeight: '1.2' }}>
                                                                            {contribution.toFixed(1)}<span style={{ fontWeight: 500, color: '#9ca3af' }}>/{pct}%</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Per-subject overall rubric */}
                                                        {hasAnyScore && (() => {
                                                            const overallRubric = getRubric(overallScore);
                                                            if (overallRubric?.points) totalPoints += parseFloat(overallRubric.points);
                                                            const oColor = getRubricColor(overallRubric);
                                                            return (
                                                                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: '70px', borderLeft: '1px dashed #ebedf3', paddingLeft: '10px' }}>
                                                                    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Overall</div>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#3f4254', lineHeight: 1 }}>
                                                                        {overallScore.toFixed(1)}%
                                                                    </div>
                                                                    {overallRubric && (
                                                                        <>
                                                                            <div className="label label-inline font-weight-boldest mt-1" style={{ backgroundColor: `${oColor}15`, color: oColor, fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${oColor}` }}>
                                                                                {overallRubric.label}
                                                                            </div>
                                                                            {overallRubric.teachersComment && (
                                                                                <div className="text-center mt-1 px-1" style={{ fontSize: '9px', fontWeight: 800, color: '#3f4254', lineHeight: 1.3, maxWidth: '70px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                                                    {overallRubric.teachersComment}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="text-center align-middle" style={{ position: 'sticky', right: '120px', zIndex: 50, backgroundColor: isExpanded ? '#f1faff' : '#fff', borderLeft: '1px solid #ebedf3', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>
                                            <span className="text-dark-75 font-weight-bolder font-size-h6">
                                                {totalPoints || '-'}
                                            </span>
                                        </td>
                                        <td className="text-right pr-4" style={{ position: 'sticky', right: 0, zIndex: 50, backgroundColor: isExpanded ? '#f1faff' : '#fff' }}>
                                            <div className="d-flex justify-content-end">
                                                <button 
                                                    className="btn btn-icon btn-light-primary btn-sm mx-1" 
                                                    onClick={() => toggleStudent(student.id)}
                                                    title="View Details"
                                                >
                                                    <i className={`flaticon2-${isExpanded ? 'up' : 'down'}`}></i>
                                                </button>
                                                <button 
                                                    className="btn btn-icon btn-light-success btn-sm mx-1" 
                                                    onClick={() => onPrintSingle?.(student)}
                                                    title="Print Statement"
                                                >
                                                    <i className="fa fa-print text-dark"></i>
                                                </button>
                                                <button 
                                                    className="btn btn-icon btn-light-info btn-sm mx-1" 
                                                    onClick={() => onSendSms?.(student)}
                                                    title="Send SMS balance"
                                                >
                                                    <i className="flaticon2-paper-plane"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* EXPANDED ANALYTICS */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={(subjects?.length || 0) + 4} className="p-0 border-0">
                                                <DetailedPerformanceAnalytics 
                                                    student={student}
                                                    subjects={subjects}
                                                    currentAssessments={assessments}
                                                    allAssessments={allAssessments}
                                                    allTerms={allTerms}
                                                    assessmentTypes={sortedAssessmentTypes}
                                                    rubrics={rubrics}
                                                    lessonAttempts={lessonAttempts}
                                                    attemptEvents={attemptEvents}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Component */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-6 pt-4 border-top">
                    <div className="d-flex align-items-center">
                        <span className="text-muted font-weight-bold mr-4">Page {currentPage} of {totalPages}</span>
                        <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                            <span className="text-muted font-size-xs" style={{ whiteSpace: 'nowrap' }}>Jump to:</span>
                            <input 
                                type="number" 
                                className="form-control form-control-sm text-center" 
                                style={{ width: '60px', borderRadius: '8px' }}
                                min={1}
                                max={totalPages}
                                value={currentPage}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                }}
                            />
                        </div>
                    </div>
                    <div className="d-flex">
                        <button className="btn btn-sm btn-icon btn-light-primary mr-2" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
                            <i className="ki ki-bold-arrow-back icon-xs"></i>
                        </button>
                        {/* Show limited page buttons if many pages */}
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                return (
                                    <button 
                                        key={i} 
                                        className={`btn btn-sm btn-icon mr-2 ${currentPage === page ? 'btn-primary' : 'btn-light-primary'}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={i} className="mr-2 text-muted">...</span>;
                            }
                            return null;
                        })}
                        <button className="btn btn-sm btn-icon btn-light-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}>
                            <i className="ki ki-bold-arrow-next icon-xs"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


export default memo(ResultsGrid);
