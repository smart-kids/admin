import React, { useState } from 'react';

const ResultsManagementLayout = ({ 
  // Filter props
  selectedLetter = 'ALL', 
  onLetterFilterChange,
  searchValue = '',
  onSearchChange,
  resultsCount = 0,
  pageSize = 15,
  onPageSizeChange,
  
  // Selection props
  selectedTerm = '',
  selectedClass = '',
  selectedGrade = '',
  terms = [],
  classes = [],
  grades = [],
  onTermChange,
  onClassChange,
  onGradeChange,
  
  // Action buttons
  editCount = 0,
  saving = false,
  onSave,
  onPrint,
  onSms,
  onAddTerm,
  onAddClass,
  onAddGrade,
  
  // Show/hide add buttons
  showAddButtons = true,
  
  children
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const letters = ['ALL', 'A', 'B', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W'];

  const hasActiveFilters = selectedLetter !== 'ALL' || searchValue !== '';
  const hasSelections = selectedTerm || selectedClass || selectedGrade;

  return (
    <div className="card card-custom card-shadowless">
      {/* Header */}
      <div className="card-header border-0 py-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <div className="mb-2 mb-md-0">
            <h1 className="font-weight-bolder text-dark font-size-h3 mb-1">Results Management</h1>
            <div className="d-flex align-items-center flex-wrap">
              <div className="text-muted font-weight-bold font-size-xs">Manage student scores and academic insights</div>
              {resultsCount > 0 && (
                <div className="ml-3">
                  <span className="label label-light-primary label-inline font-weight-bold font-size-xs">
                    {resultsCount} Students
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="d-flex align-items-center flex-wrap">
            {editCount > 0 && (
              <button 
                className={`btn btn-sm btn-primary font-weight-bold mr-2 mb-2 mb-md-0 ${saving ? 'spinner spinner-white spinner-right' : ''}`} 
                onClick={onSave} 
                disabled={saving}
              >
                <i className="fa fa-save mr-1"></i> <span className="d-none d-sm-inline">Save ({editCount})</span>
                <span className="d-sm-none">Save</span>
              </button>
            )}
            <button 
              className="btn btn-sm btn-success font-weight-bold mr-2 mb-2 mb-md-0" 
              onClick={onPrint} 
              disabled={!selectedClass || !selectedTerm}
            >
              <i className="fa fa-print mr-1"></i> <span className="d-none d-sm-inline">Print</span>
            </button>
            <button 
              className="btn btn-sm btn-light-primary font-weight-bold mb-2 mb-md-0" 
              onClick={onSms} 
              disabled={!selectedClass || !selectedTerm}
            >
              <i className="fa fa-sms mr-1"></i> <span className="d-none d-sm-inline">SMS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="card-body pt-0">
        {/* Desktop Controls */}
        <div className="d-none d-lg-flex align-items-center justify-content-between mb-4">
          {/* Academic Selection */}
          <div className="d-flex align-items-center" style={{ gap: '12px' }}>
            <div>
              <select 
                className="form-control form-control-sm form-control-solid" 
                style={{ minWidth: '120px' }}
                value={selectedTerm} 
                onChange={e => onTermChange && onTermChange(e.target.value)}
              >
                <option value="">Term...</option>
                {terms?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <div>
              <select 
                className="form-control form-control-sm form-control-solid" 
                style={{ minWidth: '140px' }}
                value={selectedClass} 
                onChange={e => onClassChange && onClassChange(e.target.value)}
              >
                <option value="">Class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <select 
                className="form-control form-control-sm form-control-solid" 
                style={{ minWidth: '120px' }}
                value={selectedGrade} 
                onChange={e => onGradeChange && onGradeChange(e.target.value)}
              >
                <option value="">Grade...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {hasSelections && (
              <button 
                className="btn btn-clean btn-xs text-muted"
                onClick={() => {
                  onTermChange && onTermChange('');
                  onClassChange && onClassChange('');
                  onGradeChange && onGradeChange('');
                }}
              >
                <i className="fa fa-times mr-1"></i>Clear
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="d-flex align-items-center" style={{ gap: '12px' }}>
            <div className="input-icon input-icon-right">
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ width: '200px' }}
                placeholder="Search students..."
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
              <span>
                <i className="flaticon2-search-1 icon-sm text-muted"></i>
              </span>
            </div>

            <select
              className="form-control form-control-sm form-control-solid"
              style={{ width: '100px' }}
              value={pageSize}
              onChange={(e) => onPageSizeChange && onPageSizeChange(e.target.value)}
            >
              <option value={15}>15</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>All</option>
            </select>

            <button 
              className="btn btn-clean btn-xs text-primary font-weight-bold"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <i className={`fa fa-filter mr-1`}></i>
              {hasActiveFilters && <span className="label label-primary label-inline ml-1">Active</span>}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Controls */}
        <div className="d-lg-none mb-4">
          {/* Academic Selection - Mobile */}
          <div className="row mb-3">
            <div className="col-6 mb-2">
              <select 
                className="form-control form-control-sm form-control-solid" 
                value={selectedTerm} 
                onChange={e => onTermChange && onTermChange(e.target.value)}
              >
                <option value="">Term...</option>
                {terms?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-6 mb-2">
              <select 
                className="form-control form-control-sm form-control-solid" 
                value={selectedClass} 
                onChange={e => onClassChange && onClassChange(e.target.value)}
              >
                <option value="">Class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-6 mb-2">
              <select 
                className="form-control form-control-sm form-control-solid" 
                value={selectedGrade} 
                onChange={e => onGradeChange && onGradeChange(e.target.value)}
              >
                <option value="">Grade...</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="col-6 mb-2">
              <select
                className="form-control form-control-sm form-control-solid"
                value={pageSize}
                onChange={(e) => onPageSizeChange && onPageSizeChange(e.target.value)}
              >
                <option value={15}>15</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>All</option>
              </select>
            </div>
          </div>

          {/* Search and Filters - Mobile */}
          <div className="d-flex align-items-center mb-3">
            <div className="input-icon input-icon-right flex-grow-1 mr-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search students..."
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
              <span>
                <i className="flaticon2-search-1 icon-sm text-muted"></i>
              </span>
            </div>
            <button 
              className="btn btn-light-primary btn-sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <i className={`fa fa-filter`}></i>
              {hasActiveFilters && <span className="label label-primary label-inline ml-1">Active</span>}
            </button>
          </div>

          {hasSelections && (
            <button 
              className="btn btn-clean btn-xs text-muted"
              onClick={() => {
                onTermChange && onTermChange('');
                onClassChange && onClassChange('');
                onGradeChange && onGradeChange('');
              }}
            >
              <i className="fa fa-times mr-1"></i>Clear All Selections
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="bg-light rounded p-3 mb-4 animate__animated animate__fadeIn">
            <div className="d-flex align-items-center mb-2">
              <span className="font-weight-bolder text-dark font-size-xs">Filter by First Letter</span>
            </div>
            <div className="d-flex flex-wrap" style={{ gap: '4px' }}>
              {letters.map((letter) => (
                <button
                  key={letter}
                  className={`btn btn-xs font-weight-boldest ${
                    selectedLetter === letter 
                      ? 'btn-primary' 
                      : 'btn-light-primary text-primary'
                  }`}
                  style={{ minWidth: letter === 'ALL' ? '35px' : '28px', height: '28px' }}
                  onClick={() => onLetterFilterChange && onLetterFilterChange(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResultsManagementLayout;
