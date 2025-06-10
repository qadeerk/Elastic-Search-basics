import React from 'react';
import { Database, ChevronDown } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

const DatasetSelector = () => {
  const { datasets, currentDataset, selectDataset, loading } = useDataset();

  const handleDatasetChange = (event) => {
    const selectedDataset = event.target.value;
    if (selectedDataset && selectedDataset !== currentDataset) {
      selectDataset(selectedDataset);
    }
  };

  const getCurrentDatasetInfo = () => {
    return datasets.find(dataset => dataset.name === currentDataset);
  };

  const currentInfo = getCurrentDatasetInfo();

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Database className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Dataset:</span>
      </div>
      
      <div className="relative">
        <select
          value={currentDataset || ''}
          onChange={handleDatasetChange}
          disabled={loading || datasets.length === 0}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:cursor-not-allowed disabled:bg-slate-100 pr-8 min-w-[200px] 
                     appearance-none cursor-pointer"
        >
          {datasets.length === 0 ? (
            <option value="">No datasets available</option>
          ) : (
            <>
              <option value="">Select a dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.name} value={dataset.name}>
                  {dataset.name} ({dataset.docsCount?.toLocaleString() || 0} docs)
                </option>
              ))}
            </>
          )}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      
      {currentInfo && (
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>{currentInfo.docsCount?.toLocaleString() || 0} documents</span>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector; 