import React from 'react';

// Quick Actions Component
export const QuickActions = ({ onRefresh, onExport, refreshing }) => {
  return (
    <div className="quick-actions">
      <div className="btn-group">
        <button
          className="btn btn-primary btn-sm font-weight-bold"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <i className={`la la-refresh ${refreshing ? 'la-spin' : ''} mr-2`}></i>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          className="btn btn-light-primary btn-sm font-weight-bold"
          onClick={onExport}
        >
          <i className="la la-download mr-2"></i>
          Export
        </button>
        <button
          className="btn btn-light-info btn-sm font-weight-bold"
          onClick={() => window.print()}
        >
          <i className="la la-print mr-2"></i>
          Print
        </button>
      </div>
    </div>
  );
};

// Filter Panel Component - All controls in single row
export const FilterPanel = ({ 
  schools, 
  selectedTimeRange, 
  selectedSchool, 
  onTimeRangeChange, 
  onSchoolChange, 
  onViewModeChange, 
  viewMode,
  onRefresh,
  onExport,
  refreshing
}) => {
  return (
    <div className="filter-panel mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap">
        <div className="d-flex align-items-center flex-wrap">
          {/* Time Range */}
          <div className="mr-3 mb-2">
            <label className="form-label text-muted small mb-1">Time Range</label>
            <select
              className="form-control form-control-sm"
              value={selectedTimeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              style={{ borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '120px' }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          {/* School */}
          <div className="mr-3 mb-2">
            <label className="form-label text-muted small mb-1">School</label>
            <select
              className="form-control form-control-sm"
              value={selectedSchool ? selectedSchool.id : ""}
              onChange={(e) => {
                const school = schools.find(s => s.id === e.target.value);
                onSchoolChange(school || null);
              }}
              style={{ borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem', minWidth: '150px' }}
            >
              <option value="">All Schools</option>
              {schools?.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* View Mode */}
          <div className="mr-3 mb-2">
            <label className="form-label text-muted small mb-1">View</label>
            <div className="btn-group">
              <button
                className={`btn btn-sm ${viewMode === 'dashboard' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => onViewModeChange('dashboard')}
                style={{ borderRadius: '6px 0 0 6px', fontSize: '0.875rem' }}
              >
                Dashboard
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => onViewModeChange('table')}
                style={{ fontSize: '0.875rem' }}
              >
                Table
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'analytics' ? 'btn-primary' : 'btn-light'}`}
                onClick={() => onViewModeChange('analytics')}
                style={{ borderRadius: '0 6px 6px 0', fontSize: '0.875rem' }}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mr-3 mb-2">
            <label className="form-label text-muted small mb-1">Actions</label>
            <div className="btn-group">
              <button
                className="btn btn-primary btn-sm font-weight-bold"
                onClick={onRefresh}
                disabled={refreshing}
                style={{ borderRadius: '6px 0 0 6px', fontSize: '0.875rem' }}
              >
                <i className={`la la-refresh ${refreshing ? 'la-spin' : ''} mr-1`}></i>
                Refresh
              </button>
              <button
                className="btn btn-light-primary btn-sm font-weight-bold"
                onClick={onExport}
                style={{ fontSize: '0.875rem' }}
              >
                <i className="la la-download mr-1"></i>
                Export
              </button>
              <button
                className="btn btn-light-info btn-sm font-weight-bold"
                onClick={() => window.print()}
                style={{ borderRadius: '0 6px 6px 0', fontSize: '0.875rem' }}
              >
                <i className="la la-print mr-1"></i>
                Print
              </button>
            </div>
          </div>
        </div>
        
        {/* Status Info */}
        <div className="d-flex align-items-center mb-2">
          <div className="text-muted mr-3">
            <span className="small">Total Schools:</span>
            <span className="font-weight-bolder text-dark ml-1">{schools?.filter(s => !s.isDeleted).length || 0}</span>
          </div>
          {selectedSchool && (
            <div className="badge badge-light badge-pill" style={{ fontSize: '0.75rem' }}>
              {selectedSchool.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Date Range Picker Component
export const DateRangePicker = ({ startDate, endDate, onChange }) => {
  return (
    <div className="date-range-picker">
      <div className="d-flex align-items-center">
        <div className="mr-2">
          <label className="form-label font-weight-bold">Start Date</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => onChange({ startDate: new Date(e.target.value), endDate })}
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="mr-2">
          <label className="form-label font-weight-bold">End Date</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={endDate.toISOString().split('T')[0]}
            onChange={(e) => onChange({ startDate, endDate: new Date(e.target.value) })}
            style={{ borderRadius: '8px' }}
          />
        </div>
        <div className="mt-6">
          <button
            className="btn btn-sm btn-light-primary"
            onClick={() => onChange({
              startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)),
              endDate: new Date()
            })}
          >
            <i className="la la-history mr-1"></i>
            Last 12 Months
          </button>
        </div>
      </div>
    </div>
  );
};

// Search Filter Component
export const SearchFilter = ({ searchTerm, onSearch, placeholder = "Search..." }) => {
  return (
    <div className="search-filter">
      <div className="input-group">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          style={{ borderRadius: '8px 0 0 8px' }}
        />
        <div className="input-group-append">
          <button className="btn btn-sm btn-primary" type="button">
            <i className="la la-search"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'success':
        return { color: 'success', icon: 'la la-check-circle' };
      case 'inactive':
      case 'pending':
      case 'warning':
        return { color: 'warning', icon: 'la la-exclamation-circle' };
      case 'error':
      case 'failed':
      case 'danger':
        return { color: 'danger', icon: 'la la-times-circle' };
      case 'processing':
      case 'info':
        return { color: 'info', icon: 'la la-info-circle' };
      default:
        return { color: 'secondary', icon: 'la la-question-circle' };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`badge badge-${config.color} badge-pill`}>
      <i className={`${config.icon} mr-1`}></i>
      {status}
    </span>
  );
};

// Progress Indicator Component
export const ProgressIndicator = ({ value, max, label, color = 'primary', showPercentage = true }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <div className="progress-indicator">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="font-weight-bold">{label}</span>
        {showPercentage && (
          <span className="font-weight-bold text-muted">{percentage.toFixed(1)}%</span>
        )}
      </div>
      <div className="progress progress-sm">
        <div
          className={`progress-bar bg-${color}`}
          role="progressbar"
          style={{ 
            width: `${percentage}%`,
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
            backgroundSize: '1rem 1rem'
          }}
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <div className="d-flex justify-content-between mt-1">
        <span className="text-muted small">{value.toLocaleString()}</span>
        <span className="text-muted small">{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

// Action Button Component
export const ActionButton = ({ icon, label, onClick, variant = 'primary', size = 'sm', disabled = false }) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} font-weight-bold`}
      onClick={onClick}
      disabled={disabled}
      style={{ borderRadius: '8px' }}
    >
      <i className={`${icon} mr-2`}></i>
      {label}
    </button>
  );
};

// Card Header Component
export const CardHeader = ({ title, subtitle, actions, gradient = false }) => {
  const gradientClass = gradient ? 'bg-gradient-primary' : 'bg-light';
  
  return (
    <div className={`card-header border-0 ${gradientClass}`}>
      <div className="card-title">
        <div>
          <h3 className={`card-label font-weight-bolder ${gradient ? 'text-white' : 'text-dark'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-muted ${gradient ? 'text-white' : ''} mb-0`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="card-toolbar">
          {actions}
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClass = {
    small: 'spinner-sm',
    default: 'spinner',
    large: 'spinner-lg'
  }[size];

  return (
    <div className="text-center py-10">
      <div className={`spinner spinner-primary ${sizeClass} mr-3`}></div>
      <span className="text-muted">{text}</span>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-20">
      <div className="symbol symbol-100 symbol-light-primary mb-6">
        <span className="symbol-label">
          <i className={`${icon} text-primary`} style={{ fontSize: '3rem' }}></i>
        </span>
      </div>
      <h4 className="font-weight-bolder text-dark mb-2">{title}</h4>
      <p className="text-muted mb-6">{description}</p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};
