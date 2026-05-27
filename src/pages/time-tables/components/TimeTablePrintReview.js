import React from 'react';
import ReportHeader from '../../../components/reports/ReportHeader';
import ReportFooter from '../../../components/reports/ReportFooter';
import Data from '../../../utils/data';

const TimeTablePrintReview = ({ 
  classes, 
  selectedClass, 
  selectedTerm, 
  timeTableData, 
  config, 
  timeSlots, 
  subjects, 
  teachers,
  school: propSchool,
  printAll = false,
  orientation = 'landscape'
}) => {
  const school = propSchool || Data.schools.getSelected();
  const themeColor = school?.themeColor || '#1a1a1a';
  
  const subjectColors = {
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
  };

  const getSubjectColor = (subjectName) => {
    return subjectColors[subjectName] || '#3699ff';
  };

  
  const getPrintStyles = () => {
    const baseStyles = {
      padding: orientation === 'landscape' ? '0.5cm 1cm' : '1.0cm 1.5cm',
      backgroundColor: 'white', 
      minHeight: 'auto', 
      height: 'auto', 
      width: orientation === 'landscape' ? '29.7cm' : '21cm',
      margin: '2cm auto', 
      position: 'relative',
      fontFamily: "'Inter', 'Roboto', sans-serif",
      color: '#1f2937', 
      boxSizing: 'border-box',
      boxShadow: '0 0 30px rgba(0,0,0,0.1)', 
      border: '1px solid #e5e7eb',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column'
    };
    return baseStyles;
  };

  const renderTimeTable = (classData, classTimeTableData) => {
    const days = config.workingDays;
    
    return (
      <div key={classData.id} className="time-table-print-container" style={{ 
        pageBreakInside: 'avoid',
        marginBottom: printAll ? '40px' : '0'
      }}>
        {/* Class Information Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '15px', 
          backgroundColor: '#ffffff', 
          padding: '20px', 
          borderRadius: '16px', 
          marginBottom: '20px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Class</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{classData.name}</div>
          </div>
          <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Grade</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{classData.grade?.name || 'N/A'}</div>
          </div>
          <div style={{ borderRight: '1px solid #f3f4f6', paddingRight: '10px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Term</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{selectedTerm?.name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>Students</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{classData.studentCount || 0}</div>
          </div>
        </div>

        {/* Schedule Summary */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px', border: '2px solid #f3f4f6', padding: '15px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Schedule Overview
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>School Hours:</span>
                <span style={{ fontWeight: 800, color: themeColor, fontSize: '0.95rem' }}>{config.startTime} - {config.endTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Lesson Duration:</span>
                <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{config.lessonLength} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Working Days:</span>
                <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{config.workingDays.length} days</span>
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', border: '2px solid #f3f4f6', padding: '15px', borderRadius: '16px', backgroundColor: '#ffffff' }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Allocation Summary
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Total Slots:</span>
                <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{timeSlots.length * days.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed #f3f4f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Allocated:</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>{Object.keys(classTimeTableData).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Available:</span>
                <span style={{ fontWeight: 800, color: '#f6c23e', fontSize: '0.95rem' }}>{timeSlots.length * days.length - Object.keys(classTimeTableData).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Table Grid */}
        <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: themeColor }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', width: '100px' }}>Time</th>
                {days.map(day => (
                  <th key={day} style={{ padding: '12px 10px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slot.id} style={{ backgroundColor: slotIndex % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ 
                    padding: '10px 10px', 
                    borderBottom: '1px solid #f3f4f6', 
                    fontWeight: 700, 
                    fontSize: '0.8rem', 
                    color: '#374151',
                    verticalAlign: 'middle',
                    width: '100px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{slot.time}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {slot.duration} min
                      </div>
                    </div>
                  </td>
                  {days.map(day => {
                    const key = `${day}-${slot.time}`;
                    const allocation = classTimeTableData[key];
                    
                    if (slot.isBreak) {
                      const breakLabel = slot.breakType === 'tea' ? 'TEA BREAK' : 'LUNCH BREAK';
                      const breakColor = slot.breakType === 'tea' ? '#FEF3C7' : '#DBEAFE';
                      const breakTextColor = slot.breakType === 'tea' ? '#92400E' : '#1E40AF';
                      
                      return (
                        <td key={`${day}-${slot.id}`} style={{ 
                          padding: '8px 10px', 
                          borderBottom: '1px solid #f3f4f6', 
                          textAlign: 'center',
                          backgroundColor: breakColor,
                          color: breakTextColor,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          <div>
                            <div>{breakLabel}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{slot.duration} min</div>
                          </div>
                        </td>
                      );
                    }
                    
                    if (allocation) {
                      const subjectColor = getSubjectColor(allocation.subject?.name);
                      
                      return (
                        <td key={`${day}-${slot.id}`} style={{ 
                          padding: '8px 10px', 
                          borderBottom: '1px solid #f3f4f6', 
                          textAlign: 'left',
                          backgroundColor: `${subjectColor}10`,
                          borderLeft: `3px solid ${subjectColor}`,
                          verticalAlign: 'top'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827', marginBottom: '2px' }}>
                              {allocation.subject?.name || 'N/A'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              {allocation.teacher?.name || 'N/A'}
                            </div>
                          </div>
                        </td>
                      );
                    }
                    
                    return (
                      <td key={`${day}-${slot.id}`} style={{ 
                        padding: '8px 10px', 
                        borderBottom: '1px solid #f3f4f6', 
                        textAlign: 'center',
                        color: '#d1d5db',
                        fontSize: '0.75rem'
                      }}>
                        -
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subject Legend */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px', 
          border: '1px solid #e5e7eb' 
        }}>
          <h6 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>
            Subject Legend
          </h6>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(subjectColors).slice(0, 8).map(([subject, color]) => (
              <div key={subject} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: color, 
                  borderRadius: '2px' 
                }}></div>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{subject}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Page break for print all */}
        {printAll && <div style={{ pageBreakAfter: 'always' }}></div>}
      </div>
    );
  };

  return (
    <div className="time-table-print-review" style={getPrintStyles()}>
      {/* Premium Header Layout */}
      <ReportHeader school={school} title="TIME TABLE" themeColor={themeColor} />

      {/* Generated Info */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
          Generated on {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} at {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Render Time Tables */}
      {printAll ? (
        classes.map(classData => {
          const classTimeTableData = timeTableData[classData.id] || {};
          return renderTimeTable(classData, classTimeTableData);
        })
      ) : (
        selectedClass && renderTimeTable(selectedClass, timeTableData)
      )}

      {/* Signature Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', marginBottom: '20px', padding: '0 1cm' }}>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ height: '40px' }}></div>
          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '0.85rem', textTransform: 'uppercase' }}>Academic Director</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>Signature & Date</p>
          </div>
        </div>
        <div style={{ width: '220px', textAlign: 'center' }}>
          <div style={{ height: '40px' }}></div>
          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '10px' }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '0.85rem', textTransform: 'uppercase' }}>Principal</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>Official Stamp & Date</p>
          </div>
        </div>
      </div>

      {/* Premium Footer */}
      <div style={{ marginTop: 'auto', paddingBottom: '0.5cm' }}>
        <ReportFooter themeColor={themeColor} validationStatus="Official Schedule" />
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .time-table-print-review {
            box-shadow: none;
            border: none;
            margin: 0;
            padding: ${orientation === 'landscape' ? '0.5cm 1cm' : '1cm'};
          }
          
          .time-table-print-container {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          table {
            font-size: ${orientation === 'landscape' ? '9px' : '10px'} !important;
          }
          
          th, td {
            padding: ${orientation === 'landscape' ? '4px 6px' : '6px'} !important;
          }

          @page {
            size: A4 ${orientation};
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default TimeTablePrintReview;
