export const advancedFeatures = [
  {
    id: 'boosted_search',
    title: 'Boosted Multi-Match',
    description: 'Search with field importance weighting',
    query: `{
  "query": {
    "multi_match": {
      "query": "{{searchTerm}}",
      "fields": ["title^3", "overview"]
    }
  }
}`,
    explanation: 'Field boosting increases the importance of matches in specific fields. Title matches are 3x more important than overview matches.',
    concepts: ['Field boosting', 'Relevance scoring', 'Caret notation', 'Score manipulation'],
    variableHints: {
      searchTerm: 'Enter search terms (e.g., "Avengers")'
    }
  },
  {
    id: 'fuzzy_search',
    title: 'Fuzzy Match Query',
    description: 'Handle typos and misspellings',
    query: `{
  "query": {
    "match": {
      "title": {
        "query": "{{searchTerm}}",
        "fuzziness": "AUTO"
      }
    }
  }
}`,
    explanation: 'Fuzzy matching handles typos and misspellings by allowing edit distance. AUTO setting adjusts fuzziness based on term length.',
    concepts: ['Fuzzy matching', 'Edit distance', 'Typo tolerance', 'AUTO fuzziness'],
    variableHints: {
      searchTerm: 'Enter with potential typos (e.g., "Jurrasic Park")'
    }
  },
  {
    id: 'aggregation_facets',
    title: 'Faceted Search with Aggregations',
    description: 'Search with genre and year facets',
    query: `{
  "query": {
    "bool": {
      "filter": {
        "range": {
          "release_date": {
            "gte": "{{date:startYear}}-01-01"
          }
        }
      }
    }
  },
  "aggs": {
    "genres": {
      "terms": {
        "field": "genres.name.keyword"
      }
    },
    "years": {
      "date_histogram": {
        "field": "release_date",
        "calendar_interval": "year"
      }
    }
  },
  "size": 10
}`,
    explanation: 'Combines filtering with aggregations to provide faceted search results. Shows genre and year distributions while filtering.',
    concepts: ['Aggregations', 'Terms aggregation', 'Date histogram', 'Faceted search', 'Filter context'],
    variableHints: {
      'date:startYear': 'Enter start year (e.g., "2020")'
    }
  },
  {
    id: 'complex_nested',
    title: 'Complex Query with Cast Search',
    description: 'Search movies by cast members with nested queries',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "cast",
            "query": {
              "match": {
                "cast.name": "{{actorName}}"
              }
            }
          }
        }
      ],
      "filter": [
        {
          "range": {
            "vote_average": {
              "gte": {{minRating}}
            }
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "title": {},
      "overview": {}
    }
  }
}`,
    explanation: 'Complex query combining nested queries for cast members with rating filters and highlighting. Shows advanced Elasticsearch features.',
    concepts: ['Nested queries', 'Complex boolean logic', 'Highlighting', 'Multiple filters', 'Numeric ranges'],
    variableHints: {
      actorName: 'Enter actor name (e.g., "Samuel L. Jackson")',
      minRating: 'Enter minimum rating (e.g., 7.0)'
    }
  },
  {
    id: 'function_score',
    title: 'Function Score with Date Decay',
    description: 'Custom scoring with recency boost',
    query: `{
  "query": {
    "function_score": {
      "query": {
        "match": {
          "overview": "{{searchTerm}}"
        }
      },
      "functions": [
        {
          "linear": {
            "release_date": {
              "origin": "now",
              "scale": "365d",
              "decay": 0.5
            }
          }
        }
      ],
      "boost_mode": "multiply"
    }
  }
}`,
    explanation: 'Function score query applies custom scoring functions. This example boosts recent movies using linear date decay.',
    concepts: ['Function score', 'Date decay', 'Custom scoring', 'Recency boosting', 'Linear functions'],
    variableHints: {
      searchTerm: 'Enter search terms (e.g., "superhero")'
    }
  }
]; 