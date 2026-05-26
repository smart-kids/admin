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
    currentClassObj,
    teachers
}) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjects?.[0]?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [alphabetFilter, setAlphabetFilter] = useState('');
    const [expandedStudents, setExpandedStudents] = useState({});

    const sortedAssessmentTypes = useMemo(() => {
        return [...(assessmentTypes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [assessmentTypes]);

    const filteredStudents = useMemo(() => {
        let result = students || [];
        if (alphabetFilter) {
            result = result.filter(s => (s.names || '').toUpperCase().startsWith(alphabetFilter));
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(s => 
                (s.names || '').toLowerCase().includes(lowerSearch) || 
                (s.admNo || '').toLowerCase().includes(lowerSearch) ||
                (s.registration || '').toLowerCase().includes(lowerSearch)
            );
        }
        return result;
    }, [students, searchTerm, alphabetFilter]);

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

    const resolvedClassTeacher = useMemo(() => {
        if (!currentClassObj) return null;
        if (currentClassObj.teacher?.name || currentClassObj.teacher?.names) return currentClassObj.teacher;
        const teacherId = currentClassObj.teacher?.id || currentClassObj.teacher;
        return (teachers || []).find(t => String(t.id) === String(teacherId));
    }, [currentClassObj, teachers]);

    const resolvedSubjectTeacher = useMemo(() => {
        if (!activeSubject) return null;
        if (activeSubject.teacher?.name || activeSubject.teacher?.names) return activeSubject.teacher;
        const teacherId = activeSubject.teacher?.id || activeSubject.teacher;
        return (teachers || []).find(t => String(t.id) === String(teacherId));
    }, [activeSubject, teachers]);

    return (
        <div className={`d-flex flex-column ${loading ? 'opacity-70' : ''}`} style={{ minHeight: '400px' }}>
            {/* Context Selectors */}
            {/* Context Selectors */}
            <div className="card card-custom shadow-sm mb-4" style={{ border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #f1faff 0%, #ffffff 100%)' }}>
                <div className="card-body p-4">
                    <div className="d-flex flex-column mb-3">
                        <span className="text-primary font-weight-boldest text-uppercase mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Grading Context</span>
                        <h3 className="font-weight-bolder text-dark-75 mb-0" style={{ fontSize: '1.1rem' }}>Select Subject</h3>
                    </div>
                    <EnhancedDropdown
                        value={selectedSubjectId}
                        onChange={(value) => setSelectedSubjectId(value)}
                        options={subjects || []}
                        placeholder="Subject..."
                        searchable={true}
                        width="100%"
                        className="w-100 bg-white shadow-sm"
                    />
                    <div className="mt-3 d-flex flex-column" style={{ gap: '8px' }}>
                        {resolvedClassTeacher && (
                            <div className="d-flex justify-content-between align-items-center p-2 rounded shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e1f0ff' }}>
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-30 symbol-light-info mr-2">
                                        <span className="symbol-label"><i className="flaticon2-group text-info icon-sm"></i></span>
                                    </div>
                                    <span className="font-weight-bold text-muted font-size-xs">Class teacher</span>
                                </div>
                                <span className="font-weight-bolder text-dark-75 font-size-sm text-right text-truncate pl-2" style={{ maxWidth: '140px' }}>{resolvedClassTeacher.name || resolvedClassTeacher.names}</span>
                            </div>
                        )}
                        {resolvedSubjectTeacher && (
                            <div className="d-flex justify-content-between align-items-center p-2 rounded shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #e1f0ff' }}>
                                <div className="d-flex align-items-center">
                                    <div className="symbol symbol-30 symbol-light-primary mr-2">
                                        <span className="symbol-label"><i className="flaticon2-user text-primary icon-sm"></i></span>
                                    </div>
                                    <span className="font-weight-bold text-muted font-size-xs">Subject teacher</span>
                                </div>
                                <span className="font-weight-bolder text-primary font-size-sm text-right text-truncate pl-2" style={{ maxWidth: '140px' }}>{resolvedSubjectTeacher.name || resolvedSubjectTeacher.names}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <SearchAlphabetFilter
                    searchTerm={searchTerm}
                    onSearchChange={(value) => setSearchTerm(value)}
                    onSearch={(value) => setSearchTerm(value)}
                    onClearSearch={() => setSearchTerm('')}
                    onAlphabetFilterChange={(value) => setAlphabetFilter(value)}
                    data={students}
                    dataKey="names"
                    placeholder="Search by name or admission..."
                    showAlphabet={true}
                    className="w-100"
                />
            </div>

            {/* Student List */}
            {!selectedSubjectId ? (
                <div className="text-center py-10 bg-light rounded text-muted font-weight-bold">
                    Please select a subject to begin grading.
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4 px-2">
                        <span className="text-dark-75 font-weight-bolder" style={{ fontSize: '1.1rem' }}>Student Roster</span>
                        <span className="label label-light-primary label-inline font-weight-bolder py-3 px-4" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>
                            {loading ? '...' : `${filteredStudents.length} Students`}
                        </span>
                    </div>
                    <div className="d-flex flex-column" style={{ gap: '15px' }}>
                    {filteredStudents.map(student => {
                        let overallScore = 0;
                        let hasAnyScore = false;
                        const isExpanded = !!expandedStudents[student.id];

                        return (
                            <div key={student.id} className="card card-custom shadow-sm border-0" style={{ overflow: 'hidden' }}>
                                {/* Header */}
                                <div className="card-header border-0 pt-5 pb-4 px-5" style={{ backgroundColor: isExpanded ? '#f1faff' : '#ffffff' }}>
                                    <div className="d-flex align-items-start">
                                        <div className="symbol symbol-60 symbol-light-success mr-4 shadow-sm" style={{ borderRadius: '14px' }}>
                                            <span className="symbol-label font-weight-boldest" style={{ fontSize: '1.8rem' }}>{student.names?.[0] || 'S'}</span>
                                        </div>
                                        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
                                            <span className="text-dark-75 font-weight-boldest mb-3 text-truncate" style={{ fontSize: '1.35rem', lineHeight: '1.2' }}>
                                                {student.names}
                                            </span>
                                            <div className="d-flex flex-column" style={{ gap: '8px' }}>
                                                <div className="d-flex align-items-center">
                                                    <div style={{ width: '65px' }}>
                                                        <span className="text-muted font-weight-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>ADM No</span>
                                                    </div>
                                                    <span className="font-weight-bolder text-dark-50" style={{ fontSize: '0.95rem' }}>{student.admNo || student.registration || 'N/A'}</span>
                                                </div>
                                                {student.parent?.name && (
                                                    <div className="d-flex align-items-center">
                                                        <div style={{ width: '65px' }}>
                                                            <span className="text-muted font-weight-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Parent</span>
                                                        </div>
                                                        <span className="font-weight-bolder text-primary text-truncate" style={{ fontSize: '0.95rem' }}>{student.parent.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Body: Assessment Inputs (Horizontal Boxes for Mobile) */}
                                <div className="card-body py-4 px-3" style={{ backgroundColor: isExpanded ? '#f1faff' : '#fff' }}>
                                    <div className="d-flex flex-row justify-content-between w-100" style={{ gap: '10px' }}>
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
                                                <div key={type.id} className="d-flex flex-column align-items-center p-3 rounded shadow-sm" style={{ flex: 1, minWidth: 0, border: '1px solid #e4e6ef', backgroundColor: isScoreUpdated ? '#fff8dd' : '#f8f9fa' }}>
                                                    <div className="text-dark-75 font-size-sm font-weight-boldest mb-3 text-truncate w-100 text-center" title={type.name}>
                                                        {type.name}
                                                    </div>
                                                    <div className="position-relative w-100 mb-3">
                                                        <span className="position-absolute text-muted" style={{ fontSize: '0.65rem', top: '-7px', left: '8px', background: isScoreUpdated ? '#fff8dd' : '#f8f9fa', padding: '0 4px', zIndex: 1, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Score</span>
                                                        <input
                                                            type="number"
                                                            className="form-control text-center font-weight-boldest px-1"
                                                            value={scoreVal}
                                                            placeholder="--"
                                                            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                            onBlur={onBlur ? () => onBlur() : undefined}
                                                            onChange={(e) => onScoreChange && onScoreChange(student.id, selectedSubjectId, type.id, e.target.value)}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '46px', 
                                                                fontSize: '1.25rem',
                                                                borderRadius: '6px',
                                                                border: isScoreUpdated ? '2px solid #f6c23e' : '2px solid #ebedf3',
                                                                backgroundColor: '#ffffff',
                                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="position-relative w-100">
                                                        <span className="position-absolute text-muted" style={{ fontSize: '0.65rem', top: '-7px', left: '8px', background: isScoreUpdated ? '#fff8dd' : '#f8f9fa', padding: '0 4px', zIndex: 1, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Out Of</span>
                                                        <input
                                                            type="number"
                                                            className="form-control text-center px-1 text-muted font-weight-bold"
                                                            value={outOfVal}
                                                            placeholder="--"
                                                            onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                            onBlur={onBlur ? () => onBlur() : undefined}
                                                            onChange={(e) => onOutOfChange && onOutOfChange(student.id, selectedSubjectId, type.id, e.target.value)}
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '36px', 
                                                                fontSize: '0.9rem',
                                                                borderRadius: '6px',
                                                                border: isOutOfUpdated ? '2px solid #f6c23e' : '1px solid #ebedf3',
                                                                backgroundColor: '#f3f6f9'
                                                            }}
                                                        />
                                                    </div>
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
                                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#3f4254', lineHeight: 1, marginRight: '10px' }}>
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
                                        className="btn btn-icon btn-light-info btn-sm mr-3" 
                                        onClick={() => onSendSms?.(student)}
                                        title="Send SMS"
                                    >
                                        <i className="flaticon2-paper-plane"></i>
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
                </>
            )}
        </div>
    );
};

export default MobileDataEntry;
