export const booleanLogic = [
  {
    id: 'bool_must',
    title: 'Boolean Must Query (AND)',
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
    title: 'Boolean Should Query (OR)',
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
    id: 'bool_must_not',
    title: 'Boolean Must Not Query (NOT)',
    description: 'Exclude documents matching certain conditions',
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
      "must_not": [
        {
          "term": {
            "adult": true
          }
        }
      ]
    }
  }
}`,
    explanation: 'Boolean must_not excludes documents matching the specified conditions while including those that match the must clause.',
    concepts: ['Boolean queries', 'Must not clause', 'Exclusion logic', 'Content filtering'],
    variableHints: {
      searchTerm: 'Enter overview keywords (e.g., "love")'
    }
  },
  {
    id: 'bool_filter',
    title: 'Boolean with Filter Context',
    description: 'Combine query and filter contexts for performance',
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
          "range": {
            "vote_average": {
              "gte": {{minRating}}
            }
          }
        },
        {
          "term": {
            "adult": false
          }
        }
      ]
    }
  }
}`,
    explanation: 'Combines scoring queries (must) with non-scoring filters for better performance. Filters are cached and faster for exact matches.',
    concepts: ['Filter context', 'Query context', 'Performance optimization', 'Caching'],
    variableHints: {
      searchTerm: 'Enter title keywords (e.g., "action")',
      minRating: 'Enter minimum rating (e.g., 7.0)'
    }
  }
]; 