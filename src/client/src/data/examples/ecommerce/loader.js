import { productSearch } from './product-search.js';
import { filteringFacets } from './filtering-facets.js';

// Registry of all ecommerce example categories
const ecommerceCategories = {
  productSearch,
  filteringFacets
};

// Flatten all examples into a single array
export const ecommerceExamples = [
  ...productSearch,
  ...filteringFacets
];

// Export individual categories for potential future use
export {
  productSearch,
  filteringFacets
};

// Helper functions for working with ecommerce examples
export const getEcommerceExamplesByCategory = (category) => {
  return ecommerceCategories[category] || [];
};

export const getEcommerceCategories = () => {
  return Object.keys(ecommerceCategories);
};

export const getEcommerceExampleById = (id) => {
  return ecommerceExamples.find(example => example.id === id);
}; 