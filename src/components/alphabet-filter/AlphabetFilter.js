import React, { useMemo } from 'react';
import './AlphabetFilter.css';

const AlphabetFilter = ({ 
  data, 
  dataKey, 
  onFilterChange, 
  selectedLetter, 
  className = "",
  showAll = true,
  allLabel = "All"
}) => {
  // Extract unique first letters from the data
  const availableLetters = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    const letters = new Set();
    data.forEach(item => {
      const value = item[dataKey];
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

  const handleLetterClick = (letter) => {
    onFilterChange(letter === selectedLetter ? '' : letter);
  };

  const handleAllClick = () => {
    onFilterChange('');
  };

  return (
    <div className={`alphabet-filter-container ${className}`}>
      {showAll && (
        <button
          className={`alphabet-filter-btn alphabet-filter-btn-all ${
            !selectedLetter ? 'active' : ''
          }`}
          onClick={handleAllClick}
        >
          {allLabel}
        </button>
      )}
      
      <div className="alphabet-filter-letters">
        {allLetters.map(letter => {
          const isAvailable = availableLetters.includes(letter);
          const isActive = selectedLetter === letter;
          
          return (
            <button
              key={letter}
              className={`alphabet-filter-btn ${
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
      
      {selectedLetter && (
        <div className="alphabet-filter-active">
          <span className="alphabet-filter-active-label">
            Filtering by: <strong>{selectedLetter}</strong>
          </span>
          <button
            className="alphabet-filter-clear"
            onClick={handleAllClick}
            title="Clear filter"
          >
            <i className="la la-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AlphabetFilter;
