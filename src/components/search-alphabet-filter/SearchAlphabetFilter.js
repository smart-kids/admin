import React, { useState, useCallback, useMemo } from 'react';
import './SearchAlphabetFilter.css';

const SearchAlphabetFilter = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  onClearSearch,
  alphabetFilter,
  onAlphabetFilterChange,
  data,
  dataKey,
  placeholder = "Search Parent Name, Phone, or Student Name...",
  className = "",
  showClearButton = true,
  debounceMs = 300,
  disabled = false,
  showAll = true,
  allLabel = "ALL"
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Extract unique first letters from the data
  const availableLetters = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    const letters = new Set();
    data.forEach(item => {
      let value = item;
      if (dataKey && typeof dataKey === 'string') {
        const keys = dataKey.split('.');
        for (const key of keys) {
          value = value ? value[key] : undefined;
        }
      } else {
        value = item[dataKey];
      }
      
      if (value && typeof value === 'string') {
        const firstLetter = value.trim().charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          letters.add(firstLetter);
        }
      }
    });
    
    return Array.from(letters).sort();
  }, [data, dataKey]);

  // Generate all alphabet letters for comparison
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

  const handleLetterClick = (letter) => {
    onAlphabetFilterChange(letter === alphabetFilter ? '' : letter);
  };

  const handleAllClick = () => {
    onAlphabetFilterChange('');
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
    <div className={`search-alphabet-filter-container ${className}`}>
      {/* Search Bar */}
      <div className="search-alphabet-filter-search">
        <div className="search-alphabet-filter-input-group">
          <div className="search-alphabet-filter-input-wrapper">
            <input
              type="text"
              className="search-alphabet-filter-input"
              placeholder={placeholder}
              value={localSearchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
            />
            <div className="search-alphabet-filter-icon">
              <i className="flaticon2-search-1"></i>
            </div>
          </div>
          <div className="search-alphabet-filter-actions">
            <button
              className="search-alphabet-filter-btn search-alphabet-filter-btn-primary"
              onClick={handleSearchClick}
              disabled={disabled}
            >
              Search
            </button>
            {showClearButton && localSearchTerm && (
              <button
                className="search-alphabet-filter-btn search-alphabet-filter-btn-secondary"
                onClick={handleClear}
                disabled={disabled}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alphabet Filter */}
      <div className="search-alphabet-filter-alphabet">
        <div className="search-alphabet-filter-letters">
          {showAll && (
            <button
              className={`search-alphabet-filter-btn-letter ${
                !alphabetFilter ? 'active' : ''
              }`}
              onClick={handleAllClick}
            >
              {allLabel}
            </button>
          )}
          
          {allLetters.map(letter => {
            const isAvailable = availableLetters.includes(letter);
            const isActive = alphabetFilter === letter;
            
            return (
              <button
                key={letter}
                className={`search-alphabet-filter-btn-letter ${
                  !isAvailable ? 'disabled' : ''
                } ${isActive ? 'active' : ''}`}
                onClick={() => isAvailable && handleLetterClick(letter)}
                disabled={!isAvailable}
                title={isAvailable ? `Filter by ${letter}` : 'No items starting with this letter'}
              >
                {letter}
              </button>
            );
          })}
        </div>
        
        {alphabetFilter && (
          <div className="search-alphabet-filter-active">
            <span className="search-alphabet-filter-active-label">
              Filtering by: <strong>{alphabetFilter}</strong>
            </span>
            <button
              className="search-alphabet-filter-clear"
              onClick={handleAllClick}
              title="Clear filter"
            >
              <i className="la la-times"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAlphabetFilter;
