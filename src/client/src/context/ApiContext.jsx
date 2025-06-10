import React, { createContext, useContext, useCallback } from 'react';

const ApiContext = createContext();

const API_BASE_URL = 'http://localhost:5174/api';

export const ApiProvider = ({ children }) => {
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }, []);

  const getDatasets = useCallback(async () => {
    return await apiCall('/datasets');
  }, [apiCall]);

  const getDatasetMapping = useCallback(async (dataset) => {
    return await apiCall(`/datasets/${dataset}/mapping`);
  }, [apiCall]);

  const executeSearch = useCallback(async (dataset, query, size = 10) => {
    return await apiCall('/search', {
      method: 'POST',
      body: JSON.stringify({ dataset, query, size }),
    });
  }, [apiCall]);

  const getRecommendations = useCallback(async (dataset, query, size = 5) => {
    return await apiCall('/recommend', {
      method: 'POST',
      body: JSON.stringify({ dataset, query, size }),
    });
  }, [apiCall]);

  const getVisualizationData = useCallback(async (dataset, query) => {
    return await apiCall('/visualize', {
      method: 'POST',
      body: JSON.stringify({ dataset, query }),
    });
  }, [apiCall]);

  const saveQuery = useCallback(async (name, dataset, query, type) => {
    return await apiCall('/queries', {
      method: 'POST',
      body: JSON.stringify({ name, dataset, query, type }),
    });
  }, [apiCall]);

  const getSavedQueries = useCallback(async () => {
    return await apiCall('/queries');
  }, [apiCall]);

  const testConnection = useCallback(async () => {
    return await apiCall('/test-elasticsearch');
  }, [apiCall]);

  const value = {
    getDatasets,
    getDatasetMapping,
    executeSearch,
    getRecommendations,
    getVisualizationData,
    saveQuery,
    getSavedQueries,
    testConnection,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}; 