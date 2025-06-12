export const rangeFiltering = [
  {
    id: 'range_date',
    title: 'Date Range Query',
    description: 'Filter by date ranges',
    query: `{
  "query": {
    "range": {
      "release_date": {
        "gte": "{{date:startDate}}",
        "lte": "{{date:endDate}}"
      }
    }
  }
}`,
    explanation: 'Range queries filter documents within specified value ranges. Great for dates, numbers, and other ordered data.',
    concepts: ['Range queries', 'Date filtering', 'GTE/LTE operators', 'Date math'],
    variableHints: {
      'date:startDate': 'Enter start date (e.g., "2010-01-01")',
      'date:endDate': 'Enter end date (e.g., "2019-12-31")'
    }
  },
  {
    id: 'rating_filter',
    title: 'Rating Range Filter',
    description: 'Filter movies by rating range',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "overview": "{{searchTerm}}"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "vote_average": {
              "gte": {{minRating}},
              "lte": {{maxRating}}
            }
          }
        }
      ]
    }
  }
}`,
    explanation: 'Combines text search with rating filters. The filter context provides fast, cacheable range filtering.',
    concepts: ['Numeric ranges', 'Filter context', 'Combined queries', 'Rating systems'],
    variableHints: {
      searchTerm: 'Enter search terms (e.g., "adventure")',
      minRating: 'Enter minimum rating (e.g., 6.0)',
      maxRating: 'Enter maximum rating (e.g., 10.0)'
    }
  },
  {
    id: 'popularity_range',
    title: 'Popularity Range Query',
    description: 'Find movies within popularity range',
    query: `{
  "query": {
    "range": {
      "popularity": {
        "gte": {{minPopularity}}
      }
    }
  },
  "sort": [
    { "popularity": "desc" },
    { "vote_average": "desc" }
  ]
}`,
    explanation: 'Filters by popularity threshold and sorts results by popularity and rating. Useful for finding trending content.',
    concepts: ['Popularity metrics', 'Multi-field sorting', 'Trending content', 'Threshold filtering'],
    variableHints: {
      minPopularity: 'Enter minimum popularity (e.g., 100)'
    }
  },
  {
    id: 'exists_filter',
    title: 'Field Exists Filter',
    description: 'Filter documents that have specific fields',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "{{searchTerm}}"
          }
        }
      ],
      "filter": [
        {
          "exists": {
            "field": "poster_path"
          }
        },
        {
          "exists": {
            "field": "overview"
          }
        }
      ]
    }
  }
}`,
    explanation: 'Ensures documents have required fields like poster images and descriptions. Essential for UI completeness.',
    concepts: ['Exists filter', 'Data completeness', 'Field validation', 'UI requirements'],
    variableHints: {
      searchTerm: 'Enter title search (e.g., "comedy")'
    }
  }
]; 