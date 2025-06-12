export const filteringFacets = [
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
    id: 'brand_filter',
    title: 'Brand-Specific Search',
    description: 'Search products from specific brands',
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
          "terms": {
            "brand.keyword": [{{#brands}}"{{.}}"{{#unless @last}},{{/unless}}{{/brands}}]
          }
        }
      ]
    }
  },
  "aggs": {
    "brands": {
      "terms": {
        "field": "brand.keyword",
        "size": 20
      }
    }
  }
}`,
    explanation: 'Filters products by specific brands while providing brand facets for UI. Supports multiple brand selection.',
    concepts: ['Terms filter', 'Multiple selection', 'Brand filtering', 'Faceted navigation'],
    variableHints: {
      searchTerm: 'Enter product search (e.g., "shoes")',
      brands: 'Enter brand names as array (e.g., ["Nike", "Adidas"])'
    }
  }
]; 