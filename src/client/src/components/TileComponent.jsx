import React, { useState } from 'react';
import { Star, Calendar, Clock, Users, Image as ImageIcon } from 'lucide-react';

const TileComponent = ({ hit, mapping, index }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getNestedValue = (obj, path) => {
    if (!path) return '';
    
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        if (Array.isArray(current)) {
          return current.map(item => item[key]).filter(Boolean).join(', ');
        }
        return current[key];
      }
      return '';
    }, obj);
  };

  const formatValue = (value, field) => {
    if (!value) return '';
    
    if (field === 'release_date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (field === 'vote_average') {
      return `${Number(value).toFixed(1)}/10`;
    }
    
    if (field === 'runtime') {
      return `${value} min`;
    }
    
    if (Array.isArray(value)) {
      return value.slice(0, 3).join(', ');
    }
    
    return String(value);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    
    // Handle TMDB poster paths
    if (path.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w300${path}`;
    }
    
    return path;
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Create a placeholder component
  const ImagePlaceholder = ({ title }) => (
    <div className="tile-placeholder">
      <ImageIcon className="w-12 h-12 text-slate-300" />
      <span className="text-xs text-slate-500 text-center mt-2 px-2">
        {title || 'No Image'}
      </span>
    </div>
  );

  const title = getNestedValue(hit._source, mapping.title);
  const subtitle = getNestedValue(hit._source, mapping.subtitle);
  const image = getNestedValue(hit._source, mapping.image);
  const description = getNestedValue(hit._source, mapping.description);
  const genres = getNestedValue(hit._source, mapping.genres);
  const cast = getNestedValue(hit._source, mapping.cast);

  const imageUrl = getImageUrl(image);

  return (
    <div className="tile-card fade-in">
      <div className="tile-header">
        <div className="tile-image-container">
          {!imageUrl || imageError ? (
            <ImagePlaceholder title={title} />
          ) : (
            <>
              <img
                src={imageUrl}
                alt={title || 'Document image'}
                className={`tile-image ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ transition: 'opacity 0.3s ease' }}
              />
              {imageLoading && (
                <div className="tile-loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </>
          )}
          <div className="tile-score">
            <Star className="w-3 h-3 text-yellow-500" />
            <span className="text-xs font-medium">
              {hit._score?.toFixed(1) || 'N/A'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="tile-content">
        <div className="tile-title-section">
          <h3 className="tile-title">{title}</h3>
          {subtitle && (
            <p className="tile-subtitle">{subtitle}</p>
          )}
        </div>
        
        {mapping.metadata && (
          <div className="tile-metadata">
            {mapping.metadata.map((field, idx) => {
              const value = getNestedValue(hit._source, field);
              if (!value) return null;
              
              return (
                <div key={idx} className="metadata-item">
                  {field === 'release_date' && <Calendar className="w-3 h-3" />}
                  {field === 'runtime' && <Clock className="w-3 h-3" />}
                  {field === 'vote_average' && <Star className="w-3 h-3" />}
                  <span className="text-xs">{formatValue(value, field)}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {genres && (
          <div className="tile-genres">
            {genres.split(', ').slice(0, 3).map((genre, idx) => (
              <span key={idx} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
        
        {description && (
          <p className="tile-description">
            {description.length > 150 
              ? `${description.substring(0, 150)}...` 
              : description
            }
          </p>
        )}
        
        {cast && (
          <div className="tile-cast">
            <Users className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-600">
              {cast.split(', ').slice(0, 3).join(', ')}
            </span>
          </div>
        )}
        
        {hit.highlight && (
          <div className="tile-highlights">
            <div className="text-xs font-medium text-blue-700 mb-1">Matches:</div>
            <div className="text-xs text-blue-800">
              {Object.entries(hit.highlight).slice(0, 2).map(([field, highlights]) => (
                <div key={field} className="highlight-item">
                  <span className="font-medium">{field}:</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: highlights[0] }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TileComponent; 