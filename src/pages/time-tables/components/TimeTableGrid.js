import React, { memo, useMemo } from 'react';

const TimeTableGrid = ({ 
  config, 
  timeSlots, 
  timeTableData, 
  subjects, 
  teachers, 
  selectedClass,
  onSlotClick, 
  checkTeacherConflict, 
  getTeacherAllocations,
  loading 
}) => {
  
  const subjectColors = useMemo(() => ({
    'Mathematics': '#4F46E5',
    'English': '#059669',
    'Science': '#DC2626',
    'History': '#EA580C',
    'Geography': '#0891B2',
    'Art': '#7C3AED',
    'Physical Education': '#16A34A',
    'Music': '#DB2777',
    'Computer Science': '#6B7280',
    'Physics': '#DC2626',
    'Chemistry': '#059669',
    'Biology': '#16A34A',
    'Economics': '#4F46E5',
    'Literature': '#EA580C',
    'Religious Studies': '#7C3AED'
  }), []);

  const getSubjectColor = (subjectName) => {
    return subjectColors[subjectName] || '#3699ff';
  };

  const getSlotAllocation = (day, time) => {
    const key = `${day}-${time}`;
    const allocation = timeTableData[key];
    
    // Debug logging to help identify data issues
    if (allocation) {
      console.log(`Found allocation for ${key}:`, {
        subject: allocation.subject?.name,
        teacher: allocation.teacher?.name,
        class: allocation.class?.name
      });
    }
    
    return allocation || null;
  };

  const hasConflict = (teacher, day, time) => {
    if (!teacher) return false;
    return checkTeacherConflict(teacher, day, time, true);
  };

  const renderSlot = (day, slot) => {
    const key = `${day}-${slot.time}`;
    const allocation = timeTableData[key];
    
    // Debug logging for data structure
    if (process.env.NODE_ENV === 'development') {
      if (allocation) {
        console.log(`Rendering slot ${key}:`, {
          hasSubject: !!allocation.subject,
          hasTeacher: !!allocation.teacher,
          subjectName: allocation.subject?.name,
          teacherName: allocation.teacher?.name,
          className: allocation.class?.name
        });
      }
    }
    
    if (slot.isBreak) {
      const breakIcon = slot.breakType === 'tea' ? 'flaticon2-coffee' : 'flaticon2-food';
      const breakLabel = slot.breakType === 'tea' ? 'TEA BREAK' : 'LUNCH BREAK';
      const breakColor = slot.breakType === 'tea' ? '#FEF3C7' : '#DBEAFE';
      const breakBorderColor = slot.breakType === 'tea' ? '#FDE68A' : '#93C5FD';
      
      return (
        <div 
          className="time-table-slot break-slot"
          style={{
            backgroundColor: breakColor,
            border: `1px solid ${breakBorderColor}`,
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="text-center">
            <i className={`${breakIcon} font-size-h3 opacity-70`} style={{ color: slot.breakType === 'tea' ? '#D97706' : '#1D4ED8' }}></i>
            <div className="font-size-xs mt-1 font-weight-bold" style={{ color: slot.breakType === 'tea' ? '#92400E' : '#1E40AF' }}>
              {breakLabel}
            </div>
            <div className="font-size-xs text-muted">
              {slot.duration} min
            </div>
          </div>
        </div>
      );
    }
    
    if (allocation) {
      // Validate data structure
      const subjectName = allocation.subject?.name || 'Unknown Subject';
      const teacherName = allocation.teacher?.name || 'Unknown Teacher';
      const subjectColor = getSubjectColor(subjectName);
      
      const hasTeacherConflict = checkTeacherConflict && checkTeacherConflict(allocation.teacher, day, slot.time, true);
      const conflictInfo = hasTeacherConflict && getTeacherAllocations ? 
        getTeacherAllocations(allocation.teacher).find(a => a.day === day && a.time === slot.time) : null;
      
      return (
        <div 
          className={`time-table-slot allocated-slot ${hasTeacherConflict ? 'conflict-slot' : ''}`}
          onClick={() => onSlotClick && onSlotClick(day, slot)}
          style={{
            backgroundColor: `${subjectColor}10`,
            borderLeft: `4px solid ${subjectColor}`,
            border: hasTeacherConflict ? '2px solid #DC2626' : '1px solid #ebedf3',
            minHeight: '60px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div className="p-2">
            <div className="font-weight-bold font-size-sm text-dark mb-1">
              {subjectName}
            </div>
            <div className="font-size-xs text-muted">
              {teacherName}
            </div>
            {hasTeacherConflict && (
              <div className="conflict-indicator">
                <span className="label label-inline label-light-danger font-weight-bold font-size-xs">
                  Conflict
                </span>
                {conflictInfo && (
                  <div className="conflict-details mt-1">
                    <div className="text-danger font-size-xs">
                      Also: {conflictInfo.class?.name}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Show different message based on whether class is selected
    const clickHandler = selectedClass ? () => onSlotClick(day, slot) : undefined;
    const cursorStyle = selectedClass ? 'pointer' : 'default';
    const borderStyle = selectedClass ? '1px dashed #ebedf3' : '1px solid #f0f0f0';
    
    return (
      <div 
        className="time-table-slot empty-slot"
        onClick={clickHandler}
        style={{
          backgroundColor: selectedClass ? '#ffffff' : '#fafafa',
          border: borderStyle,
          minHeight: '60px',
          cursor: cursorStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="text-center text-muted">
          {selectedClass ? (
            <>
              <i className="flaticon2-plus font-size-h2 opacity-50"></i>
              <div className="font-size-xs mt-1">Click to add</div>
            </>
          ) : (
            <>
              <i className="flaticon2-calendar font-size-h2 opacity-30"></i>
              <div className="font-size-xs mt-1">Select class</div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card card-custom" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
        <div className="card-body p-10 text-center">
          <div className="spinner spinner-primary mb-4"></div>
          <h3 className="font-weight-boldest text-dark mb-2">Loading Time Table...</h3>
        </div>
      </div>
    );
  }

  // Debug panel for development
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="card card-custom mb-4" style={{ borderRadius: '8px', border: '1px solid #ebedf3', backgroundColor: '#f8f9fa' }}>
        <div className="card-body p-4">
          <h6 className="font-weight-bold text-dark mb-3">Debug Information</h6>
          <div className="row">
            <div className="col-md-6">
              <div className="font-size-sm">
                <strong>Time Table Data Keys:</strong> {Object.keys(timeTableData).length}
              </div>
              <div className="font-size-sm">
                <strong>Selected Class:</strong> {selectedClass?.name || 'None'}
              </div>
              <div className="font-size-sm">
                <strong>Time Slots:</strong> {timeSlots.length}
              </div>
            </div>
            <div className="col-md-6">
              <div className="font-size-sm">
                <strong>Sample Data:</strong>
              </div>
              <pre className="font-size-xs bg-light p-2 mt-1" style={{ maxHeight: '100px', overflow: 'auto' }}>
                {JSON.stringify(Object.entries(timeTableData).slice(0, 3), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="time-table-grid-container">
      {/* Debug Panel */}
      <DebugPanel />
      
      {/* Header */}
      

      <div className="card card-custom" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
        <div className="card-body p-0">
          {/* Time Table Grid */}
          <div className="table-responsive">
            <table className="table table-bordered table-vertical-center mb-0 time-table-grid">
              <thead>
                <tr>
                  <th 
                    className="text-center font-weight-boldest text-dark"
                    style={{ 
                      minWidth: '100px', 
                      backgroundColor: '#f9fafc',
                      border: '1px solid #ebedf3',
                      padding: '15px 10px'
                    }}
                  >
                    Time
                  </th>
                  {config.workingDays.map(day => (
                    <th 
                      key={day}
                      className="text-center font-weight-boldest text-dark"
                      style={{ 
                        minWidth: '150px', 
                        backgroundColor: '#f9fafc',
                        border: '1px solid #ebedf3',
                        padding: '15px 10px'
                      }}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, slotIndex) => (
                  <tr key={slot.id}>
                    <td 
                      className="text-center font-weight-bold"
                      style={{ 
                        backgroundColor: '#f9fafc',
                        border: '1px solid #ebedf3',
                        padding: '15px 10px',
                        verticalAlign: 'middle'
                      }}
                    >
                      <div>
                        <div className="font-size-sm">{slot.time}</div>
                        <div className="font-size-xs text-muted">
                          {slot.duration} min
                        </div>
                      </div>
                    </td>
                    {config.workingDays.map(day => (
                      <td 
                        key={`${day}-${slot.id}`}
                        style={{ 
                          border: '1px solid #ebedf3',
                          padding: '8px',
                          verticalAlign: 'top'
                        }}
                      >
                        {renderSlot(day, slot)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card card-custom mt-4" style={{ borderRadius: '8px', border: '1px solid #ebedf3' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center" style={{ gap: '20px' }}>
              <span className="font-weight-bold text-dark font-size-sm">Legend:</span>
              <div className="d-flex align-items-center">
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: '#FEF3C7', 
                    border: '1px solid #FDE68A',
                    marginRight: '8px'
                  }}
                ></div>
                <span className="text-muted font-size-xs">Break Time</span>
              </div>
              <div className="d-flex align-items-center">
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    backgroundColor: '#3699ff20', 
                    border: '1px solid #3699ff',
                    marginRight: '8px'
                  }}
                ></div>
                <span className="text-muted font-size-xs">Allocated Lesson</span>
              </div>
              <div className="d-flex align-items-center">
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px dashed #ebedf3',
                    marginRight: '8px'
                  }}
                ></div>
                <span className="text-muted font-size-xs">Empty Slot</span>
              </div>
              <div className="d-flex align-items-center">
                <div 
                  style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #DC2626',
                    marginRight: '8px'
                  }}
                ></div>
                <span className="text-muted font-size-xs">Teacher Conflict</span>
              </div>
            </div>
            <div className="text-muted font-size-xs">
              Total Slots: {timeSlots.length * config.workingDays.length} | 
              Allocated: {Object.keys(timeTableData).length} | 
              Available: {timeSlots.length * config.workingDays.length - Object.keys(timeTableData).length}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .time-table-slot {
          transition: all 0.2s ease;
          border-radius: 4px;
        }
        
        .time-table-slot:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .allocated-slot:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .conflict-slot {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        
        .conflict-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
        }
        
        .time-table-grid {
          font-size: 13px;
        }
        
        .time-table-grid th,
        .time-table-grid td {
          position: relative;
        }
        
        @media (max-width: 1200px) {
          .time-table-grid {
            font-size: 12px;
          }
          .time-table-grid th,
          .time-table-grid td {
            min-width: 120px;
            padding: 8px 6px;
          }
        }
        
        @media (max-width: 768px) {
          .time-table-grid {
            font-size: 11px;
          }
          .time-table-grid th,
          .time-table-grid td {
            min-width: 100px;
            padding: 6px 4px;
          }
          .time-table-slot {
            min-height: 50px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(TimeTableGrid);
