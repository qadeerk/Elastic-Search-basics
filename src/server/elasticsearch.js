import { Client } from '@elastic/elasticsearch';

class ElasticsearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_AUTH ? {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'password'
      } : undefined
    });
    this.index = 'tmdb_movies';
  }

  // Get all available indices/datasets
  async getIndices() {
    try {
      const response = await this.client.cat.indices({ format: 'json' });
      const indices = response?.body || response;
      
      return indices
        .filter(index => !index.index.startsWith('.')) // Filter out system indices
        .map(index => ({
          name: index.index,
          health: index.health,
          status: index.status,
          docsCount: parseInt(index['docs.count']) || 0,
          storeSize: index['store.size']
        }));
    } catch (error) {
      console.error('Error fetching indices:', error);
      throw new Error('Failed to fetch datasets');
    }
  }

  // Get mapping for a specific dataset
  async getMapping(indexName) {
    try {
      const response = await this.client.indices.getMapping({ index: indexName });
      const mapping = response?.body?.[indexName] || response?.[indexName];
      return mapping;
    } catch (error) {
      console.error(`Error fetching mapping for ${indexName}:`, error);
      throw new Error(`Failed to fetch mapping for ${indexName}`);
    }
  }

  // Execute raw Elasticsearch query
  async executeQuery(indexName, query, size = 10) {
    try {
      let searchBody;
      
      // Handle different query formats
      if (typeof query === 'string') {
        try {
          searchBody = JSON.parse(query);
        } catch {
          // If not valid JSON, treat as simple text search
          searchBody = {
            size,
            query: {
              multi_match: {
                query,
                fields: ['*'],
                fuzziness: 'AUTO'
              }
            }
          };
        }
      } else {
        searchBody = query;
      }

      const response = await this.client.search({
        index: indexName,
        body: searchBody
      });

      const hits = response?.body?.hits || response?.hits;
      return {
        total: hits?.total?.value || hits?.total || 0,
        hits: hits?.hits || [],
        took: response?.body?.took || response?.took,
        aggregations: response?.body?.aggregations || response?.aggregations
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  // Get recommendations based on a query or document
  async getRecommendations(indexName, query, size = 5) {
    try {
      let recommendationQuery;

      if (typeof query === 'string') {
        // Simple text-based recommendations
        recommendationQuery = {
          size,
          query: {
            more_like_this: {
              fields: ['*'],
              like: query,
              min_term_freq: 1,
              min_doc_freq: 1
            }
          }
        };
      } else if (query.document_id) {
        // Document-based recommendations
        recommendationQuery = {
          size,
          query: {
            more_like_this: {
              fields: ['*'],
              like: [
                {
                  _index: indexName,
                  _id: query.document_id
                }
              ],
              min_term_freq: 1,
              min_doc_freq: 1
            }
          }
        };
      } else {
        // Use the provided query as-is
        recommendationQuery = query;
      }

      const response = await this.client.search({
        index: indexName,
        body: recommendationQuery
      });

      const hits = response?.body?.hits || response?.hits;
      return {
        total: hits?.total?.value || hits?.total || 0,
        recommendations: hits?.hits || []
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error(`Recommendations failed: ${error.message}`);
    }
  }

  // Get aggregation data for visualizations
  async getVisualizationData(indexName, query) {
    try {
      let visualQuery;

      if (typeof query === 'string') {
        try {
          visualQuery = JSON.parse(query);
        } catch {
          // Default aggregation query for text search
          visualQuery = {
            size: 0,
            query: {
              match_all: {}
            },
            aggs: {
              field_stats: {
                stats: {
                  field: '*'
                }
              },
              top_terms: {
                terms: {
                  field: 'keywords.keyword',
                  size: 10
                }
              }
            }
          };
        }
      } else {
        visualQuery = query;
      }

      const response = await this.client.search({
        index: indexName,
        body: visualQuery
      });

      return response?.body?.aggregations || response?.aggregations || {};
    } catch (error) {
      console.error('Error getting visualization data:', error);
      throw new Error(`Visualization data retrieval failed: ${error.message}`);
    }
  }

  // Legacy movie search methods (keep for backward compatibility)
  async searchMovies(query, size = 10) {
    try {
      const searchQuery = {
        index: this.index,
        body: {
          size,
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query,
                    fields: [
                      'title^3',
                      'original_title^2', 
                      'overview',
                      'tagline',
                      'cast.name^2',
                      'directors.name^2',
                      'genres.name'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                },
                {
                  prefix: {
                    'title.keyword': query
                  }
                }
              ],
              minimum_should_match: 1
            }
          },
          highlight: {
            fields: {
              title: {},
              overview: {}
            }
          },
          sort: [
            { _score: { order: 'desc' } },
            { popularity: { order: 'desc' } },
            { vote_average: { order: 'desc' } }
          ]
        }
      };

      const response = await this.client.search(searchQuery);
      const hits = response?.body?.hits?.hits || response?.hits?.hits || [];
      return this.formatSearchResults(hits);
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw new Error('Search failed');
    }
  }

  async getTopMovies(size = 5) {
    try {
      const topMoviesQuery = {
        index: this.index,
        body: {
          size,
          query: {
            bool: {
              must: [
                { range: { vote_count: { gte: 1000 } } },
                { range: { vote_average: { gte: 7.0 } } }
              ]
            }
          },
          sort: [
            { popularity: { order: 'desc' } },
            { vote_average: { order: 'desc' } }
          ]
        }
      };

      const response = await this.client.search(topMoviesQuery);
      const hits = response?.body?.hits?.hits || response?.hits?.hits || [];
      
      if (!hits || hits.length === 0) {
        console.warn('No top movies found in Elasticsearch index');
        return [];
      }
      
      return this.formatSearchResults(hits);
    } catch (error) {
      console.error('Elasticsearch top movies error:', error);
      throw new Error('Failed to get top movies');
    }
  }

  formatSearchResults(hits) {
    if (!Array.isArray(hits)) {
      console.warn('Invalid hits data received:', hits);
      return [];
    }
    
    return hits.map(hit => ({
      id: hit._source.id,
      title: hit._source.title,
      original_title: hit._source.original_title,
      overview: hit._source.overview,
      poster_path: hit._source.poster_path,
      backdrop_path: hit._source.backdrop_path,
      release_date: hit._source.release_date,
      vote_average: hit._source.vote_average,
      vote_count: hit._source.vote_count,
      popularity: hit._source.popularity,
      genres: hit._source.genres,
      cast: hit._source.cast?.slice(0, 5),
      directors: hit._source.directors,
      runtime: hit._source.runtime,
      tagline: hit._source.tagline,
      highlight: hit.highlight
    }));
  }

  async testConnection() {
    try {
      const health = await this.client.cluster.health();
      const status = health?.body?.status || health?.status || 'unknown';
      console.log('Elasticsearch connection successful:', status);
      return true;
    } catch (error) {
      console.error('Elasticsearch connection failed:', error.message);
      return false;
    }
  }
}

export default ElasticsearchService; 