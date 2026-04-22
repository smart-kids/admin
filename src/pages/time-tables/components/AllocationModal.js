import React, { useState, useEffect, useMemo } from 'react';

const AllocationModal = ({ 
  isOpen, 
  slot, 
  day, 
  time, 
  subjects, 
  teachers, 
  currentAllocation, 
  onAllocation, 
  onClose, 
  checkTeacherConflict, 
  getTeacherAllocations 
}) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchSubject, setSearchSubject] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [showTeacherConflicts, setShowTeacherConflicts] = useState(false);

  // Initialize with current allocation data
  useEffect(() => {
    if (currentAllocation) {
      setSelectedSubject(currentAllocation.subject);
      setSelectedTeacher(currentAllocation.teacher);
    } else {
      setSelectedSubject(null);
      setSelectedTeacher(null);
    }
    setSearchSubject('');
    setSearchTeacher('');
  }, [currentAllocation, isOpen]);

  // Auto-select teacher when subject changes
  useEffect(() => {
    if (selectedSubject && !currentAllocation) {
      const defaultTeacher = teachers.find(t => 
        t.subjects && t.subjects.some(s => s.id === selectedSubject.id)
      );
      if (defaultTeacher) {
        setSelectedTeacher(defaultTeacher);
      }
    }
  }, [selectedSubject, teachers, currentAllocation]);

  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchSubject) return subjects;
    return subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchSubject.toLowerCase())
    );
  }, [subjects, searchSubject]);

  // Filter teachers based on search and subject compatibility
  const filteredTeachers = useMemo(() => {
    let filtered = teachers;
    
    if (searchTeacher) {
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTeacher.toLowerCase())
      );
    }
    
    if (selectedSubject) {
      filtered = filtered.filter(teacher => 
        !teacher.subjects || teacher.subjects.some(s => s.id === selectedSubject.id)
      );
    }
    
    return filtered;
  }, [teachers, searchTeacher, selectedSubject]);

  // Check for teacher conflicts
  const teacherConflicts = useMemo(() => {
    if (!selectedTeacher) return [];
    
    const conflicts = [];
    const allocations = getTeacherAllocations(selectedTeacher);
    
    allocations.forEach(allocation => {
      if (allocation.day === day && allocation.time === time) {
        conflicts.push(allocation);
      }
    });
    
    return conflicts;
  }, [selectedTeacher, day, time, getTeacherAllocations]);

  const hasConflict = teacherConflicts.length > 0;

  const handleSave = () => {
    onAllocation({
      subject: selectedSubject,
      teacher: selectedTeacher
    });
  };

  const handleClear = () => {
    onAllocation({
      subject: null,
      teacher: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title font-weight-boldest">
              📝 Allocate Lesson - {day} {time}
              {slot && <span className="text-muted ml-2">({slot.duration} min)</span>}
            </h5>
            <button type="button" className="close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <div className="modal-body">
            <div className="row">
              {/* Subject Selection */}
              <div className="col-md-6">
                <label className="font-weight-boldest text-dark font-size-sm mb-2">
                  Subject <span className="text-danger">*</span>
                </label>
                <div className="form-group mb-4">
                  <div className="input-icon">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search subject..."
                      value={searchSubject}
                      onChange={(e) => setSearchSubject(e.target.value)}
                    />
                    <span><i className="flaticon2-search-1"></i></span>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: '200px', border: '1px solid #ebedf3', borderRadius: '4px' }}>
                    {filteredSubjects.map(subject => (
                      <div
                        key={subject.id}
                        className={`p-3 border-bottom cursor-pointer allocation-option ${
                          selectedSubject?.id === subject.id ? 'selected-option' : ''
                        }`}
                        onClick={() => setSelectedSubject(subject)}
                        style={{
                          backgroundColor: selectedSubject?.id === subject.id ? '#3699ff10' : 'transparent',
                          borderLeft: selectedSubject?.id === subject.id ? '3px solid #3699ff' : '3px solid transparent'
                        }}
                      >
                        <div className="font-weight-bold text-dark font-size-sm">{subject.name}</div>
                        {subject.code && (
                          <div className="text-muted font-size-xs">Code: {subject.code}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Teacher Selection */}
              <div className="col-md-6">
                <label className="font-weight-boldest text-dark font-size-sm mb-2">
                  Teacher <span className="text-danger">*</span>
                </label>
                <div className="form-group mb-4">
                  <div className="input-icon">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search teacher..."
                      value={searchTeacher}
                      onChange={(e) => setSearchTeacher(e.target.value)}
                      disabled={!selectedSubject}
                    />
                    <span><i className="flaticon2-search-1"></i></span>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: '200px', border: '1px solid #ebedf3', borderRadius: '4px' }}>
                    {filteredTeachers.map(teacher => (
                      <div
                        key={teacher.id}
                        className={`p-3 border-bottom cursor-pointer allocation-option ${
                          selectedTeacher?.id === teacher.id ? 'selected-option' : ''
                        } ${hasConflict && selectedTeacher?.id === teacher.id ? 'conflict-option' : ''}`}
                        onClick={() => setSelectedTeacher(teacher)}
                        style={{
                          backgroundColor: selectedTeacher?.id === teacher.id ? '#3699ff10' : 'transparent',
                          borderLeft: selectedTeacher?.id === teacher.id ? '3px solid #3699ff' : '3px solid transparent',
                          opacity: hasConflict && selectedTeacher?.id === teacher.id ? 0.7 : 1
                        }}
                      >
                        <div className="font-weight-bold text-dark font-size-sm">{teacher.name}</div>
                        <div className="text-muted font-size-xs">
                          {teacher.email && `Email: ${teacher.email}`}
                        </div>
                        {teacher.subjects && teacher.subjects.length > 0 && (
                          <div className="text-muted font-size-xs">
                            Subjects: {teacher.subjects.map(s => s.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Warning */}
            {hasConflict && (
              <div className="alert alert-warning d-flex align-items-center mb-4" style={{ borderRadius: '4px' }}>
                <i className="flaticon2-warning-sign mr-3" style={{ fontSize: '24px' }}></i>
                <div className="flex-grow-1">
                  <div className="font-weight-bold text-dark">⚠️ Teacher Conflict Detected</div>
                  <div className="text-muted font-size-sm mt-1">
                    {selectedTeacher?.name} is already allocated at this time:
                  </div>
                  <div className="mt-2">
                    {teacherConflicts.map((conflict, index) => (
                      <div key={index} className="font-size-sm">
                        <span className="label label-inline label-light-warning font-weight-bold mr-2">
                          {conflict.class?.name || 'Unknown Class'}
                        </span>
                        {conflict.subject?.name} - {conflict.day} {conflict.time}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Allocation Info */}
            {currentAllocation && (
              <div className="bg-light p-3 rounded mb-4">
                <div className="font-weight-bold text-dark font-size-sm mb-2">Current Allocation:</div>
                <div className="d-flex align-items-center">
                  <span className="label label-inline label-light-primary font-weight-bold mr-2">
                    {currentAllocation.subject?.name}
                  </span>
                  <span className="text-muted font-size-sm">
                    with {currentAllocation.teacher?.name}
                  </span>
                </div>
              </div>
            )}

            {/* Teacher Schedule Preview */}
            {selectedTeacher && (
              <div className="bg-light p-3 rounded">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="font-weight-bold text-dark font-size-sm">
                    👥 {selectedTeacher.name}'s Schedule
                  </div>
                  <button 
                    className="btn btn-xs btn-light-primary"
                    onClick={() => setShowTeacherConflicts(!showTeacherConflicts)}
                  >
                    {showTeacherConflicts ? 'Hide' : 'Show'} Details
                  </button>
                </div>
                
                {showTeacherConflicts && (
                  <div className="mt-2">
                    {getTeacherAllocations(selectedTeacher).length > 0 ? (
                      <div className="max-h-200 overflow-auto">
                        {getTeacherAllocations(selectedTeacher).map((allocation, index) => (
                          <div key={index} className="d-flex align-items-center justify-content-between p-2 border-bottom">
                            <div>
                              <span className="font-size-sm font-weight-bold">
                                {allocation.subject?.name}
                              </span>
                              <span className="text-muted font-size-xs ml-2">
                                ({allocation.class?.name})
                              </span>
                            </div>
                            <span className="text-muted font-size-xs">
                              {allocation.day} {allocation.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted font-size-xs text-center py-2">
                        No other allocations found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-light-secondary" onClick={onClose}>
              Cancel
            </button>
            {currentAllocation && (
              <button 
                type="button" 
                className="btn btn-light-danger" 
                onClick={handleClear}
              >
                <i className="flaticon2-trash mr-2"></i>
                Clear
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={!selectedSubject || !selectedTeacher || hasConflict}
            >
              <i className="flaticon2-check-mark mr-2"></i>
              {currentAllocation ? 'Update' : 'Allocate'} Lesson
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .allocation-option:hover {
          background-color: #f9fafc !important;
        }
        
        .selected-option {
          background-color: #3699ff10 !important;
        }
        
        .conflict-option {
          background-color: #fef2f2 !important;
          border-left-color: #dc2626 !important;
        }
        
        .max-h-200 {
          max-height: 200px;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .border-bottom:last-child {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  );
};

export default AllocationModal;
