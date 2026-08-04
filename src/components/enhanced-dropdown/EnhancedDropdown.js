import React, { useState, useMemo, useRef, useEffect } from 'react';
import './EnhancedDropdown.css';
import './DropdownButtonFixes.css';

const EnhancedDropdown = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...",
  labelKey = 'name',
  valueKey = 'id',
  searchable = false,
  className = "",
  disabled = false,
  width = 'auto',
  minWidth = '0',
  showCount = false,
  countKey = null,
  countLabel = 'students',
  emptyMessage = "No options available",
  persistenceKey = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const hasInitialized = useRef(false);

  // Persistence & "All" Defaulting logic
  useEffect(() => {
    if (!options || options.length === 0) return;
    
    // Only apply the aggressive default logic once when the component initially mounts with data.
    // This allows the user to explicitly select an 'All' option (which often has a value of '') later.
    if (hasInitialized.current) return;

    // Only attempt to default/restore if current value is empty
    if (value === undefined || value === null || value === '') {
      let targetValue = null;

      // 1. Try to restore from localStorage
      if (persistenceKey) {
        const savedValue = localStorage.getItem(`ed_pref_${persistenceKey}`);
        if (savedValue && options.find(o => String(o[valueKey]) === savedValue)) {
          targetValue = savedValue;
        }
      }

      // 2. Default to the first actual item (not 'All') if no valid persisted value
      if (targetValue === null) {
        const firstRealOption = options.find(o => {
          const label = String(o[labelKey] || '').toLowerCase();
          const val = String(o[valueKey] || '').toLowerCase();
          return !(label.includes('all') && (val === 'all' || val === ''));
        });
        
        if (firstRealOption) {
          targetValue = firstRealOption[valueKey];
        } else if (options.length > 0) {
          targetValue = options[0][valueKey];
        }
      }

      if (targetValue !== null && String(targetValue) !== String(value)) {
        onChange(targetValue);
      }
    }
    
    hasInitialized.current = true;
  }, [options, persistenceKey, value, onChange, labelKey, valueKey]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm || !searchable) return options;
    
    const searchLower = searchTerm.toLowerCase();
    return options.filter(option => {
      const label = option[labelKey] || '';
      return label.toLowerCase().includes(searchLower);
    });
  }, [options, searchTerm, searchable, labelKey]);

  // Find selected option
  const selectedOption = useMemo(() => {
    return options.find(option => 
      String(option[valueKey]) === String(value)
    );
  }, [options, value, valueKey]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const handleOptionSelect = (option) => {
    const newVal = option[valueKey];
    onChange(newVal);
    
    // Persist choice
    if (persistenceKey) {
      localStorage.setItem(`ed_pref_${persistenceKey}`, String(newVal));
    }

    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
  };

  const getDisplayText = () => {
    if (selectedOption) {
      const label = selectedOption[labelKey] || '';
      if (showCount && countKey && selectedOption[countKey] !== undefined) {
        let countValue = selectedOption[countKey];
        // Handle arrays by getting their length
        if (Array.isArray(countValue)) {
          countValue = countValue.length;
        }
        // Handle objects by converting to string representation
        if (typeof countValue === 'object' && countValue !== null) {
          countValue = Object.keys(countValue).length;
        }
        const finalCountLabel = selectedOption.countLabel || countLabel;
        return `${label} (${countValue} ${finalCountLabel})`;
      }
      return label;
    }
    return placeholder;
  };

  return (
    <div 
      ref={dropdownRef}
      className={`enhanced-dropdown ${className}`}
      style={{ width, minWidth }}
      onKeyDown={handleKeyDown}
    >
      <div 
        className={`enhanced-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="enhanced-dropdown-text">
          {getDisplayText()}
        </span>
        <div className="enhanced-dropdown-arrow">
          <i className={`la la-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
      </div>

      {isOpen && (
        <div className="enhanced-dropdown-menu">
          {searchable && (
            <div className="enhanced-dropdown-search">
              <input
                ref={searchRef}
                type="text"
                className="enhanced-dropdown-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
              <i className="enhanced-dropdown-search-icon flaticon2-search-1"></i>
            </div>
          )}

          <div className="enhanced-dropdown-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = String(option[valueKey]) === String(value);
                const isHighlighted = index === highlightedIndex;
                
                return (
                  <div
                    key={option[valueKey]}
                    className={`enhanced-dropdown-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <span className="enhanced-dropdown-option-label">
                      {option[labelKey]}
                    </span>
                    {showCount && countKey && option[countKey] !== undefined && (
                      <span className="enhanced-dropdown-option-count">
                        <span className="enhanced-dropdown-count-shape">
                          {Array.isArray(option[countKey]) ? option[countKey].length : option[countKey]} {option.countLabel || countLabel}
                        </span>
                      </span>
                    )}
                    {isSelected && (
                      <i className="enhanced-dropdown-option-check la la-check"></i>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="enhanced-dropdown-empty">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDropdown;
