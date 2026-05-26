import React, { useMemo } from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';

const ResultsReport = ({ 
    students, 
    subjects, 
    assessments, 
    assessmentTypes, 
    rubrics, 
    loading,
    selectedClassName,
    selectedTermName,
    schoolInfo,
    isPrintView,
    onPrintClick
}) => {
    
    const sortedAssessmentTypes = useMemo(() => {
        return [...(assessmentTypes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [assessmentTypes]);

    const getScore = (studentId, subjectId, typeId) => {
        const assessment = assessments.find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? assessment.score : "";
    };

    const getOutOf = (studentId, subjectId, typeId) => {
        const subjectTypeAssessment = assessments.find(a =>
            (a.subject === subjectId || a.subject?.id === subjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        if (subjectTypeAssessment && subjectTypeAssessment.outOf !== undefined && subjectTypeAssessment.outOf !== null) {
            return subjectTypeAssessment.outOf;
        }
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

    const getRubricColor = (rubric) => {
        if (!rubric) return '#3699ff';
        const colors = { 'EE': '#10b981', 'ME': '#3699ff', 'AE': '#f6c23e', 'BE': '#e74c3c' };
        return colors[rubric.label] || '#3699ff';
    };

    const handlePrint = () => {
        if (onPrintClick) {
            onPrintClick();
        } else {
            window.print();
        }
    };

    if (loading) {
        return <div className="text-center py-20" style={{ width: '100%' }}><div className="spinner spinner-primary spinner-lg"></div></div>;
    }

    if (!students || students.length === 0) {
        return <div className="alert alert-light-primary text-center py-10 m-6" style={{ width: '100%' }}>No students found for this class and term.</div>;
    }

    const themeColor = schoolInfo?.themeColor || '#1a1a1a';
    
    // Paper styles for realistic print preview (Landscape A4)
    const paperStyles = isPrintView ? {
        padding: '1.5cm', 
        backgroundColor: 'white', 
        minHeight: '21cm', 
        width: '29.7cm', 
        margin: '2cm auto', 
        position: 'relative',
        fontFamily: "'Inter', 'Roboto', sans-serif",
        color: '#1f2937', 
        boxSizing: 'border-box',
        boxShadow: '0 0 30px rgba(0,0,0,0.15)', 
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
    } : {};

    return (
        <div className="results-report-container" style={isPrintView ? { display: 'flex', justifyContent: 'center', backgroundColor: '#f3f4f6', minHeight: '100vh', width: '100%' } : { padding: '1.5rem' }}>
            {!isPrintView && (
                <div className="d-print-none d-flex justify-content-between align-items-center mb-6 bg-white p-5 rounded shadow-sm border">
                    <div>
                        <h2 className="font-weight-bolder text-dark font-size-h2 mb-0">Class Results Report</h2>
                        <div className="text-muted font-weight-bold font-size-sm mt-1">
                            Showing all students for <strong>{selectedClassName || "Selected Class"}</strong> in <strong>{selectedTermName || "Selected Term"}</strong>
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <button 
                            className="btn btn-primary btn-sm px-6 font-weight-bold" 
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={handlePrint}
                        >
                            <i className="fas fa-print mr-2"></i>Preview & Print
                        </button>
                    </div>
                </div>
            )}

            <div className={`card card-custom ${isPrintView ? '' : 'shadow-sm border'} print-card`} style={paperStyles}>
                {/* Print Header (Visible only when printing or in print preview mode) */}
                <div className={`${isPrintView ? 'd-block' : 'd-none d-print-block'} print-header mb-4`} style={{ zoom: 0.8 }}>
                    <ReportHeader school={schoolInfo} title="Results Report" themeColor={themeColor} />
                    <div className="text-right" style={{ marginTop: '-15px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                            <strong>Term:</strong> {selectedTermName}<br/>
                            <strong>Class:</strong> {selectedClassName}
                        </div>
                    </div>
                </div>

                <div className={`${isPrintView ? '' : 'card-body p-0'} print-body`} style={{ flex: 1, overflowX: 'auto' }}>
                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table className="table table-bordered table-vertical-center m-0 print-table results-report-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead className="bg-light" style={{ backgroundColor: '#f8f9fa' }}>
                                <tr className="text-uppercase">
                                    <th className="font-weight-bolder print-num" style={{ textAlign: 'center', borderBottom: '2px solid #ebedf3', backgroundColor: '#f3f6f9' }}>#</th>
                                    <th className="font-weight-bolder print-student" style={{ borderBottom: '2px solid #ebedf3', backgroundColor: '#f3f6f9' }}>Student Details</th>
                                    {subjects?.map(subj => (
                                        <th key={subj.id} className="text-center font-weight-bolder print-th" style={{ borderBottom: '2px solid #ebedf3', padding: '1px', backgroundColor: '#f3f6f9' }}>
                                            <div className="print-subject-name" style={{ paddingBottom: '1px', borderBottom: '1px solid #ebedf3', marginBottom: '1px' }}>
                                                {subj.name}
                                            </div>
                                            <div className="d-flex justify-content-between print-type-name" style={{ gap: '1px' }}>
                                                {sortedAssessmentTypes.map(type => (
                                                    <div key={type.id} className="text-center" style={{ flex: '1 1 auto' }}>
                                                        {type.name.substring(0, 3)}
                                                    </div>
                                                ))}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="text-center font-weight-bolder print-total" style={{ borderBottom: '2px solid #ebedf3', backgroundColor: '#f3f6f9' }}>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    let totalPoints = 0;

                                    return (
                                        <tr key={student.id} className="border-bottom student-row">
                                            <td className="text-center font-weight-bold text-muted print-num" style={{ verticalAlign: 'middle' }}>{index + 1}</td>
                                            <td style={{ verticalAlign: 'middle' }} className="print-student">
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex align-items-baseline mb-1">
                                                        <span className="text-muted font-weight-normal mr-1" style={{fontSize: '9px'}}>Student:</span>
                                                        <span className="text-dark print-name">{student.names}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center print-adm">
                                                        <span className="text-muted mr-1">ADM:</span>
                                                        <span className="text-dark font-weight-bold mr-3">{student.admNo || student.registration || 'N/A'}</span>
                                                        <span className="text-muted mr-1">Parent:</span>
                                                        <span className="text-dark font-weight-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{student.parent?.name || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {subjects?.map(subj => {
                                                let overallScore = 0;
                                                let hasAnyScore = false;

                                                const cellContent = sortedAssessmentTypes.map(type => {
                                                    const val = getScore(student.id, subj.id, type.id);
                                                    const outOfVal = getOutOf(student.id, subj.id, type.id);
                                                    const score = parseFloat(val);
                                                    const outOf = parseFloat(outOfVal) || 100;
                                                    const pct = type.percentage || 0;
                                                    const contribution = (!isNaN(score) && outOf > 0) ? (score / outOf) * pct : null;
                                                    if (contribution !== null) { overallScore += contribution; hasAnyScore = true; }

                                                    return {
                                                        type,
                                                        val: val !== "" && val !== null ? val : "-",
                                                        contribution
                                                    };
                                                });

                                                const overallRubric = hasAnyScore ? getRubric(overallScore) : null;
                                                if (overallRubric?.points) totalPoints += parseFloat(overallRubric.points);
                                                const oColor = getRubricColor(overallRubric);

                                                return (
                                                    <td key={subj.id} style={{ verticalAlign: 'top' }} className="print-cell">
                                                        <div className="d-flex flex-column" style={{ minHeight: '100%' }}>
                                                            {/* Details row for each assessment type */}
                                                            <div className="d-flex flex-wrap justify-content-between border-bottom pb-1 mb-1" style={{ gap: '1px' }}>
                                                                {cellContent.map((item, i) => (
                                                                    <div key={i} className="text-center" style={{ flex: '1 1 auto' }}>
                                                                        <div className="print-type-val">
                                                                            {item.val}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {/* Overall score for the subject */}
                                                            {hasAnyScore ? (
                                                                <div className="d-flex justify-content-center align-items-center mt-auto" style={{ gap: '2px' }}>
                                                                    <div className="print-overall-val">
                                                                        {overallScore.toFixed(1)}%
                                                                    </div>
                                                                    {overallRubric && (
                                                                        <div className="rounded print-overall-rubric label label-inline" style={{ backgroundColor: `${oColor}15`, color: oColor, border: `1px solid ${oColor}` }}>
                                                                            {overallRubric.label}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-muted mt-auto" style={{ fontSize: '8px' }}>-</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="text-center font-weight-bolder print-total" style={{ verticalAlign: 'middle', backgroundColor: '#f8f9fa' }}>
                                                {totalPoints > 0 ? totalPoints : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Premium ShulePlus Footer - Visible only in print or preview */}
                <div className={`${isPrintView ? 'd-block' : 'd-none d-print-block'}`} style={{ marginTop: 'auto', paddingTop: '1cm' }}>
                    <ReportFooter themeColor={themeColor} validationStatus="Authentic Report" />
                </div>
            </div>
            
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 1cm;
                    }
                    .results-report-table {
                        zoom: 0.67;
                    }

                    body * {
                        visibility: hidden;
                    }
                    #kt_header, #kt_aside, .d-print-none {
                        display: none !important;
                    }
                    .results-report-container, .results-report-container * {
                        visibility: visible;
                    }
                    .results-report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-card {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        min-height: auto !important;
                    }
                    .print-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                /* Compact table styles for both on-screen and print */
                .results-report-table th, .results-report-table td {
                    padding: 2px !important;
                    font-size: 10px !important;
                    white-space: nowrap !important;
                    text-transform: uppercase;
                }
                .results-report-table th {
                    background-color: #f3f6f9 !important;
                    color: #3f4254 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .results-report-table .print-num { font-size: 10px !important; padding: 2px !important; white-space: nowrap; }
                .results-report-table .print-student { padding: 2px 4px !important; white-space: nowrap; }
                .results-report-table .print-name { font-size: 12px !important; font-weight: 800; white-space: nowrap !important; text-transform: uppercase; color: #3f4254 !important; }
                .results-report-table .print-adm { font-size: 9px !important; white-space: nowrap !important; text-transform: uppercase; color: #b5b5c3 !important; }
                .results-report-table .print-adm .text-dark { color: #3f4254 !important; }
                
                .results-report-table .print-subject-name { font-size: 11px !important; font-weight: 800; text-transform: uppercase; white-space: nowrap !important; color: #3f4254 !important; }
                .results-report-table .print-cell { padding: 2px !important; }
                .results-report-table .print-type-name { font-size: 8px !important; color: #b5b5c3 !important; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
                .results-report-table .print-type-val { font-size: 10px !important; font-weight: 800; white-space: nowrap; color: #3f4254 !important; }
                .results-report-table .print-overall-val { font-size: 11px !important; font-weight: 900; color: #3f4254 !important; white-space: nowrap; }
                .results-report-table .print-overall-rubric { font-size: 8px !important; padding: 1px 4px !important; font-weight: 800; white-space: nowrap; text-transform: uppercase; border-radius: 4px; }
                .results-report-table .print-total { font-size: 12px !important; white-space: nowrap; color: #3f4254 !important; }
                .results-report-table td, .results-report-table th { border: 1px solid #ebedf3 !important; }

                @media print {
                    @page {
                        size: landscape;
                        margin: 1.5cm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #kt_header, #kt_aside, .d-print-none {
                        display: none !important;
                    }
                    .results-report-container, .results-report-container * {
                        visibility: visible;
                    }
                    .results-report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-card {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        min-height: auto !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ResultsReport;
