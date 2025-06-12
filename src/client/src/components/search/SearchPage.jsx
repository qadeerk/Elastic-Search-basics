import React, { useState, useEffect, useRef } from 'react';
import { Play, Clock, AlertCircle, Database, FileText, Settings, X, Grid, Code, ChevronDown, ChevronRight, Search, TreePine, Copy, CheckCircle, Plus, Minus, Calendar } from 'lucide-react';
import DatasetSelector from '../DatasetSelector';
import QueryEditor from '../QueryEditor';
import AutocompleteSearch from '../AutocompleteSearch';
import TileComponent from '../TileComponent';
import DatasetSettingsModal from '../DatasetSettingsModal';
import ExampleSelector from './ExampleSelector';
import { useDataset } from '../../context/DatasetContext';
import { useApi } from '../../context/ApiContext';
import { useUIState } from '../../hooks/useUIState';

// Resizable Panel Hook
const useResizable = (initialWidth = 50) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const containerWidth = window.innerWidth;
      const newWidth = (e.clientX / containerWidth) * 100;
      
      // Constrain between 20% and 80%
      if (newWidth >= 20 && newWidth <= 80) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return { width, handleMouseDown, resizerRef };
};

// Collapsible JSON Component (Enhanced for Structure view)
const CollapsibleJSON = ({ data, title, defaultExpanded = false, path = "" }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (typeof data !== 'object' || data === null) {
    return (
      <div className="flex items-center space-x-2 py-1">
        <span className="text-slate-400 text-xs w-4"></span>
        <span className="text-xs text-slate-600 font-mono">
          {path && <span className="text-blue-600">{path}: </span>}
          <span className={typeof data === 'string' ? 'text-green-700' : 'text-orange-600'}>
            {typeof data === 'string' ? `"${data}"` : String(data)}
          </span>
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((item, index) => [index, item]) : Object.entries(data);
  const isEmpty = entries.length === 0;

  return (
    <div className="font-mono text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1 hover:bg-slate-100 px-1 py-0.5 rounded w-full text-left"
      >
        {isEmpty ? (
          <span className="w-4 h-4"></span>
        ) : (
          isExpanded ? 
            <ChevronDown className="w-3 h-3 text-slate-500" /> : 
            <ChevronRight className="w-3 h-3 text-slate-500" />
        )}
        <span className="text-slate-700">
          {path && <span className="text-blue-600">{path}: </span>}
          <span className="text-slate-500">
            {isArray ? '[' : '{'} 
            {!isEmpty && !isExpanded && (
              <span className="text-slate-400 italic">
                {entries.length} {entries.length === 1 ? 'item' : 'items'}
              </span>
            )}
            {isEmpty && (isArray ? ']' : '}')}
          </span>
        </span>
      </button>
      
      {isExpanded && !isEmpty && (
        <div className="ml-4 border-l border-slate-200 pl-3 mt-1">
          {entries.map(([key, value]) => (
            <CollapsibleJSON
              key={key}
              data={value}
              path={String(key)}
              defaultExpanded={false}
            />
          ))}
          <div className="text-slate-500 mt-1">
            {isArray ? ']' : '}'}
          </div>
        </div>
      )}
    </div>
  );
};

// Copy to Clipboard Hook
const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return { copied, copy };
};

// Dynamic Variable Detection Utility - Updated to handle ANY variable in double curly braces
const extractVariables = (queryString) => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables = new Set();
  let match;
  
  while ((match = variableRegex.exec(queryString)) !== null) {
    const variableName = match[1].trim();
    if (variableName) {
      variables.add(variableName);
    }
  }
  
  return Array.from(variables).sort((a, b) => {
    // Sort so 'searchTerm' comes first if it exists, then alphabetically
    if (a === 'searchTerm') return -1;
    if (b === 'searchTerm') return 1;
    return a.localeCompare(b);
  });
};

// Dynamic Variable Input Component - Updated to handle any variable names and disable autocomplete
const DynamicVariableInputs = ({ 
  variables, 
  variableValues, 
  onVariableChange, 
  onSearch, 
  loading, 
  disabled,
  autocompleteVariables = [], // Disabled by default
  variableHints = {} // Add hints from examples
}) => {
  if (variables.length === 0) return null;

  // Helper function to extract field name from variable name
  const extractFieldName = (variableName) => {
    // Check for explicit field patterns like "field:fieldName" or "search:fieldName"
    if (variableName.includes(':')) {
      const parts = variableName.split(':');
      if (parts.length > 1) {
        return parts[1]; // Return the field name part
      }
    }
    
    // Check for common field name patterns
    const commonFields = [
      'title', 'name', 'description', 'content', 'text', 'body',
      'category', 'type', 'status', 'genre', 'tag', 'keyword',
      'author', 'creator', 'owner', 'user', 'email',
      'location', 'city', 'country', 'address',
      'price', 'amount', 'value', 'score', 'rating'
    ];
    
    const lowerVar = variableName.toLowerCase();
    for (const field of commonFields) {
      if (lowerVar.includes(field)) {
        return field;
      }
    }
    
    // If variable name looks like a direct field name, use it
    if (!lowerVar.includes('search') && !lowerVar.includes('term') && !lowerVar.includes('query')) {
      return variableName;
    }
    
    return null; // General search
  };

  // Helper function to get readable placeholder
  const getPlaceholder = (variableName) => {
    // Use hint from examples if available
    if (variableHints[variableName]) {
      return variableHints[variableName];
    }
    
    // Convert variable name to readable format
    const readable = variableName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[_:-]/g, ' ') // Replace underscores, colons, hyphens with spaces
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
    
    return `Enter ${readable}...`;
  };

  const handleDateClick = (variableName) => {
    // Create a temporary date input to trigger the native date picker
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.position = 'absolute';
    dateInput.style.left = '-9999px';
    dateInput.value = variableValues[variableName] || '';
    
    dateInput.onchange = (e) => {
      onVariableChange(variableName, e.target.value);
      document.body.removeChild(dateInput);
    };
    
    document.body.appendChild(dateInput);
    dateInput.click();
  };

  return (
    <div className="space-y-2">
      {variables.map((variableName) => {
        const hasAutocomplete = autocompleteVariables.includes(variableName);
        const isDateField = variableName.toLowerCase().startsWith('date:') || 
                           variableName.toLowerCase().includes('date');
        const fieldName = extractFieldName(variableName);
        
        return (
          <div key={variableName} className="space-y-1">
            {!(hasAutocomplete || fieldName) && (
              <label className="block text-xs font-medium text-slate-600">
                {variableName}
              </label>
            )}
            
            {hasAutocomplete || fieldName ? (
              // Use AutocompleteSearch for variables with autocomplete or detected field names
              <AutocompleteSearch
                onSearch={(value) => {
                  onVariableChange(variableName, value);
                  if (onSearch && variableName === 'searchTerm') onSearch(value);
                }}
                searchTerm={variableValues[variableName] || ''}
                setSearchTerm={(value) => onVariableChange(variableName, value)}
                disabled={loading || disabled}
                fieldName={fieldName}
                variableName={variableName}
              />
            ) : (
              // Use input with clickable calendar icon for date fields, regular input for others
              <div className="relative">
                <input
                  type="text"
                  value={variableValues[variableName] || ''}
                  onChange={(e) => onVariableChange(variableName, e.target.value)}
                  placeholder={getPlaceholder(variableName)}
                  disabled={loading || disabled}
                  autoComplete="off"
                  className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDateField ? 'pr-8' : ''
                  }`}
                />
                {isDateField && (
                  <button
                    type="button"
                    onClick={() => handleDateClick(variableName)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-50 rounded-r-md transition-colors"
                    title="Open calendar"
                  >
                    <Calendar className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Enhanced Variable Substitution - Updated to handle any variable names
const substituteVariables = (queryString, variableValues) => {
  let result = queryString;
  
  // Replace all variables
  Object.entries(variableValues).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
};

// Add default size to query if not present
const ensureDefaultSize = (queryString, defaultSize = 10) => {
  try {
    const query = JSON.parse(queryString);
    
    // Add default size if not present
    if (!query.hasOwnProperty('size')) {
      query.size = defaultSize;
    }
    
    return JSON.stringify(query, null, 2);
  } catch (error) {
    // If query is invalid JSON, return as-is
    return queryString;
  }
};

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [variableValues, setVariableValues] = useState({});
  const [variableHints, setVariableHints] = useState({});
  const [dynamicVariables, setDynamicVariables] = useState([]);
  const [query, setQuery] = useState('{\n  "query": {\n    "bool": {\n      "must": [\n        {\n          "match": {\n            "title": "{{searchTerm}}"\n          }\n        }\n      ],\n      "filter": [\n        {\n          "term": {\n            "category": "{{category}}"\n          }\n        },\n        {\n          "range": {\n            "created_date": {\n              "gte": "{{date:startDate}}",\n              "lte": "{{date:endDate}}"\n            }\n          }\n        },\n        {\n          "range": {\n            "updated_at": {\n              "gte": "{{lastModified}}"\n            }\n          }\n        }\n      ]\n    }\n  },\n  "size": 10\n}');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [executedQuery, setExecutedQuery] = useState(null);
  const [selectedExample, setSelectedExample] = useState(null);

  const { currentDataset } = useDataset();
  const api = useApi();
  const { 
    uiState, 
    toggleSearchTips, 
    setResultsTab, 
    getTileMapping, 
    hasTileMapping 
  } = useUIState();

  // Resizable panels hook
  const { width: leftPanelWidth, handleMouseDown } = useResizable(50);
  const { copied, copy } = useCopyToClipboard();

  // Update dynamic variables when query changes
  useEffect(() => {
    const detectedVariables = extractVariables(query);
    setDynamicVariables(detectedVariables);
    
    // Clean up removed variables from values
    const newVariableValues = { ...variableValues };
    Object.keys(newVariableValues).forEach(key => {
      if (!detectedVariables.includes(key)) {
        delete newVariableValues[key];
      }
    });
    
    // Ensure we have the main searchTerm for backward compatibility
    if (detectedVariables.includes('searchTerm') && !newVariableValues.searchTerm) {
      newVariableValues.searchTerm = searchTerm;
    }
    
    setVariableValues(newVariableValues);
  }, [query, searchTerm]);

  // Sync main searchTerm with variableValues for backward compatibility
  useEffect(() => {
    if (variableValues.searchTerm !== searchTerm) {
      setSearchTerm(variableValues.searchTerm || '');
    }
  }, [variableValues.searchTerm, searchTerm]);

  // Handle variable value changes
  const handleVariableChange = (variableName, value) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // Update main searchTerm for backward compatibility
    if (variableName === 'searchTerm') {
      setSearchTerm(value);
    }
  };

  // Execute search function
  const executeSearch = async (customQuery = null, searchMode = 'search') => {
    if (!currentDataset) {
      setError('Please select a dataset first');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      let searchQuery = customQuery || query;
      
      // If using search term, modify the query
      if (searchMode === 'search' && searchTerm.trim()) {
        searchQuery = JSON.stringify({
          query: {
            multi_match: {
              query: searchTerm,
              fields: ["*"],
              fuzziness: "AUTO"
            }
          },
          highlight: {
            fields: {
              "*": {}
            }
          },
          size: 20
        }, null, 2);
      } else if (searchMode === 'query') {
        // Substitute variables in the query
        searchQuery = substituteVariables(searchQuery, variableValues);
        // Ensure default size
        searchQuery = ensureDefaultSize(searchQuery, 10);
      }

      // Store the executed query for display
      setExecutedQuery(searchQuery);

      const response = await api.executeSearch(currentDataset, searchQuery);
      setResults(response.results);
      setExecutionTime(Date.now() - startTime);
      
      // Don't auto-switch tabs for search mode
      // Auto-switch to tiles only if we have mapping and results for query mode
      if (searchMode === 'query' && hasTileMapping(currentDataset) && response.results?.hits?.length > 0) {
        if (uiState.resultsTab === 'raw') {
          setResultsTab('tiles');
        }
      }
    } catch (err) {
      setError(err.message);
      setResults(null);
      setExecutedQuery(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle autocomplete search
  const handleAutocompleteSearch = (term) => {
    setSearchTerm(term);
    handleVariableChange('searchTerm', term);
    if (term.trim()) {
      executeSearch(null, 'search');
    } else {
      setResults(null);
      setExecutedQuery(null);
    }
  };

  // Handle query execution
  const handleQueryExecution = () => {
    executeSearch(query, 'query');
  };

  // Format results for structure display (collapsible like code editor)
  const formatStructureResults = (results) => {
    if (!results || !results.hits) return null;

    return results.hits.map((hit, index) => (
      <div key={hit._id || index} className="result-card fade-in mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TreePine className="w-4 h-4 text-slate-500" />
              <span className="badge badge-primary">
                Score: {hit._score?.toFixed(3) || 'N/A'}
              </span>
            </div>
            <span className="text-xs text-slate-500">ID: {hit._id}</span>
          </div>
          <span className="text-xs text-slate-400">#{index + 1}</span>
        </div>
        
        {hit.highlight && (
          <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-xs font-medium text-blue-700 mb-2 flex items-center">
              <Search className="w-3 h-3 mr-1" />
              Matched content:
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              {Object.entries(hit.highlight).map(([field, highlights]) => (
                <div key={field} className="bg-white p-2 rounded border border-blue-100">
                  <span className="font-medium text-blue-900 capitalize">{field.replace(/[._]/g, ' ')}:</span>{' '}
                  <span 
                    className="text-blue-800" 
                    dangerouslySetInnerHTML={{ __html: highlights.join(' ... ') }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Document Structure</h4>
            <span className="text-xs text-slate-500">
              {Object.keys(hit._source || {}).length} fields
            </span>
          </div>
          <div className="bg-white rounded border border-slate-200 p-3 max-h-96 overflow-y-auto">
            <CollapsibleJSON 
              data={hit._source} 
              defaultExpanded={true}
            />
          </div>
        </div>
      </div>
    ));
  };

  // Format results for raw display - ALWAYS show raw output
  const formatRawResults = (results) => {
    if (!results) {
      return (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-sm text-slate-600 mb-2">Raw Response:</div>
          <pre className="text-xs text-slate-500 bg-white p-3 rounded border overflow-x-auto">
            No results to display
          </pre>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-700 font-medium">Raw Response</div>
            <button
              onClick={() => copy(JSON.stringify(results, null, 2))}
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-xs text-slate-800 bg-white p-3 rounded border overflow-x-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>

        {results.hits && results.hits.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700">Individual Documents:</div>
            {results.hits.map((hit, index) => (
              <div key={hit._id || index} className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="badge badge-primary">
                        Score: {hit._score?.toFixed(3) || 'N/A'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">ID: {hit._id}</span>
                  </div>
                  <span className="text-xs text-slate-400">#{index + 1}</span>
                </div>
                
                {hit.highlight && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-2 flex items-center">
                      <Search className="w-3 h-3 mr-1" />
                      Highlighted matches:
                    </div>
                    <div className="text-sm text-blue-800 space-y-1">
                      {Object.entries(hit.highlight).map(([field, highlights]) => (
                        <div key={field} className="bg-white p-2 rounded border border-blue-100">
                          <span className="font-medium text-blue-900">{field}:</span>{' '}
                          <span 
                            className="text-blue-800" 
                            dangerouslySetInnerHTML={{ __html: highlights.join(' ... ') }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-600 font-medium">Document Source</span>
                    <button
                      onClick={() => copy(JSON.stringify(hit._source, null, 2))}
                      className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-slate-800 overflow-x-auto">
                    {JSON.stringify(hit._source, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Format results for tile display
  const formatTileResults = (results) => {
    if (!results || !results.hits) return null;
    
    const tileMapping = getTileMapping(currentDataset);
    if (!tileMapping) return null;

    return (
      <div className="tiles-grid">
        {results.hits.map((hit, index) => (
          <TileComponent
            key={hit._id || index}
            hit={hit}
            mapping={tileMapping}
            index={index}
          />
        ))}
      </div>
    );
  };

  // Format executed query for display with cURL equivalent
  const formatExecutedQuery = () => {
    if (!executedQuery) return null;

    const elasticsearchUrl = `GET ${currentDataset}/_search`;
    const curlCommand = `curl -X GET "localhost:9200/${currentDataset}/_search" -H "Content-Type: application/json" -d'
${executedQuery}'`;

    try {
      const parsedQuery = JSON.parse(executedQuery);
      return (
        <div className="space-y-4">
          {/* Elasticsearch URL */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">Elasticsearch Dev Tools Command</h3>
              <button
                onClick={() => copy(elasticsearchUrl + '\n' + executedQuery)}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border"
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-800 text-green-400 p-3 rounded font-mono text-sm">
              <div className="text-blue-300">{elasticsearchUrl}</div>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(parsedQuery, null, 2)}
              </pre>
            </div>
          </div>

          {/* cURL Command */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700">cURL Command</h3>
              <button
                onClick={() => copy(curlCommand)}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 bg-white px-2 py-1 rounded border"
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-slate-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
              <pre>{curlCommand}</pre>
            </div>
          </div>

          {/* Query Details */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Query Analysis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Dataset:</span>
                <span className="font-mono text-blue-600">{currentDataset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Method:</span>
                <span className="font-mono text-green-600">GET</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Endpoint:</span>
                <span className="font-mono text-slate-800">/_search</span>
              </div>
              {Object.entries(variableValues).filter(([key, value]) => value && value.trim()).length > 0 && (
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-slate-600 font-medium mb-1">Variables:</div>
                  {Object.entries(variableValues)
                    .filter(([key, value]) => value && value.trim())
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between ml-2">
                        <span className="text-slate-500">
                          <code className="bg-slate-100 px-1 rounded text-xs">{"{{" + key + "}}"}</code>:
                        </span>
                        <span className="font-mono text-purple-600 max-w-xs truncate" title={value}>
                          {value}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-700">
            <strong>Invalid JSON Query:</strong>
          </div>
          <pre className="text-xs mt-2 text-red-800 bg-white p-3 rounded overflow-x-auto">
            {executedQuery}
          </pre>
        </div>
      );
    }
  };

  // Handle example selection
  const handleSelectExample = (exampleQuery, example) => {
    if (exampleQuery) {
      setQuery(exampleQuery);
      setSelectedExample(example);
      // Clear existing variable values when selecting a new example
      setVariableValues({});
    } else {
      setSelectedExample(null);
      setVariableHints({});
    }
  };

  // Handle variable hints from examples
  const handleVariableHintsChange = (hints) => {
    setVariableHints(hints);
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner mr-3"></div>
          <span className="text-slate-600">Executing search...</span>
        </div>
      );
    }

    switch (uiState.resultsTab) {
      case 'tiles':
        if (!hasTileMapping(currentDataset)) {
          return (
            <div className="empty-state">
              <Grid className="empty-state-icon" />
              <p className="empty-state-title">Tiles view not configured</p>
              <p className="empty-state-description">
                Configure tile mapping in dataset settings to use this view
              </p>
            </div>
          );
        }
        if (!results || !results.hits?.length) {
          return (
            <div className="empty-state">
              <Grid className="empty-state-icon" />
              <p className="empty-state-title">No results for tiles view</p>
              <p className="empty-state-description">
                Execute a search to see results in tile format
              </p>
            </div>
          );
        }
        return formatTileResults(results);

      case 'query':
        if (!executedQuery) {
          return (
            <div className="empty-state">
              <Search className="empty-state-icon" />
              <p className="empty-state-title">No query executed</p>
              <p className="empty-state-description">
                Execute a search or query to see the generated query
              </p>
            </div>
          );
        }
        return formatExecutedQuery();

      case 'structure':
        if (!results || !results.hits?.length) {
          return (
            <div className="empty-state">
              <TreePine className="empty-state-icon" />
              <p className="empty-state-title">No results for structure view</p>
              <p className="empty-state-description">
                Execute a search to see results in a structured format
              </p>
            </div>
          );
        }
        if (results.total === 0 || (results.total?.value === 0)) {
          return (
            <div className="empty-state">
              <Database className="empty-state-icon" />
              <p className="empty-state-title">No results found</p>
              <p className="empty-state-description">
                Try adjusting your search terms or query
              </p>
            </div>
          );
        }
        return formatStructureResults(results);

      case 'raw':
      default:
        return formatRawResults(results);
    }
  };

  return (
    <div className="dev-tool-layout">
      <div className="dev-tool-content">
        {/* Left Panel - Search Tools */}
        <div 
          className="bg-white border-r border-slate-200 flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Search Tools</h2>
            </div>
            <div className="flex items-center space-x-2">
              <DatasetSelector />
              <button
                onClick={() => setShowSettings(true)}
                disabled={!currentDataset}
                className="settings-btn"
                title="Dataset Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="panel-content flex flex-col" style={{ height: 'calc(100vh - 116px)' }}>
            {/* Search Tips - Closable */}
            {uiState.searchTipsVisible && (
              <div className="closable-tip flex-shrink-0 mb-4">
                <button
                  onClick={toggleSearchTips}
                  className="tip-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="tip-content">
                  <p className="tip-title">Search Tips:</p>
                  <ul className="space-y-1">
                    <li>• Use quotes for exact phrases: "machine learning"</li>
                    <li>• Supports fuzzy matching automatically</li>
                    <li>• Use <code className="bg-blue-100 px-1 rounded text-xs">{"{{variableName}}"}</code> in query editor for any variable</li>
                    <li>• Field-specific variables: <code className="bg-blue-100 px-1 rounded text-xs">{"{{title}}"}</code>, <code className="bg-blue-100 px-1 rounded text-xs">{"{{category}}"}</code></li>
                    <li>• Date fields: <code className="bg-blue-100 px-1 rounded text-xs">{"{{date:startDate}}"}</code> show calendar icons</li>
                    <li>• Select examples from dropdown to learn Elasticsearch concepts</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Example Selector - Above Help Text */}
            <div className="flex-shrink-0 mb-4">
              <ExampleSelector
                currentDataset={currentDataset}
                onSelectExample={handleSelectExample}
                onVariableHintsChange={handleVariableHintsChange}
              />
            </div>

            {/* Help Text */}
            <div className="flex-shrink-0 mb-3">
              <div className="text-xs text-slate-500">
                Use <code className="bg-slate-100 px-1 rounded">{"{{variableName}}"}</code> to insert variables.
                Examples: <code className="bg-slate-100 px-1 rounded">{"{{title}}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{{category}}"}</code>
                <br />
                Date fields: <code className="bg-slate-100 px-1 rounded">{"{{date:startDate}}"}</code> or variables containing "date" show calendar icons
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Query Editor Section - Takes available space */}
              <div className="flex-1 flex flex-col min-h-0 mb-4">
                <QueryEditor
                  value={query}
                  onChange={setQuery}
                  placeholder="Write your Elasticsearch query here... Use {{variableName}} for dynamic values. Example: {{searchTerm}}, {{category}}, {{date:startDate}}"
                  height="100%"
                />
              </div>

              {/* Bottom section - always visible */}
              <div className="flex-shrink-0 space-y-4">
                {/* Dynamic Variable Inputs - Above Execute button */}
                {dynamicVariables.length > 0 && (
                  <div>
                    <DynamicVariableInputs
                      variables={dynamicVariables}
                      variableValues={variableValues}
                      onVariableChange={handleVariableChange}
                      onSearch={handleAutocompleteSearch}
                      loading={loading}
                      disabled={!currentDataset}
                      autocompleteVariables={[]} // Disabled autocomplete
                      variableHints={variableHints}
                    />
                  </div>
                )}

                {/* Execute Query Button - Always visible */}
                <div>
                  <button
                    onClick={handleQueryExecution}
                    disabled={loading || !currentDataset}
                    className="btn-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? 'Executing...' : 'Execute Query'}
                  </button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="error-alert">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={handleMouseDown}
        ></div>

        {/* Right Panel - Results */}        
        <div 
          className="bg-slate-50 flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Search Results</h2>
            </div>
            {results && executionTime && (
              <div className="text-sm text-slate-600">
                {results.total?.value?.toLocaleString() || results.total?.toLocaleString() || 0} results in {executionTime}ms
              </div>
            )}
          </div>

          {/* Results Tabs - Always visible */}
          <div className="results-tabs">
            <button
              onClick={() => setResultsTab('tiles')}
              className={`results-tab ${uiState.resultsTab === 'tiles' ? 'active' : ''}`}
            >
              <Grid className="w-4 h-4 mr-2" />
              Tiles
            </button>
            <button
              onClick={() => setResultsTab('query')}
              className={`results-tab ${uiState.resultsTab === 'query' ? 'active' : ''}`}
            >
              <Search className="w-4 h-4 mr-2" />
              Query
            </button>
            <button
              onClick={() => setResultsTab('raw')}
              className={`results-tab ${uiState.resultsTab === 'raw' ? 'active' : ''}`}
            >
              <Code className="w-4 h-4 mr-2" />
              Raw
            </button>
            <button
              onClick={() => setResultsTab('structure')}
              className={`results-tab ${uiState.resultsTab === 'structure' ? 'active' : ''}`}
            >
              <TreePine className="w-4 h-4 mr-2" />
              Structure
            </button>
          </div>
          
          <div className="panel-content">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <DatasetSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        dataset={currentDataset}
      />
    </div>
  );
};

export default SearchPage;
