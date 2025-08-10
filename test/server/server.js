const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8991;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Load mock data
let mockData;
try {
  const dataPath = path.join(__dirname, 'mock-data.json');
  mockData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (error) {
  console.error('Failed to load mock data:', error);
  process.exit(1);
}

// Helper function to find extension
function findExtension(id, releaseTag = 'stable') {
  return mockData.extensions.find(ext => 
    ext.id === id && ext.releaseTag === releaseTag
  );
}

// Helper function to get latest version for an extension
function getLatestVersion(id, releaseTag = 'stable') {
  const extensions = mockData.extensions.filter(ext => 
    ext.id === id && ext.releaseTag === releaseTag
  );
  
  if (extensions.length === 0) return null;
  
  // Sort by version in descending order (simple string comparison for demo)
  extensions.sort((a, b) => b.version.localeCompare(a.version));
  return extensions[0];
}

// API Routes

/**
 * Query single extension
 * GET /plugin/query?id=publisher.name&tag=stable|alpha|beta
 */
app.get('/plugin/query', (req, res) => {
  const { id, tag = 'stable' } = req.query;
  
  if (!id) {
    return res.status(400).json({
      error: 'Missing required parameter: id'
    });
  }

  console.log(`[QUERY] Searching for extension: ${id} with tag: ${tag}`);
  
  const extension = getLatestVersion(id, tag);
  
  if (!extension) {
    return res.json({
      extension: null
    });
  }

  res.json({
    extension: extension
  });
});

/**
 * Search extensions by tags
 * GET /plugin/search?tag=tag1,tag2&releaseTag=stable|alpha|beta
 */
app.get('/plugin/search', (req, res) => {
  const { tag, releaseTag = 'stable' } = req.query;
  
  if (!tag) {
    return res.status(400).json({
      error: 'Missing required parameter: tag'
    });
  }

  const searchTags = tag.split(',').map(t => t.trim().toLowerCase());
  console.log(`[SEARCH] Searching for tags: ${searchTags.join(', ')} with releaseTag: ${releaseTag}`);
  
  const matchingExtensions = mockData.extensions.filter(ext => {
    // Match release tag
    if (ext.releaseTag !== releaseTag) return false;
    
    // Match at least one search tag
    const extTags = ext.tags.map(t => t.toLowerCase());
    return searchTags.some(searchTag => 
      extTags.some(extTag => extTag.includes(searchTag))
    );
  });

  res.json({
    extensions: matchingExtensions,
    totalCount: matchingExtensions.length
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Get all available extensions (for debugging)
 */
app.get('/debug/extensions', (req, res) => {
  res.json(mockData);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Custom Marketplace Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${mockData.extensions.length} mock extensions`);
  console.log(`🔍 Available endpoints:`);
  console.log(`   - GET /plugin/query?id=<extensionId>&tag=<releaseTag>`);
  console.log(`   - GET /plugin/search?tag=<tags>&releaseTag=<releaseTag>`);
  console.log(`   - GET /health`);
  console.log(`   - GET /debug/extensions`);
});

module.exports = app;