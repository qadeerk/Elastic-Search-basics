import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import ElasticsearchService from './elasticsearch.js';

class ElasticsearchDevTool {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.elasticsearchService = new ElasticsearchService();
    this.port = process.env.PORT || 5174;
    
    this.setupMiddleware();
    this.setupWebSocket();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Elasticsearch connection test
    this.app.get('/api/test-elasticsearch', async (req, res) => {
      try {
        const isConnected = await this.elasticsearchService.testConnection();
        res.json({ connected: isConnected });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all available indices/datasets
    this.app.get('/api/datasets', async (req, res) => {
      try {
        const indices = await this.elasticsearchService.getIndices();
        res.json({ datasets: indices });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get mapping for a specific dataset
    this.app.get('/api/datasets/:dataset/mapping', async (req, res) => {
      try {
        const { dataset } = req.params;
        const mapping = await this.elasticsearchService.getMapping(dataset);
        res.json({ mapping });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute search query
    this.app.post('/api/search', async (req, res) => {
      try {
        const { dataset, query, size = 10 } = req.body;
        const results = await this.elasticsearchService.executeQuery(dataset, query, size);
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recommendations based on query
    this.app.post('/api/recommend', async (req, res) => {
      try {
        const { dataset, query, size = 5 } = req.body;
        const recommendations = await this.elasticsearchService.getRecommendations(dataset, query, size);
        res.json({ recommendations });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get field-based autocomplete suggestions
    this.app.post('/api/suggest', async (req, res) => {
      try {
        const { dataset, fieldName, query, size = 8 } = req.body;
        
        if (!dataset) {
          return res.status(400).json({ error: 'Dataset is required' });
        }
        
        if (!query || query.trim().length === 0) {
          return res.json({ suggestions: [] });
        }

        let suggestions;
        if (fieldName && fieldName !== 'general') {
          // Field-specific suggestions
          suggestions = await this.elasticsearchService.getFieldSuggestions(dataset, fieldName, query, size);
        } else {
          // General suggestions (fallback)
          suggestions = await this.elasticsearchService.getGeneralSuggestions(dataset, query, size);
        }
        
        res.json({ suggestions });
      } catch (error) {
        console.error('Suggestion error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get aggregation data for visualization
    this.app.post('/api/visualize', async (req, res) => {
      try {
        const { dataset, query } = req.body;
        const visualizationData = await this.elasticsearchService.getVisualizationData(dataset, query);
        res.json({ data: visualizationData });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Save query
    this.app.post('/api/queries', async (req, res) => {
      try {
        const { name, dataset, query, type } = req.body;
        // In a real implementation, you'd save to a database
        // For now, we'll just acknowledge the save
        res.json({ success: true, id: Date.now().toString() });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get saved queries
    this.app.get('/api/queries', async (req, res) => {
      try {
        // In a real implementation, you'd fetch from a database
        res.json({ queries: [] });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get dataset details (count, etc.)
    this.app.get('/api/datasets/:dataset/details', async (req, res) => {
      try {
        const { dataset } = req.params;
        const details = await this.elasticsearchService.getDatasetDetails(dataset);
        res.json({ details });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all tile mappings
    this.app.get('/api/tile-mappings', async (req, res) => {
      try {
        // In a real implementation, you'd fetch from a database
        // For now, return predefined mappings
        const tileMappings = {
          tmdb_movies: {
            title: 'title',
            subtitle: 'tagline',
            image: 'poster_path',
            description: 'overview',
            metadata: ['release_date', 'vote_average', 'runtime'],
            genres: 'genres.name',
            cast: 'cast.name'
          }
        };
        res.json({ mappings: tileMappings });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get tile mapping for specific dataset
    this.app.get('/api/tile-mappings/:dataset', async (req, res) => {
      try {
        const { dataset } = req.params;
        // In a real implementation, you'd fetch from a database
        // For now, return predefined mapping for tmdb_movies
        if (dataset === 'tmdb_movies') {
          const mapping = {
            title: 'title',
            subtitle: 'tagline',
            image: 'poster_path',
            description: 'overview',
            metadata: ['release_date', 'vote_average', 'runtime'],
            genres: 'genres.name',
            cast: 'cast.name'
          };
          res.json({ mapping });
        } else {
          res.json({ mapping: null });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Save tile mapping for dataset
    this.app.post('/api/tile-mappings/:dataset', async (req, res) => {
      try {
        const { dataset } = req.params;
        const { mapping } = req.body;
        
        // In a real implementation, you'd save to a database
        // For now, just acknowledge the save
        console.log(`Saving tile mapping for ${dataset}:`, mapping);
        
        res.json({ success: true, dataset, mapping });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Placeholder endpoint for image handling
    this.app.get('/api/placeholder/:width/:height', (req, res) => {
      const { width, height } = req.params;
      const w = Math.min(Math.max(parseInt(width) || 300, 50), 1000);
      const h = Math.min(Math.max(parseInt(height) || 450, 50), 1000);
      
      // Return a more attractive SVG placeholder
      const svg = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#f8fafc"/>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <circle cx="${w/2}" cy="${h/2 - 20}" r="30" fill="#cbd5e1"/>
          <path d="M${w/2 - 20} ${h/2 - 25} L${w/2 + 20} ${h/2 - 25} L${w/2 + 15} ${h/2 - 15} L${w/2 - 15} ${h/2 - 15} Z" fill="#94a3b8"/>
          <text x="50%" y="${h/2 + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#64748b">
            ${w} × ${h}
          </text>
          <text x="50%" y="${h/2 + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">
            No Image Available
          </text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(svg.trim());
    });

    // Fallback endpoint for any missing images
    this.app.get('/api/placeholder', (req, res) => {
      res.redirect('/api/placeholder/300/450');
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message handling error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async handleMessage(ws, message) {
    const { type, payload } = message;

    switch (type) {
      case 'SEARCH_MOVIES':
        await this.handleSearch(ws, payload);
        break;
      
      case 'GET_RECOMMENDATIONS':
        await this.sendTopMovies(ws);
        break;
      
      case 'PING':
        this.sendMessage(ws, { type: 'PONG', timestamp: Date.now() });
        break;
      
      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  async handleSearch(ws, payload) {
    try {
      const { query, size = 10 } = payload;
      
      if (!query || query.trim().length === 0) {
        this.sendMessage(ws, {
          type: 'SEARCH_RESULTS',
          payload: { movies: [], query: '' }
        });
        return;
      }

      const movies = await this.elasticsearchService.searchMovies(query, size);
      
      this.sendMessage(ws, {
        type: 'SEARCH_RESULTS',
        payload: {
          movies,
          query,
          total: movies.length
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      this.sendError(ws, 'Search failed. Please try again.');
    }
  }

  async sendTopMovies(ws) {
    try {
      const topMovies = await this.elasticsearchService.getTopMovies(5);
      
      this.sendMessage(ws, {
        type: 'TOP_MOVIES',
        payload: { movies: topMovies }
      });
    } catch (error) {
      console.error('Top movies error:', error);
      this.sendError(ws, 'Failed to load recommendations');
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'ERROR',
      payload: { message: errorMessage, timestamp: Date.now() }
    });
  }

  async start() {
    try {
      // Test Elasticsearch connection
      const isConnected = await this.elasticsearchService.testConnection();
      if (!isConnected) {
        console.warn('⚠️  Elasticsearch connection failed. Server will start but search functionality may not work.');
      }

      this.server.listen(this.port, () => {
        console.log(`🚀 Elasticsearch Developer Tool Server running on port ${this.port}`);
        console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}`);
        console.log(`🔍 API endpoints available at: http://localhost:${this.port}/api`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

// Start the server
const server = new ElasticsearchDevTool();
server.start(); 