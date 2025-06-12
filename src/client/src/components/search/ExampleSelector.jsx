import React, { useState, useEffect } from 'react';
import { ChevronDown, BookOpen, Info, Lightbulb } from 'lucide-react';
import { getExamplesForDataset, getVariableHints } from '../../data/examples';

const ExampleSelector = ({ 
  currentDataset, 
  onSelectExample, 
  onVariableHintsChange,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [examples, setExamples] = useState([]);
  const [selectedExample, setSelectedExample] = useState(null);

  useEffect(() => {
    if (currentDataset) {
      const datasetExamples = getExamplesForDataset(currentDataset);
      setExamples(datasetExamples);
      setSelectedExample(null);
    } else {
      setExamples([]);
      setSelectedExample(null);
    }
  }, [currentDataset]);

  const handleSelectExample = (example) => {
    setSelectedExample(example);
    setIsOpen(false);
    
    // Get variable hints for this example
    const hints = getVariableHints(currentDataset, example.id);
    
    // Call the callbacks
    onSelectExample(example.query, example);
    if (onVariableHintsChange) {
      onVariableHintsChange(hints);
    }
  };

  const handleClearSelection = () => {
    setSelectedExample(null);
    onSelectExample('', null);
    if (onVariableHintsChange) {
      onVariableHintsChange({});
    }
  };

  if (!currentDataset || examples.length === 0) {
    return (
      <div className={`text-xs text-slate-400 ${className}`}>
        No examples available for this dataset
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700 truncate">
              {selectedExample ? selectedExample.title : 'Select Query Example'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-slate-600 mb-2 flex items-center">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Examples for {currentDataset}
                </div>
                
                {selectedExample && (
                  <button
                    onClick={handleClearSelection}
                    className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded border-b border-slate-100 mb-1"
                  >
                    Clear Selection
                  </button>
                )}

                {examples.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => handleSelectExample(example)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 border ${
                      selectedExample?.id === example.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-800 mb-1">
                      {example.title}
                    </div>
                    <div className="text-xs text-slate-600 mb-2">
                      {example.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {example.concepts.map((concept, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedExample && (
          <button
            onClick={handleClearSelection}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Show explanation for selected example */}
      {selectedExample && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">
                {selectedExample.title}
              </div>
              <div className="text-xs text-blue-700">
                {selectedExample.explanation}
              </div>
              <div className="mt-2">
                <div className="text-xs font-medium text-blue-800 mb-1">Concepts covered:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedExample.concepts.map((concept, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExampleSelector; 