import React, { useState, useMemo, useCallback } from 'react';
import EnhancedDropdown from '../../../components/enhanced-dropdown/EnhancedDropdown';
import SearchAlphabetFilter from '../../../components/search-alphabet-filter/SearchAlphabetFilter';
import { DetailedPerformanceAnalytics } from './ResultsGrid';

const MobileDataEntry = ({ 
    students, 
    subjects, 
    assessments,
    allAssessments,
    allTerms,
    assessmentTypes,
    rubrics,
    lessonAttempts,
    attemptEvents,
    updates, 
    onScoreChange, 
    onOutOfChange, 
    onBlur,
    onPrintSingle,
    onSendSms,
    loading,
    currentClassObj
}) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjects?.[0]?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudents, setExpandedStudents] = useState({});

    const sortedAssessmentTypes = useMemo(() => {
        return [...(assessmentTypes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [assessmentTypes]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students || [];
        const lowerSearch = searchTerm.toLowerCase();
        return (students || []).filter(s => 
            (s.names || '').toLowerCase().includes(lowerSearch) || 
            (s.admNo || '').toLowerCase().includes(lowerSearch) ||
            (s.registration || '').toLowerCase().includes(lowerSearch)
        );
    }, [students, searchTerm]);

    const getScore = (studentId, typeId) => {
        const updateKey = `${studentId}-${selectedSubjectId}-${typeId}-score`;
        if (updates && updates.hasOwnProperty(updateKey)) return updates[updateKey];
        const assessment = (assessments || []).find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === selectedSubjectId || a.subject?.id === selectedSubjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        return assessment ? assessment.score : "";
    };

    const getOutOf = (studentId, typeId) => {
        const updateKey = `${studentId}-${selectedSubjectId}-${typeId}-outOf`;
        if (updates && updates.hasOwnProperty(updateKey)) return updates[updateKey];
        
        const subjectTypeAssessment = (assessments || []).find(a =>
            (a.subject === selectedSubjectId || a.subject?.id === selectedSubjectId) &&
            (a.assessmentType === typeId || a.assessmentType?.id === typeId || a.type === typeId || a.type?.id === typeId)
        );
        
        if (subjectTypeAssessment && subjectTypeAssessment.outOf !== undefined && subjectTypeAssessment.outOf !== null) {
            return subjectTypeAssessment.outOf;
        }
        
        const studentAssessment = (assessments || []).find(a =>
            (a.student === studentId || a.student?.id === studentId) &&
            (a.subject === selectedSubjectId || a.subject?.id === selectedSubjectId) &&
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

    const toggleStudent = useCallback((studentId) => {
        setExpandedStudents(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    }, []);

    React.useEffect(() => {
        if (!selectedSubjectId && subjects?.length > 0) setSelectedSubjectId(subjects[0].id);
    }, [subjects, selectedSubjectId]);

    const activeSubject = useMemo(() => {
        return (subjects || []).find(s => s.id === selectedSubjectId);
    }, [subjects, selectedSubjectId]);

    return (
        <div className={`d-flex flex-column ${loading ? 'opacity-70' : ''}`} style={{ minHeight: '400px' }}>
            {/* Context Selectors */}
            <div className="bg-light-primary p-4 rounded mb-6" style={{ border: '1px solid #e1f0ff' }}>
                <div className="form-group mb-0">
                    <label className="font-weight-bolder text-dark-75 mb-2 text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>Select Subject</label>
                    <EnhancedDropdown
                        value={selectedSubjectId}
                        onChange={(value) => setSelectedSubjectId(value)}
                        options={subjects || []}
                        placeholder="Subject..."
                        searchable={true}
                        width="100%"
                        className="w-100 bg-white shadow-sm"
                    />
                    <div className="mt-3 d-flex flex-column" style={{ gap: '10px' }}>
                        {currentClassObj?.teacher?.name && (
                            <span className="text-info font-weight-bolder font-size-sm px-3 py-2 bg-white rounded shadow-sm border border-info-o-20 w-100 d-flex justify-content-center align-items-center" title="Class Teacher Accountable">
                                <i className="flaticon2-group text-info icon-md mr-2"></i>
                                Class: {currentClassObj.teacher.name}
                            </span>
                        )}
                        {(activeSubject?.teacher?.name || activeSubject?.teacher?.names) && (
                            <span className="text-primary font-weight-bolder font-size-sm px-3 py-2 bg-white rounded shadow-sm border border-primary-o-20 w-100 d-flex justify-content-center align-items-center" title="Subject Teacher Accountable">
                                <i className="flaticon2-user text-primary icon-md mr-2"></i>
                                Subject: {activeSubject.teacher.name || activeSubject.teacher.names}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white p-4 rounded shadow-sm" style={{ border: '1px solid #ebedf3' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="font-weight-boldest text-dark-75 font-size-h5">Student Roster</span>
                    <span className="label label-lg label-light-primary label-inline font-weight-boldest px-4 py-3" style={{ fontSize: '0.9rem' }}>
                        {loading ? 'Updating...' : `${filteredStudents.length} Students`}
                    </span>
                </div>
                <SearchAlphabetFilter
                    searchTerm={searchTerm}
                    onSearchChange={(value) => setSearchTerm(value)}
                    onSearch={(value) => setSearchTerm(value)}
                    onClearSearch={() => setSearchTerm('')}
                    onAlphabetFilterChange={() => {}}
                    data={students}
                    dataKey="names"
                    placeholder="Search by name or admission..."
                    showAlphabet={false}
                    className="w-100"
                />
            </div>

            {/* Student List */}
            {!selectedSubjectId ? (
                <div className="text-center py-10 bg-light rounded text-muted font-weight-bold">
                    Please select a subject to begin grading.
                </div>
            ) : (
                <div className="d-flex flex-column" style={{ gap: '15px' }}>
                    {filteredStudents.map(student => {
                        let overallScore = 0;
                        let hasAnyScore = false;
                        const isExpanded = !!expandedStudents[student.id];

                        return (
                            <div key={student.id} className="card card-custom shadow-sm border-0" style={{ overflow: 'hidden' }}>
                                {/* Header */}
                                <div className="card-header border-0 pt-5 pb-3 px-4" style={{ backgroundColor: isExpanded ? '#f1faff' : '#fff' }}>
                                    <div className="d-flex flex-column" style={{ flex: 1, minWidth: 0 }}>
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="symbol symbol-45 symbol-light-success mr-4 shadow-sm">
                                                <span className="symbol-label font-size-h4 font-weight-boldest">{student.names?.[0] || 'S'}</span>
                                            </div>
                                            <span className="text-dark-75 font-weight-boldest" style={{ fontSize: '1.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {student.names}
                                            </span>
                                        </div>
                                        <div className="d-flex align-items-center bg-light rounded py-2 px-3" style={{ marginLeft: '60px' }}>
                                            <span className="text-muted font-weight-bold font-size-xs mr-2 text-uppercase">ADM:</span>
                                            <span className="text-dark-75 font-weight-boldest font-size-sm mr-4">{student.admNo || student.registration || 'N/A'}</span>
                                            <span className="text-muted font-weight-bold font-size-xs mr-2 text-uppercase">Parent:</span>
                                            <span className="text-primary font-weight-boldest font-size-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                                {student.parent?.name || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body: Assessment Inputs (Horizontal Boxes for Mobile) */}
                                <div className="card-body py-4 px-3" style={{ backgroundColor: isExpanded ? '#f1faff' : '#fff' }}>
                                    <div className="d-flex flex-row justify-content-between w-100" style={{ gap: '8px' }}>
                                        {sortedAssessmentTypes?.map(type => {
                                            const scoreVal = getScore(student.id, type.id);
                                            const outOfVal = getOutOf(student.id, type.id);
                                            const isScoreUpdated = updates?.hasOwnProperty(`${student.id}-${selectedSubjectId}-${type.id}-score`);
                                            const isOutOfUpdated = updates?.hasOwnProperty(`${student.id}-${selectedSubjectId}-${type.id}-outOf`);

                                            const score = parseFloat(scoreVal);
                                            const outOf = parseFloat(outOfVal) || 100;
                                            const pct = type.percentage || 0;
                                            const contribution = (!isNaN(score) && outOf > 0) ? (score / outOf) * pct : null;
                                            if (contribution !== null) { overallScore += contribution; hasAnyScore = true; }

                                            return (
                                                <div key={type.id} className="d-flex flex-column align-items-center p-2 rounded shadow-sm" style={{ flex: 1, minWidth: 0, border: '1px solid #ebedf3', backgroundColor: isScoreUpdated ? '#fff8dd' : '#f8f9fb' }}>
                                                    <div className="text-muted font-size-xs font-weight-bolder mb-2 text-truncate w-100 text-center" title={type.name}>
                                                        {type.name}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm text-center font-weight-boldest px-1 mb-1"
                                                        value={scoreVal}
                                                        placeholder="Score"
                                                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                        onBlur={onBlur ? () => onBlur() : undefined}
                                                        onChange={(e) => onScoreChange && onScoreChange(student.id, selectedSubjectId, type.id, e.target.value)}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '32px', 
                                                            fontSize: '0.95rem',
                                                            borderRadius: '4px',
                                                            border: isScoreUpdated ? '1px solid #f6c23e' : '1px solid #ebedf3'
                                                        }}
                                                    />
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm text-center px-1 text-muted"
                                                        value={outOfVal}
                                                        placeholder="Out Of"
                                                        onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                        onBlur={onBlur ? () => onBlur() : undefined}
                                                        onChange={(e) => onOutOfChange && onOutOfChange(student.id, selectedSubjectId, type.id, e.target.value)}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '24px', 
                                                            fontSize: '0.75rem',
                                                            borderRadius: '4px',
                                                            border: isOutOfUpdated ? '1px solid #f6c23e' : '1px solid #ebedf3',
                                                            background: '#fff'
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Per-subject overall rubric placed cleanly below the list */}
                                    {hasAnyScore && (() => {
                                        const overallRubric = getRubric(overallScore);
                                        const oColor = getRubricColor(overallRubric);
                                        return (
                                            <div className="d-flex align-items-center justify-content-between mt-4 pt-3" style={{ borderTop: '1px dashed #ebedf3' }}>
                                                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Subject Total</div>
                                                <div className="d-flex align-items-center">
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#3f4254', lineHeight: 1, marginRight: '10px' }}>
                                                        {overallScore.toFixed(1)}%
                                                    </div>
                                                    {overallRubric && (
                                                        <div className="label label-inline font-weight-boldest" style={{ backgroundColor: `${oColor}15`, color: oColor, fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${oColor}` }}>
                                                            {overallRubric.label}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Footer Actions */}
                                <div className="card-footer border-top-0 d-flex justify-content-end align-items-center py-3 px-4" style={{ backgroundColor: isExpanded ? '#e3f3ff' : '#fcfcfc', borderTop: '1px solid #ebedf3' }}>
                                    <button 
                                        className="btn btn-icon btn-light-info btn-sm mr-2" 
                                        onClick={() => onSendSms?.(student)}
                                        title="Send SMS"
                                    >
                                        <i className="flaticon2-paper-plane"></i>
                                    </button>
                                    <button 
                                        className="btn btn-icon btn-light-success btn-sm mr-3" 
                                        onClick={() => onPrintSingle?.(student)}
                                        title="Print Statement"
                                    >
                                        <i className="fa fa-print text-dark"></i>
                                    </button>
                                    <button 
                                        className={`btn btn-sm font-weight-bold ${isExpanded ? 'btn-primary' : 'btn-light-primary'}`}
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        {isExpanded ? 'Hide Insights' : 'Insights'}
                                        <i className={`ml-2 flaticon2-${isExpanded ? 'up' : 'down'}`}></i>
                                    </button>
                                </div>

                                {/* Expanded Analytics Dashboard */}
                                {isExpanded && (
                                    <div className="border-top" style={{ backgroundColor: '#fff' }}>
                                        <DetailedPerformanceAnalytics 
                                            isMobileMode={true}
                                            student={student}
                                            subjects={subjects}
                                            currentAssessments={assessments}
                                            allAssessments={allAssessments}
                                            allTerms={allTerms}
                                            assessmentTypes={assessmentTypes}
                                            rubrics={rubrics}
                                            lessonAttempts={lessonAttempts}
                                            attemptEvents={attemptEvents}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MobileDataEntry;
