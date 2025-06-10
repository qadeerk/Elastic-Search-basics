import React, { useState, useMemo } from 'react';
import { BarChart3, Play, Save, Clock, AlertCircle, Info, Table } from 'lucide-react';
import DatasetSelector from './DatasetSelector';
import QueryEditor from './QueryEditor';
import { useDataset } from '../context/DatasetContext';
import { useApi } from '../context/ApiContext';

const VisualizePage = () => {
  const [query, setQuery] = useState('{\n  "size": 0,\n  "aggs": {\n    "top_categories": {\n      "terms": {\n        "field": "category.keyword",\n        "size": 10\n      }\n    },\n    "value_stats": {\n      "stats": {\n        "field": "value"\n      }\n    }\n  }\n}');
  const [visualizationData, setVisualizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  const { currentDataset } = useDataset();
  const api = useApi();

  const executeVisualization = async () => {
    if (!currentDataset) {
      setError('Please select a dataset first');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await api.getVisualizationData(currentDataset, query);
      setVisualizationData(response.data);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      setError(err.message);
      setVisualizationData(null);
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async () => {
    const name = prompt('Enter a name for this visualization query:');
    if (name) {
      try {
        await api.saveQuery(name, currentDataset, query, 'visualize');
        alert('Visualization query saved successfully!');
      } catch (err) {
        alert('Failed to save query: ' + err.message);
      }
    }
  };

  const loadSampleQueries = () => {
    const samples = [
      {
        name: 'Terms Aggregation',
        query: '{\n  "size": 0,\n  "aggs": {\n    "categories": {\n      "terms": {\n        "field": "category.keyword",\n        "size": 10\n      }\n    }\n  }\n}'
      },
      {
        name: 'Date Histogram',
        query: '{\n  "size": 0,\n  "aggs": {\n    "over_time": {\n      "date_histogram": {\n        "field": "timestamp",\n        "calendar_interval": "month"\n      }\n    }\n  }\n}'
      },
      {
        name: 'Stats Aggregation',
        query: '{\n  "size": 0,\n  "aggs": {\n    "price_stats": {\n      "stats": {\n        "field": "price"\n      }\n    },\n    "rating_stats": {\n      "stats": {\n        "field": "rating"\n      }\n    }\n  }\n}'
      },
      {
        name: 'Range Aggregation',
        query: '{\n  "size": 0,\n  "aggs": {\n    "price_ranges": {\n      "range": {\n        "field": "price",\n        "ranges": [\n          { "to": 100 },\n          { "from": 100, "to": 500 },\n          { "from": 500 }\n        ]\n      }\n    }\n  }\n}'
      }
    ];

    const selected = prompt(`Select a sample query:\n${samples.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}\n\nEnter number (1-${samples.length}):`);
    const index = parseInt(selected) - 1;
    
    if (index >= 0 && index < samples.length) {
      setQuery(samples[index].query);
    }
  };

  // Process aggregation data for table display
  const processedData = useMemo(() => {
    if (!visualizationData) return null;

    const result = {
      tables: [],
      stats: []
    };

    Object.entries(visualizationData).forEach(([key, agg]) => {
      if (agg.buckets) {
        // Terms or date histogram aggregation
        const tableData = agg.buckets.map(bucket => ({
          key: bucket.key_as_string || bucket.key,
          count: bucket.doc_count,
          percentage: bucket.doc_count_error_upper_bound || 0,
          ...bucket
        }));
        
        result.tables.push({
          title: key.replace(/_/g, ' ').toUpperCase(),
          data: tableData,
          total: tableData.reduce((sum, item) => sum + item.count, 0)
        });
      } else if (agg.count !== undefined) {
        // Stats aggregation
        result.stats.push({
          title: key.replace(/_/g, ' ').toUpperCase(),
          stats: agg
        });
      }
    });

    return result;
  }, [visualizationData]);

  // Modern Data Table Component
  const DataTable = ({ title, data, total }) => (
    <div className="table-container mb-6">
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
        <span className="text-xs text-slate-500">Total: {total.toLocaleString()}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td className="font-medium">{item.key}</td>
                <td>{item.count.toLocaleString()}</td>
                <td>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(item.count / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">
                      {((item.count / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Stats Display Component
  const StatsDisplay = ({ title, stats }) => (
    <div className="table-container mb-6">
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
      </div>
      <div className="p-4">
        <div className="stats-grid">
          {Object.entries(stats)
            .filter(([key]) => key !== 'count')
            .map(([key, value]) => (
              <div key={key} className="stat-item">
                <div className="stat-value">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="stat-label">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dev-tool-layout">
      <div className="dev-tool-content">
        {/* Left Panel - Visualization Query */}
        <div className="dev-panel">
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Visualization Query</h2>
            </div>
            <DatasetSelector />
          </div>
          
          <div className="panel-content space-y-4">
            {/* Tips */}
            <div className="info-alert">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium">Visualization Tips:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Use "size": 0 to skip document results and focus on aggregations</li>
                  <li>• Terms aggregation for categorical data</li>
                  <li>• Date histogram for time-series data</li>
                  <li>• Stats aggregation for numerical summaries</li>
                </ul>
                <button
                  onClick={loadSampleQueries}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Load sample queries →
                </button>
              </div>
            </div>

            {/* Query Editor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Aggregation Query
              </label>
              <QueryEditor
                value={query}
                onChange={setQuery}
                placeholder="Enter your aggregation query..."
                height={350}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={executeVisualization}
                disabled={loading || !currentDataset}
                className="btn-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Visualization'}
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

        {/* Right Panel - Visualizations */}
        <div className="output-panel">
          <div className="panel-header">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-slate-600" />
              <h2 className="panel-title">Data Tables</h2>
            </div>
          </div>
          
          <div className="panel-content">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner mr-3"></div>
                <span className="text-slate-600">Generating visualization...</span>
              </div>
            ) : processedData ? (
              <div className="space-y-6">
                {processedData.tables.map((table, index) => (
                  <DataTable 
                    key={index} 
                    title={table.title} 
                    data={table.data} 
                    total={table.total}
                  />
                ))}
                {processedData.stats.map((stat, index) => (
                  <StatsDisplay key={index} title={stat.title} stats={stat.stats} />
                ))}
                {processedData.tables.length === 0 && processedData.stats.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Table className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium">No aggregation data found</p>
                    <p className="text-sm mt-1">Make sure your query includes aggregations</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-lg font-medium">Ready to visualize</p>
                <p className="text-sm mt-1">Execute an aggregation query to generate tables</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizePage; 