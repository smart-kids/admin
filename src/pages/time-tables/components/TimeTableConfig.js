import React, { useState } from 'react';

const TimeTableConfig = ({ config, onConfigChange, onClose }) => {
  const [localConfig, setLocalConfig] = useState({ ...config });
  const [hasChanges, setHasChanges] = useState(false);

  const workingDaysOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleInputChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    
    // Check if there are changes from original config
    const changes = Object.keys(newConfig).some(key => {
      if (Array.isArray(newConfig[key])) {
        return JSON.stringify(newConfig[key]) !== JSON.stringify(config[key]);
      }
      return newConfig[key] !== config[key];
    });
    setHasChanges(changes);
  };

  const handleDayToggle = (day) => {
    const newWorkingDays = localConfig.workingDays.includes(day)
      ? localConfig.workingDays.filter(d => d !== day)
      : [...localConfig.workingDays, day];
    
    handleInputChange('workingDays', newWorkingDays);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig({ ...config });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalConfig({ ...config });
    setHasChanges(false);
    onClose();
  };

  return (
    <div>
      <div className="mb-6">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="font-weight-boldest text-dark">
            <i className="flaticon2-settings text-primary mr-2"></i>
            Schedule Configuration
          </h5>
          <div>
            <button 
              className="btn btn-light-primary btn-sm mr-2"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <i className="flaticon2-refresh mr-2"></i>
              Reset
            </button>
            <button 
              className="btn btn-light-secondary btn-sm mr-2"
              onClick={handleCancel}
            >
              <i className="flaticon2-cross mr-2"></i>
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <div className="row">
          {/* Left Column - Time Settings */}
          <div className="col-md-6">
            <h4 className="font-weight-boldest text-dark mb-4">Time Settings</h4>
            
            {/* Start Time */}
            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                School Start Time
              </label>
              <input
                type="time"
                className="form-control form-control-solid"
                value={localConfig.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>

            {/* End Time */}
            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                School End Time
              </label>
              <input
                type="time"
                className="form-control form-control-solid"
                value={localConfig.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>

            {/* Lesson Length */}
            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                Lesson Length (minutes)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-solid"
                  value={localConfig.lessonLength}
                  onChange={(e) => handleInputChange('lessonLength', parseInt(e.target.value) || 30)}
                  min="15"
                  max="120"
                  step="5"
                />
                <div className="input-group-append">
                  <span className="input-group-text">min</span>
                </div>
              </div>
              <small className="text-muted font-size-xs">
                Typical lesson duration (15-120 minutes)
              </small>
            </div>

            {/* Tea Break Settings */}
            <h5 className="font-weight-boldest text-dark mb-3 mt-6">Tea Break Settings</h5>
            
            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                Tea Breaks After Lessons (comma-separated)
              </label>
              <div className="d-flex align-items-center" style={{ gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-control form-control-solid"
                  value={(localConfig.teaBreakAfterLessons || []).join(', ')}
                  onChange={(e) => {
                    const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v) && v > 0);
                    handleInputChange('teaBreakAfterLessons', values.length > 0 ? values : [2]);
                  }}
                  placeholder="e.g., 2, 6"
                />
              </div>
              
              {/* Quick Preset Buttons */}
              <div className="d-flex flex-wrap" style={{ gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  className="btn btn-light-primary btn-xs font-weight-bold"
                  onClick={() => handleInputChange('teaBreakAfterLessons', [2])}
                  title="One tea break after 2nd lesson"
                >
                  After 2nd
                </button>
                <button
                  type="button"
                  className="btn btn-light-primary btn-xs font-weight-bold"
                  onClick={() => handleInputChange('teaBreakAfterLessons', [2, 6])}
                  title="Tea breaks after 2nd and 6th lessons"
                >
                  After 2nd & 6th
                </button>
                <button
                  type="button"
                  className="btn btn-light-primary btn-xs font-weight-bold"
                  onClick={() => handleInputChange('teaBreakAfterLessons', [3, 7])}
                  title="Tea breaks after 3rd and 7th lessons"
                >
                  After 3rd & 7th
                </button>
                <button
                  type="button"
                  className="btn btn-light-primary btn-xs font-weight-bold"
                  onClick={() => handleInputChange('teaBreakAfterLessons', [2, 5, 8])}
                  title="Tea breaks after 2nd, 5th, and 8th lessons"
                >
                  After 2nd, 5th & 8th
                </button>
                <button
                  type="button"
                  className="btn btn-light-danger btn-xs font-weight-bold"
                  onClick={() => handleInputChange('teaBreakAfterLessons', [])}
                  title="No tea breaks"
                >
                  No Tea Breaks
                </button>
              </div>
              
              <small className="text-muted font-size-xs">
                Enter lesson numbers after which tea breaks should occur (e.g., "2, 6" for breaks after 2nd and 6th lessons)
              </small>
            </div>

            {/* Per-break duration inputs - rendered dynamically based on teaBreakAfterLessons */}
            {(localConfig.teaBreakAfterLessons || []).length > 0 && (
              <div className="form-group mb-4">
                <label className="font-weight-bold text-dark font-size-sm d-block mb-2">
                  Tea Break Durations (minutes)
                </label>
                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                  {(localConfig.teaBreakAfterLessons || []).map(lessonNum => {
                    const lengths = localConfig.teaBreakLengths || {};
                    const defaultLen = localConfig.teaBreakLength || 15;
                    const val = lengths[lessonNum] !== undefined ? lengths[lessonNum] : defaultLen;
                    return (
                      <div key={lessonNum} className="d-flex align-items-center" style={{ gap: '10px' }}>
                        <span className="text-muted font-size-sm" style={{ minWidth: '130px' }}>
                          After lesson <strong>{lessonNum}</strong>:
                        </span>
                        <div className="input-group" style={{ maxWidth: '160px' }}>
                          <input
                            type="number"
                            className="form-control form-control-solid form-control-sm"
                            value={val}
                            onChange={(e) => {
                              const newLen = parseInt(e.target.value) || 15;
                              const newLengths = { ...(localConfig.teaBreakLengths || {}), [lessonNum]: newLen };
                              // Also keep teaBreakLength in sync as the most common value (for backwards compat)
                              const allVals = Object.values(newLengths);
                              const allSame = allVals.every(v => v === allVals[0]);
                              const newConfig = {
                                ...localConfig,
                                teaBreakLengths: newLengths,
                                teaBreakLength: allSame ? allVals[0] : (localConfig.teaBreakLength || 15)
                              };
                              setLocalConfig(newConfig);
                              const changes = Object.keys(newConfig).some(key => {
                                if (Array.isArray(newConfig[key])) return JSON.stringify(newConfig[key]) !== JSON.stringify(config[key]);
                                if (typeof newConfig[key] === 'object') return JSON.stringify(newConfig[key]) !== JSON.stringify(config[key]);
                                return newConfig[key] !== config[key];
                              });
                              setHasChanges(changes);
                            }}
                            min="5"
                            max="60"
                            step="5"
                          />
                          <div className="input-group-append">
                            <span className="input-group-text">min</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <small className="text-muted font-size-xs mt-2 d-block">
                  Set a custom duration for each tea break independently
                </small>
              </div>
            )}

            {/* Lunch Break Settings */}
            <h5 className="font-weight-boldest text-dark mb-3 mt-6">Lunch Break Settings</h5>
            
            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                Lunch Break After (lessons)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-solid"
                  value={localConfig.lunchBreakAfterLessons || 4}
                  onChange={(e) => handleInputChange('lunchBreakAfterLessons', parseInt(e.target.value) || 4)}
                  min="1"
                  max="10"
                  step="1"
                />
                <div className="input-group-append">
                  <span className="input-group-text">lessons</span>
                </div>
              </div>
              <small className="text-muted font-size-xs">
                Number of lessons before lunch break (e.g., 4 for break after 4th lesson)
              </small>
            </div>

            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                Lunch Break Length (minutes)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-solid"
                  value={localConfig.lunchBreakLength || 30}
                  onChange={(e) => handleInputChange('lunchBreakLength', parseInt(e.target.value) || 30)}
                  min="15"
                  max="120"
                  step="5"
                />
                <div className="input-group-append">
                  <span className="input-group-text">min</span>
                </div>
              </div>
              <small className="text-muted font-size-xs">
                Duration of lunch break (15-120 minutes)
              </small>
            </div>

          </div>

          {/* Right Column - Working Days */}
          <div className="col-md-6">
            <h4 className="font-weight-boldest text-dark mb-4">Working Days</h4>
            
            <div className="form-group">
              <label className="font-weight-bold text-dark font-size-sm mb-3">
                Select Working Days
              </label>
              <div className="d-flex flex-wrap" style={{ gap: '10px' }}>
                {workingDaysOptions.map(day => (
                  <label 
                    key={day}
                    className="btn btn-outline-primary btn-sm cursor-pointer mb-2"
                    style={{
                      backgroundColor: localConfig.workingDays.includes(day) ? '#3699ff' : 'transparent',
                      color: localConfig.workingDays.includes(day) ? 'white' : '#3699ff',
                      border: '1px solid #3699ff',
                      minWidth: '100px'
                    }}
                  >
                    <input
                      type="checkbox"
                      className="d-none"
                      checked={localConfig.workingDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                    />
                    <i className={`mr-2 ${localConfig.workingDays.includes(day) ? 'flaticon2-check-mark' : ''}`}></i>
                    {day}
                  </label>
                ))}
              </div>
              <small className="text-muted font-size-xs mt-2 d-block">
                Select the days when classes are held
              </small>
            </div>

            {/* Schedule Preview */}
            <div className="mt-6">
              <h4 className="font-weight-boldest text-dark mb-4">Schedule Preview</h4>
              <div className="bg-light p-4 rounded">
                <div className="font-size-sm text-dark mb-3">
                  <strong>Working Days:</strong> {localConfig.workingDays.join(', ')}
                </div>
                <div className="font-size-sm text-dark mb-3">
                  <strong>School Hours:</strong> {localConfig.startTime} - {localConfig.endTime}
                </div>
                <div className="font-size-sm text-dark mb-3">
                  <strong>Lesson Duration:</strong> {localConfig.lessonLength} minutes
                </div>
                <div className="font-size-sm text-dark mb-3">
                  <strong>Tea Breaks:</strong> After lessons {(localConfig.teaBreakAfterLessons || []).join(', ')}
                  {(localConfig.teaBreakAfterLessons || []).length > 0 && (
                    <span className="ml-2 text-muted">
                      ({(localConfig.teaBreakAfterLessons || []).map(n => {
                        const len = (localConfig.teaBreakLengths || {})[n] || localConfig.teaBreakLength || 15;
                        return `L${n}: ${len}min`;
                      }).join(', ')})
                    </span>
                  )}
                </div>
                <div className="font-size-sm text-dark mb-3">
                  <strong>Lunch Break:</strong> After lesson {localConfig.lunchBreakAfterLessons || 4}
                </div>
                
                <div className="mt-4 p-3 bg-white rounded">
                  <div className="font-weight-bold text-dark font-size-sm mb-2">
                    📊 Calculated Schedule:
                  </div>
                  <div className="text-muted font-size-xs">
                    Total working time: {calculateTotalTime(localConfig)} hours
                  </div>
                  <div className="text-muted font-size-xs">
                    Estimated lessons per day: {calculateLessonsPerDay(localConfig)}
                  </div>
                  <div className="text-muted font-size-xs">
                    Total weekly lessons: {calculateWeeklyLessons(localConfig)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end mt-6 pt-4 border-top">
          <button 
            className="btn btn-light-secondary mr-2"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <i className="flaticon2-check-mark mr-2"></i>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions for schedule calculations
const calculateTotalTime = (config) => {
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  return (totalMinutes / 60).toFixed(1);
};

const calculateLessonsPerDay = (config) => {
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  let lessonCount = 0;
  let teaBreaksUsed = [];
  let lunchBreakUsed = false;
  
  while (currentTime < endTime) {
    let isBreak = false;
    
    let breakType = null;
    if (lessonCount > 0) {
      // Check for tea breaks (support multiple)
      if (config.teaBreakAfterLessons && config.teaBreakAfterLessons.includes(lessonCount) && !teaBreaksUsed.includes(lessonCount)) {
        isBreak = true;
        breakType = 'tea';
        teaBreaksUsed.push(lessonCount);
      }
      // Check for lunch break (only once)
      else if (lessonCount === config.lunchBreakAfterLessons && !lunchBreakUsed) {
        isBreak = true;
        breakType = 'lunch';
        lunchBreakUsed = true;
      }
    }
    
    currentTime += isBreak ? (breakType === 'tea' ? (config.teaBreakLengths?.[lessonCount] ?? config.teaBreakLength ?? 15) : config.lunchBreakLength) : config.lessonLength;
    if (!isBreak) lessonCount++;
    
    if (currentTime >= endTime) break;
  }
  
  return lessonCount;
};

const calculateWeeklyLessons = (config) => {
  return calculateLessonsPerDay(config) * config.workingDays.length;
};

export default TimeTableConfig;
