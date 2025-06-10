import React from 'react';
import MovieCard from './MovieCard';
import './RecommendationPanel.css';

const RecommendationPanel = ({ movies, isLoading, error }) => {
  if (error) {
    return (
      <section className="recommendation-panel">
        <div className="recommendation-header">
          <h2>🎬 Top Recommendations</h2>
        </div>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>Failed to load recommendations</p>
          <span className="error-details">{error}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="recommendation-panel">
      <div className="recommendation-header">
        <h2>🎬 Top Recommendations</h2>
        <p className="recommendation-subtitle">Discover highly-rated movies</p>
      </div>

      {isLoading ? (
        <div className="recommendation-loading">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="movie-card-skeleton">
              <div className="skeleton-poster"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-meta"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="recommendation-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              variant="recommendation"
            />
          ))}
        </div>
      ) : (
        <div className="empty-recommendations">
          <div className="empty-icon">🎭</div>
          <h3>No recommendations available</h3>
          <p>We couldn't find any top-rated movies at the moment.</p>
        </div>
      )}
    </section>
  );
};

export default RecommendationPanel; 