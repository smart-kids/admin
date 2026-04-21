import React from "react";
import Data from "../../utils/data";
import ReportCard from "./components/ReportCard";
import ResultsGrid from "./components/ResultsGrid";
import BulkReportSmsModal from "../../components/reports/BulkReportSmsModal";
import AddSubjectModal from "../learning/subjects/add";
import AddClassModal from "../classes/add";
import AddGradeModal from "../learning/grades/add";
import AddTermModal from "./components/AddTermModal";
import ResultsInsightsDashboard from '../insights/ResultsInsightsDashboard';
import { StatCard, DistributionChart, TrendBarChart, AreaChart, RankingList } from '../../components/analytics/DashboardWidgets';

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
    selectedSubject: "",
    
    assessmentTypes: [],
    assessmentRubrics: [],
    
    edits: {}, 
    loading: true,
    saving: false,
    sendingSms: false,
    showPrintView: false,
    schoolInfo: null,
    fetchingAssessments: false,
    showBulkModal: false,

    printingStudentId: null,
    showSingleSmsModal: false,
    selectedStudentForSms: null,
    smsMessage: "",
    bulkSmsRecipients: [],

    activeTab: 'grid', 
    
    showAddSubjectModal: false,
    showAddTermModal: false,
    showAddClassModal: false,
    showAddGradeModal: false,
    showSelectSubjectModal: false,
    selectedGrade: localStorage.getItem('matrix_selectedGrade') || "",
  };

  componentDidMount() {
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

    // Check for defaults as data arrives
    this.checkAutoSelect = setInterval(() => {
        if (this.state.classes.length > 0 && this.state.terms.length > 0) {
            this.autoSelectDefaults();
            clearInterval(this.checkAutoSelect);
        }
    }, 500);

    // Fallback timeout to ensure loading is eventually set to false
    this.loadingTimeout = setTimeout(() => {
        if (this.state.loading) {
            console.warn('Loading timeout reached - setting loading to false');
            this.setState({ loading: false });
        }
        if (this.checkAutoSelect) {
            clearInterval(this.checkAutoSelect);
        }
    }, 10000); // 10 seconds timeout

    const schoolInfo = Data.schools.getSelected();
    
    let restoredGrade = localStorage.getItem('matrix_selectedGrade');
    if (restoredGrade === 'null' || restoredGrade === 'undefined') restoredGrade = "";

    this.setState({ 
        schoolInfo,
        selectedClass: localStorage.getItem('matrix_selectedClass') || "",
        selectedTerm: localStorage.getItem('matrix_selectedTerm') || "",
        selectedGrade: restoredGrade || ""
    });
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

  autoSelectDefaults = () => {
    const { selectedClass, selectedTerm, selectedGrade, loading } = this.state;
    const { availableClasses, availableGrades, terms } = this.getAvailableData();
    let updates = {};
    let shouldUpdate = false;

    if (!selectedClass && availableClasses?.length > 0) {
        updates.selectedClass = String(availableClasses[0].id);
        localStorage.setItem('matrix_selectedClass', updates.selectedClass);
        shouldUpdate = true;
    }

    if (!selectedTerm && terms?.length > 0) {
        updates.selectedTerm = String(terms[0].id);
        localStorage.setItem('matrix_selectedTerm', updates.selectedTerm);
        shouldUpdate = true;
    }

    if (!selectedGrade && availableGrades?.length > 0) {
        const classId = updates.selectedClass || selectedClass;
        if (classId) {
            const currentClass = availableClasses.find(c => String(c.id) === String(classId));
            const gradeId = currentClass?.grade?.id || currentClass?.grade;
            if (gradeId) {
                updates.selectedGrade = String(gradeId);
                localStorage.setItem('matrix_selectedGrade', updates.selectedGrade);
                shouldUpdate = true;
            }
        }
        
        if (!updates.selectedGrade && availableGrades.length > 0) {
            updates.selectedGrade = String(availableGrades[0].id);
            localStorage.setItem('matrix_selectedGrade', updates.selectedGrade);
            shouldUpdate = true;
        }
    }

    if (shouldUpdate) {
        this.setState(updates, () => {
            if (this.state.selectedClass && this.state.selectedTerm) {
                this.fetchAssessments();
            }
        });
    } else if (selectedClass && selectedTerm && loading) {
        this.fetchAssessments();
    }
    
    if (loading) this.setState({ loading: false });
  }
  
  componentDidUpdate(prevProps, prevState) {
      if (this.state.selectedClass !== prevState.selectedClass) {
          localStorage.setItem('matrix_selectedClass', this.state.selectedClass);
          // Proactively set grade if class changed
          const newGradeId = this.detectGradeId();
          if (newGradeId) {
              this.setState({ selectedGrade: newGradeId });
          }
      }
      if (this.state.selectedTerm !== prevState.selectedTerm) localStorage.setItem('matrix_selectedTerm', this.state.selectedTerm);
      if (this.state.selectedGrade !== prevState.selectedGrade) localStorage.setItem('matrix_selectedGrade', this.state.selectedGrade);

      if ((this.state.selectedClass && this.state.selectedTerm) &&
          (this.state.selectedClass !== prevState.selectedClass || this.state.selectedTerm !== prevState.selectedTerm)) {
          this.fetchAssessments();
      }
  }

  componentWillUnmount() {
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
      if (this.unsubLessonAttempts) this.unsubLessonAttempts();
      if (this.unsubTeachers) this.unsubTeachers();
      if (this.unsubAttemptEvents) this.unsubAttemptEvents();
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
    
    // Debug: Log the filtering process
    console.log('Filtering students for class:', selectedClass);
    console.log('Total students:', students.length);
    console.log('Sample student data:', students.slice(0, 3));
    
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
      
      const match = classId && String(classId) === String(selectedClass);
      if (!match && students.length <= 10) {
        console.log('Student not matched:', s.names, 'classId:', classId, 'selected:', selectedClass, 'full student:', s);
      }
      return match;
    });
    
    console.log('Filtered students count:', filtered.length);
    
    // If filtering results in empty students but there are students overall, 
    // it might be a data structure issue. Return all students as fallback.
    if (filtered.length === 0 && students.length > 0) {
      console.warn('No students matched the selected class, returning all students as fallback');
      return students;
    }
    
    return filtered;
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

  handlePrint = () => window.print();

  renderInsights = () => {
    const { assessments, students, subjects, assessmentRubrics, selectedClass, selectedTerm, terms } = this.state;
    const filteredStudents = this.getFilteredStudents();
    const currentAss = (assessments || []).filter(a => 
        (!selectedClass || a.student?.class?.id === selectedClass || a.student?.class === selectedClass) &&
        (!selectedTerm || a.term?.id === selectedTerm || a.term === selectedTerm)
    );

    const rubricCounts = (assessmentRubrics || []).map(r => {
        const count = currentAss.filter(a => {
            const score = parseFloat(a.score);
            return score >= r.minScore && score <= r.maxScore;
        }).length;
        const colors = { 'EE': '#10b981', 'ME': '#3699ff', 'AE': '#f6c23e', 'BE': '#e74c3c' };
        return { label: r.label, value: count, color: colors[r.label] || '#e5e7eb' };
    }).filter(r => r.value > 0);

    const subjectMastery = (subjects || []).map(subj => {
        const subAss = currentAss.filter(a => (a.subject === subj.id || a.subject?.id === subj.id));
        const avg = subAss.length > 0 ? (subAss.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / subAss.length) : 0;
        return { label: subj.name, value: avg, color: avg >= 80 ? '#10b981' : avg >= 65 ? '#3699ff' : avg >= 50 ? '#f6c23e' : '#e74c3c' };
    }).filter(s => s.value > 0).sort((a,b) => b.value - a.value).slice(0, 8);

    // Term-over-Term Trend
    const termTrendData = (terms || []).map(t => {
        const tAss = (assessments || []).filter(a => 
            (a.term?.id === t.id || a.term === t.id) &&
            (!selectedClass || a.student?.class?.id === selectedClass || a.student?.class === selectedClass)
        );
        const avg = tAss.length > 0 ? (tAss.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / tAss.length) : 0;
        return { label: t.name, value: Math.round(avg) };
    }).filter(t => t.value > 0);

    // Top Performers Ranking
    const studentPerformance = filteredStudents.map(student => {
        const studentAss = currentAss.filter(a => (a.student === student.id || a.student?.id === student.id));
        let totalPoints = 0;
        studentAss.forEach(a => {
            const score = parseFloat(a.score);
            const rubric = (assessmentRubrics || []).find(r => score >= r.minScore && score <= r.maxScore);
            if (rubric?.points) totalPoints += parseFloat(rubric.points);
        });
        return { label: student.names, subtext: student.registration || 'No Reg No.', value: totalPoints, color: '#3699ff' };
    }).filter(s => s.value > 0).sort((a,b) => b.value - a.value).slice(0, 5);

    const totalStudents = filteredStudents.length;
    const gradedStudents = new Set(currentAss.map(a => a.student?.id || a.student)).size;
    const classAvg = currentAss.length > 0 ? (currentAss.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / currentAss.length) : 0;
    const topGradesCount = currentAss.filter(a => {
        const s = parseFloat(a.score);
        return s >= 80; // Assuming 80+ is EE
    }).length;

    return (
        <div className="animate__animated animate__fadeInUp">
            {/* ROW 1: MISSION CONTROL STATS */}
            <div className="row">
                <div className="col-md-3"><StatCard title="Class Average" value={`${Math.round(classAvg)}%`} icon="flaticon-line-graph" color="#3699ff" trend={5} /></div>
                <div className="col-md-3"><StatCard title="Grading Progress" value={`${gradedStudents}/${totalStudents}`} icon="flaticon-users" color="#10b981" subtext="Students with scores" /></div>
                <div className="col-md-3"><StatCard title="Subject Coverage" value={subjects.length} icon="flaticon-book" color="#f6c23e" subtext="Subjects recorded" trend={2} /></div>
                <div className="col-md-3"><StatCard title="Quality Scores" value={topGradesCount} icon="flaticon-medal" color="#e74c3c" subtext="High achievement (80%+)" /></div>
            </div>

            {/* ROW 2: PRIMARY ANALYTICS (3 COLUMNS) */}
            <div className="row mt-4">
                <div className="col-lg-4">
                    <DistributionChart title="Grade Distribution" data={rubricCounts} />
                </div>
                <div className="col-lg-4">
                    <TrendBarChart title="Subject Performance (%)" data={subjectMastery} />
                </div>
                <div className="col-lg-4">
                    <AreaChart title="Class Trend (Termly)" data={termTrendData} color="#3699ff" />
                </div>
            </div>

            {/* ROW 3: LEADERS & RANKINGS */}
            <div className="row mt-4">
                <div className="col-lg-6">
                    <RankingList title="Top Student Performers" data={studentPerformance} valueSuffix=" pts" />
                </div>
                <div className="col-lg-6">
                    <RankingList title="Top Subject Mastery" data={subjectMastery.slice(0, 5)} valueSuffix="%" />
                </div>
            </div>
        </div>
    );
  };

  render() {
    const { 
        classes, terms, subjects, assessmentTypes, assessmentRubrics, 
        selectedClass, selectedTerm, selectedSubject, assessments, 
        showPrintView, schoolInfo, edits, fetchingAssessments, saving, 
        showBulkModal, printingStudentId, activeTab, loading 
    } = this.state;
    
    if (loading && !classes.length) return <div className="p-10 text-center"><div className="spinner spinner-primary mr-3"></div>Loading...</div>;

    const { availableSubjects, availableGrades, availableClasses } = this.getAvailableData();

    const students = this.getFilteredStudents();
    const currentTerm = terms?.find(t => t.id === selectedTerm) || { name: 'Term' };
    
    const { selectedGrade } = this.state;
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

    return (
      <div className="card card-custom">
        <div className="card-header border-0 py-5 d-flex flex-column align-items-stretch">
            <div className="mb-4 d-flex flex-column">
                <h1 className="font-weight-bolder text-dark font-size-h3 mb-0">Results Management</h1>
                <div className="text-muted font-weight-bold font-size-sm mt-1">Manage student scores and academic insights</div>
            </div>

            <div className="d-flex align-items-center justify-content-between">
                <ul className="nav nav-tabs nav-tabs-line nav-bold nav-tabs-line-2x border-0 mb-0">
                    <li className="nav-item">
                        <a 
                            className={`nav-link py-4 ${activeTab === 'grid' ? 'active' : ''}`} 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'grid' }); }}
                        >
                            Score Sheet
                        </a>
                    </li>
                    <li className="nav-item">
                        <a 
                            className={`nav-link py-4 ${activeTab === 'insights' ? 'active' : ''}`} 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); this.setState({ activeTab: 'insights' }); }}
                        >
                            Insights
                        </a>
                    </li>
                </ul>

                <div className="card-toolbar d-flex align-items-center">
                    <div className="dropdown dropdown-inline mr-2 d-flex align-items-center">
                        <select className="form-control form-control-sm form-control-solid" value={selectedTerm} onChange={e => {
                            this.setState({ selectedTerm: e.target.value });
                            localStorage.setItem('matrix_selectedTerm', e.target.value);
                        }}>
                            <option value="">Term...</option>
                            {terms?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div className="ml-1 d-flex">
                            <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/terms"} title="Configure Terms">
                                <i className="fa fa-cog font-size-xs"></i>
                            </button>
                            <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddTermModal: true })} title="Add Term">
                                <i className="fa fa-plus font-size-xs"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div className="dropdown dropdown-inline mr-2 d-flex align-items-center">
                        <select className="form-control form-control-sm form-control-solid" value={selectedClass} onChange={e => this.handleClassChange(e.target.value)}>
                            <option value="">Class (Students)...</option>
                            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({(c.students && c.students.length) || 0} Students)</option>)}
                        </select>
                        <div className="ml-1 d-flex">
                            <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/classes"} title="Configure Classes">
                                <i className="fa fa-cog font-size-xs"></i>
                            </button>
                            <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddClassModal: true })} title="Add Class">
                                <i className="fa fa-plus font-size-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div className="dropdown dropdown-inline mr-2 d-flex align-items-center">
                        <select className="form-control form-control-sm form-control-solid" value={selectedGrade} onChange={e => {
                            this.setState({ selectedGrade: e.target.value });
                            localStorage.setItem('matrix_selectedGrade', e.target.value);
                        }}>
                            <option value="">Grade (Subjects)...</option>
                            {availableGrades.map(g => <option key={g.id} value={g.id}>{g.name} ({(g.subjects || []).length} Subjects)</option>)}
                        </select>
                        <div className="ml-1 d-flex">
                            <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/learning"} title="Configure Grades">
                                <i className="fa fa-cog font-size-xs"></i>
                            </button>
                            <button className="btn btn-xs btn-icon btn-light-success" onClick={() => this.setState({ showAddGradeModal: true })} title="Add Grade">
                                <i className="fa fa-plus font-size-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div className="d-flex align-items-center">
                        {Object.keys(edits).length > 0 && <button className={`btn btn-sm btn-primary font-weight-bold mr-2 ${saving ? 'spinner spinner-white spinner-right' : ''}`} onClick={this.saveAllChanges} disabled={saving}><i className="fa fa-save"></i> Save ({Object.keys(edits).length})</button>}
                        <button className="btn btn-sm btn-success font-weight-bold mr-2" onClick={this.togglePrintView} disabled={!selectedClass || !selectedTerm}><i className="fa fa-print"></i> Print</button>
                        <button className="btn btn-sm btn-light-primary font-weight-bold" onClick={this.initiateBulkResultsSms} disabled={!selectedClass || !selectedTerm}><i className="fa fa-sms"></i> SMS</button>
                    </div>
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
                    />
                ) : <div className="alert alert-light-primary text-center py-10">Select Term and Class to view results</div>
            ) : <ResultsInsightsDashboard 
                                classes={classes}
                                assessments={assessments}
                                subjects={subjects}
                                students={students}
                                terms={terms}
                                assessmentTypes={assessmentTypes}
                                assessmentRubrics={assessmentRubrics}
                                selectedClass={selectedClass}
                                selectedTerm={selectedTerm}
                                selectedSubject={selectedSubject || ""}
                                onFilterChange={(filter, value) => this.setState({ [filter]: value })}
                            />}
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
      </div>
    );
  }
}

export default ResultsMatrix;
