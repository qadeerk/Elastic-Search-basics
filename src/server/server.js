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