import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SearchBar.css';

// Custom hook for debouncing values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = ({ onSearch, isSearching, placeholder = "Search for movies..." }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const previousQueryRef = useRef('');

  // Use the custom debounce hook
  const debouncedQuery = useDebounce(query, 300);

  // Only trigger search when debounced value actually changes
  useEffect(() => {
    if (debouncedQuery !== previousQueryRef.current) {
      previousQueryRef.current = debouncedQuery;
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // For immediate search on form submit, bypass debouncing
    if (query !== previousQueryRef.current) {
      previousQueryRef.current = query;
      onSearch(query);
    }
  }, [query, onSearch]);

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <div className="search-icon">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
            spellCheck="false"
          />
          
          {isSearching && (
            <div className="search-spinner">
              <div className="spinner"></div>
            </div>
          )}
          
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SearchBar; 