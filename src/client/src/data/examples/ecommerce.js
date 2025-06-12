export const ecommerceExamples = [
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
    id: 'price_filter',
    title: 'Price Range Filter',
    description: 'Filter products by price range',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "category": "{{category}}"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "price": {
              "gte": {{minPrice}},
              "lte": {{maxPrice}}
            }
          }
        }
      ]
    }
  }
}`,
    explanation: 'Combines category matching with price range filtering. Uses filter context for efficient price filtering without scoring.',
    concepts: ['Boolean queries', 'Range filters', 'Filter context', 'Performance optimization'],
    variableHints: {
      category: 'Enter product category (e.g., "Electronics")',
      minPrice: 'Enter minimum price (e.g., 50)',
      maxPrice: 'Enter maximum price (e.g., 500)'
    }
  },
  {
    id: 'faceted_search',
    title: 'Faceted Product Search',
    description: 'Search with category and brand facets',
    query: `{
  "query": {
    "match": {
      "name": "{{searchTerm}}"
    }
  },
  "aggs": {
    "categories": {
      "terms": {
        "field": "category.keyword",
        "size": 10
      }
    },
    "brands": {
      "terms": {
        "field": "brand.keyword",
        "size": 10
      }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 200 },
          { "from": 200, "to": 500 },
          { "from": 500 }
        ]
      }
    }
  }
}`,
    explanation: 'Provides search results with facets for categories, brands, and price ranges. Essential for ecommerce filtering UI.',
    concepts: ['Aggregations', 'Terms aggregation', 'Range aggregation', 'Faceted search'],
    variableHints: {
      searchTerm: 'Enter product name (e.g., "laptop")'
    }
  },
  {
    id: 'inventory_filter',
    title: 'In-Stock Products',
    description: 'Filter products that are in stock',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "{{searchTerm}}",
            "fields": ["name", "description"]
          }
        }
      ],
      "filter": [
        {
          "range": {
            "stock_quantity": {
              "gt": 0
            }
          }
        },
        {
          "term": {
            "available": true
          }
        }
      ]
    }
  },
  "sort": [
    { "popularity": "desc" },
    { "_score": "desc" }
  ]
}`,
    explanation: 'Searches products while filtering for availability and stock. Sorts by popularity first, then relevance score.',
    concepts: ['Boolean filters', 'Inventory management', 'Multi-level sorting', 'Availability filtering'],
    variableHints: {
      searchTerm: 'Enter product search (e.g., "smartphone")'
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
  }
]; 