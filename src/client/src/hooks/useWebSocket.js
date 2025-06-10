import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:5174';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting');
  const [searchResults, setSearchResults] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(WEBSOCKET_URL);
      
      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('Connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code);
        setConnectionStatus('Disconnected');
        
        // Attempt reconnection if not explicitly closed
        if (!event.wasClean && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection failed. Please check if the server is running.');
        setConnectionStatus('Error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to server');
      setConnectionStatus('Error');
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
      setConnectionStatus('Reconnecting');
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  const handleMessage = useCallback((message) => {
    const { type, payload } = message;

    switch (type) {
      case 'SEARCH_RESULTS':
        setSearchResults(payload.movies || []);
        setIsSearching(false);
        break;

      case 'TOP_MOVIES':
        setTopMovies(payload.movies || []);
        break;

      case 'ERROR':
        setError(payload.message);
        setIsSearching(false);
        break;

      case 'PONG':
        // Handle ping/pong for connection health
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      setError('Connection lost. Trying to reconnect...');
    }
  }, []);

  const searchMovies = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    sendMessage({
      type: 'SEARCH_MOVIES',
      payload: { query, size: 10 }
    });
  }, [sendMessage]);

  const getRecommendations = useCallback(() => {
    sendMessage({
      type: 'GET_RECOMMENDATIONS'
    });
  }, [sendMessage]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Ping server periodically to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'PING' });
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [sendMessage]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === 'Connected',
    error,
    
    // Search functionality
    searchMovies,
    searchResults,
    isSearching,
    clearResults,
    
    // Recommendations
    topMovies,
    getRecommendations
  };
}; 