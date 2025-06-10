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
      // Handle both old and new response formats
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
      // Handle both old and new response formats - this is the fix for the error
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
      cast: hit._source.cast?.slice(0, 5), // Top 5 cast members
      directors: hit._source.directors,
      runtime: hit._source.runtime,
      tagline: hit._source.tagline,
      highlight: hit.highlight
    }));
  }

  async testConnection() {
    try {
      const health = await this.client.cluster.health();
      // Handle both old and new response formats
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