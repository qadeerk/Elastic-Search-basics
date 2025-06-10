import React, { useState } from 'react';
import { Search, Play, Save, Clock, AlertCircle, Database, FileText } from 'lucide-react';
import DatasetSelector from './DatasetSelector';
import QueryEditor from './QueryEditor';
import { useDataset } from '../context/DatasetContext';
import { useApi } from '../context/ApiContext';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('{\n  "query": {\n    "match_all": {}\n  },\n  "size": 10\n}');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'query'

  const { currentDataset } = useDataset();
  const api = useApi();

  const executeSearch = async (customQuery = null) => {
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
      if (activeTab === 'search' && searchTerm.trim()) {
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
          size: 10
        }, null, 2);
      }

      const response = await api.executeSearch(currentDataset, searchQuery);
      setResults(response.results);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const saveQuery = async () => {
    const name = prompt('Enter a name for this query:');
    if (name) {
      try {
        await api.saveQuery(name, currentDataset, query, 'search');
        alert('Query saved successfully!');
      } catch (err) {
        alert('Failed to save query: ' + err.message);
      }
    }
  };

  const formatResults = (results) => {
    if (!results || !results.hits) return null;

    return results.hits.map((hit, index) => (
      <div key={hit._id || index} className="result-card fade-in mb-4">
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
            <div className="text-xs font-medium text-blue-700 mb-1">Highlighted matches:</div>
            <div className="text-sm text-blue-800">
              {Object.entries(hit.highlight).map(([field, highlights]) => (
                <div key={field} className="mb-1">
                  <span className="font-medium">{field}:</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: highlights.join(' ... ') }} />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="code-block">
          <pre className="text-xs">
            {JSON.stringify(hit._source, null, 2)}
          </pre>
        </div>
      </div>
    ));
  };

  return (
    <div className="dev-tool-layout">
      <div className="dev-tool-content">
        {/* Left Panel - Search Tools */}
        <div className="dev-panel">
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Search Tools</h2>
            </div>
            <DatasetSelector />
          </div>
          
          <div className="panel-content space-y-4">
            {/* Tab Navigation */}
            <div className="nav-tabs">
              <button
                onClick={() => setActiveTab('search')}
                className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                onClick={() => setActiveTab('query')}
                className={`nav-tab ${activeTab === 'query' ? 'active' : ''}`}
              >
                <Database className="w-4 h-4 mr-2" />
                Query
              </button>
            </div>

            {activeTab === 'search' ? (
              <div className="space-y-4">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Term
                  </label>
                  <form onSubmit={handleSearchSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter search terms..."
                      className="search-input"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={loading || !currentDataset}
                        className="btn-primary"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {loading ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Search Info */}
                <div className="info-alert">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium">Search Tips:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Use quotes for exact phrases: "machine learning"</li>
                      <li>• Supports fuzzy matching automatically</li>
                      <li>• Searches across all fields by default</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Query Editor */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Elasticsearch Query
                  </label>
                  <QueryEditor
                    value={query}
                    onChange={setQuery}
                    placeholder="Enter your Elasticsearch search query..."
                    height={300}
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => executeSearch()}
                    disabled={loading || !currentDataset}
                    className="btn-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? 'Executing...' : 'Execute'}
                  </button>
                  
                  <button
                    onClick={saveQuery}
                    disabled={!query.trim() || !currentDataset}
                    className="btn-secondary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Execution Time */}
            {executionTime && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Execution time: {executionTime}ms</span>
                </div>
                {results && (
                  <span className="text-sm text-slate-600">
                    {results.total.toLocaleString()} results
                  </span>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="error-alert">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="output-panel">
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Search Results</h2>
            </div>
            {results && (
              <div className="text-sm text-slate-600">
                {results.total.toLocaleString()} results
                {results.took && ` in ${results.took}ms`}
              </div>
            )}
          </div>
          
          <div className="panel-content">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner mr-3"></div>
                <span className="text-slate-600">Executing search...</span>
              </div>
            ) : results ? (
              <div className="space-y-4">
                {results.total === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm mt-1">Try adjusting your search terms or query</p>
                  </div>
                ) : (
                  formatResults(results)
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-lg font-medium">Ready to search</p>
                <p className="text-sm mt-1">
                  {activeTab === 'search' 
                    ? 'Enter search terms to find documents' 
                    : 'Execute a query to see results'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 