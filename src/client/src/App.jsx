import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import SearchPage from './components/SearchPage';
import RecommendPage from './components/RecommendPage';
import VisualizePage from './components/VisualizePage';
import { DatasetProvider } from './context/DatasetContext';
import { ApiProvider } from './context/ApiContext';

function App() {
  const [isServerConnected, setIsServerConnected] = useState(false);

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:5174/health');
      if (response.ok) {
        setIsServerConnected(true);
      }
    } catch (error) {
      console.error('Server connection failed:', error);
      setIsServerConnected(false);
    }
  };

  if (!isServerConnected) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4 w-8 h-8"></div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Connecting to Elasticsearch Server
          </h2>
          <p className="text-slate-600 mb-4">
            Please ensure the server is running on port 5174
          </p>
          <button
            onClick={checkServerConnection}
            className="btn-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ApiProvider>
      <DatasetProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Navigation />
            <main className="h-[calc(100vh-64px)]">
              <Routes>
                <Route path="/" element={<Navigate to="/search" replace />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/recommend" element={<RecommendPage />} />
                <Route path="/visualize" element={<VisualizePage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </DatasetProvider>
    </ApiProvider>
  );
}

export default App; 