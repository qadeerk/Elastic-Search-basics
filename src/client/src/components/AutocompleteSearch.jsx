import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useApi } from '../context/ApiContext';
import { useDataset } from '../context/DatasetContext';

const AutocompleteSearch = ({ 
  onSearch, 
  searchTerm, 
  setSearchTerm, 
  disabled = false, 
  fieldName = null, // Field name for field-specific suggestions
  variableName = 'searchTerm', // Variable name for placeholder
  placeholder = null // Custom placeholder override
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  
  const api = useApi();
  const { currentDataset } = useDataset();

  // Check if this is a date field
  const isDateField = variableName.toLowerCase().startsWith('date:') || 
                     variableName.toLowerCase().includes('date');

  // Generate placeholder text based on variable name
  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    // Convert variable name to readable format
    const readableName = variableName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();

    // Special handling for date fields
    if (isDateField) {
      return `Select ${readableName.replace(/date:/i, '').trim() || 'date'}...`;
    }
    
    // Add context based on field name
    if (fieldName && fieldName !== 'general') {
      const fieldDisplay = fieldName.split('.').pop(); // Get last part of nested field
      return `Enter ${readableName} for ${fieldDisplay}...`;
    }
    
    return `Enter ${readableName}...`;
  };

  // Parse date string to Date object
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Format date to ISO string
  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Handle date picker change
  const handleDateChange = (date) => {
    const formattedDate = formatDate(date);
    setSearchTerm(formattedDate);
    onSearch(formattedDate);
    setShowDatePicker(false);
  };

  // Calculate date picker position
  const getDatePickerPosition = () => {
    if (!inputRef.current) return { top: '100%', left: 0 };
    
    const rect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const datePickerHeight = 280; // Approximate height of date picker
    const datePickerWidth = 250; // Approximate width of date picker
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top, left;
    
    if (spaceAbove >= datePickerHeight) {
      // Position directly above the input
      top = rect.top - datePickerHeight - 8;
    } else if (spaceBelow >= datePickerHeight) {
      // Position directly below the input
      top = rect.bottom + 8;
    } else {
      // Position in viewport center
      top = Math.max(10, (viewportHeight - datePickerHeight) / 2);
    }
    
    // Center horizontally relative to input, but keep within viewport
    left = rect.left + (rect.width - datePickerWidth) / 2;
    left = Math.max(10, Math.min(left, viewportWidth - datePickerWidth - 10));
    
    return {
      position: 'fixed',
      top: top,
      left: left,
      zIndex: 9999
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback((term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (term.trim().length > 0 && !isDateField) {
        onSearch(term);
        fetchSuggestions(term);
      }
    }, 300); // 300ms delay
  }, [onSearch, isDateField]);

  // Fetch search suggestions using the new API
  const fetchSuggestions = async (term) => {
    if (!currentDataset || !term.trim() || isDateField) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.getSuggestions(currentDataset, fieldName, term, 8);
      
      if (response.suggestions) {
        setSuggestions(response.suggestions.map(suggestion => ({
          text: suggestion.text,
          count: suggestion.count,
          field: suggestion.field
        })));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    
    if (value.trim().length > 0 && !isDateField) {
      debouncedSearch(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      if (!isDateField) {
        onSearch(''); // Clear search for non-date fields
      } else {
        onSearch(value); // For date fields, pass the value directly
      }
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (isDateField && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setShowDatePicker(true);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          onSearch(searchTerm);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion) => {
    const suggestionText = suggestion.text || suggestion;
    setSearchTerm(suggestionText);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch(suggestionText);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  // Handle calendar icon click
  const handleCalendarClick = () => {
    if (isDateField) {
      setShowDatePicker(true);
    }
  };

  // Close suggestions and date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      
      // Close date picker if clicking outside
      if (
        showDatePicker &&
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        !event.target.closest('.react-datepicker')
      ) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="autocomplete-container">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isDateField ? (
            <Calendar className="h-4 w-4 text-slate-400" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !isDateField) {
              setShowSuggestions(true);
            }
          }}
          onClick={() => {
            if (isDateField) {
              setShowDatePicker(true);
            }
          }}
          placeholder={getPlaceholderText()}
          disabled={disabled}
          autoComplete="off"
          className={`autocomplete-input pl-10 ${isDateField ? 'pr-16' : 'pr-10'} ${isDateField ? 'cursor-pointer' : ''}`}
          readOnly={isDateField}
        />
        
        {isDateField && (
          <button
            onClick={handleCalendarClick}
            className="absolute inset-y-0 right-8 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Open calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
        )}
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {loading && !isDateField && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      {isDateField && showDatePicker && (
        <div 
          style={getDatePickerPosition()}
          className="date-picker-portal"
        >
          <DatePicker
            selected={parseDate(searchTerm)}
            onChange={handleDateChange}
            onClickOutside={() => setShowDatePicker(false)}
            inline
            calendarClassName="shadow-lg border border-slate-200 rounded-lg"
          />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isDateField && (
        <div
          ref={suggestionsRef}
          className="autocomplete-dropdown"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`autocomplete-item ${
                index === selectedIndex ? 'highlighted' : ''
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <span className="truncate">{suggestion.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch; 