import React from "react";
import Data from "../../utils/data";
import ReportCard from "./components/ReportCard";
import ResultsGrid from "./components/ResultsGrid";
import ResultsReport from "./components/ResultsReport";
import BulkReportSmsModal from "../../components/reports/BulkReportSmsModal";
import AddSubjectModal from "../learning/subjects/add";
import AddClassModal from "../classes/add";
import AddGradeModal from "../learning/grades/add";
import AddTermModal from "./components/AddTermModal";
import { StatCard, DistributionChart, TrendBarChart, AreaChart, RankingList } from "../../components/analytics/DashboardWidgets";
import { EnhancedStatCard, AdvancedStatCard } from "../../components/charts/EnhancedStatCard";
import { ModernKPICard } from "../../components/charts/ModernKPICard";
import { SubjectPerformanceRadarChart } from "../../components/charts/results/SubjectPerformanceRadarChart";
import { StudentProgressTimelineChart } from "../../components/charts/results/StudentProgressTimelineChart";
import { ClassComparisonSunburstChart } from "../../components/charts/results/ClassComparisonSunburstChart";
import { PerformanceMatrixChart, GradeTreemapChart } from "../../components/charts/results/PerformanceMatrixChart";
import EnhancedSearch from '../../components/enhanced-search/EnhancedSearch';
import AlphabetFilter from '../../components/alphabet-filter/AlphabetFilter';
import EnhancedDropdown from '../../components/enhanced-dropdown/EnhancedDropdown';

class ResultsMatrix extends React.Component {
  state = {
    classes: [],
    terms: [],
    subjects: [],
    grades: [],
    students: [],
    assessments: [], // Full list
    lessonAttempts: [],
    attemptEvents: [],

    selectedClass: "",
    selectedTerm: "",
    searchTerm: "",
    alphabetFilter: "",
    
    assessmentTypes: [],
    assessmentRubrics: [],
    
    edits: {}, 
    loading: true,
    saving: false,
    sendingSms: false,
    showPrintView: false,
    showReportPrintView: false,
    schoolInfo: null,
    fetchingAssessments: false,
    showBulkModal: false,

    printingStudentId: null,
    showSingleSmsModal: false,
    selectedStudentForSms: null,
    smsMessage: "",
    bulkSmsRecipients: [],

    activeTab: 'insights', 
    
    showAddSubjectModal: false,
    showAddTermModal: false,
    showAddClassModal: false,
    showAddGradeModal: false,
    showSelectSubjectModal: false,
    selectedGrade: "",
  };

  componentDidMount() {
    this._isMounted = true;
    const originalSetState = this.setState.bind(this);
    this.setState = (state, callback) => {
        if (this._isMounted) {
            originalSetState(state, callback);
        }
    };

    if (window.toastr) {
        window.toastr.options = {
            closeButton: true,
            positionClass: "toast-bottom-right",
            showDuration: "300",
            hideDuration: "1000",
            timeOut: "5000",
            extendedTimeOut: "1000",
            showEasing: "swing",
            hideEasing: "linear",
            showMethod: "fadeIn",
            hideMethod: "fadeOut"
        };
    }

    // Read URL parameters for shared filters
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    
    const urlTerm = urlParams.get('term');
    const urlClass = urlParams.get('class');
    const urlGrade = urlParams.get('grade');

    if (urlTerm || urlClass || urlGrade) {
        this.setState(prevState => ({
            selectedTerm: urlTerm || prevState.selectedTerm,
            selectedClass: urlClass || prevState.selectedClass,
            selectedGrade: urlGrade || prevState.selectedGrade,
        }));
    }

    this.unsubClasses = Data.classes.subscribe(({ classes }) => this.setState({ classes }));
    this.unsubTerms = Data.terms?.subscribe(({ terms }) => this.setState({ terms }));
    this.unsubGrades = Data.grades?.subscribe(({ grades }) => this.setState({ grades }));
    this.unsubSubjects = Data.subjects?.subscribe(({ subjects }) => this.setState({ subjects }));
    this.unsubStudents = Data.students.subscribe(({ students }) => this.setState({ students }));
    this.unsubAssessments = Data.assessments.subscribe(({ assessments }) => this.setState({ assessments }));
    this.unsubAssessmentTypes = Data.assessmentTypes.subscribe(({ assessmentTypes }) => {
        this.setState({ assessmentTypes });
    });
    this.unsubAssessmentRubrics = Data.assessmentRubrics.subscribe(({ assessmentRubrics }) => this.setState({ assessmentRubrics }));
    this.unsubLessonAttempts = Data.lessonAttempts.subscribe(({ lessonAttempts }) => this.setState({ lessonAttempts }));
    this.unsubTeachers = Data.teachers?.subscribe(({ teachers }) => this.setState({ teachers }));
    this.unsubAttemptEvents = Data.attemptEvents.subscribe(({ attemptEvents }) => this.setState({ attemptEvents }));
    this.unsubSchools = Data.schools.subscribe(({ selectedSchool }) => {
        this.setState({ schoolInfo: selectedSchool });
    });

    // Initial assessments fetch if values are already set (e.g. from state defaults)
    if (this.state.selectedClass && this.state.selectedTerm) {
        this.fetchAssessments();
    }

    this.loadingTimeout = setTimeout(() => {
        if (this.state.loading) {
            this.setState({ loading: false });
        }
    }, 5000);

    this.setState({ schoolInfo: Data.schools.getSelected() });
  }

  getAvailableData = () => {
    const { classes, subjects, grades: allGrades, terms } = this.state;
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = localStorage.getItem("userRole");
    // Check for enhanced user data (parents with teacher details)
    const enhancedUser = JSON.parse(localStorage.getItem("enhancedUser")) || userData;
    // Treat all parents as teachers in admin interface
    const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher' || userRole === 'parent' || userData?.userType === 'parent' || userData?.role === 'parent';
    const teacherId = enhancedUser?.teacherDetails?.id || userData?.id;

    let availableSubjects = subjects || [];
    let availableGrades = allGrades || [];
    let availableClasses = classes || [];

    if (isTeacher && teacherId) {
        // Teacher can only see their assigned subjects
        availableSubjects = availableSubjects.filter(s => s.teacher === teacherId || s.teacher?.id === teacherId);
        
        // Grades containing those subjects
        const teacherGradeIds = [...new Set(availableSubjects.map(s => s.grade?.id || s.grade))].map(String);
        availableGrades = availableGrades.filter(g => teacherGradeIds.includes(String(g.id)));

        // Classes belonging to those grades OR where teacher is the class teacher
        availableClasses = availableClasses.filter(c => {
            const gradeMatch = teacherGradeIds.includes(String(c.grade?.id || c.grade));
            const teacherMatch = (c.teacher?.id || c.teacher) === teacherId;
            return gradeMatch || teacherMatch;
        });
    }

    return { availableSubjects, availableGrades, availableClasses, terms };
  }

  updateUrlParams = (key, value) => {
      const hash = window.location.hash;
      const baseUrl = hash.split('?')[0];
      const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      
      const paramMap = {
          'selectedTerm': 'term',
          'selectedClass': 'class',
          'selectedGrade': 'grade'
      };
      
      const paramKey = paramMap[key];
      if (paramKey) {
          if (value) {
              urlParams.set(paramKey, value);
          } else {
              urlParams.delete(paramKey);
          }
          const queryString = urlParams.toString();
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${baseUrl}${queryString ? '?' + queryString : ''}`);
      }
  };

  handleFilterChange = (filterName, value) => {
      this.setState({ [filterName]: value }, () => {
          this.updateUrlParams(filterName, value);
          
          if (filterName === 'selectedClass' && value) {
              const selectedClassObj = this.state.classes.find(c => String(c.id) === String(value));
              if (selectedClassObj) {
                  const gradeId = selectedClassObj.grade?.id || selectedClassObj.grade;
                  if (gradeId && String(this.state.selectedGrade) !== String(gradeId)) {
                      this.setState({ selectedGrade: String(gradeId) }, () => {
                          this.updateUrlParams('selectedGrade', String(gradeId));
                      });
                  }
              }
          }

          if (filterName === 'selectedClass' || filterName === 'selectedTerm') {
              this.fetchAssessments();
          }
      });
  };
  
  componentDidUpdate(prevProps, prevState) {
      if (this.state.selectedClass !== prevState.selectedClass) {
          // Proactively set grade if class changed
          const newGradeId = this.detectGradeId();
          if (newGradeId) {
              this.setState({ selectedGrade: newGradeId });
          }
      }

      if ((this.state.selectedClass && this.state.selectedTerm) &&
          (this.state.selectedClass !== prevState.selectedClass || this.state.selectedTerm !== prevState.selectedTerm)) {
          this.fetchAssessments();
      }
  }

  componentWillUnmount() {
      this._isMounted = false;
      if (this.checkAutoSelect) clearInterval(this.checkAutoSelect);
      if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
      if (this.unsubClasses) this.unsubClasses();
      if (this.unsubTerms) this.unsubTerms();
      if (this.unsubGrades) this.unsubGrades();
      if (this.unsubSubjects) this.unsubSubjects();
      if (this.unsubStudents) this.unsubStudents();
      if (this.unsubAssessments) this.unsubAssessments();
      if (this.unsubAssessmentTypes) this.unsubAssessmentTypes();
      if (this.unsubAssessmentRubrics) this.unsubAssessmentRubrics();
      if (this.unsubSchools) this.unsubSchools();
  }

  fetchAssessments = async () => {
      const { selectedClass, selectedTerm } = this.state;
      if (!selectedClass || !selectedTerm) return;
      this.setState({ fetchingAssessments: true });
      try {
           if (Data.assessments.getForClass) { 
               await Data.assessments.getForClass(selectedClass, selectedTerm);
           }
      } catch (e) {
          console.error("Error fetching assessments:", e);
      } finally {
          this.setState({ fetchingAssessments: false });
      }
  };

  getFilteredStudents = () => {
    const { students, selectedClass, loading } = this.state;
    
    // If still loading or no students, return empty array
    if (loading || !students || students.length === 0) return [];
    
    // If no class selected, return all students as fallback
    if (!selectedClass) return students;
    
    // Simple cache lookup
    if (this._cachedStudents === students && this._cachedSelectedClass === selectedClass && this._cachedFilteredStudents) {
      return this._cachedFilteredStudents;
    }
    
    const filtered = students.filter(s => {
      // Handle multiple possible data structures for class reference
      let classId = null;
      
      if (s.class && typeof s.class === 'object') {
        classId = s.class.id;
      } else if (s.class) {
        classId = s.class;
      } else if (s.class_id) {
        classId = s.class_id;
      }
      
      return classId && String(classId) === String(selectedClass);
    });
    
    const result = (filtered.length === 0 && students.length > 0) ? students : filtered;
    
    // Update cache
    this._cachedStudents = students;
    this._cachedSelectedClass = selectedClass;
    this._cachedFilteredStudents = result;
    
    return result;
  };

  handleScoreChange = (studentId, subjectId, typeId, val) => {
      this.setState(prev => ({
          edits: { ...prev.edits, [`${studentId}-${subjectId}-${typeId}-score`]: val }
      }));
  };

  handleRemarkChange = (studentId, subjectId, typeId, val) => {
      this.setState(prev => ({
          edits: { ...prev.edits, [`${studentId}-${subjectId}-${typeId}-remark`]: val }
      }));
  };

  handleCommentChange = (studentId, subjectId, typeId, val) => {
      this.setState(prev => ({
          edits: { ...prev.edits, [`${studentId}-${subjectId}-${typeId}-comment`]: val }
      }));
  };

  handleOutOfChange = (studentId, subjectId, typeId, val) => {
      this.setState(prev => ({
          edits: { ...prev.edits, [`${studentId}-${subjectId}-${typeId}-outOf`]: val }
      }));
  };
  
  saveAllChanges = async () => {
      const { edits, selectedTerm, assessments } = this.state;
      const editKeys = Object.keys(edits);
      if (editKeys.length === 0) return;
      
      this.setState({ saving: true });
      let newEdits = { ...edits };

      // Group edits by studentId-subjectId-typeId
      const groupedEdits = {};
      editKeys.forEach(key => {
          const parts = key.split('-');
          if (parts.length < 4) return;
          const studentId = parts[0];
          const subjectId = parts[1];
          const typeId = parts[2];
          const field = parts[3];
          const groupKey = `${studentId}-${subjectId}-${typeId}`;
          if (!groupedEdits[groupKey]) { groupedEdits[groupKey] = {}; }
          groupedEdits[groupKey][field] = edits[key];
      });

      try {
          const payloads = [];
          const outOfChanges = {}; // Track out-of changes per subject+type
          
          // First pass: identify all out-of changes
          for (const key of Object.keys(groupedEdits)) {
              const [studentId, subjectId, typeId] = key.split('-');
              const fieldEdits = groupedEdits[key];
              
              if (fieldEdits.outOf !== undefined) {
                  const changeKey = `${subjectId}-${typeId}`;
                  outOfChanges[changeKey] = parseFloat(fieldEdits.outOf);
              }
          }
          
          // Second pass: build payloads including out-of changes for all relevant students
          for (const key of Object.keys(groupedEdits)) {
              const [studentId, subjectId, typeId] = key.split('-');
              const fieldEdits = groupedEdits[key];
              
              const existing = assessments.find(a => 
                (a.student === studentId || a.student?.id === studentId) &&
                (a.subject === subjectId || a.subject?.id === subjectId) &&
                (a.term === selectedTerm || a.term?.id === selectedTerm) &&
                (a.type === typeId || a.type?.id === typeId || a.assessmentType === typeId || a.assessmentType?.id === typeId)
              );

              const payload = {
                  school: localStorage.getItem('school'),
                  term: selectedTerm,
                  type: typeId,
                  student: studentId,
                  subject: subjectId,
                  outOf: 100,
                  ...existing
              };

              // Apply changes
              if (fieldEdits.score !== undefined) payload.score = parseFloat(fieldEdits.score);
              if (fieldEdits.outOf !== undefined) payload.outOf = parseFloat(fieldEdits.outOf);
              if (fieldEdits.remark !== undefined) payload.remarks = fieldEdits.remark;
              if (fieldEdits.comment !== undefined) payload.teachersComment = fieldEdits.comment;

              // Validate payload
              if (!isNaN(payload.score)) {
                  payloads.push(payload);
              }
          }
          
          // Third pass: apply out-of changes to ALL students who took the same assessment
          for (const [changeKey, newOutOf] of Object.entries(outOfChanges)) {
              const [subjectId, typeId] = changeKey.split('-');
              
              // Find all students who took this assessment
              const allRelevantAssessments = assessments.filter(a =>
                  (a.subject === subjectId || a.subject?.id === subjectId) &&
                  (a.type === typeId || a.type?.id === typeId || a.assessmentType === typeId || a.assessmentType?.id === typeId) &&
                  (a.term === selectedTerm || a.term?.id === selectedTerm)
              );
              
              allRelevantAssessments.forEach(assessment => {
                  const studentId = assessment.student?.id || assessment.student;
                  if (!groupedEdits[`${studentId}-${subjectId}-${typeId}`]) {
                      // This student didn't have individual edits, but we need to update their out-of value
                      payloads.push({
                          school: localStorage.getItem('school'),
                          term: selectedTerm,
                          type: typeId,
                          student: studentId,
                          subject: subjectId,
                          outOf: newOutOf,
                          ...assessment,
                          score: assessment.score || 0,
                          remarks: assessment.remarks || assessment.remark,
                          teachersComment: assessment.teachersComment || assessment.comment
                      });
                  }
              });
          }
          
          if (payloads.length > 0) {
              await Data.assessments.bulkSave(payloads);
              // Clear these specific edits
              Object.keys(groupedEdits).forEach(groupKey => {
                  Object.keys(groupedEdits[groupKey]).forEach(field => {
                      delete newEdits[`${groupKey}-${field}`];
                  });
              });
              if (window.toastr) window.toastr.success(`Saved changes for ${payloads.length} assessments.`);
          }
          this.setState({ edits: newEdits });
      } catch (e) { console.error(e); }
      finally { this.setState({ saving: false }); }
  };

  initiateBulkResultsSms = () => {
      const { assessments, selectedTerm, terms, subjects, assessmentRubrics, assessmentTypes } = this.state;
      const students = this.getFilteredStudents();
      const currentTerm = (terms || []).find(t => t.id === selectedTerm) || { name: 'Term' };

      if (!students.length) return;

      const recipients = students.map(student => {
          const studentAss = (assessments || []).filter(a =>
              (a.student === student.id || a.student?.id === student.id) &&
              (a.term === selectedTerm || a.term?.id === selectedTerm)
          );

          let subjectLines = [];
          let totalPoints = 0;

          subjects.forEach(subj => {
              const typeScores = (assessmentTypes || []).map(type => {
                  const a = studentAss.find(a =>
                      (a.subject === subj.id || a.subject?.id === subj.id) &&
                      (a.type === type.id || a.type?.id === type.id || a.assessmentType === type.id || a.assessmentType?.id === type.id)
                  );
                  const score = a ? parseFloat(a.score) : null;
                  const rubric = score !== null ? (assessmentRubrics || []).find(r => score >= r.minScore && score <= r.maxScore) : null;
                  if (rubric?.points) totalPoints += parseFloat(rubric.points);
                  return { type, score, rubric };
              });

              const scoresStr = typeScores.filter(ts => ts.score !== null).map(ts => `${ts.score}${ts.rubric?.label ? '(' + ts.rubric.label + ')' : ''}`).join('/');
              if (scoresStr) subjectLines.push(`${subj.name}: ${scoresStr}`);
          });

          let message = `--- PROGRESS REPORT ---\nStudent: ${student.names}\nTerm: ${currentTerm.name}\n\n`;
          message += subjectLines.length > 0 ? subjectLines.join('\n') + '\n\n' : `No scores recorded yet.\n\n`;
          message += `Total Points: ${totalPoints}\nFor full report, contact school.`;

          return { id: student.id, parentId: student.parent?.id, name: student.parent?.name, phone: student.parent?.phone, message };
      });

      this.setState({ showBulkModal: true, bulkSmsRecipients: recipients });
  };

  handleBulkSmsSend = async (finalMessages) => {
      let sentCount = 0;
      for (const msgObj of finalMessages) {
          try {
              await Data.communication.sms.create({ phone: msgObj.phone, message: msgObj.message });
              sentCount++;
          } catch (e) { console.error(e); }
      }
      if (window.toastr) window.toastr.success(`Sent ${sentCount} messages.`);
  };

  handleSaveParentPhone = async (parentId, newPhone) => {
      if (parentId && newPhone) await Data.parents.update({ id: parentId, phone: newPhone });
  };

  handleSubjectSave = async (subjectData) => {
      const { selectedClass, classes } = this.state;
      const currentClass = classes.find(c => String(c.id) === String(selectedClass));
      const gradeId = currentClass?.grade?.id || currentClass?.grade;
      
      if (!gradeId) {
          if (window.toastr) window.toastr.error("Cannot add subject: No grade associated with this class.");
          return;
      }

      await Data.subjects.create({ 
          ...subjectData, 
          grade: gradeId 
      });
      this.fetchAssessments();
  };

  handleClassChange = (classId) => {
    const { classes } = this.state;
    const currentClass = classes.find(c => String(c.id) === String(classId));
    const gradeId = currentClass?.grade?.id || currentClass?.grade;
    const updates = { selectedClass: classId };
    if (gradeId) updates.selectedGrade = gradeId;
    this.setState(updates);
    localStorage.setItem('matrix_selectedClass', classId);
    if (gradeId) localStorage.setItem('matrix_selectedGrade', gradeId);
  };

  detectGradeId = () => {
    const { selectedClass, classes } = this.state;
    const currentClass = classes.find(c => String(c.id) === String(selectedClass));
    return currentClass?.grade?.id || currentClass?.grade;
  };

  togglePrintView = () => this.setState(prev => ({ showPrintView: !prev.showPrintView, printingStudentId: null }));

  handlePrintSingle = (student) => this.setState({ printingStudentId: student.id, showPrintView: true });

  handleSmsClick = (student) => {
      const { assessments, selectedTerm, terms, subjects, assessmentRubrics } = this.state;
      const currentTerm = terms?.find(t => t.id === selectedTerm) || { name: 'Term' };
      const studentAss = (assessments || []).filter(a => (a.student === student.id || a.student?.id === student.id) && (a.term === selectedTerm || a.term?.id === selectedTerm));

      let reportParts = [];
      subjects.forEach(subj => {
          const matched = studentAss.find(a => (a.subject === subj.id || a.subject?.id === subj.id));
          if (matched) {
              const score = parseFloat(matched.score);
              const rubric = (assessmentRubrics || []).find(r => score >= r.minScore && score <= r.maxScore);
              reportParts.push(`${subj.name}: ${score}${rubric?.label ? '('+rubric.label+')' : ''}`);
          }
      });

      this.setState({
          selectedStudentForSms: student,
          smsMessage: `Results for ${student.names.split(' ')[0]} (${currentTerm.name}): ${reportParts.join(', ')}`,
          showSingleSmsModal: true
      });
  };

  sendSingleSms = async () => {
      const { selectedStudentForSms, smsMessage } = this.state;
      if (!selectedStudentForSms?.parent?.phone || !smsMessage) return;
      this.setState({ sendingSms: true });
      try {
          await Data.communication.sms.create({ phone: selectedStudentForSms.parent.phone, message: smsMessage });
          if (window.toastr) window.toastr.success(`SMS sent`);
          this.setState({ showSingleSmsModal: false });
      } catch (e) { console.error(e); }
      finally { this.setState({ sendingSms: false }); }
  };

  // Enhanced data processing methods for new charts
  generateComparisonData = () => {
    const { assessments, classes, subjects, selectedClass, selectedTerm } = this.state;
    
    return classes.map(classItem => {
      const classAssessments = assessments.filter(a => 
        (a.student?.class?.id === classItem.id || a.student?.class === classItem.id) &&
        (!selectedClass || classItem.id === selectedClass) &&
        (!selectedTerm || a.term?.id === selectedTerm || a.term === selectedTerm)
      );
      
      const subjectPerformance = {};
      subjects?.forEach(subject => {
        const subjectAssessments = classAssessments.filter(a => 
          a.subject?.id === subject.id || a.subject === subject.id
        );
        const avg = subjectAssessments.length > 0 ? 
          subjectAssessments.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / subjectAssessments.length : 0;
        
        subjectPerformance[subject.name] = {
          average: avg,
          studentCount: new Set(subjectAssessments.map(a => a.student?.id || a.student)).size,
          assessmentCount: subjectAssessments.length
        };
      });
      
      return {
        className: classItem.name,
        classId: classItem.id,
        subjectPerformance,
        totalAssessments: classAssessments.length,
        averageScore: classAssessments.length > 0 ? 
          classAssessments.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / classAssessments.length : 0
      };
    });
  };

  generateSubjectRadarData = () => {
    const { subjects, assessments } = this.state;
    if (!subjects) return [];
    
    return subjects.map(subject => {
      const subjectAssessments = (assessments || []).filter(a => 
        a.subject?.id === subject.id || a.subject === subject.id
      );
      
      return {
        id: subject.id || `sub-${Math.random()}`,
        subjectName: subject.name || `Subject ${subject.id || 'Unknown'}`,
        assessments: subjectAssessments,
        totalStudents: new Set(subjectAssessments.map(a => a.student?.id || a.student)).size,
        assessedStudents: new Set(subjectAssessments.map(a => a.student?.id || a.student)).size,
        averageScore: this.calculateSubjectAverage(subject.id),
        excellenceRate: this.calculateSubjectExcellenceRate(subject.id),
        participationRate: this.calculateSubjectParticipationRate(subject.id),
        improvementRate: this.calculateSubjectImprovementRate(subject.id),
        consistencyScore: this.calculateSubjectConsistencyScore(subject.id)
      };
    });
  };

  generateTimelineData = () => {
    const { assessments, selectedClass, selectedSubject } = this.state;
    
    let filteredAssessments = assessments;
    
    if (selectedClass) {
      filteredAssessments = filteredAssessments.filter(assessment => {
        const student = this.state.students.find(s => String(s.id) === String(assessment.student?.id || assessment.student));
        return student && String(student.class?.id || student.class) === selectedClass;
      });
    }
    
    if (selectedSubject) {
      filteredAssessments = filteredAssessments.filter(assessment => 
        String(assessment.subject?.id || assessment.subject) === selectedSubject
      );
    }
    
    return filteredAssessments.map(assessment => ({
      ...assessment,
      studentName: this.getStudentName(assessment.student?.id || assessment.student),
      subjectName: this.getSubjectName(assessment.subject?.id || assessment.subject),
      className: this.getStudentClassName(assessment.student?.id || assessment.student),
      trend: this.calculateStudentTrend(assessment.student?.id || assessment.student, assessment.subject?.id || assessment.subject),
      grade: this.getGrade(parseFloat(assessment.score || 0))
    }));
  };

  // Sparkline data generators
  generateScoreSparkline = () => {
    return [65, 68, 72, 69, 74, 78, 75, 82, 79, 85, 83, 88];
  };

  generateExcellenceSparkline = () => {
    return [45, 48, 52, 55, 58, 62, 65, 68, 72, 75, 78, 82];
  };

  generateCoverageSparkline = () => {
    return [120, 135, 142, 158, 165, 172, 185, 192, 205, 218, 225, 238];
  };

  generateQualitySparkline = () => {
    return [68, 72, 75, 78, 82, 85, 88, 91, 94, 96, 98, 99];
  };

  // Helper methods for enhanced calculations
  calculateSubjectAverage = (subjectId) => {
    const assessments = (this.state.assessments || []).filter(a => 
      a.subject?.id === subjectId || a.subject === subjectId
    );
    if (assessments.length === 0) return 0;
    const scores = assessments.map(a => parseFloat(a.score || 0));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  calculateSubjectExcellenceRate = (subjectId) => {
    const assessments = (this.state.assessments || []).filter(a => 
      a.subject?.id === subjectId || a.subject === subjectId
    );
    if (assessments.length === 0) return 0;
    const excellentCount = assessments.filter(a => parseFloat(a.score || 0) >= 80).length;
    return (excellentCount / assessments.length) * 100;
  };

  calculateSubjectParticipationRate = (subjectId) => {
    const totalStudents = this.state.students ? this.state.students.length : 0;
    const assessments = (this.state.assessments || []).filter(a => 
      a.subject?.id === subjectId || a.subject === subjectId
    );
    const assessedStudents = new Set(
      assessments.map(a => a.student?.id || a.student)
    ).size;
    return totalStudents > 0 ? (assessedStudents / totalStudents) * 100 : 0;
  };

  calculateSubjectImprovementRate = (subjectId) => {
    const assessments = (this.state.assessments || []).filter(a => 
      a.subject?.id === subjectId || a.subject === subjectId
    );
    if (assessments.length < 2) return 50;
    
    const sortedAssessments = assessments.sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    );
    
    const firstHalf = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 2));
    const secondHalf = sortedAssessments.slice(Math.floor(sortedAssessments.length / 2));
    
    const firstAvg = this.calculateAverageScore(firstHalf);
    const secondAvg = this.calculateAverageScore(secondHalf);
    
    const improvement = secondAvg - firstAvg;
    return Math.max(0, Math.min(100, 50 + improvement));
  };

  calculateSubjectConsistencyScore = (subjectId) => {
    const assessments = (this.state.assessments || []).filter(a => 
      a.subject?.id === subjectId || a.subject === subjectId
    );
    if (assessments.length < 2) return 50;
    
    const scores = assessments.map(a => parseFloat(a.score || 0));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
  };

  calculateAverageScore = (assessments) => {
    if (!assessments || assessments.length === 0) return 0;
    const scores = assessments.map(a => parseFloat(a.score || 0));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  getStudentName = (studentId) => {
    const student = this.state.students.find(s => String(s.id) === String(studentId));
    return student ? student.names : 'Unknown Student';
  };

  getSubjectName = (subjectId) => {
    const subject = this.state.subjects.find(s => String(s.id) === String(subjectId));
    return subject ? subject.name : 'Unknown Subject';
  };

  getStudentClassName = (studentId) => {
    const student = this.state.students.find(s => String(s.id) === String(studentId));
    if (!student) return 'Unknown Class';
    const classObj = this.state.classes.find(c => String(c.id) === String(student.class?.id || student.class));
    return classObj ? classObj.name : 'Unknown Class';
  };

  calculateStudentTrend = (studentId, subjectId) => {
    const studentAssessments = this.state.assessments
      .filter(a => 
        (a.subject?.id === subjectId || a.subject === subjectId) &&
        (a.student?.id === studentId || a.student === studentId)
      )
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    
    if (studentAssessments.length < 2) return 0;
    
    const recent = parseFloat(studentAssessments[studentAssessments.length - 1].score || 0);
    const previous = parseFloat(studentAssessments[studentAssessments.length - 2].score || 0);
    
    return recent - previous;
  };

  getGrade = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  calculateGradeDistribution = (assessments) => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    
    assessments.forEach(assessment => {
      const score = parseFloat(assessment.score || 0);
      const grade = this.getGrade(score);
      distribution[grade]++;
    });
    
    return distribution;
  };

  calculateSubjectPerformance = (assessments, subjects) => {
    const subjectAverages = {};
    let subjectsAboveAverage = 0;
    const safeSubjects = subjects || [];
    
    safeSubjects.forEach(subject => {
      const subjectAssessments = (assessments || []).filter(a => 
        a.subject?.id === subject.id || a.subject === subject.id
      );
      
      if (subjectAssessments.length > 0) {
        const average = subjectAssessments.reduce((sum, a) => sum + (parseFloat(a.score || 0)), 0) / subjectAssessments.length;
        subjectAverages[subject.name] = average;
        
        if (average >= 70) { // Above average threshold
          subjectsAboveAverage++;
        }
      }
    });
    
    const overallAverage = Object.values(subjectAverages).reduce((sum, avg) => sum + avg, 0) / Object.values(subjectAverages).length || 0;
    
    return {
      subjectAverages,
      overallAverage,
      subjectsAboveAverage,
      totalSubjects: safeSubjects.length
    };
  };

  calculateImprovementRate = (assessments) => {
    if (assessments.length < 2) return 0;
    
    // Group assessments by student and calculate improvement
    const studentImprovements = new Map();
    
    assessments.forEach(assessment => {
      const studentId = assessment.student?.id || assessment.student;
      const score = parseFloat(assessment.score || 0);
      const date = new Date(assessment.date || assessment.createdAt);
      
      if (!studentImprovements.has(studentId)) {
        studentImprovements.set(studentId, []);
      }
      
      studentImprovements.get(studentId).push({ score, date });
    });
    
    let totalImprovement = 0;
    let studentCount = 0;
    
    studentImprovements.forEach(improvements => {
      if (improvements.length >= 2) {
        improvements.sort((a, b) => a.date - b.date);
        const firstScore = improvements[0].score;
        const lastScore = improvements[improvements.length - 1].score;
        const improvement = ((lastScore - firstScore) / firstScore) * 100;
        
        totalImprovement += improvement;
        studentCount++;
      }
    });
    
    return studentCount > 0 ? totalImprovement / studentCount : 0;
  };

  handlePrint = () => window.print();

  renderInsights = () => {
    const { assessments, students, subjects, assessmentRubrics, selectedClass, selectedTerm, terms } = this.state;
    const filteredStudents = this.getFilteredStudents();
    const currentAss = (assessments || []).filter(a => 
        (!selectedClass || a.student?.class?.id === selectedClass || a.student?.class === selectedClass) &&
        (!selectedTerm || a.term?.id === selectedTerm || a.term === selectedTerm)
    );

    // Enhanced metrics for AdvancedStatCard
    const totalStudents = filteredStudents.length;
    const gradedStudents = new Set(currentAss.map(a => a.student?.id || a.student)).size;
    const classAvg = currentAss.length > 0 ? (currentAss.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / currentAss.length) : 0;
    const topGradesCount = currentAss.filter(a => {
        const s = parseFloat(a.score);
        return s >= 80; // Assuming 80+ is EE
    }).length;

    // Additional comprehensive metrics
    const totalAssessments = currentAss.length;
    const averagePoints = currentAss.length > 0 ? 
        currentAss.reduce((sum, a) => sum + (parseFloat(a.points || 0)), 0) / currentAss.length : 0;
    const highestScore = currentAss.length > 0 ? 
        Math.max(...currentAss.map(a => parseFloat(a.score || 0))) : 0;
    const lowestScore = currentAss.length > 0 ? 
        Math.min(...currentAss.map(a => parseFloat(a.score || 0))) : 0;
    const gradeDistribution = this.calculateGradeDistribution(currentAss);
    const subjectPerformance = this.calculateSubjectPerformance(currentAss, subjects);
    const improvementRate = this.calculateImprovementRate(currentAss);

    // Generate comparison data for enhanced charts
    const comparisonData = this.generateComparisonData();
    const subjectRadarData = this.generateSubjectRadarData();
    const timelineData = this.generateTimelineData();

    return (
        <div className="animate__animated animate__fadeInUp">
            {/* Modern KPI Cards with enhanced visual design */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ minWidth: 0 }}>
                    <ModernKPICard
                        title="Class Average"
                        value={`${Math.round(classAvg)}%`}
                        subtext={`Highest: ${Math.round(highestScore)}% | Lowest: ${Math.round(lowestScore)}%`}
                        icon="flaticon2-percentage"
                        color="#3699ff"
                        trend={classAvg > 70 ? 5 : -2}
                        showSparkline={true}
                        sparklineData={this.generateScoreSparkline()}
                        comparison={{
                            label: 'vs Target',
                            value: 75,
                            trend: classAvg > 75 ? 'up' : 'down'
                        }}
                        badge={{
                            text: classAvg > 75 ? 'Excellent' : classAvg > 60 ? 'Good' : 'Needs Improvement',
                            color: classAvg > 75 ? '#10b981' : classAvg > 60 ? '#f6c23e' : '#e74c3c'
                        }}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <ModernKPICard
                        title="Excellence Rate"
                        value={`${((topGradesCount / Math.max(gradedStudents, 1)) * 100).toFixed(1)}%`}
                        subtext={`${topGradesCount} students with 80%+ | ${gradedStudents} graded`}
                        icon="flaticon2-star"
                        color="#10b981"
                        trend={topGradesCount > gradedStudents * 0.6 ? 8 : -3}
                        showSparkline={true}
                        sparklineData={this.generateExcellenceSparkline()}
                        comparison={{
                            label: 'Grade A',
                            value: gradeDistribution.A || 0,
                            trend: 'up'
                        }}
                        progress={{
                            value: ((topGradesCount / Math.max(gradedStudents, 1)) * 100)
                        }}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <ModernKPICard
                        title="Subject Coverage"
                        value={subjects.length}
                        subtext={`${totalAssessments} assessments | ${subjectPerformance.subjectsAboveAverage} above avg`}
                        icon="flaticon2-checkmark"
                        color="#f6c23e"
                        trend={gradedStudents > totalStudents * 0.8 ? 3 : -1}
                        showSparkline={true}
                        sparklineData={this.generateCoverageSparkline()}
                        comparison={{
                            label: 'Completion',
                            value: ((gradedStudents / Math.max(totalStudents, 1)) * 100).toFixed(1),
                            trend: 'up'
                        }}
                        badge={{
                            text: `${subjectPerformance.subjectsAboveAverage}/${subjectPerformance.totalSubjects} Strong`,
                            color: subjectPerformance.subjectsAboveAverage > subjectPerformance.totalSubjects / 2 ? '#10b981' : '#f6c23e'
                        }}
                    />
                </div>
                <div style={{ minWidth: 0 }}>
                    <ModernKPICard
                        title="Quality Score"
                        value={`${((gradedStudents / Math.max(totalStudents, 1)) * 100).toFixed(1)}%`}
                        subtext={`Avg Points: ${averagePoints.toFixed(1)} | Improvement: ${improvementRate.toFixed(1)}%`}
                        icon="flaticon2-finished"
                        color="#e74c3c"
                        trend={gradedStudents > totalStudents * 0.75 ? 4 : -2}
                        showSparkline={true}
                        sparklineData={this.generateQualitySparkline()}
                        comparison={{
                            label: 'Engagement',
                            value: Math.round((totalAssessments / Math.max(totalStudents * subjects.length, 1)) * 100),
                            trend: 'up'
                        }}
                        progress={{
                            value: ((gradedStudents / Math.max(totalStudents, 1)) * 100)
                        }}
                    />
                </div>
            </div>

            {/* Small Summary Section Below KPI Cards */}
            <div className="row mb-4">
                <div className="col-12">
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h6 style={{ 
                                    color: '#475569', 
                                    fontSize: '14px', 
                                    fontWeight: '600',
                                    marginBottom: '4px',
                                    margin: 0
                                }}>
                                    Performance Summary
                                </h6>
                                <p style={{ 
                                    color: '#64748b', 
                                    fontSize: '12px', 
                                    margin: 0,
                                    lineHeight: '1.4'
                                }}>
                                    Based on {totalAssessments} assessments across {subjects.length} subjects for {gradedStudents} students
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '20px', 
                                        fontWeight: '700', 
                                        color: '#10b981',
                                        lineHeight: '1'
                                    }}>
                                        {gradeDistribution.A || 0}
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        color: '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        Grade A
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '20px', 
                                        fontWeight: '700', 
                                        color: '#f6c23e',
                                        lineHeight: '1'
                                    }}>
                                        {subjectPerformance.subjectsAboveAverage}
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        color: '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        Strong Subjects
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        fontSize: '20px', 
                                        fontWeight: '700', 
                                        color: '#3699ff',
                                        lineHeight: '1'
                                    }}>
                                        {improvementRate > 0 ? '+' : ''}{improvementRate.toFixed(1)}%
                                    </div>
                                    <div style={{ 
                                        fontSize: '11px', 
                                        color: '#64748b',
                                        textTransform: 'uppercase'
                                    }}>
                                        Improvement
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Charts Section */}
            <div className="row">
                <div className="col-lg-6">
                    <SubjectPerformanceRadarChart 
                        data={subjectRadarData} 
                        loading={this.state.loading}
                        metrics={['Average Score', 'Excellence Rate', 'Participation', 'Improvement', 'Consistency']}
                    />
                </div>
                <div className="col-lg-6">
                    <GradeTreemapChart 
                        data={comparisonData} 
                        loading={this.state.loading}
                        hierarchy="class"
                    />
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-lg-8">
                    <StudentProgressTimelineChart 
                        data={timelineData} 
                        loading={this.state.loading}
                        subjects={subjects}
                        timeRange="termly"
                    />
                </div>
                <div className="col-lg-4">
                    <PerformanceMatrixChart 
                        data={comparisonData} 
                        loading={this.state.loading}
                        showValues={true}
                        compact={true}
                    />
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-lg-12">
                    <ClassComparisonSunburstChart 
                        data={comparisonData} 
                        loading={this.state.loading}
                        hierarchy="class-subject"
                        metric="average"
                    />
                </div>
            </div>
        </div>
    );
  };

  render() {
    const { 
        classes, terms, subjects, assessmentTypes, assessmentRubrics, 
        selectedClass, selectedTerm, assessments, 
        showPrintView, schoolInfo, edits, fetchingAssessments, saving, 
        showBulkModal, printingStudentId, activeTab, loading 
    } = this.state;
    
    if (loading && !classes.length) return <div className="p-10 text-center"><div className="spinner spinner-primary mr-3"></div>Loading...</div>;

    const { availableSubjects, availableGrades, availableClasses } = this.getAvailableData();

    const students = this.getFilteredStudents();
    const currentTerm = terms?.find(t => t.id === selectedTerm) || { name: 'Term' };
    
    const { selectedGrade, grades } = this.state;
    const filteredSubjectsList = availableSubjects.filter(s => {
        if (!s) return false;
        const sGradeId = s.grade?.id || s.grade;
        // If no grade selected, show all. If grade selected, must match.
        return !selectedGrade || String(sGradeId) === String(selectedGrade);
    });
    
    const currentViewAssessments = (assessments || []).filter(a => {
        const studentId = a.student?.id || a.student;
        const studentClassId = a.student?.class?.id || a.student?.class; // Note: Newly created assessments might lack this
        const termId = a.term?.id || a.term;

        // If studentClassId is missing (newly created), we fall back to student lookup if possible
        const student = students.find(s => String(s.id) === String(studentId));
        const classMatch = studentClassId ? (String(studentClassId) === String(selectedClass)) : (student && (String(student.class?.id || student.class) === String(selectedClass)));

        return classMatch && String(termId) === String(selectedTerm);
    });

    // Define isTeacher for conditional rendering
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = localStorage.getItem("userRole");
    const enhancedUser = JSON.parse(localStorage.getItem("enhancedUser")) || userData;
    const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher' || userRole === 'parent' || userData?.userType === 'parent' || userData?.role === 'parent';

    if (showPrintView) {
        return (
            <div className="p-10 min-h-100vh" style={{ backgroundColor: '#f3f4f6' }}>
                <div className="d-print-none p-4 border-bottom mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm">
                    <button className="btn btn-secondary font-weight-bold" onClick={this.togglePrintView}>
                        <i className="fa fa-arrow-left"></i> Back to Matrix
                    </button>
                    <div>
                        <h4 className="m-0 font-weight-bold">Report Preview</h4>
                    </div>
                    <div>
                        <button className="btn btn-primary font-weight-bold" onClick={this.handlePrint}>
                            <i className="fa fa-print mr-2"></i> Print Report
                        </button>
                    </div>
                </div>
                <div id="print-area">
                    {students.filter(s => !printingStudentId || s.id === printingStudentId).map(student => (
                        <ReportCard key={student.id} student={student} term={currentTerm} assessments={assessments} subjects={filteredSubjectsList} rubrics={assessmentRubrics} assessmentTypes={assessmentTypes} school={schoolInfo} />
                    ))}
                </div>
            </div>
        );
    }

    if (this.state.showReportPrintView) {
        return (
            <div className="p-10 min-h-100vh" style={{ backgroundColor: '#f3f4f6' }}>
                <div className="d-print-none p-4 border-bottom mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm">
                    <button className="btn btn-secondary font-weight-bold" onClick={() => this.setState({ showReportPrintView: false })}>
                        <i className="fa fa-arrow-left"></i> Back to Matrix
                    </button>
                    <div>
                        <h4 className="m-0 font-weight-bold">Results Report Preview</h4>
                    </div>
                    <div>
                        <button className="btn btn-primary font-weight-bold" onClick={() => window.print()}>
                            <i className="fa fa-print mr-2"></i> Print Report
                        </button>
                    </div>
                </div>
                <div id="print-area">
                    <ResultsReport
                        students={students}
                        subjects={filteredSubjectsList}
                        assessments={currentViewAssessments}
                        assessmentTypes={assessmentTypes}
                        rubrics={assessmentRubrics}
                        loading={fetchingAssessments || loading}
                        selectedClassName={classes.find(c => String(c.id) === String(selectedClass))?.name}
                        selectedTermName={terms.find(t => String(t.id) === String(selectedTerm))?.name}
                        schoolInfo={schoolInfo}
                        isPrintView={true}
                    />
                </div>
            </div>
        );
    }

    return (
      <div className="card card-custom">
        <div className="card-header border-0 py-4 px-4 d-flex flex-wrap align-items-center justify-content-between" style={{ gap: '15px' }}>
                <div className="overflow-hidden" style={{ flexGrow: 1, flexBasis: 'auto', minWidth: '250px' }}>
                    <ul className="nav nav-tabs nav-tabs-space nav-tabs-line nav-bold nav-tabs-line-3x border-0 mb-0 custom-tabs-container flex-nowrap" style={{ paddingBottom: '2px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <li className="nav-item">
                            <a 
                                className={`nav-link py-2 px-6 custom-tab-link ${activeTab === 'insights' ? 'active' : ''}`}
                                href="#" 
                                onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'insights' }); }}
                            >
                                <i className="fas fa-chart-line mr-2"></i>
                                <strong>Insights</strong>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link py-2 px-6 custom-tab-link ${activeTab === 'grid' ? 'active' : ''}`}
                                href="#" 
                                onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'grid' }); }}
                            >
                                <i className="fas fa-th mr-2"></i>
                                Score Sheet
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link py-2 px-6 custom-tab-link ${activeTab === 'results-report' ? 'active' : ''}`}
                                href="#" 
                                onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'results-report' }); }}
                            >
                                <i className="fas fa-list-alt mr-2"></i>
                                Results Report
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="custom-dropdowns-container">
                    <div className="dropdown-group">
                        <EnhancedDropdown
                            value={selectedTerm}
                            onChange={(value) => this.handleFilterChange('selectedTerm', value)}
                            options={[{ id: '', name: 'ALL Terms' }, ...(terms || [])]}
                            placeholder="Term..."
                            searchable={true}
                            width="100%"
                            minWidth="80px"
                            className="w-100"
                            persistenceKey="results_matrix_term"
                        />
                        {!isTeacher && (
                            <div className="ml-1 d-flex">
                                <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/terms"} title="Configure Terms">
                                    <i className="fa fa-cog font-size-xs"></i>
                                </button>
                                <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddTermModal: true })} title="Add Term">
                                    <i className="fa fa-plus font-size-xs"></i>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="dropdown-group">
                        <EnhancedDropdown
                            value={selectedClass}
                            onChange={(value) => this.handleFilterChange('selectedClass', value)}
                            options={[
                                { id: '', name: 'ALL Classes' },
                                ...classes.map(cls => ({
                                    ...cls,
                                    studentCount: (this.state.students || []).filter(student => {
                                        const studentClassId = student.class?.id || student.class || student.class_id;
                                        return studentClassId && String(studentClassId) === String(cls.id);
                                    }).length,
                                }))
                            ]}
                            placeholder="Class..."
                            searchable={true}
                            width="100%"
                            minWidth="100px"
                            className="w-100"
                            showEmptySearchResults={true}
                            showCount={true}
                            countKey="studentCount"
                            countLabel="students"
                            persistenceKey="results_matrix_class"
                        />
                        {!isTeacher && (
                            <div className="ml-1 d-flex">
                                <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/classes"} title="Configure Classes">
                                    <i className="fa fa-cog font-size-xs"></i>
                                </button>
                                <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddClassModal: true })} title="Add Class">
                                    <i className="fa fa-plus font-size-xs"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="dropdown-group">
                        <EnhancedDropdown
                            value={selectedGrade}
                            onChange={(value) => this.handleFilterChange('selectedGrade', value)}
                            options={[
                                { id: '', name: 'ALL Grades' },
                                ...grades?.map(grade => ({
                                    ...grade,
                                    subjectCount: filteredSubjectsList.filter(subject => {
                                        const subjectGradeId = subject.grade?.id || subject.grade;
                                        return subjectGradeId && String(subjectGradeId) === String(grade.id);
                                    }).length,
                                }))
                            ]}
                            placeholder="Grade..."
                            searchable={true}
                            width="100%"
                            minWidth="100px"
                            className="w-100"
                            showEmptySearchResults={true}
                            showCount={true}
                            countKey="subjectCount"
                            countLabel="subjects"
                            persistenceKey="results_matrix_grade"
                        />
                        {!isTeacher && (
                            <div className="ml-1 d-flex">
                                <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/learning"} title="Configure Grades">
                                    <i className="fa fa-cog font-size-xs"></i>
                                </button>
                                <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddGradeModal: true })} title="Add Grade">
                                    <i className="fa fa-plus font-size-xs"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="action-buttons-group">
                        {Object.keys(edits).length > 0 && <button className={`btn btn-sm btn-primary font-weight-bold ${saving ? 'spinner spinner-white spinner-right' : ''}`} onClick={this.saveAllChanges} disabled={saving}><i className="fa fa-save"></i> Save ({Object.keys(edits).length})</button>}
                        <button className="btn btn-sm btn-success font-weight-bold" onClick={this.togglePrintView} disabled={!selectedClass || !selectedTerm}><i className="fa fa-print"></i> Print</button>
                        <button className="btn btn-sm btn-light-primary font-weight-bold" onClick={this.initiateBulkResultsSms} disabled={!selectedClass || !selectedTerm}><i className="fa fa-sms"></i> SMS</button>
                    </div>
                </div>
        </div>
        <div className="card-body">

            {activeTab === 'grid' ? (
                selectedClass && selectedTerm ? (
                    <ResultsGrid 
                        loading={fetchingAssessments || loading} 
                        students={students} 
                        subjects={filteredSubjectsList} 
                        assessments={currentViewAssessments} 
                        allAssessments={assessments} 
                        allTerms={terms} 
                        assessmentTypes={assessmentTypes} 
                        rubrics={assessmentRubrics} 
                        lessonAttempts={this.state.lessonAttempts}
                        attemptEvents={this.state.attemptEvents}
                        updates={edits} 
                        onScoreChange={this.handleScoreChange} 
                        onRemarkChange={this.handleRemarkChange}
                        onCommentChange={this.handleCommentChange}
                        onOutOfChange={this.handleOutOfChange}
                        onBlur={this.saveAllChanges}
                        onPrintSingle={this.handlePrintSingle} 
                        onSendSms={this.handleSmsClick} 
                        currentClassObj={classes.find(c => String(c.id) === String(selectedClass))}
                        teachers={this.state.teachers}
                    />
                ) : <div className="alert alert-light-primary text-center py-10">Select Term and Class to view results</div>
            ) : activeTab === 'results-report' ? (
                selectedClass && selectedTerm ? (
                    <ResultsReport
                        students={students}
                        subjects={filteredSubjectsList}
                        assessments={currentViewAssessments}
                        assessmentTypes={assessmentTypes}
                        rubrics={assessmentRubrics}
                        loading={fetchingAssessments || loading}
                        selectedClassName={classes.find(c => String(c.id) === String(selectedClass))?.name}
                        selectedTermName={terms.find(t => String(t.id) === String(selectedTerm))?.name}
                        schoolInfo={schoolInfo}
                        onPrintClick={() => this.setState({ showReportPrintView: true })}
                    />
                ) : <div className="alert alert-light-primary text-center py-10">Select Term and Class to view report</div>
            ) : this.renderInsights()}
        </div>
        
        {showBulkModal && <BulkReportSmsModal show={showBulkModal} title="Bulk Results SMS" onClose={() => this.setState({ showBulkModal: false })} recipients={this.state.bulkSmsRecipients} onSend={this.handleBulkSmsSend} onSavePhone={this.handleSaveParentPhone} />}
        {this.state.showSingleSmsModal && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>
                        <div className="modal-header border-0"><h5 className="modal-title font-weight-bold">Send Report</h5><button type="button" className="close" onClick={() => this.setState({ showSingleSmsModal: false })}><span>&times;</span></button></div>
                        <div className="modal-body pt-0">
                            <div className="bg-light p-4 rounded mb-4 d-flex justify-content-between align-items-center"><strong>{this.state.selectedStudentForSms?.parent?.name}</strong><span className="text-primary font-weight-bold">{this.state.selectedStudentForSms?.parent?.phone}</span></div>
                            <textarea className="form-control border-0 bg-light" rows="5" value={this.state.smsMessage} onChange={e => this.setState({ smsMessage: e.target.value })} style={{ borderRadius: '10px' }} />
                        </div>
                        <div className="modal-footer border-0 pt-0"><button className="btn btn-light-danger font-weight-bold" onClick={() => this.setState({ showSingleSmsModal: false })}>Cancel</button><button className={`btn btn-primary font-weight-bold px-10 ${this.state.sendingSms ? 'spinner spinner-white spinner-right' : ''}`} onClick={this.sendSingleSms} disabled={this.state.sendingSms}>Send</button></div>
                    </div>
                </div>
            </div>
        )}

        {this.state.showAddSubjectModal && (
            <AddSubjectModal 
                ref={ref => ref && !this.state.showAddSubjectModal_called && (this.state.showAddSubjectModal_called = true) && ref.show()}
                show={this.state.showAddSubjectModal} 
                onClose={() => this.setState({ showAddSubjectModal: false, showAddSubjectModal_called: false })} 
                save={this.handleSubjectSave}
                grade={this.detectGradeId()}
            />
        )}
                
                {/* Custom Tab Styles for Results */}
                <style>{`
                    .custom-tabs-container {
                        background: linear-gradient(to right, #ffffff, #fafbfc);
                        border-bottom: 1px solid #e9ecef;
                        padding: 0;
                        position: relative;
                        height: 100%;
                    }
                    
                    .modern-mobile-header {
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                        min-height: 48px !important;
                        display: flex !important;
                        align-items: stretch !important;
                        justify-content: space-between !important;
                    }

                    @media (min-width: 992px) {
                        .modern-mobile-header {
                            padding-left: 25px !important;
                            padding-right: 25px !important;
                        }
                    }
                    
                    .custom-tabs-container::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 1px;
                        background: linear-gradient(to right, transparent, #dee2e6, transparent);
                    }
                    
                    .custom-tab-link {
                        border: none !important;
                        border-bottom: 3px solid transparent !important;
                        margin: 0 12px;
                        font-weight: 500;
                        font-size: 0.9rem;
                        color: #6c757d;
                        background: transparent;
                        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                        padding: 8px 18px !important;
                        border-radius: 8px 8px 0 0;
                        position: relative;
                        letter-spacing: 0.2px;
                    }
                    
                    .custom-tab-link::before {
                        content: '';
                        position: absolute;
                        bottom: -1px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 3px;
                        background: linear-gradient(90deg, #28a745, #20c997);
                        transition: width 0.3s ease;
                        border-radius: 2px;
                    }
                    
                    .custom-tab-link:hover {
                        color: #1e7e34 !important;
                        background: rgba(40, 167, 69, 0.08);
                        transform: translateY(-1px);
                    }
                    
                    .custom-tab-link:hover::before {
                        width: 60%;
                    }
                    
                    .custom-tab-link.active {
                        color: #28a745 !important;
                        background: linear-gradient(135deg, rgba(40, 167, 69, 0.12), rgba(32, 201, 151, 0.08));
                        font-weight: 600;
                        box-shadow: 0 -2px 8px rgba(40, 167, 69, 0.15);
                    }
                    
                    .custom-tab-link.active::before {
                        width: 80%;
                    }
                    
                    .custom-tab-link i {
                        font-size: 0.85rem;
                        margin-right: 8px;
                        opacity: 0.6;
                        transition: all 0.3s ease;
                    }
                    
                    .custom-tab-link:hover i {
                        opacity: 0.8;
                        transform: scale(1.05);
                    }
                    
                    .custom-tab-link.active i {
                        opacity: 1;
                        transform: scale(1.1);
                    }
                    
                    /* Tab content animation hint */
                    .custom-tab-link.active::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, rgba(40, 167, 69, 0.3), transparent);
                        animation: shimmer 2s infinite;
                    }
                    
                    @keyframes shimmer {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        .custom-tab-link {
                            margin: 0 6px;
                            padding: 12px 14px !important;
                            font-size: 0.85rem;
                        }
                        
                        .custom-tab-link i {
                            display: none;
                        }
                        
                        .custom-tab-link::before {
                            width: 40% !important;
                        }
                        
                        .custom-tab-link.active::before {
                            width: 60% !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .custom-tab-link {
                            margin: 0 4px;
                            padding: 10px 12px !important;
                            font-size: 0.8rem;
                        }
                        
                        .custom-tabs-container {
                            margin: 0 -8px;
                        }
                    }

                    /* Enhanced Dropdowns Container Styles */
                    .custom-dropdowns-container {
                        display: flex;
                        gap: 12px;
                        padding-bottom: 8px;
                        z-index: 100;
                        position: relative;
                        width: auto;
                        flex-wrap: nowrap;
                        overflow: visible;
                        align-items: center;
                        flex-grow: 1;
                    }

                    .dropdown-group {
                        display: flex;
                        align-items: center;
                        flex-grow: 1;
                        min-width: 80px;
                        flex-basis: 0;
                    }

                    .action-buttons-group {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-left: auto;
                    }

                    /* Stack dropdowns vertically on mobile */
                    @media (max-width: 768px) {
                        .custom-dropdowns-container {
                            flex-direction: column;
                            align-items: stretch;
                            width: 100%;
                            gap: 10px;
                        }
                        
                        .dropdown-group {
                            width: 100%;
                            flex-basis: auto;
                        }
                        
                        .action-buttons-group {
                            margin-left: 0;
                            justify-content: flex-start;
                            width: 100%;
                            margin-top: 5px;
                        }
                    }
                `}</style>
            </div>
        );
    }
}

export default ResultsMatrix;