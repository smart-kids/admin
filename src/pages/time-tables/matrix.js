import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TimeTableGrid from './components/TimeTableGrid';
import TimeTableConfig from './components/TimeTableConfig';
import AllocationModal from './components/AllocationModal';
import TimeTablePrintReview from './components/TimeTablePrintReview';
import Data from "../../utils/data";

const TimeTableMatrix = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [timeTableData, setTimeTableData] = useState({});
  const [config, setConfig] = useState({
    lessonLength: 45,
    teaBreakLength: 15,
    lunchBreakLength: 30,
    lessonsPerTeaBreak: 2,
    lessonsPerLunchBreak: 4,
    teaBreakAfterLessons: [2, 6], // Support multiple tea breaks
    lunchBreakAfterLessons: 4,
    startTime: '08:00',
    endTime: '13:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  const [showConfig, setShowConfig] = useState(false);
  const [allocationModal, setAllocationModal] = useState({
    isOpen: false,
    slot: null,
    day: null,
    time: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [allTimeTablesData, setAllTimeTablesData] = useState({});
  const [viewMode, setViewMode] = useState('vertical'); // 'vertical' or 'horizontal'

  // Generate time slots based on configuration
  const timeSlots = useMemo(() => {
    console.log('Generating time slots with config:', config);
    const slots = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    let lessonCount = 0;
    let teaBreaksUsed = [];
    let lunchBreakUsed = false;
    
    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Determine if this should be a break and what type
      let isBreak = false;
      let breakType = null;
      let breakDuration = 0;
      
      if (lessonCount > 0) {
        // Check for tea breaks (support multiple)
        if (config.teaBreakAfterLessons && config.teaBreakAfterLessons.includes(lessonCount) && !teaBreaksUsed.includes(lessonCount)) {
          isBreak = true;
          breakType = 'tea';
          breakDuration = config.teaBreakLength;
          teaBreaksUsed.push(lessonCount);
        }
        // Check for lunch break (only once)
        else if (lessonCount === config.lunchBreakAfterLessons && !lunchBreakUsed) {
          isBreak = true;
          breakType = 'lunch';
          breakDuration = config.lunchBreakLength;
          lunchBreakUsed = true;
        }
      }
      
      // Create the slot
      slots.push({
        id: `${timeString}-${lessonCount}`,
        time: timeString,
        isBreak,
        breakType,
        duration: isBreak ? breakDuration : config.lessonLength,
        lessonNumber: isBreak ? null : lessonCount + 1
      });
      
      // Move to next time slot
      currentTime += isBreak ? breakDuration : config.lessonLength;
      if (!isBreak) lessonCount++;
      
      // Stop if we've reached the end time
      if (currentTime >= endTime) break;
    }
    
    console.log('Generated time slots:', slots.map(s => ({ 
      time: s.time, 
      isBreak: s.isBreak, 
      breakType: s.breakType, 
      duration: s.duration,
      lessonNumber: s.lessonNumber 
    })));
    return slots;
  }, [config]);

  // Load initial data and restore selections from localStorage
  useEffect(() => {
    // Restore selections from localStorage
    const savedClass = localStorage.getItem('timeTables_selectedClass');
    const savedTerm = localStorage.getItem('timeTables_selectedTerm');
    const savedGrade = localStorage.getItem('timeTables_selectedGrade');
    
    if (savedClass) {
      try {
        const parsedClass = JSON.parse(savedClass);
        setSelectedClass(parsedClass);
      } catch (error) {
        console.error('Error parsing saved class:', error);
        localStorage.removeItem('timeTables_selectedClass');
      }
    }
    
    if (savedTerm) {
      setSelectedTerm(savedTerm);
    }
    
    if (savedGrade) {
      setSelectedGrade(savedGrade);
    }
    
    // Load school info
    const schoolInfo = Data.schools.getSelected();
    setSchoolInfo(schoolInfo);
  }, []);

  // Set up subscriptions like results management
  useEffect(() => {
    // Subscribe to data changes
    const unsubClasses = Data.classes.subscribe(({ classes }) => setClasses(classes || []));
    const unsubTerms = Data.terms?.subscribe(({ terms }) => setTerms(terms || []));
    const unsubGrades = Data.grades?.subscribe(({ grades }) => setGrades(grades || []));
    const unsubSubjects = Data.subjects?.subscribe(({ subjects }) => setSubjects(subjects || []));
    const unsubTeachers = Data.teachers?.subscribe(({ teachers }) => setTeachers(teachers || []));
    const unsubStudents = Data.students?.subscribe(({ students }) => setStudents(students || []));
    const unsubSchools = Data.schools?.subscribe(({ selectedSchool }) => {
      setSchoolInfo(selectedSchool);
    });

    // Check for defaults as data arrives
    const checkAutoSelect = setInterval(() => {
      if (classes.length > 0 && terms.length > 0) {
        autoSelectDefaults(classes, terms, grades);
        clearInterval(checkAutoSelect);
      }
    }, 500);

    // Cleanup
    return () => {
      if (unsubClasses) unsubClasses();
      if (unsubTerms) unsubTerms();
      if (unsubGrades) unsubGrades();
      if (unsubSubjects) unsubSubjects();
      if (unsubTeachers) unsubTeachers();
      if (unsubStudents) unsubStudents();
      if (unsubSchools) unsubSchools();
      clearInterval(checkAutoSelect);
    };
  }, [classes, terms, grades]);

  const getAvailableData = () => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = localStorage.getItem("userRole");
    // Check for enhanced user data (parents with teacher details)
    const enhancedUser = JSON.parse(localStorage.getItem("enhancedUser")) || userData;
    // Treat all parents as teachers in admin interface
    const isTeacher = userRole === 'teacher' || userData?.userType === 'teacher' || userData?.role === 'teacher' || userRole === 'parent' || userData?.userType === 'parent' || userData?.role === 'parent';
    const teacherId = enhancedUser?.teacherDetails?.id || userData?.id;

    let availableSubjects = subjects || [];
    let availableGrades = grades || [];
    let availableClasses = classes || [];

    if (isTeacher && teacherId) {
        // Teacher can only see their assigned subjects
        availableSubjects = availableSubjects.filter(s => s.teacher === teacherId || s.teacher?.id === teacherId);
        
        // Grades containing those subjects
        const teacherGradeIds = [...new Set(availableSubjects.map(s => s.grade?.id || s.grade))].map(String);
        availableGrades = availableGrades.filter(g => teacherGradeIds.includes(String(g.id)));

        // Classes belonging to those grades OR where teacher is class teacher
        availableClasses = availableClasses.filter(c => {
            const gradeMatch = teacherGradeIds.includes(String(c.grade?.id || c.grade));
            const teacherMatch = (c.teacher?.id || c.teacher) === teacherId;
            return gradeMatch || teacherMatch;
        });
    }

    return { availableSubjects, availableGrades, availableClasses, terms };
  };

  const autoSelectDefaults = (classesData, termsData, gradesData) => {
    const { availableClasses, availableGrades } = getAvailableData();
    let shouldUpdate = false;
    let updates = {};

    // Auto-select first class if none selected
    if (!selectedClass && availableClasses?.length > 0) {
      const firstClass = availableClasses[0];
      updates.selectedClass = firstClass;
      localStorage.setItem('timeTables_selectedClass', JSON.stringify(firstClass));
      shouldUpdate = true;
    }

    // Auto-select first term if none selected
    if (!selectedTerm && termsData?.length > 0) {
      updates.selectedTerm = String(termsData[0].id);
      localStorage.setItem('timeTables_selectedTerm', updates.selectedTerm);
      shouldUpdate = true;
    }

    // Auto-select grade based on selected class
    if (!selectedGrade && availableGrades?.length > 0) {
      const classToUse = updates.selectedClass || selectedClass;
      if (classToUse) {
        const currentClass = availableClasses.find(c => c.id === classToUse.id);
        const gradeId = currentClass?.grade?.id || currentClass?.grade;
        if (gradeId) {
          updates.selectedGrade = String(gradeId);
          localStorage.setItem('timeTables_selectedGrade', updates.selectedGrade);
          shouldUpdate = true;
        }
      }
      
      // Fallback to first grade
      if (!updates.selectedGrade && availableGrades.length > 0) {
        updates.selectedGrade = String(availableGrades[0].id);
        localStorage.setItem('timeTables_selectedGrade', updates.selectedGrade);
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      if (updates.selectedClass) setSelectedClass(updates.selectedClass);
      if (updates.selectedTerm) setSelectedTerm(updates.selectedTerm);
      if (updates.selectedGrade) setSelectedGrade(updates.selectedGrade);
    }
  };

  // Load time table data when class changes
  useEffect(() => {
    if (selectedClass) {
      loadTimeTableData();
    }
  }, [selectedClass]);

  const loadTimeTableData = async () => {
    if (!selectedClass) return;
    
    try {
      console.log('Loading time table data for class:', selectedClass.id, selectedClass.name);
      setLoading(true);
      setError(null);
      
      const timeTableResponse = await Data.timeTables.getByClass(selectedClass.id);
      console.log('Time table data loaded:', {
        classId: selectedClass.id,
        className: selectedClass.name,
        dataKeys: Object.keys(timeTableResponse || {}).length,
        sampleData: Object.entries(timeTableResponse || {}).slice(0, 2)
      });
      
      setTimeTableData(timeTableResponse || {});
      
      // Validate that data structure is correct
      if (timeTableResponse && Object.keys(timeTableResponse).length > 0) {
        const firstKey = Object.keys(timeTableResponse)[0];
        const firstEntry = timeTableResponse[firstKey];
        console.log('Sample entry validation:', {
          key: firstKey,
          hasSubject: !!firstEntry.subject,
          hasTeacher: !!firstEntry.teacher,
          subjectName: firstEntry.subject?.name,
          teacherName: firstEntry.teacher?.name
        });
      }
      
    } catch (error) {
      console.error('Error loading time table data:', error);
      setError(`Failed to load time table data: ${error.message || 'Unknown error'}`);
      setTimeTableData({});
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleClassChange = useCallback((classId) => {
    const { availableClasses, availableGrades } = getAvailableData();
    const classData = availableClasses.find(c => String(c.id) === String(classId));
    setSelectedClass(classData || null);
    if (classData) {
      localStorage.setItem('timeTables_selectedClass', JSON.stringify(classData));
      
      // Auto-select grade based on class
      const gradeId = classData?.grade?.id || classData?.grade;
      if (gradeId) {
        setSelectedGrade(String(gradeId));
        localStorage.setItem('timeTables_selectedGrade', String(gradeId));
      }
    } else {
      localStorage.removeItem('timeTables_selectedClass');
    }
  }, [getAvailableData]);

  // Handle term selection
  const handleTermChange = useCallback((termId) => {
    setSelectedTerm(termId);
    localStorage.setItem('timeTables_selectedTerm', termId);
  }, []);

  // Handle grade selection
  const handleGradeChange = useCallback((gradeId) => {
    setSelectedGrade(gradeId);
    localStorage.setItem('timeTables_selectedGrade', gradeId);
  }, []);

  // Handle slot click
  const handleSlotClick = useCallback((day, timeSlot) => {
    if (timeSlot.isBreak) return;
    
    setAllocationModal({
      isOpen: true,
      slot: timeSlot,
      day,
      time: timeSlot.time
    });
  }, []);

  // Handle allocation
  const handleAllocation = useCallback(async (allocationData) => {
    try {
      const key = `${allocationModal.day}-${allocationModal.time}`;
      const newTimeTableData = { ...timeTableData };
      
      if (allocationData.subject && allocationData.teacher) {
        newTimeTableData[key] = {
          subject: allocationData.subject,
          teacher: allocationData.teacher,
          class: selectedClass,
          day: allocationModal.day,
          time: allocationModal.time
        };
      } else {
        delete newTimeTableData[key];
      }
      
      // Save to backend
      await Data.timeTables.save(selectedClass.id, newTimeTableData);
      setTimeTableData(newTimeTableData);
      
      setAllocationModal({ isOpen: false, slot: null, day: null, time: null });
    } catch (error) {
      console.error('Error saving allocation:', error);
    }
  }, [allocationModal, selectedClass, timeTableData]);

  // Check for teacher conflicts
  const checkTeacherConflict = useCallback((teacher, day, time, excludeCurrentSlot = false) => {
    const checkKey = `${day}-${time}`;
    
    return Object.entries(timeTableData).some(([key, allocation]) => {
      if (excludeCurrentSlot && key === checkKey) return false;
      return allocation.teacher?.id === teacher?.id && allocation.day === day && allocation.time === time;
    });
  }, [timeTableData]);

  // Get all allocations for a specific teacher
  const getTeacherAllocations = useCallback((teacher) => {
    return Object.entries(timeTableData)
      .filter(([_, allocation]) => allocation.teacher?.id === teacher?.id)
      .map(([key, allocation]) => ({ key, ...allocation }));
  }, [timeTableData]);

  // Load all time tables data for print all functionality
  const loadAllTimeTablesData = useCallback(async () => {
    if (!classes.length) return;
    
    try {
      const allData = {};
      for (const classItem of classes) {
        const classTimeTable = await Data.timeTables.getByClass(classItem.id);
        allData[classItem.id] = classTimeTable || {};
      }
      setAllTimeTablesData(allData);
    } catch (error) {
      console.error('Error loading all time tables data:', error);
    }
  }, [classes]);

  // Toggle print view
  const togglePrintView = useCallback(() => {
    if (!showPrintView) {
      loadAllTimeTablesData();
    }
    setShowPrintView(prev => !prev);
  }, [showPrintView, loadAllTimeTablesData]);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const generatePrintContent = () => {
    const days = config.workingDays;
    const subjectColors = {
      'Mathematics': '#4F46E5',
      'English': '#059669',
      'Science': '#DC2626',
      'History': '#EA580C',
      'Geography': '#0891B2',
      'Art': '#7C3AED',
      'Physical Education': '#16A34A',
      'Music': '#DB2777',
      'Computer Science': '#6B7280'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Time Table - ${selectedClass?.name || 'Class'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 30px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .break-cell { background-color: #FEF3C7; color: #666; }
          .subject-cell { padding: 4px; font-size: 12px; }
          .teacher-name { font-size: 10px; color: #666; margin-top: 2px; }
        </style>
      </head>
      <body>
        <h1>Time Table - ${selectedClass?.name || 'Class'}</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              ${days.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(slot => `
              <tr>
                <td><strong>${slot.time}</strong></td>
                ${days.map(day => {
                  const key = `${day}-${slot.time}`;
                  const allocation = timeTableData[key];
                  if (slot.isBreak) {
                    return '<td class="break-cell">BREAK</td>';
                  }
                  if (allocation) {
                    const color = subjectColors[allocation.subject?.name] || '#3699ff';
                    return `
                      <td class="subject-cell" style="background-color: ${color}20; border-left: 3px solid ${color};">
                        <div style="font-weight: bold;">${allocation.subject?.name || ''}</div>
                        <div class="teacher-name">${allocation.teacher?.name || ''}</div>
                      </td>
                    `;
                  }
                  return '<td></td>';
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  // Handle print all
  const handlePrintAll = useCallback(() => {
    setShowPrintView(true);
  }, []);

  // Handle print single class
  const handlePrintSingle = useCallback(() => {
    setShowPrintView(true);
  }, []);

  if (showPrintView) {
    return (
      <div className="p-10 min-h-100vh" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="d-print-none p-4 border-bottom mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm">
          <button className="btn btn-secondary font-weight-bold" onClick={togglePrintView}>
            <i className="fa fa-arrow-left"></i> Back to Time Tables
          </button>
          <div>
            <h4 className="m-0 font-weight-bold">Time Table Preview</h4>
          </div>
          <div>
            <button className="btn btn-primary font-weight-bold" onClick={handlePrint}>
              <i className="fa fa-print mr-2"></i> Print Time Tables
            </button>
          </div>
        </div>
        <div id="print-area">
          <TimeTablePrintReview
            classes={classes}
            selectedClass={selectedClass}
            selectedTerm={terms.find(t => t.id === selectedTerm)}
            timeTableData={selectedClass ? { [selectedClass.id]: timeTableData } : allTimeTablesData}
            config={config}
            timeSlots={timeSlots}
            subjects={subjects}
            teachers={teachers}
            school={schoolInfo}
            printAll={!selectedClass}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="time-tables-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-6">
        <div>
          <h2 className="font-weight-boldest text-dark mb-2">Time Tables</h2>
          <p className="text-muted">Manage class schedules and teacher allocations</p>
        </div>
        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
          {/* View Mode Toggle */}
          <div className="btn-group" role="group">
            <button 
              type="button"
              className={`btn btn-sm ${viewMode === 'vertical' ? 'btn-primary' : 'btn-light-primary'}`}
              onClick={() => setViewMode('vertical')}
              title="Vertical View"
            >
              <i className="flaticon2-calendar"></i>
            </button>
            <button 
              type="button"
              className={`btn btn-sm ${viewMode === 'horizontal' ? 'btn-primary' : 'btn-light-primary'}`}
              onClick={() => setViewMode('horizontal')}
              title="Horizontal View"
            >
              <i className="flaticon2-calendar-1"></i>
            </button>
          </div>
          <button 
            className="btn btn-light-primary btn-sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <i className="flaticon2-settings mr-2"></i>
            Settings
          </button>
          <button 
            className="btn btn-success btn-sm"
            onClick={handlePrintAll}
            disabled={!classes.length}
          >
            <i className="flaticon2-printer mr-2"></i>
            Print All
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handlePrintSingle}
            disabled={!selectedClass}
          >
            <i className="flaticon2-printer mr-2"></i>
            Print
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-6" style={{ borderRadius: '4px' }}>
          <i className="flaticon2-warning-sign mr-3" style={{ fontSize: '24px' }}></i>
          <div className="flex-grow-1">
            <div className="font-weight-bold text-dark">Error</div>
            <div className="text-muted font-size-sm mt-1">{error}</div>
          </div>
          <button 
            className="btn btn-light-danger btn-sm"
            onClick={() => setError(null)}
          >
            <i className="flaticon2-cross"></i>
          </button>
        </div>
      )}

      {/* Class, Term, and Grade Selection */}
      <div className="card card-custom mb-6" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
        <div className="card-body p-5">
          <div className="d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '20px' }}>
            {(() => {
              const { availableClasses, availableGrades } = getAvailableData();

              return (
                <>
                  {/* Grade Selection */}
                  <div className="dropdown dropdown-inline d-flex align-items-center" style={{ minWidth: '200px' }}>
                    <select 
                      className="form-control form-control-sm form-control-solid" 
                      value={selectedGrade || ''} 
                      onChange={e => {
                        handleGradeChange(e.target.value);
                      }}
                    >
                      <option value="">Grade...</option>
                      {availableGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <div className="ml-1 d-flex">
                      <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/learning"} title="Configure Grades">
                        <i className="fa fa-cog font-size-xs"></i>
                      </button>
                      <button className="btn btn-xs btn-icon btn-light-success" onClick={() => window.location.hash = "#/grades/add"} title="Add Grade">
                        <i className="fa fa-plus font-size-xs"></i>
                      </button>
                    </div>
                  </div>

                  {/* Class Selection */}
                  <div className="dropdown dropdown-inline d-flex align-items-center" style={{ minWidth: '200px' }}>
                    <select 
                      className="form-control form-control-sm form-control-solid" 
                      value={selectedClass?.id || ''} 
                      onChange={e => handleClassChange(e.target.value)}
                    >
                      <option value="">Class...</option>
                      {availableClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({(c.students && c.students.length) || 0} Students)
                        </option>
                      ))}
                    </select>
                    <div className="ml-1 d-flex">
                      <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/classes"} title="Configure Classes">
                        <i className="fa fa-cog font-size-xs"></i>
                      </button>
                      <button className="btn btn-xs btn-icon btn-light-success" onClick={() => window.location.hash = "#/classes/add"} title="Add Class">
                        <i className="fa fa-plus font-size-xs"></i>
                      </button>
                    </div>
                  </div>

                  {/* Term Selection */}
                  <div className="dropdown dropdown-inline d-flex align-items-center" style={{ minWidth: '200px' }}>
                    <select 
                      className="form-control form-control-sm form-control-solid" 
                      value={selectedTerm || ''} 
                      onChange={e => {
                        handleTermChange(e.target.value);
                      }}
                    >
                      <option value="">Term...</option>
                      {terms?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="ml-1 d-flex">
                      <button className="btn btn-xs btn-icon btn-light-primary mr-1" onClick={() => window.location.hash = "#/terms"} title="Configure Terms">
                        <i className="fa fa-cog font-size-xs"></i>
                      </button>
                      <button className="btn btn-xs btn-icon btn-light-success" onClick={() => window.location.hash = "#/terms/add"} title="Add Term">
                        <i className="fa fa-plus font-size-xs"></i>
                      </button>
                    </div>
                  </div>

                  {/* Current Selection Display */}
                  
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg" style={{ maxHeight: '90vh' }}>
            <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h5 className="modal-title">Time Table Settings</h5>
                <button type="button" className="close" onClick={() => setShowConfig(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                maxHeight: 'calc(90vh - 120px)',
                padding: '20px'
              }}>
                <TimeTableConfig 
                  config={config}
                  onConfigChange={setConfig}
                  onClose={() => setShowConfig(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Table Grid */}
      <TimeTableGrid
        config={config}
        timeSlots={timeSlots}
        timeTableData={timeTableData}
        subjects={subjects}
        teachers={teachers}
        selectedClass={selectedClass}
        onSlotClick={handleSlotClick}
        checkTeacherConflict={checkTeacherConflict}
        getTeacherAllocations={getTeacherAllocations}
        loading={loading}
        viewMode={viewMode}
      />

      {/* Allocation Modal */}
      {allocationModal.isOpen && (
        <AllocationModal
          isOpen={allocationModal.isOpen}
          slot={allocationModal.slot}
          day={allocationModal.day}
          time={allocationModal.time}
          subjects={subjects}
          teachers={teachers}
          currentAllocation={timeTableData[`${allocationModal.day}-${allocationModal.time}`]}
          onAllocation={handleAllocation}
          onClose={() => setAllocationModal({ isOpen: false, slot: null, day: null, time: null })}
          checkTeacherConflict={checkTeacherConflict}
          getTeacherAllocations={getTeacherAllocations}
        />
      )}
    </div>
  );
};

export default TimeTableMatrix;
