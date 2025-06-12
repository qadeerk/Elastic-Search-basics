import { basicQueries } from './basic-queries.js';
import { booleanLogic } from './boolean-logic.js';
import { rangeFiltering } from './range-filtering.js';
import { advancedFeatures } from './advanced-features.js';

// Registry of all tmdb_movies example categories
const tmdbMoviesCategories = {
  basicQueries,
  booleanLogic,
  rangeFiltering,
  advancedFeatures
};

// Flatten all examples into a single array
export const tmdbMoviesExamples = [
  ...basicQueries,
  ...booleanLogic,
  ...rangeFiltering,
  ...advancedFeatures
];

// Export individual categories for potential future use
export {
  basicQueries,
  booleanLogic,
  rangeFiltering,
  advancedFeatures
};

// Helper functions for working with tmdb_movies examples
export const getTmdbMoviesExamplesByCategory = (category) => {
  return tmdbMoviesCategories[category] || [];
};

export const getTmdbMoviesCategories = () => {
  return Object.keys(tmdbMoviesCategories);
};

export const getTmdbMoviesExampleById = (id) => {
  return tmdbMoviesExamples.find(example => example.id === id);
}; 