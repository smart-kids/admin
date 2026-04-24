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
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ 
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1050,
      padding: '20px'
    }}>
      <div className="modal-dialog modal-xl" role="document" style={{ 
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        maxHeight: '85vh',
        position: 'relative',
        flex: '0 0 auto'
      }}>
        <div className="modal-content" style={{ 
          height: 'auto',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="modal-header" style={{
            backgroundColor: '#f8f9fa',
            color: '#212529',
            borderRadius: '8px 8px 0 0',
            padding: '16px 20px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <div className="d-flex align-items-center justify-content-between w-100">
              <div>
                <h5 className="modal-title mb-1" style={{ fontWeight: '600', fontSize: '16px', margin: 0 }}>
                  Allocate Lesson
                </h5>
                <div className="d-flex align-items-center">
                  <span className="mr-3" style={{ fontSize: '13px', color: '#6c757d' }}>
                    {day}
                  </span>
                  <span className="mr-3" style={{ fontSize: '13px', color: '#6c757d' }}>
                    {time}
                  </span>
                  {slot && (
                    <span style={{ fontSize: '13px', color: '#6c757d' }}>
                      {slot.duration} min
                    </span>
                  )}
                </div>
              </div>
              <button 
                type="button" 
                className="close" 
                onClick={onClose}
                style={{
                  color: '#6c757d',
                  fontSize: '20px',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
          
          <div className="modal-body" style={{ 
            padding: '24px',
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#f8f9fc'
          }}>
            <div className="row" style={{ margin: 0 }}>
              {/* Subject Selection */}
              <div className="col-md-6" style={{ paddingLeft: 0, paddingRight: '12px' }}>
                <div className="card shadow-sm" style={{ borderRadius: '8px', border: 'none', height: '100%' }}>
                  <div className="card-header" style={{
                    backgroundColor: '#f8f9fa',
                    color: '#212529',
                    borderRadius: '8px 8px 0 0',
                    padding: '12px 16px',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <label className="mb-0" style={{ fontWeight: '600', fontSize: '14px', color: '#212529' }}>
                        Subject Selection <span className="text-danger">*</span>
                      </label>
                      <span className="badge badge-light" style={{ fontSize: '11px' }}>
                        {filteredSubjects.length} available
                      </span>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="p-3 border-bottom" style={{ backgroundColor: '#ffffff' }}>
                      <div className="input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text" style={{ backgroundColor: '#f8f9fc', border: '1px solid #e9ecef' }}>
                            <i className="flaticon2-search-1 text-muted"></i>
                          </span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Quick search subjects..."
                          value={searchSubject}
                          onChange={(e) => setSearchSubject(e.target.value)}
                          style={{ borderLeft: 'none' }}
                        />
                        {searchSubject && (
                          <div className="input-group-append">
                            <button 
                              className="btn btn-outline-secondary" 
                              type="button"
                              onClick={() => setSearchSubject('')}
                              style={{ borderLeft: 'none' }}
                            >
                              <i className="fas fa-times text-muted"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="overflow-auto" style={{ 
                      maxHeight: '300px', 
                      backgroundColor: '#ffffff'
                    }}>
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map(subject => (
                          <div
                            key={subject.id}
                            className={`p-3 border-bottom cursor-pointer allocation-option transition-all ${
                              selectedSubject?.id === subject.id ? 'selected-option' : ''
                            }`}
                            onClick={() => setSelectedSubject(subject)}
                            style={{
                              backgroundColor: selectedSubject?.id === subject.id ? '#e3f2fd' : 'transparent',
                              borderLeft: selectedSubject?.id === subject.id ? '4px solid #2196f3' : '4px solid transparent',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              if (selectedSubject?.id !== subject.id) {
                                e.target.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (selectedSubject?.id !== subject.id) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                                {subject.name}
                              </div>
                              {selectedSubject?.id === subject.id && (
                                <i className="fas fa-check-circle text-success"></i>
                              )}
                            </div>
                            {subject.code && (
                              <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                                Code: {subject.code}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-muted">
                          <i className="fas fa-search fa-2x mb-2" style={{ opacity: 0.3 }}></i>
                          <div style={{ fontSize: '13px' }}>No subjects found matching "{searchSubject}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Selection */}
              <div className="col-md-6" style={{ paddingLeft: '12px', paddingRight: 0 }}>
                <div className="card shadow-sm" style={{ borderRadius: '8px', border: 'none', height: '100%' }}>
                  <div className="card-header" style={{
                    backgroundColor: '#f8f9fa',
                    color: '#212529',
                    borderRadius: '8px 8px 0 0',
                    padding: '12px 16px',
                    borderBottom: '1px solid #dee2e6'
                  }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <label className="mb-0" style={{ fontWeight: '600', fontSize: '14px', color: '#212529' }}>
                        Teacher Selection <span className="text-danger">*</span>
                      </label>
                      <span className="badge badge-light" style={{ fontSize: '11px' }}>
                        {filteredTeachers.length} available
                      </span>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="p-3 border-bottom" style={{ backgroundColor: '#ffffff' }}>
                      <div className="input-group input-group-sm">
                        <div className="input-group-prepend">
                          <span className="input-group-text" style={{ backgroundColor: '#f8f9fc', border: '1px solid #e9ecef' }}>
                            <i className="flaticon2-search-1 text-muted"></i>
                          </span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Quick search teachers..."
                          value={searchTeacher}
                          onChange={(e) => setSearchTeacher(e.target.value)}
                          disabled={!selectedSubject}
                          style={{ borderLeft: 'none' }}
                        />
                        {searchTeacher && (
                          <div className="input-group-append">
                            <button 
                              className="btn btn-outline-secondary" 
                              type="button"
                              onClick={() => setSearchTeacher('')}
                              style={{ borderLeft: 'none' }}
                              disabled={!selectedSubject}
                            >
                              <i className="fas fa-times text-muted"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      {!selectedSubject && (
                        <div className="text-muted mt-2" style={{ fontSize: '12px' }}>
                          <i className="fas fa-info-circle mr-1"></i>
                          Select a subject first to filter compatible teachers
                        </div>
                      )}
                    </div>
                    <div className="overflow-auto" style={{ 
                      maxHeight: '300px', 
                      backgroundColor: '#ffffff'
                    }}>
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map(teacher => (
                          <div
                            key={teacher.id}
                            className={`p-3 border-bottom cursor-pointer allocation-option transition-all ${
                              selectedTeacher?.id === teacher.id ? 'selected-option' : ''
                            } ${hasConflict && selectedTeacher?.id === teacher.id ? 'conflict-option' : ''}`}
                            onClick={() => setSelectedTeacher(teacher)}
                            style={{
                              backgroundColor: selectedTeacher?.id === teacher.id ? '#e3f2fd' : 'transparent',
                              borderLeft: selectedTeacher?.id === teacher.id ? '4px solid #2196f3' : '4px solid transparent',
                              opacity: hasConflict && selectedTeacher?.id === teacher.id ? 0.6 : 1,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              if (selectedTeacher?.id !== teacher.id) {
                                e.target.style.backgroundColor = '#f5f5f5';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (selectedTeacher?.id !== teacher.id) {
                                e.target.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                                {teacher.name}
                              </div>
                              <div className="d-flex align-items-center">
                                {hasConflict && selectedTeacher?.id === teacher.id && (
                                  <i className="fas fa-exclamation-triangle text-warning mr-2" title="Has conflict"></i>
                                )}
                                {selectedTeacher?.id === teacher.id && (
                                  <i className="fas fa-check-circle text-success"></i>
                                )}
                              </div>
                            </div>
                            {teacher.email && (
                              <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                                {teacher.email}
                              </div>
                            )}
                            {teacher.subjects && teacher.subjects.length > 0 && (
                              <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                                {teacher.subjects.slice(0, 3).map(s => s.name).join(', ')}
                                {teacher.subjects.length > 3 && ` +${teacher.subjects.length - 3} more`}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-4 text-muted">
                          <i className="fas fa-search fa-2x mb-2" style={{ opacity: 0.3 }}></i>
                          <div style={{ fontSize: '13px' }}>
                            {!selectedSubject ? 'Select a subject first' : `No teachers found matching "${searchTeacher}"`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Warning */}
            {hasConflict && (
              <div className="alert alert-warning d-flex align-items-center p-3 mb-4" style={{ 
                borderRadius: '8px', 
                border: 'none',
                backgroundColor: '#fff3cd',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div className="mr-3">
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '20px', color: '#856404' }}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="font-weight-bold" style={{ color: '#856404', fontSize: '14px' }}>
                    Teacher Schedule Conflict
                  </div>
                  <div className="mt-1" style={{ fontSize: '13px', color: '#856404' }}>
                    {selectedTeacher?.name} is already teaching at this time:
                  </div>
                  <div className="mt-2">
                    {teacherConflicts.map((conflict, index) => (
                      <div key={index} className="d-inline-block mr-2 mb-2">
                        <span className="badge badge-warning" style={{ fontSize: '11px', padding: '4px 8px' }}>
                          {conflict.class?.name || 'Unknown Class'}
                        </span>
                        <span className="text-muted ml-1" style={{ fontSize: '12px' }}>
                          {conflict.subject?.name} ({conflict.day} {conflict.time})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Allocation Info */}
            {currentAllocation && (
              <div className="card shadow-sm mb-4" style={{ borderRadius: '8px', border: 'none' }}>
                <div className="card-body p-3" style={{ backgroundColor: '#e8f5e8' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="font-weight-bold text-dark mb-1" style={{ fontSize: '13px' }}>
                        Current Allocation
                      </div>
                      <div className="d-flex align-items-center flex-wrap">
                        <span className="badge badge-success mr-2" style={{ fontSize: '12px' }}>
                          {currentAllocation.subject?.name}
                        </span>
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          with {currentAllocation.teacher?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      Click "Clear" to remove this allocation
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Schedule Preview */}
            {selectedTeacher && (
              <div className="card shadow-sm" style={{ borderRadius: '8px', border: 'none' }}>
                <div className="card-header" style={{
                  backgroundColor: '#f8f9fa',
                  color: '#212529',
                  borderRadius: '8px 8px 0 0',
                  padding: '10px 16px',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="font-weight-bold" style={{ fontSize: '13px', color: '#212529' }}>
                      {selectedTeacher.name}'s Weekly Schedule
                    </div>
                    <button 
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#e9ecef',
                        color: '#212529',
                        border: '1px solid #ced4da',
                        fontSize: '11px',
                        padding: '2px 8px'
                      }}
                      onClick={() => setShowTeacherConflicts(!showTeacherConflicts)}
                    >
                      {showTeacherConflicts ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                </div>
                
                {showTeacherConflicts && (
                  <div className="card-body p-0" style={{ backgroundColor: '#ffffff' }}>
                    {getTeacherAllocations(selectedTeacher).length > 0 ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {getTeacherAllocations(selectedTeacher).map((allocation, index) => (
                          <div key={index} className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{
                            backgroundColor: index % 2 === 0 ? '#f8f9fc' : 'white',
                            transition: 'background-color 0.2s'
                          }}>
                            <div className="d-flex align-items-center">
                              <div className="mr-3">
                                <div className="font-weight-bold" style={{ fontSize: '13px' }}>
                                  {allocation.subject?.name}
                                </div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {allocation.class?.name}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="badge badge-light" style={{ fontSize: '11px' }}>
                                {allocation.day}
                              </div>
                              <div className="text-muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                                {allocation.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted" style={{ backgroundColor: '#ffffff' }}>
                        <i className="fas fa-calendar-check fa-2x mb-2" style={{ opacity: 0.3 }}></i>
                        <div style={{ fontSize: '13px' }}>
                          No other allocations found for {selectedTeacher.name}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{
            padding: '20px 24px',
            borderTop: '1px solid #e9ecef',
            backgroundColor: '#ffffff',
            borderRadius: '0 0 12px 12px'
          }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="text-muted" style={{ fontSize: '12px' }}>
                {selectedSubject && selectedTeacher ? (
                  <span>
                    ✅ Ready to allocate: <strong>{selectedSubject.name}</strong> with <strong>{selectedTeacher.name}</strong>
                  </span>
                ) : (
                  <span>Please select both subject and teacher</span>
                )}
              </div>
              <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-light-secondary" 
                  onClick={onClose}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                {currentAllocation && (
                  <button 
                    type="button" 
                    className="btn btn-light-danger" 
                    onClick={handleClear}
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                  >
                    <i className="fas fa-trash-alt mr-2"></i>
                    Clear
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={!selectedSubject || !selectedTeacher || hasConflict}
                  style={{ 
                    fontSize: '13px', 
                    padding: '8px 16px',
                    backgroundColor: (!selectedSubject || !selectedTeacher || hasConflict) ? '#6c757d' : '#007bff',
                    borderColor: (!selectedSubject || !selectedTeacher || hasConflict) ? '#6c757d' : '#007bff'
                  }}
                >
                  <i className="fas fa-save mr-2"></i>
                  {currentAllocation ? 'Update' : 'Allocate'} Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .allocation-option:hover {
          background-color: #f5f5f5 !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .selected-option {
          background-color: #e3f2fd !important;
          border-left-color: #2196f3 !important;
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
        
        .transition-all {
          transition: all 0.2s ease;
        }
        
        /* Custom scrollbar styles */
        .overflow-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Badge styles */
        .badge {
          font-weight: 500;
          border-radius: 4px;
        }
        
        /* Input group styles */
        .input-group-text {
          border-right: none;
        }
        
        .form-control:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        /* Card hover effects */
        .card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default AllocationModal;
