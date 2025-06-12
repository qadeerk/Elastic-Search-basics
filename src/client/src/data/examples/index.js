import { tmdbMoviesExamples } from './tmdb_movies/loader.js';
import { ecommerceExamples } from './ecommerce/loader.js';
import { logsExamples } from './logs/loader.js';

// Registry of all dataset examples using the new loader structure
export const datasetExamples = {
  'tmdb_movies': tmdbMoviesExamples,
  'ecommerce': ecommerceExamples,
  'products': ecommerceExamples, // Alias for ecommerce
  'logs': logsExamples,
  'application_logs': logsExamples, // Alias for logs
  // Add more datasets here as needed
};

// Get examples for a specific dataset
export const getExamplesForDataset = (datasetName) => {
  return datasetExamples[datasetName] || [];
};

// Get all available datasets that have examples
export const getAvailableDatasets = () => {
  return Object.keys(datasetExamples);
};

// Get a specific example by dataset and id
export const getExampleById = (datasetName, exampleId) => {
  const examples = getExamplesForDataset(datasetName);
  return examples.find(example => example.id === exampleId);
};

// Get variable hints for an example
export const getVariableHints = (datasetName, exampleId) => {
  const example = getExampleById(datasetName, exampleId);
  return example?.variableHints || {};
};

// Advanced functions for category-based access
export const getExamplesByCategory = (datasetName, category) => {
  // Import category-specific functions dynamically based on dataset
  switch (datasetName) {
    case 'tmdb_movies':
      import('./tmdb_movies/loader.js').then(module => {
        return module.getTmdbMoviesExamplesByCategory(category);
      });
      break;
    case 'ecommerce':
    case 'products':
      import('./ecommerce/loader.js').then(module => {
        return module.getEcommerceExamplesByCategory(category);
      });
      break;
    case 'logs':
    case 'application_logs':
      import('./logs/loader.js').then(module => {
        return module.getLogsExamplesByCategory(category);
      });
      break;
    default:
      return [];
  }
};

// Get available categories for a dataset
export const getDatasetCategories = (datasetName) => {
  switch (datasetName) {
    case 'tmdb_movies':
      return ['basicQueries', 'booleanLogic', 'rangeFiltering', 'advancedFeatures'];
    case 'ecommerce':
    case 'products':
      return ['productSearch', 'filteringFacets'];
    case 'logs':
    case 'application_logs':
      return ['errorMonitoring', 'logAnalytics'];
    default:
      return [];
  }
}; 