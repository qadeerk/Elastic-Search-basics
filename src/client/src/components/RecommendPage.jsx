import React, { useState, useEffect, useRef } from 'react';
import { Star, Play, Save, Clock, AlertCircle, Lightbulb, FileText, Sparkles, X } from 'lucide-react';
import DatasetSelector from './DatasetSelector';
import QueryEditor from './QueryEditor';
import { useDataset } from '../context/DatasetContext';
import { useApi } from '../context/ApiContext';

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

const RecommendPage = () => {
  const [query, setQuery] = useState('{\n  "size": 5,\n  "query": {\n    "more_like_this": {\n      "fields": ["*"],\n      "like": "sample text for recommendations",\n      "min_term_freq": 1,\n      "min_doc_freq": 1\n    }\n  }\n}');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [showTips, setShowTips] = useState(true);

  const { currentDataset } = useDataset();
  const api = useApi();
  
  // Resizable panels hook
  const { width: leftPanelWidth, handleMouseDown } = useResizable(50);

  const executeRecommendation = async () => {
    if (!currentDataset) {
      setError('Please select a dataset first');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await api.getRecommendations(currentDataset, query);
      setRecommendations(response);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      setError(err.message);
      setRecommendations(null);
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async () => {
    const name = prompt('Enter a name for this recommendation query:');
    if (name) {
      try {
        await api.saveQuery(name, currentDataset, query, 'recommend');
        alert('Recommendation query saved successfully!');
      } catch (err) {
        alert('Failed to save query: ' + err.message);
      }
    }
  };

  const loadSampleQueries = () => {
    const samples = [
      {
        name: 'More Like This - Text',
        query: '{\n  "size": 5,\n  "query": {\n    "more_like_this": {\n      "fields": ["*"],\n      "like": "machine learning artificial intelligence",\n      "min_term_freq": 1,\n      "min_doc_freq": 1\n    }\n  }\n}'
      },
      {
        name: 'More Like This - Document',
        query: '{\n  "size": 5,\n  "query": {\n    "more_like_this": {\n      "fields": ["*"],\n      "like": [\n        {\n          "_index": "your_index",\n          "_id": "document_id"\n        }\n      ],\n      "min_term_freq": 1,\n      "min_doc_freq": 1\n    }\n  }\n}'
      },
      {
        name: 'Boost Similar Categories',
        query: '{\n  "size": 5,\n  "query": {\n    "bool": {\n      "should": [\n        {\n          "more_like_this": {\n            "fields": ["category", "tags"],\n            "like": "technology software",\n            "boost": 2.0\n          }\n        },\n        {\n          "match": {\n            "description": "innovation"\n          }\n        }\n      ]\n    }\n  }\n}'
      }
    ];

    const selected = prompt(`Select a sample query:\n${samples.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}\n\nEnter number (1-${samples.length}):`);
    const index = parseInt(selected) - 1;
    
    if (index >= 0 && index < samples.length) {
      setQuery(samples[index].query);
    }
  };

  const formatRecommendations = (data) => {
    if (!data || !data.recommendations) return null;

    return data.recommendations.map((rec, index) => (
      <div key={rec._id || index} className="result-card fade-in mb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="badge badge-primary">
                Score: {rec._score?.toFixed(3) || 'N/A'}
              </span>
            </div>
            <span className="text-xs text-slate-500">ID: {rec._id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Rank #{index + 1}</span>
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor((rec._score || 0) * 5) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {rec.highlight && (
          <div className="mb-3 p-3 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-xs font-medium text-purple-700 mb-1">Highlighted matches:</div>
            <div className="text-sm text-purple-800">
              {Object.entries(rec.highlight).map(([field, highlights]) => (
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
            {JSON.stringify(rec._source, null, 2)}
          </pre>
        </div>
      </div>
    ));
  };

  return (
    <div className="dev-tool-layout">
      <div className="dev-tool-content">
        {/* Left Panel - Recommendation Query */}
        <div 
          className="bg-white border-r border-slate-200 flex flex-col"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Recommendation Query</h2>
            </div>
            <DatasetSelector />
          </div>
          
          <div className="panel-content space-y-4">
            {/* Tips - Closable */}
            {showTips && (
              <div className="closable-tip">
                <button
                  onClick={() => setShowTips(false)}
                  className="tip-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="tip-content">
                  <p className="tip-title">Recommendation Tips:</p>
                  <ul className="space-y-1">
                    <li>• Use "more_like_this" query for content-based recommendations</li>
                    <li>• Specify fields to focus on specific attributes</li>
                    <li>• Adjust min_term_freq and min_doc_freq for precision</li>
                    <li>• Use boost values to prioritize certain fields</li>
                  </ul>
                  <button
                    onClick={loadSampleQueries}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Load sample queries →
                  </button>
                </div>
              </div>
            )}

            {/* Query Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Elasticsearch Query
              </label>
              <QueryEditor
                value={query}
                onChange={setQuery}
                placeholder="Enter your recommendation query (e.g., more_like_this)..."
                height={350}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={executeRecommendation}
                disabled={loading || !currentDataset}
                className="btn-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
              </button>
              
              <button
                onClick={saveQuery}
                disabled={!query.trim() || !currentDataset}
                className="btn-secondary"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Query
              </button>
            </div>

            {/* Execution Time */}
            {executionTime && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Execution time: {executionTime}ms</span>
                </div>
                {recommendations && (
                  <span className="text-sm text-slate-600">
                    {recommendations.total?.toLocaleString() || recommendations.recommendations?.length || 0} recommendations
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

        {/* Resizer */}
        <div
          className="w-1 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={handleMouseDown}
        ></div>

        {/* Right Panel - Recommendations */}
        <div 
          className="bg-slate-50 flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Recommendations</h2>
            </div>
            {recommendations && (
              <div className="text-sm text-slate-600">
                {recommendations.total?.toLocaleString() || recommendations.recommendations?.length || 0} recommendations found
              </div>
            )}
          </div>
          
          <div className="panel-content">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner mr-3"></div>
                <span className="text-slate-600">Finding recommendations...</span>
              </div>
            ) : recommendations ? (
              <div className="space-y-4">
                {(!recommendations.recommendations || recommendations.recommendations.length === 0) ? (
                  <div className="text-center py-12 text-slate-500">
                    <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No recommendations found</p>
                    <p className="text-sm mt-1">Try adjusting your query parameters</p>
                  </div>
                ) : (
                  formatRecommendations(recommendations)
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-lg font-medium">Ready to recommend</p>
                <p className="text-sm mt-1">Execute a recommendation query to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendPage; 