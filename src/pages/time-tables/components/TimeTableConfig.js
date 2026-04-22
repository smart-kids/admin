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
                Tea Break After (lessons)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-solid"
                  value={localConfig.teaBreakAfterLessons || 2}
                  onChange={(e) => handleInputChange('teaBreakAfterLessons', parseInt(e.target.value) || 2)}
                  min="1"
                  max="10"
                  step="1"
                />
                <div className="input-group-append">
                  <span className="input-group-text">lessons</span>
                </div>
              </div>
              <small className="text-muted font-size-xs">
                Number of lessons before tea break (e.g., 2 for break after 2nd lesson)
              </small>
            </div>

            <div className="form-group mb-4">
              <label className="font-weight-bold text-dark font-size-sm">
                Tea Break Length (minutes)
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control form-control-solid"
                  value={localConfig.teaBreakLength || 15}
                  onChange={(e) => handleInputChange('teaBreakLength', parseInt(e.target.value) || 15)}
                  min="5"
                  max="60"
                  step="5"
                />
                <div className="input-group-append">
                  <span className="input-group-text">min</span>
                </div>
              </div>
              <small className="text-muted font-size-xs">
                Duration of tea break (5-60 minutes)
              </small>
            </div>

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
                  <strong>Break Duration:</strong> {localConfig.breakLength} minutes
                </div>
                <div className="font-size-sm text-dark">
                  <strong>Break Frequency:</strong> Every {localConfig.lessonsPerBreak} lesson{localConfig.lessonsPerBreak > 1 ? 's' : ''}
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
  
  while (currentTime < endTime) {
    const isBreak = lessonCount > 0 && lessonCount % config.lessonsPerBreak === 0;
    currentTime += isBreak ? config.breakLength : config.lessonLength;
    if (!isBreak) lessonCount++;
  }
  
  return lessonCount;
};

const calculateWeeklyLessons = (config) => {
  return calculateLessonsPerDay(config) * config.workingDays.length;
};

export default TimeTableConfig;
