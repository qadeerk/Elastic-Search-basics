import React, { useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import RecommendationPanel from './components/RecommendationPanel';
import './App.css';

function App() {
  const {
    connectionStatus,
    isConnected,
    error,
    searchMovies,
    searchResults,
    isSearching,
    clearResults,
    topMovies,
    getRecommendations
  } = useWebSocket();

  // Stable search handler with useCallback to prevent SearchBar re-renders
  const handleSearch = useCallback((query) => {
    if (query.trim()) {
      searchMovies(query);
    } else {
      clearResults();
    }
  }, [searchMovies, clearResults]);

  // Refresh recommendations periodically - stabilized with useCallback
  const fetchRecommendations = useCallback(() => {
    if (isConnected) {
      getRecommendations();
    }
  }, [isConnected, getRecommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const renderConnectionStatus = () => {
    if (connectionStatus === 'Connected') return null;
    
    const statusConfig = {
      'Connecting': { icon: '🔄', text: 'Connecting to server...', className: 'connecting' },
      'Reconnecting': { icon: '🔄', text: 'Reconnecting...', className: 'connecting' },
      'Disconnected': { icon: '🔌', text: 'Disconnected from server', className: 'disconnected' },
      'Error': { icon: '❌', text: 'Connection failed', className: 'error' }
    };

    const config = statusConfig[connectionStatus] || statusConfig['Error'];

    return (
      <div className={`connection-status ${config.className}`}>
        <span className="connection-icon">{config.icon}</span>
        <span className="connection-text">{config.text}</span>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!searchResults.length && !isSearching) return null;

    return (
      <section className="search-results">
        <div className="search-results-header">
          <h2>Search Results</h2>
          {searchResults.length > 0 && (
            <span className="results-count">
              {searchResults.length} movie{searchResults.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {isSearching ? (
          <div className="search-loading">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
            </div>
            <p>Searching movies...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="search-results-grid">
            {searchResults.map((movie) => (
              <MovieCard key={movie.id} movie={movie} variant="detailed" />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No movies found</h3>
            <p>Try searching with different keywords</p>
          </div>
        )}
      </section>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="error-banner">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            className="error-dismiss"
            onClick={() => window.location.reload()}
            aria-label="Refresh page"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        {renderConnectionStatus()}
        
        <div className="container">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-icon">🎬</span>
              Movie Search
            </h1>
            <p className="app-subtitle">
              Discover movies powered by Elasticsearch
            </p>
          </div>

          <div className="search-section">
            <SearchBar
              onSearch={handleSearch}
              isSearching={isSearching}
              placeholder="Search for movies, actors, directors..."
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {renderError()}
          
          {/* Search Results */}
          {renderSearchResults()}

          {/* Recommendations - only show when not searching */}
          {!searchResults.length && !isSearching && (
            <RecommendationPanel
              movies={topMovies}
              isLoading={connectionStatus !== 'Connected' && topMovies.length === 0}
              error={error && topMovies.length === 0 ? error : null}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>
            Built with React, WebSocket, and Elasticsearch | 
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App; 