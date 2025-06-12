export const tmdbMoviesExamples = [
  {
    id: 'basic_match',
    title: 'Basic Match Query',
    description: 'Find titles containing specific terms',
    query: `{
  "query": {
    "match": {
      "title": "{{searchTerm}}"
    }
  }
}`,
    explanation: 'A basic match query searches for the specified terms in the title field. It uses full-text search with analysis and scoring.',
    concepts: ['Full-text search', 'Analysis', 'BM25 scoring', 'Match query'],
    variableHints: {
      searchTerm: 'Enter movie title keywords (e.g., "star wars")'
    }
  },
  {
    id: 'match_phrase',
    title: 'Match Phrase Query',
    description: 'Find exact phrase matches',
    query: `{
  "query": {
    "match_phrase": {
      "original_title": "{{phrase}}"
    }
  }
}`,
    explanation: 'Match phrase query finds documents containing the exact phrase in the specified order. Useful for precise matches.',
    concepts: ['Phrase matching', 'Term positions', 'Exact order matching'],
    variableHints: {
      phrase: 'Enter exact phrase (e.g., "le fabuleux destin d\'amelie poulain")'
    }
  },
  {
    id: 'multi_match',
    title: 'Multi-Match Query',
    description: 'Search across multiple fields',
    query: `{
  "query": {
    "multi_match": {
      "query": "{{searchTerm}}",
      "fields": ["title", "overview"]
    }
  }
}`,
    explanation: 'Multi-match searches across multiple fields simultaneously. The best matching field contributes to the final score.',
    concepts: ['Multi-field search', 'Cross-field scoring', 'Field boosting'],
    variableHints: {
      searchTerm: 'Enter keywords to search in title and overview (e.g., "space adventure")'
    }
  },
  {
    id: 'bool_must',
    title: 'Boolean Must Query',
    description: 'Combine multiple conditions with AND logic',
    query: `{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "{{searchTerm}}"
          }
        },
        {
          "term": {
            "genres.name.keyword": "{{genre}}"
          }
        }
      ]
    }
  }
}`,
    explanation: 'Boolean must query combines multiple conditions that all must be satisfied. Uses AND logic for precise filtering.',
    concepts: ['Boolean queries', 'Must clause', 'Term queries', 'Keyword fields'],
    variableHints: {
      searchTerm: 'Enter title keywords (e.g., "star")',
      genre: 'Enter exact genre (e.g., "Science Fiction")'
    }
  },
  {
    id: 'bool_should',
    title: 'Boolean Should Query',
    description: 'Combine multiple conditions with OR logic',
    query: `{
  "query": {
    "bool": {
      "should": [
        {
          "term": {
            "genres.name.keyword": "{{genre1}}"
          }
        },
        {
          "term": {
            "genres.name.keyword": "{{genre2}}"
          }
        }
      ],
      "minimum_should_match": 1
    }
  }
}`,
    explanation: 'Boolean should query matches documents satisfying at least one condition. Uses OR logic with minimum match requirements.',
    concepts: ['Boolean queries', 'Should clause', 'Minimum should match', 'OR logic'],
    variableHints: {
      genre1: 'Enter first genre (e.g., "Comedy")',
      genre2: 'Enter second genre (e.g., "Drama")'
    }
  },
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
  }
]; 