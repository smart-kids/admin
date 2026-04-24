import React, { useState, useCallback } from 'react';
import './EnhancedSearch.css';

const EnhancedSearch = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  onClearSearch, 
  placeholder = "Search...",
  className = "",
  showClearButton = true,
  debounceMs = 300,
  disabled = false
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const handleInputChange = useCallback((value) => {
    setLocalSearchTerm(value);
    
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set new timeout for real-time search (debounce)
    const timeout = setTimeout(() => {
      // Convert to lowercase for case-insensitive fuzzy search
      const searchValue = value.toLowerCase().trim();
      onSearchChange(searchValue);
    }, debounceMs);
    
    setDebounceTimeout(timeout);
  }, [debounceTimeout, onSearchChange, debounceMs]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      onSearch(localSearchTerm);
    }
  };

  const handleClear = () => {
    setLocalSearchTerm('');
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    onClearSearch();
  };

  const handleSearchClick = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    onSearch(localSearchTerm);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Update local term when external search term changes
  React.useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  return (
    <div className={`enhanced-search-container ${className}`}>
      <div className="enhanced-search-input-group">
        <div className="enhanced-search-input-wrapper">
          <input
            type="text"
            className="enhanced-search-input"
            placeholder={placeholder}
            value={localSearchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
          <div className="enhanced-search-icon">
            <i className="flaticon2-search-1"></i>
          </div>
        </div>
        <div className="enhanced-search-actions">
          <button
            className="enhanced-search-btn enhanced-search-btn-primary"
            onClick={handleSearchClick}
            disabled={disabled}
          >
            Search
          </button>
          {showClearButton && localSearchTerm && (
            <button
              className="enhanced-search-btn enhanced-search-btn-secondary"
              onClick={handleClear}
              disabled={disabled}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearch;
