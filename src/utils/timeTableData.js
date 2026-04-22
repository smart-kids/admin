// Mock data utilities for Time Tables feature
// In a real implementation, these would make API calls to your backend

const timeTableData = {
  // Mock classes data
  classes: [
    { id: '1', name: 'Class 1A', grade: '1', stream: 'A' },
    { id: '2', name: 'Class 1B', grade: '1', stream: 'B' },
    { id: '3', name: 'Class 2A', grade: '2', stream: 'A' },
    { id: '4', name: 'Class 2B', grade: '2', stream: 'B' },
    { id: '5', name: 'Class 3A', grade: '3', stream: 'A' },
    { id: '6', name: 'Class 3B', grade: '3', stream: 'B' },
    { id: '7', name: 'Class 4A', grade: '4', stream: 'A' },
    { id: '8', name: 'Class 4B', grade: '4', stream: 'B' },
  ],

  // Mock subjects data
  subjects: [
    { id: '1', name: 'Mathematics', code: 'MATH' },
    { id: '2', name: 'English', code: 'ENG' },
    { id: '3', name: 'Science', code: 'SCI' },
    { id: '4', name: 'History', code: 'HIST' },
    { id: '5', name: 'Geography', code: 'GEOG' },
    { id: '6', name: 'Art', code: 'ART' },
    { id: '7', name: 'Physical Education', code: 'PE' },
    { id: '8', name: 'Music', code: 'MUSIC' },
    { id: '9', name: 'Computer Science', code: 'CS' },
    { id: '10', name: 'Physics', code: 'PHY' },
    { id: '11', name: 'Chemistry', code: 'CHEM' },
    { id: '12', name: 'Biology', code: 'BIO' },
    { id: '13', name: 'Economics', code: 'ECON' },
    { id: '14', name: 'Literature', code: 'LIT' },
    { id: '15', name: 'Religious Studies', code: 'RE' },
  ],

  // Mock teachers data
  teachers: [
    { 
      id: '1', 
      name: 'Mr. John Smith', 
      email: 'john.smith@school.edu',
      subjects: [
        { id: '1', name: 'Mathematics' },
        { id: '10', name: 'Physics' }
      ]
    },
    { 
      id: '2', 
      name: 'Ms. Sarah Johnson', 
      email: 'sarah.johnson@school.edu',
      subjects: [
        { id: '2', name: 'English' },
        { id: '14', name: 'Literature' }
      ]
    },
    { 
      id: '3', 
      name: 'Dr. Michael Brown', 
      email: 'michael.brown@school.edu',
      subjects: [
        { id: '3', name: 'Science' },
        { id: '10', name: 'Physics' },
        { id: '11', name: 'Chemistry' }
      ]
    },
    { 
      id: '4', 
      name: 'Mrs. Emily Davis', 
      email: 'emily.davis@school.edu',
      subjects: [
        { id: '4', name: 'History' },
        { id: '5', name: 'Geography' }
      ]
    },
    { 
      id: '5', 
      name: 'Mr. James Wilson', 
      email: 'james.wilson@school.edu',
      subjects: [
        { id: '6', name: 'Art' },
        { id: '8', name: 'Music' }
      ]
    },
    { 
      id: '6', 
      name: 'Ms. Lisa Anderson', 
      email: 'lisa.anderson@school.edu',
      subjects: [
        { id: '7', name: 'Physical Education' }
      ]
    },
    { 
      id: '7', 
      name: 'Mr. Robert Taylor', 
      email: 'robert.taylor@school.edu',
      subjects: [
        { id: '9', name: 'Computer Science' },
        { id: '1', name: 'Mathematics' }
      ]
    },
    { 
      id: '8', 
      name: 'Mrs. Maria Garcia', 
      email: 'maria.garcia@school.edu',
      subjects: [
        { id: '12', name: 'Biology' },
        { id: '3', name: 'Science' }
      ]
    },
    { 
      id: '9', 
      name: 'Mr. David Martinez', 
      email: 'david.martinez@school.edu',
      subjects: [
        { id: '13', name: 'Economics' },
        { id: '4', name: 'History' }
      ]
    },
    { 
      id: '10', 
      name: 'Mrs. Jennifer Lee', 
      email: 'jennifer.lee@school.edu',
      subjects: [
        { id: '15', name: 'Religious Studies' },
        { id: '2', name: 'English' }
      ]
    },
  ],

  // Mock time table data
  timeTables: {
    '1': { // Class 1A
      'Monday-08:00': {
        subject: { id: '1', name: 'Mathematics' },
        teacher: { id: '1', name: 'Mr. John Smith' },
        class: { id: '1', name: 'Class 1A' },
        day: 'Monday',
        time: '08:00'
      },
      'Monday-08:45': {
        subject: { id: '1', name: 'Mathematics' },
        teacher: { id: '1', name: 'Mr. John Smith' },
        class: { id: '1', name: 'Class 1A' },
        day: 'Monday',
        time: '08:45'
      },
      'Monday-09:45': {
        subject: { id: '2', name: 'English' },
        teacher: { id: '2', name: 'Ms. Sarah Johnson' },
        class: { id: '1', name: 'Class 1A' },
        day: 'Monday',
        time: '09:45'
      },
      'Monday-10:30': {
        subject: { id: '2', name: 'English' },
        teacher: { id: '2', name: 'Ms. Sarah Johnson' },
        class: { id: '1', name: 'Class 1A' },
        day: 'Monday',
        time: '10:30'
      },
    }
  }
};

// API simulation functions
const TimeTableAPI = {
  // Get all classes
  getAllClasses: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return timeTableData.classes;
  },

  // Get all subjects
  getAllSubjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return timeTableData.subjects;
  },

  // Get all teachers
  getAllTeachers: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return timeTableData.teachers;
  },

  // Get time table for a specific class
  getTimeTableByClass: async (classId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return timeTableData.timeTables[classId] || {};
  },

  // Save time table for a class
  saveTimeTable: async (classId, timeTableData) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    timeTableData.timeTables[classId] = timeTableData;
    return { success: true, message: 'Time table saved successfully' };
  },

  // Get teacher availability
  getTeacherAvailability: async (teacherId, day, time) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check if teacher is already allocated at this time
    for (const classTimeTable of Object.values(timeTableData.timeTables)) {
      const key = `${day}-${time}`;
      if (classTimeTable[key] && classTimeTable[key].teacher.id === teacherId) {
        return { 
          available: false, 
          conflict: classTimeTable[key] 
        };
      }
    }
    
    return { available: true };
  },

  // Get all allocations for a teacher
  getTeacherAllocations: async (teacherId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const allocations = [];
    for (const [classId, classTimeTable] of Object.entries(timeTableData.timeTables)) {
      for (const [key, allocation] of Object.entries(classTimeTable)) {
        if (allocation.teacher.id === teacherId) {
          allocations.push({
            key,
            class: allocation.class,
            subject: allocation.subject,
            teacher: allocation.teacher,
            day: allocation.day,
            time: allocation.time
          });
        }
      }
    }
    
    return allocations;
  }
};

// Export the API
export default TimeTableAPI;
