export const basicQueries = [
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
    id: 'match_all',
    title: 'Match All Query',
    description: 'Retrieve all documents with neutral scoring',
    query: `{
  "query": {
    "match_all": {}
  }
}`,
    explanation: 'Retrieves all movies with each hit getting a neutral score of 1.0. Useful as a base query or for browsing.',
    concepts: ['Match all', 'Neutral scoring', 'Base queries'],
    variableHints: {}
  }
]; 