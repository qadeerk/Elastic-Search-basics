import { tmdbMoviesExamples } from './tmdb_movies.js';
import { ecommerceExamples } from './ecommerce.js';
import { logsExamples } from './logs.js';

// Registry of all dataset examples
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