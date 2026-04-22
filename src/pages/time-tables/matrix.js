import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TimeTableGrid from './components/TimeTableGrid';
import TimeTableConfig from './components/TimeTableConfig';
import AllocationModal from './components/AllocationModal';
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
  const [timeTableData, setTimeTableData] = useState({});
  const [config, setConfig] = useState({
    lessonLength: 45,
    teaBreakLength: 15,
    lunchBreakLength: 30,
    lessonsPerTeaBreak: 2,
    lessonsPerLunchBreak: 4,
    teaBreakAfterLessons: 2,
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

  // Generate time slots based on configuration
  const timeSlots = useMemo(() => {
    console.log('Generating time slots with config:', config);
    const slots = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    let lessonCount = 0;
    let teaBreakUsed = false;
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
        // Check for tea break (only once)
        if (lessonCount === config.teaBreakAfterLessons && !teaBreakUsed) {
          isBreak = true;
          breakType = 'tea';
          breakDuration = config.teaBreakLength;
          teaBreakUsed = true;
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
    
    loadData();
  }, []);

  const autoSelectDefaults = (classesData, termsData, gradesData) => {
    let shouldUpdate = false;
    let updates = {};

    // Auto-select first class if none selected
    if (!selectedClass && classesData?.length > 0) {
      const firstClass = classesData[0];
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
    if (!selectedGrade && gradesData?.length > 0) {
      const classToUse = updates.selectedClass || selectedClass;
      if (classToUse) {
        const currentClass = classesData.find(c => c.id === classToUse.id);
        const gradeId = currentClass?.grade?.id || currentClass?.grade;
        if (gradeId) {
          updates.selectedGrade = String(gradeId);
          localStorage.setItem('timeTables_selectedGrade', updates.selectedGrade);
          shouldUpdate = true;
        }
      }
      
      // Fallback to first grade
      if (!updates.selectedGrade && gradesData.length > 0) {
        updates.selectedGrade = String(gradesData[0].id);
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading Time Tables data...');
      
      // Load classes, terms, grades
      const [classesData, termsData, gradesData] = await Promise.all([
        Data.classes.getAll(),
        Data.terms.getAll(),
        Data.grades.getAll()
      ]);
      
      console.log('Classes loaded:', classesData?.length || 0);
      console.log('Terms loaded:', termsData?.length || 0);
      console.log('Grades loaded:', gradesData?.length || 0);
      
      setTerms(termsData || []);
      setGrades(gradesData || []);
      
      // Load all students once and get counts for each class
      const allStudents = await Data.students.getAll();
      const classesWithCounts = (classesData || []).map(classItem => {
        const studentCount = allStudents?.filter(student => student.class === classItem.id).length || 0;
        return {
          ...classItem,
          studentCount
        };
      });
      
      setClasses(classesWithCounts);
      
      // Auto-select defaults like Results
      autoSelectDefaults(classesWithCounts, termsData, gradesData);
      
      // Load subjects
      const subjectsData = await Data.subjects.getAll();
      console.log('Subjects loaded:', subjectsData?.length || 0);
      setSubjects(subjectsData || []);
      
      // Load teachers
      const teachersData = await Data.teachers.getAll();
      console.log('Teachers loaded:', teachersData?.length || 0);
      setTeachers(teachersData || []);
      
      console.log('Time Tables data loading completed');
    } catch (error) {
      console.error('Error loading Time Tables data:', error);
      setError('Failed to load Time Tables data. Please try again.');
    } finally {
      setLoading(false);
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
      console.log('Loading time table data for class:', selectedClass.id);
      const timeTableResponse = await Data.timeTables.getByClass(selectedClass.id);
      console.log('Time table data loaded:', Object.keys(timeTableResponse || {}).length);
      setTimeTableData(timeTableResponse || {});
    } catch (error) {
      console.error('Error loading time table data:', error);
      setError('Failed to load time table data. Please try again.');
      setTimeTableData({});
    }
  };

  // Handle class selection
  const handleClassChange = useCallback((classData) => {
    setSelectedClass(classData);
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
  }, []);

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

  // Handle print
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }, [selectedClass, timeTableData, config]);

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

  return (
    <div className="time-tables-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-6">
        <div>
          <h2 className="font-weight-boldest text-dark mb-2">Time Tables</h2>
          <p className="text-muted">Manage class schedules and teacher allocations</p>
        </div>
        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
          <button 
            className="btn btn-light-primary btn-sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            <i className="flaticon2-settings mr-2"></i>
            Settings
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
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
            {/* Grade Selection */}
            <div style={{ minWidth: '200px' }}>
              <label className="font-weight-boldest text-dark font-size-sm mb-2">Select Grade</label>
              <select 
                className="form-control form-control-solid"
                value={selectedGrade || ''}
                onChange={(e) => handleGradeChange(e.target.value)}
              >
                <option value="">Choose grade...</option>
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selection */}
            <div style={{ minWidth: '200px' }}>
              <label className="font-weight-boldest text-dark font-size-sm mb-2">Select Class</label>
              <select 
                className="form-control form-control-solid"
                value={selectedClass?.id || ''}
                onChange={(e) => {
                  const classData = classes.find(c => c.id === e.target.value);
                  handleClassChange(classData || null);
                }}
              >
                <option value="">Choose a class...</option>
                {classes
                  .filter(cls => !selectedGrade || String(cls.grade?.id || cls.grade) === selectedGrade)
                  .map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.studentCount !== undefined ? `(${cls.studentCount} students)` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Term Selection */}
            <div style={{ minWidth: '200px' }}>
              <label className="font-weight-boldest text-dark font-size-sm mb-2">Select Term</label>
              <select 
                className="form-control form-control-solid"
                value={selectedTerm || ''}
                onChange={(e) => handleTermChange(e.target.value)}
              >
                <option value="">Choose term...</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Selection Display */}
            <div className="d-flex align-items-center flex-wrap" style={{ gap: '10px' }}>
              {selectedGrade && (
                <span className="label label-inline label-light-info font-weight-bold">
                  Grade: {grades.find(g => g.id === selectedGrade)?.name || selectedGrade}
                </span>
              )}
              {selectedClass && (
                <span className="label label-inline label-light-primary font-weight-bold">
                  Class: {selectedClass.name}
                </span>
              )}
              {selectedTerm && (
                <span className="label label-inline label-light-success font-weight-bold">
                  Term: {terms.find(t => t.id === selectedTerm)?.name || selectedTerm}
                </span>
              )}
            </div>
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
