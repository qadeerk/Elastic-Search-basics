export const productSearch = [
  {
    id: 'product_search',
    title: 'Product Search',
    description: 'Search products by name or description',
    query: `{
  "query": {
    "multi_match": {
      "query": "{{searchTerm}}",
      "fields": ["name^2", "description", "tags"]
    }
  },
  "size": 20
}`,
    explanation: 'Multi-field search across product name, description, and tags. Product name matches are boosted 2x for better relevance.',
    concepts: ['Multi-match query', 'Field boosting', 'Cross-field search'],
    variableHints: {
      searchTerm: 'Enter product search terms (e.g., "wireless headphones")'
    }
  },
  {
    id: 'recommendation_similar',
    title: 'Similar Products (More Like This)',
    description: 'Find products similar to a given product',
    query: `{
  "query": {
    "more_like_this": {
      "fields": ["name", "description", "tags"],
      "like": [
        {
          "_index": "products",
          "_id": "{{productId}}"
        }
      ],
      "min_term_freq": 1,
      "max_query_terms": 12
    }
  },
  "size": 10
}`,
    explanation: 'Uses More Like This query to find products similar to a reference product. Great for recommendation systems.',
    concepts: ['More Like This', 'Similarity search', 'Recommendation systems', 'Content-based filtering'],
    variableHints: {
      productId: 'Enter product ID for similarity search (e.g., "prod_123")'
    }
  },
  {
    id: 'category_search',
    title: 'Category-Based Search',
    description: 'Search within specific product categories',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "{{searchTerm}}",
            "fields": ["name^2", "description"]
          }
        }
      ],
      "filter": [
        {
          "term": {
            "category.keyword": "{{category}}"
          }
        }
      ]
    }
  }
}`,
    explanation: 'Combines text search with category filtering to narrow results within specific product categories.',
    concepts: ['Category filtering', 'Boolean queries', 'Term filters', 'Scoped search'],
    variableHints: {
      searchTerm: 'Enter product search terms (e.g., "gaming")',
      category: 'Enter category (e.g., "Electronics")'
    }
  }
]; 