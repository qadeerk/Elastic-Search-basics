import { useState, useEffect, useCallback } from 'react';

const DEFAULT_UI_STATE = {
  searchTipsVisible: true,
  resultsTab: 'raw', // 'tiles', 'raw', 'query', or 'structure'
  tileMappings: {
    tmdb_movies: {
      title: 'title',
      subtitle: 'tagline',
      image: 'poster_path',
      description: 'overview',
      metadata: ['release_date', 'vote_average', 'runtime'],
      genres: 'genres.name',
      cast: 'cast.name'
    }
  }
};

export const useUIState = (dataset) => {
  const [uiState, setUIState] = useState(DEFAULT_UI_STATE);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('elasticSearchUI');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setUIState(prev => ({
          ...DEFAULT_UI_STATE,
          ...parsed
        }));
      }
    } catch (error) {
      console.error('Failed to load UI state from localStorage:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState) => {
    try {
      const stateToSave = { ...uiState, ...newState };
      localStorage.setItem('elasticSearchUI', JSON.stringify(stateToSave));
      setUIState(stateToSave);
    } catch (error) {
      console.error('Failed to save UI state to localStorage:', error);
    }
  }, [uiState]);

  // Helper functions
  const toggleSearchTips = useCallback(() => {
    saveState({ searchTipsVisible: !uiState.searchTipsVisible });
  }, [uiState.searchTipsVisible, saveState]);

  const setResultsTab = useCallback((tab) => {
    saveState({ resultsTab: tab });
  }, [saveState]);

  const setTileMapping = useCallback((datasetName, mapping) => {
    const newMappings = {
      ...uiState.tileMappings,
      [datasetName]: mapping
    };
    saveState({ tileMappings: newMappings });
  }, [uiState.tileMappings, saveState]);

  const getTileMapping = useCallback((datasetName) => {
    return uiState.tileMappings[datasetName] || null;
  }, [uiState.tileMappings]);

  const hasTileMapping = useCallback((datasetName) => {
    return Boolean(uiState.tileMappings[datasetName]);
  }, [uiState.tileMappings]);

  return {
    uiState,
    toggleSearchTips,
    setResultsTab,
    setTileMapping,
    getTileMapping,
    hasTileMapping,
    saveState
  };
}; 