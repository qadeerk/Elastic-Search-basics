import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
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
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  
  const api = useApi();
  const { currentDataset } = useDataset();

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
    
    // Add context based on field name
    if (fieldName && fieldName !== 'general') {
      const fieldDisplay = fieldName.split('.').pop(); // Get last part of nested field
      return `Enter ${readableName} for ${fieldDisplay}...`;
    }
    
    return `Enter ${readableName}...`;
  };

  // Debounced search function
  const debouncedSearch = useCallback((term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (term.trim().length > 0) {
        onSearch(term);
        fetchSuggestions(term);
      }
    }, 300); // 300ms delay
  }, [onSearch]);

  // Fetch search suggestions using the new API
  const fetchSuggestions = async (term) => {
    if (!currentDataset || !term.trim()) {
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
    
    if (value.trim().length > 0) {
      debouncedSearch(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearch(''); // Clear search
    }
  };

  // Handle key navigation
  const handleKeyDown = (e) => {
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={getPlaceholderText()}
          disabled={disabled}
          className="autocomplete-input pl-10 pr-10"
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
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