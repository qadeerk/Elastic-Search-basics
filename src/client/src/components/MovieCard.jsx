import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, variant = 'default' }) => {
  const {
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    vote_average,
    vote_count,
    popularity,
    genres,
    cast,
    directors,
    runtime,
    tagline
  } = movie;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    // Using TMDB image base URL - you may need to adjust this based on your setup
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const renderRating = () => {
    if (!vote_average) return null;
    
    const rating = Math.round(vote_average * 10) / 10;
    const ratingPercentage = (rating / 10) * 100;
    
    return (
      <div className="movie-rating">
        <div className="rating-circle">
          <svg className="rating-svg" viewBox="0 0 36 36">
            <path
              className="rating-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="rating-progress"
              strokeDasharray={`${ratingPercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="rating-text">{rating}</div>
        </div>
        {vote_count && (
          <span className="vote-count">({vote_count.toLocaleString()} votes)</span>
        )}
      </div>
    );
  };

  const renderGenres = () => {
    if (!genres || genres.length === 0) return null;
    
    return (
      <div className="movie-genres">
        {genres.slice(0, 3).map((genre) => (
          <span key={genre.id} className="genre-tag">
            {genre.name}
          </span>
        ))}
      </div>
    );
  };

  const renderCast = () => {
    if (!cast || cast.length === 0) return null;
    
    return (
      <div className="movie-cast">
        <h4>Cast:</h4>
        <p>{cast.slice(0, 3).map(actor => actor.name).join(', ')}</p>
      </div>
    );
  };

  const renderDirectors = () => {
    if (!directors || directors.length === 0) return null;
    
    return (
      <div className="movie-directors">
        <h4>Director{directors.length > 1 ? 's' : ''}:</h4>
        <p>{directors.map(director => director.name).join(', ')}</p>
      </div>
    );
  };

  const posterUrl = getImageUrl(poster_path);
  const backdropUrl = getImageUrl(backdrop_path);

  return (
    <article className={`movie-card ${variant}`}>
      <div className="movie-poster">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={`${title} Poster`}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="poster-placeholder" style={{ display: posterUrl ? 'none' : 'flex' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 19l3.5-4.5 2.5 3.01L14.5 12l4.5 7H5z"/>
          </svg>
        </div>
        {backdropUrl && variant === 'detailed' && (
          <div className="backdrop-overlay" style={{ backgroundImage: `url(${backdropUrl})` }} />
        )}
      </div>

      <div className="movie-details">
        <div className="movie-header">
          <h3 className="movie-title">{title}</h3>
          {original_title && original_title !== title && (
            <p className="original-title">({original_title})</p>
          )}
          {renderRating()}
        </div>

        {tagline && variant === 'detailed' && (
          <p className="movie-tagline">"{tagline}"</p>
        )}

        <div className="movie-meta">
          <span className="release-date">{formatDate(release_date)}</span>
          {runtime && (
            <>
              <span className="meta-separator">•</span>
              <span className="runtime">{formatRuntime(runtime)}</span>
            </>
          )}
          {popularity && variant === 'detailed' && (
            <>
              <span className="meta-separator">•</span>
              <span className="popularity">Pop: {Math.round(popularity)}</span>
            </>
          )}
        </div>

        {renderGenres()}

        {overview && (
          <p className="movie-overview">
            {overview.length > 200 && variant !== 'detailed' 
              ? `${overview.substring(0, 200)}...` 
              : overview
            }
          </p>
        )}

        {variant === 'detailed' && (
          <div className="movie-credits">
            {renderDirectors()}
            {renderCast()}
          </div>
        )}
      </div>
    </article>
  );
};

export default MovieCard; 