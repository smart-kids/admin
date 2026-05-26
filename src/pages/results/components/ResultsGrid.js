import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import Data from "../../../utils/data";
import SearchAlphabetFilter from '../../../components/search-alphabet-filter/SearchAlphabetFilter';

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

    // Revision Summary & Behavioral Metadata
    const revisionInsights = useMemo(() => {
        const completed = studentLessons.filter(l => l.status === 'COMPLETED');
        const avgScore = completed.length > 0 ? (completed.reduce((sum, l) => sum + (parseFloat(l.finalScore) || parseFloat(l.score) || 0), 0) / completed.length) : 0;
        
        // Calculate Study Time (assuming duration in seconds or timeSpent)
        const totalDurationSecs = studentLessons.reduce((sum, l) => sum + (parseFloat(l.duration) || parseFloat(l.timeSpent) || 0), 0);
        let timeStr = "0 mins";
        if (totalDurationSecs > 0) {
            // Assume duration is in seconds if it's large, otherwise assume minutes. We'll format safely.
            const isSecs = totalDurationSecs > 1000; 
            const totalMins = isSecs ? Math.round(totalDurationSecs / 60) : totalDurationSecs;
            if (totalMins > 60) {
                timeStr = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
            } else {
                timeStr = `${Math.round(totalMins)} mins`;
            }
        }

        const completionRate = studentLessons.length > 0 ? Math.round((completed.length / studentLessons.length) * 100) : 0;

        // Subject Preferences
        const subjCounts = {};
        studentLessons.forEach(l => {
            const sName = l.subject?.name || l.subjectName || "Unknown";
            if (sName !== "Unknown") {
                subjCounts[sName] = (subjCounts[sName] || 0) + 1;
            }
        });
        const sortedSubjs = Object.entries(subjCounts).sort((a,b) => b[1] - a[1]);
        const mostRevised = sortedSubjs.length > 0 ? `${sortedSubjs[0][0]} (${sortedSubjs[0][1]}x)` : "None yet";

        // Current bars for relative strengths (calculated on the fly for insights)
        const currentBars = multiTermBars.map(b => ({ name: b.name, score: b.currentScore })).filter(b => b.score > 0);
        const sortedScores = [...currentBars].sort((a,b) => b.score - a.score);
        
        const strengths = sortedScores.slice(0, 2);
        const weaknesses = sortedScores.slice(-2).reverse(); // Focus areas

        // Consistency / Habit heuristic
        let learningHabit = "Getting Started";
        if (studentLessons.length > 20 && completionRate >= 80) learningHabit = "Highly Consistent";
        else if (studentLessons.length > 10) learningHabit = "Active Learner";
        else if (studentLessons.length === 0) learningHabit = "No Engagement";
        else if (studentLessons.length > 0 && completionRate < 50) learningHabit = "Needs Encouragement";

        return {
            totalAttempts: studentLessons.length,
            completedCount: completed.length,
            revisionAvg: Math.round(avgScore),
            completionRate,
            timeStr,
            mostRevised,
            learningHabit,
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
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
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
        <div style={{ padding: '30px', background: '#f9fafc', borderTop: '3px solid #3699ff', overflowX: 'auto', width: '100%' }}>
            <div className="d-flex flex-nowrap align-items-stretch" style={{ gap: '30px', minWidth: 'max-content' }}>
                
                {/* === LEFT PANEL (KPI Cards arranged vertically) === */}
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card card-custom shadow-sm flex-grow-1" style={{ border: 'none', borderRadius: '12px' }}>
                        <div className="card-body p-5 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                                <div className="symbol symbol-30 symbol-light-primary mr-3">
                                    <span className="symbol-label"><i className="flaticon2-pen text-primary"></i></span>
                                </div>
                                <span className="text-muted font-weight-bold font-size-sm text-uppercase">Revision Attempts</span>
                            </div>
                            <div className="text-dark-75 font-weight-boldest font-size-h3">{revisionInsights.totalAttempts}</div>
                            <div className="text-muted font-size-xs mt-1">Total app submissions</div>
                        </div>
                    </div>
                    
                    <div className="card card-custom shadow-sm flex-grow-1" style={{ border: 'none', borderRadius: '12px' }}>
                        <div className="card-body p-5 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                                <div className="symbol symbol-30 symbol-light-success mr-3">
                                    <span className="symbol-label"><i className="flaticon2-hourglass-1 text-success"></i></span>
                                </div>
                                <span className="text-muted font-weight-bold font-size-sm text-uppercase">Time Spent</span>
                            </div>
                            <div className="text-dark-75 font-weight-boldest font-size-h3">{revisionInsights.timeStr}</div>
                            <div className="text-muted font-size-xs mt-1">Dedicated to mobile revision</div>
                        </div>
                    </div>
                    
                    <div className="card card-custom shadow-sm flex-grow-1" style={{ border: 'none', borderRadius: '12px' }}>
                        <div className="card-body p-5 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                                <div className="symbol symbol-30 symbol-light-info mr-3">
                                    <span className="symbol-label"><i className="flaticon2-percentage text-info"></i></span>
                                </div>
                                <span className="text-muted font-weight-bold font-size-sm text-uppercase">Completion Rate</span>
                            </div>
                            <div className="text-dark-75 font-weight-boldest font-size-h3">{revisionInsights.completionRate}%</div>
                            <div className="text-muted font-size-xs mt-1">Of attempted lessons</div>
                        </div>
                    </div>
                    
                    <div className="card card-custom shadow-sm flex-grow-1" style={{ border: 'none', borderRadius: '12px' }}>
                        <div className="card-body p-5 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center mb-2">
                                <div className="symbol symbol-30 symbol-light-warning mr-3">
                                    <span className="symbol-label"><i className="flaticon2-line-chart text-warning"></i></span>
                                </div>
                                <span className="text-muted font-weight-bold font-size-sm text-uppercase">Learning Habit</span>
                            </div>
                            <div className="text-dark-75 font-weight-boldest font-size-h5">{revisionInsights.learningHabit}</div>
                            <div className="text-muted font-size-xs mt-1 text-truncate" title={revisionInsights.mostRevised}>Favors: {revisionInsights.mostRevised}</div>
                        </div>
                    </div>
                </div>

                {/* === MIDDLE PANEL (Detailed Subject Matrix & Sparklines) === */}
                <div style={{ width: '700px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card card-custom shadow-sm bg-white flex-grow-1" style={{ borderRadius: '12px', border: 'none' }}>
                        <div className="card-body p-6">
                            <div className="d-flex align-items-center justify-content-between mb-6">
                                <h3 className="card-title font-weight-bolder text-dark-75 mb-0" style={{ fontSize: '1.1rem' }}>
                                    Subject Performance Across Terms
                                </h3>
                                <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: themeColor, marginRight: '6px' }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#7e8299', fontWeight: 600 }}>Current</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e1e3ea', marginRight: '6px' }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#7e8299', fontWeight: 600 }}>Historical</span>
                                    </div>
                                </div>
                            </div>

                            {/* Subject Sparklines */}
                            {multiTermBars.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                                    {multiTermBars.map((item, i) => {
                                        const currentRubric = (rubrics || []).find(r => item.currentScore >= r.minScore && item.currentScore <= r.maxScore);
                                        const colorMap = { 'EE': '#10b981', 'ME': '#3699ff', 'AE': '#f6c23e', 'BE': '#e74c3c' };
                                        const primaryColor = currentRubric ? (colorMap[currentRubric.label] || themeColor) : themeColor;
                                        
                                        return (
                                            <div key={i}>
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3f4254' }}>
                                                        {item.name}
                                                    </span>
                                                    <div className="d-flex align-items-center">
                                                        {currentRubric && (
                                                            <span className="mr-3 px-2 py-1 border rounded" style={{ fontSize: '0.65rem', fontWeight: 800, color: primaryColor, borderColor: primaryColor, backgroundColor: `${primaryColor}10`, lineHeight: 1 }}>
                                                                {currentRubric.label}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3f4254', minWidth: '35px', textAlign: 'right' }}>
                                                            {Math.round(item.currentScore)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                                                    {/* Main Bar (Current Term) */}
                                                    <div style={{ height: '8px', background: '#f3f6f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${item.currentScore}%`, height: '100%', background: primaryColor, borderRadius: '10px', transition: 'width 0.8s ease' }} />
                                                    </div>
                                                    
                                                    {/* Term Comparison Spark Bars */}
                                                    <div className="d-flex align-items-end" style={{ gap: '4px', height: '24px', padding: '0 2px' }}>
                                                        {item.termScores.map((ts, idx) => {
                                                            const hasData = ts.score !== null;
                                                            const isCurrent = item.currentScore > 0 && Math.abs(ts.score - item.currentScore) < 0.1;
                                                            
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
                                                                        borderRadius: '2px',
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
                                <div className="text-muted small p-4 text-center bg-light rounded mb-6">Insufficient subject data for multi-term comparison.</div>
                            )}

                            {/* Cross-Term Sub-Matrix Table */}
                            {crossTermMatrix.length > 0 && (
                                <>
                                    <h4 className="font-weight-bold text-dark-75 mb-3" style={{ fontSize: '0.9rem' }}>Cross-Term Subject Averages</h4>
                                    <div className="table-responsive">
                                        <table className="table table-borderless table-vertical-center mb-0" style={{ border: '1px solid #ebedf3', borderRadius: '8px', overflow: 'hidden' }}>
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="pl-4 py-3" style={{ minWidth: '100px', fontSize: '0.75rem', color: '#b5b5c3', textTransform: 'uppercase' }}>Term</th>
                                                    {subjects.map(s => (
                                                        <th key={s.id} className="py-3 text-center" style={{ minWidth: '50px', fontSize: '0.75rem', color: '#b5b5c3', textTransform: 'uppercase' }}>
                                                            {s.name.slice(0,3)}
                                                        </th>
                                                    ))}
                                                    <th className="pr-4 py-3 text-right" style={{ minWidth: '50px', fontSize: '0.75rem', color: '#b5b5c3', textTransform: 'uppercase' }}>Avg</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {crossTermMatrix.map((row, i) => (
                                                    <tr key={i} style={{ borderBottom: i === crossTermMatrix.length - 1 ? 'none' : '1px solid #ebedf3' }}>
                                                        <td className="pl-4 py-3">
                                                            <span className="text-dark-75 font-weight-bolder d-block font-size-sm">{row.term.name}</span>
                                                        </td>
                                                        {row.subjectScores.map((score, j) => (
                                                            <td key={j} className="text-center py-3">
                                                                <span className={`font-weight-bold font-size-sm ${score === null ? 'text-muted opacity-40' : 'text-dark-75'}`}>
                                                                    {score !== null ? Math.round(score) : '-'}
                                                                </span>
                                                            </td>
                                                        ))}
                                                        <td className="pr-4 py-3 text-right text-primary font-weight-boldest font-size-sm">
                                                            {Math.round(row.termAvg)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* === RIGHT PANEL (Trends & Insights) === */}
                <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Progress Trend Chart */}
                    <div className="card card-custom shadow-sm bg-white flex-grow-1" style={{ borderRadius: '12px', border: 'none' }}>
                        <div className="card-body p-6 d-flex flex-column">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h3 className="card-title font-weight-bolder text-dark-75 mb-0" style={{ fontSize: '1.1rem' }}>
                                    Weighted Progress Trend
                                </h3>
                            </div>
                            <div className="d-flex align-items-center justify-content-between bg-light p-4 rounded mb-6">
                                <div className="d-flex flex-column">
                                    <span className="text-muted font-weight-bold font-size-sm">Previous Avg</span>
                                    <span className="text-dark-75 font-weight-boldest" style={{ fontSize: '1.25rem' }}>{Math.round(trendData[trendData.length-2]?.avg || 0)}%</span>
                                </div>
                                <div className="d-flex align-items-center">
                                    <i className={`ki ki-arrow-${trendData[trendData.length-1]?.avg >= trendData[trendData.length-2]?.avg ? 'up text-success' : 'down text-danger'} icon-lg mx-3`}></i>
                                </div>
                                <div className="d-flex flex-column text-right">
                                    <span className="text-muted font-weight-bold font-size-sm">Current Avg</span>
                                    <span className="text-primary font-weight-boldest" style={{ fontSize: '1.25rem' }}>{Math.round(trendData[trendData.length-1]?.avg || 0)}%</span>
                                </div>
                            </div>
                            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                                {renderTrendChart()}
                            </div>
                        </div>
                    </div>

                    {/* Academic Insights (Strengths & Focus) */}
                    <div className="card card-custom shadow-sm bg-white flex-grow-1" style={{ borderRadius: '12px', border: 'none' }}>
                        <div className="card-body p-6">
                            <h3 className="card-title font-weight-bolder text-dark-75 mb-6" style={{ fontSize: '1.1rem' }}>
                                Academic Insights
                            </h3>
                            
                            <div className="mb-6">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="symbol symbol-30 symbol-light-success mr-3">
                                        <span className="symbol-label"><i className="flaticon2-check-mark text-success"></i></span>
                                    </div>
                                    <span className="font-weight-boldest text-dark-75 font-size-sm text-uppercase">Top Strengths</span>
                                </div>
                                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                                    {revisionInsights.strengths.length > 0 ? revisionInsights.strengths.map((s, i) => (
                                        <div key={i} className="d-flex align-items-center justify-content-between bg-light-success p-3 rounded">
                                            <span className="font-weight-bold text-success font-size-sm">{s.name}</span>
                                            <span className="font-weight-boldest text-success">{Math.round(s.score)}%</span>
                                        </div>
                                    )) : <div className="text-muted font-size-sm p-3 bg-light rounded">No sufficient data</div>}
                                </div>
                            </div>

                            <div>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="symbol symbol-30 symbol-light-danger mr-3">
                                        <span className="symbol-label"><i className="flaticon2-warning text-danger"></i></span>
                                    </div>
                                    <span className="font-weight-boldest text-dark-75 font-size-sm text-uppercase">Needs Immediate Focus</span>
                                </div>
                                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                                    {revisionInsights.weaknesses.length > 0 ? revisionInsights.weaknesses.map((s, i) => (
                                        <div key={i} className="d-flex align-items-center justify-content-between bg-light-danger p-3 rounded">
                                            <span className="font-weight-bold text-danger font-size-sm">{s.name}</span>
                                            <span className="font-weight-boldest text-danger">{Math.round(s.score)}%</span>
                                        </div>
                                    )) : <div className="text-muted font-size-sm p-3 bg-light rounded">No critical areas identified</div>}
                                </div>
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
        
        // First, try to find any assessment for this subject+type combination to get the consistent out-of value
        const subjectTypeAssessment = assessments.find(a =>
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        
        // If we found an assessment with an outOf value, use it for all students
        if (subjectTypeAssessment && subjectTypeAssessment.outOf !== undefined && subjectTypeAssessment.outOf !== null) {
            return subjectTypeAssessment.outOf;
        }
        
        // Fallback to student-specific assessment (for backward compatibility)
        const studentAssessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        
        return studentAssessment ? (studentAssessment.outOf ?? "100") : "100";
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
            {/* Combined Search and Alphabet Filter */}
            <div className="mb-6">
                <SearchAlphabetFilter
                    searchTerm={searchTerm}
                    onSearchChange={(value) => setSearchTerm(value)}
                    onSearch={(value) => setSearchTerm(value)}
                    onClearSearch={() => setSearchTerm('')}
                    alphabetFilter={selectedLetter}
                    onAlphabetFilterChange={(letter) => setSelectedLetter(letter)}
                    data={students}
                    dataKey="names"
                    placeholder="Search Name, ADM No..."
                    className="mb-4"
                />
                
                {/* Additional Controls */}
                <div className="d-flex justify-content-between align-items-center">
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
                    <div className="text-muted font-weight-bold">
                        {loading ? 'Updating results...' : `Found ${filteredStudents.length} students`}
                    </div>
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
                            <th className="text-center" style={{ minWidth: '100px', backgroundColor: '#f3f6f9', position: 'sticky', right: '120px', zIndex: 101, borderLeft: '1px solid #ebedf3', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>Points</th>
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
                                                <div className="d-flex align-items-baseline mb-1">
                                                    <span className="text-muted font-weight-bold font-size-xs mr-2">Student:</span>
                                                    <span className="text-dark-75 font-weight-bolder font-size-sm">{student.names}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <span className="text-muted font-weight-bold font-size-xs mr-2">ADM:</span>
                                                    <span className="text-dark-75 font-weight-bold font-size-xs mr-3">{student.admNo || student.registration || 'N/A'}</span>
                                                    <span className="text-muted font-weight-bold font-size-xs mr-2">Parent:</span>
                                                    <span className="text-primary font-weight-bold font-size-xs text-uppercase" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{student.parent?.name || 'N/A'}</span>
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