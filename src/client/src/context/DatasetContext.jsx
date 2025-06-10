import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useApi } from './ApiContext';

const DatasetContext = createContext();

const initialState = {
  datasets: [],
  currentDataset: null,
  currentMapping: null,
  loading: false,
  error: null,
};

function datasetReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_DATASETS':
      return { ...state, datasets: action.payload, loading: false, error: null };
    case 'SET_CURRENT_DATASET':
      return { ...state, currentDataset: action.payload };
    case 'SET_CURRENT_MAPPING':
      return { ...state, currentMapping: action.payload };
    default:
      return state;
  }
}

export const DatasetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(datasetReducer, initialState);
  const api = useApi();

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.getDatasets();
      dispatch({ type: 'SET_DATASETS', payload: response.datasets || [] });
      
      // Auto-select first dataset if available
      if (response.datasets && response.datasets.length > 0) {
        selectDataset(response.datasets[0].name);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const selectDataset = async (datasetName) => {
    dispatch({ type: 'SET_CURRENT_DATASET', payload: datasetName });
    
    try {
      const response = await api.getDatasetMapping(datasetName);
      dispatch({ type: 'SET_CURRENT_MAPPING', payload: response.mapping });
    } catch (error) {
      console.error('Failed to load dataset mapping:', error);
      dispatch({ type: 'SET_CURRENT_MAPPING', payload: null });
    }
  };

  const getFieldNames = () => {
    if (!state.currentMapping) return [];
    
    try {
      const mapping = state.currentMapping.mappings || state.currentMapping;
      const properties = mapping.properties || {};
      
      const extractFields = (props, prefix = '') => {
        const fields = [];
        
        Object.entries(props).forEach(([key, value]) => {
          const fieldPath = prefix ? `${prefix}.${key}` : key;
          fields.push(fieldPath);
          
          if (value.properties) {
            fields.push(...extractFields(value.properties, fieldPath));
          }
        });
        
        return fields;
      };
      
      return extractFields(properties);
    } catch (error) {
      console.error('Error extracting field names:', error);
      return [];
    }
  };

  const value = {
    ...state,
    loadDatasets,
    selectDataset,
    getFieldNames,
  };

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}; 