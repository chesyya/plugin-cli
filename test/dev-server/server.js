const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8991; // Dev server port
const SERVER_TYPE = 'development';

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

// VSX Extension format converter
function createVSXExtensionRaw(extension) {
  const baseUrl = `http://localhost:${PORT}`;
  const { publisher, name, version, displayName, description, tags = [], categories = [], releaseTag = 'release' } = extension;
  
  return {
    namespaceUrl: `${baseUrl}/api/${publisher}`,
    reviewsUrl: `${baseUrl}/api/${publisher}/${name}/reviews`,
    name: name,
    namespace: publisher,
    publishedBy: {
      loginName: publisher,
      fullName: publisher,
      avatarUrl: `${baseUrl}/api/user/${publisher}/avatar`,
      homepage: `${baseUrl}/user/${publisher}`,
      provider: "custom"
    },
    preRelease: releaseTag !== 'release',
    namespaceAccess: "public",
    files: {
      download: `${baseUrl}/api/${publisher}/${name}/${version}/file/download`,
      manifest: `${baseUrl}/api/${publisher}/${name}/${version}/file/package.json`,
      readme: `${baseUrl}/api/${publisher}/${name}/${version}/file/README.md`,
      license: `${baseUrl}/api/${publisher}/${name}/${version}/file/LICENSE`,
      icon: `${baseUrl}/api/${publisher}/${name}/${version}/file/icon.png`
    },
    allVersions: {
      [version]: `${baseUrl}/api/${publisher}/${name}/${version}`
    },
    allVersionsUrl: `${baseUrl}/api/${publisher}/${name}/versions`,
    averageRating: 0,
    downloadCount: Math.floor(Math.random() * 10000),
    reviewCount: Math.floor(Math.random() * 100),
    version: version,
    timestamp: extension.lastUpdated || new Date().toISOString(),
    preview: releaseTag !== 'release',
    verified: false,
    displayName: displayName || name,
    namespaceDisplayName: publisher,
    description: description || '',
    categories: categories,
    extensionKind: ['ui'],
    tags: tags,
    license: 'MIT',
    homepage: extension.homepage,
    repository: extension.repository,
    markdown: 'github',
    galleryTheme: 'light',
    localizedLanguages: [],
    qna: 'marketplace',
    badges: [],
    dependencies: [],
    bundledExtensions: [],
    allTargetPlatformVersions: [{
      targetPlatform: 'universal',
      version: version,
      uri: `${baseUrl}/api/${publisher}/${name}/${version}`
    }],
    url: `${baseUrl}/extension/${publisher}/${name}`,
    engines: extension.engines || {
      vscode: "^1.74.0"
    }
  };
}

// Helper function to find extensions by ID and release tag
function findExtensions(id, releaseTag) {
  return mockData.extensions.filter(ext => 
    ext.id === id && 
    (releaseTag ? ext.releaseTag === releaseTag : true)
  );
}

// Helper function to get latest version (like Theia)
function findLatestCompatibleVersion(extensions, targetReleaseTag) {
  if (!extensions || extensions.length === 0) return null;
  
  const compatible = extensions.filter(ext => 
    targetReleaseTag ? ext.releaseTag === targetReleaseTag : true
  );
  
  if (compatible.length === 0) return null;
  
  // Sort by timestamp (latest first)
  compatible.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  return compatible[0];
}

/**
 * VSX-compatible API endpoints
 */

// Query extension (VSX format)
app.get('/api/:namespace/:name', (req, res) => {
  const { namespace, name } = req.params;
  const { includeAllVersions, targetPlatform } = req.query;
  const id = `${namespace}.${name}`;
  
  console.log(`[VSX-QUERY] ${id}, includeAllVersions: ${includeAllVersions}`);
  
  const extensions = findExtensions(id);
  if (extensions.length === 0) {
    return res.status(404).json({ error: 'Extension not found' });
  }
  
  if (includeAllVersions === 'true') {
    // Return all versions
    const vsxExtensions = extensions.map(ext => createVSXExtensionRaw(ext));
    res.json(vsxExtensions);
  } else {
    // Return latest version
    const latest = findLatestCompatibleVersion(extensions);
    if (latest) {
      res.json(createVSXExtensionRaw(latest));
    } else {
      res.status(404).json({ error: 'No compatible version found' });
    }
  }
});

// Query extension by version
app.get('/api/:namespace/:name/:version', (req, res) => {
  const { namespace, name, version } = req.params;
  const id = `${namespace}.${name}`;
  
  console.log(`[VSX-QUERY-VERSION] ${id}@${version}`);
  
  const extension = mockData.extensions.find(ext => 
    ext.id === id && ext.version === version
  );
  
  if (extension) {
    res.json(createVSXExtensionRaw(extension));
  } else {
    res.status(404).json({ error: 'Extension version not found' });
  }
});

// Search extensions
app.get('/api/-/search', (req, res) => {
  const { query, category, tag } = req.query;
  
  console.log(`[VSX-SEARCH] query: ${query}, category: ${category}, tag: ${tag}`);
  
  let results = mockData.extensions;
  
  // Filter by query
  if (query) {
    results = results.filter(ext => 
      ext.name.toLowerCase().includes(query.toLowerCase()) ||
      ext.displayName.toLowerCase().includes(query.toLowerCase()) ||
      ext.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Filter by category
  if (category) {
    results = results.filter(ext => 
      ext.categories && ext.categories.some(cat => 
        cat.toLowerCase() === category.toLowerCase()
      )
    );
  }
  
  // Filter by tag
  if (tag) {
    results = results.filter(ext => 
      ext.tags && ext.tags.some(t => 
        t.toLowerCase().includes(tag.toLowerCase())
      )
    );
  }
  
  const vsxResults = results.map(ext => createVSXExtensionRaw(ext));
  res.json({
    extensions: vsxResults,
    totalSize: vsxResults.length
  });
});

/**
 * Legacy API endpoints (backward compatibility)
 */
app.get('/plugin/query', (req, res) => {
  const { id, tag = 'release' } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  console.log(`[LEGACY-QUERY] ${id} with tag: ${tag}`);
  
  const extension = findLatestCompatibleVersion(findExtensions(id), tag);
  
  res.json({
    extension: extension ? createVSXExtensionRaw(extension) : null
  });
});

app.get('/plugin/search', (req, res) => {
  const { tag, releaseTag = 'alpha' } = req.query;
  
  if (!tag) {
    return res.status(400).json({ error: 'Missing required parameter: tag' });
  }

  const searchTags = tag.split(',').map(t => t.trim().toLowerCase());
  console.log(`[LEGACY-SEARCH] tags: ${searchTags.join(', ')} with releaseTag: ${releaseTag}`);
  
  const matchingExtensions = mockData.extensions.filter(ext => {
    if (ext.releaseTag !== releaseTag) return false;
    const extTags = ext.tags.map(t => t.toLowerCase());
    return searchTags.some(searchTag => 
      extTags.some(extTag => extTag.includes(searchTag))
    );
  });

  res.json({
    extensions: matchingExtensions.map(ext => createVSXExtensionRaw(ext)),
    totalCount: matchingExtensions.length
  });
});

/**
 * Health and debug endpoints
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: SERVER_TYPE,
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/debug/extensions', (req, res) => {
  res.json({
    server: SERVER_TYPE,
    ...mockData
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    server: SERVER_TYPE
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development Marketplace Server running on http://localhost:${PORT}`);
  console.log(`📊 Server type: ${SERVER_TYPE}`);
  console.log(`📊 Loaded ${mockData.extensions.length} alpha/beta extensions`);
  console.log(`🔍 VSX API endpoints:`);
  console.log(`   - GET /api/{namespace}/{name}[?includeAllVersions=true]`);
  console.log(`   - GET /api/{namespace}/{name}/{version}`);
  console.log(`   - GET /api/-/search?query={query}`);
  console.log(`🔍 Legacy endpoints:`);
  console.log(`   - GET /plugin/query?id={extensionId}&tag={releaseTag}`);
  console.log(`   - GET /plugin/search?tag={tags}&releaseTag={releaseTag}`);
  console.log(`   - GET /health`);
  console.log(`   - GET /debug/extensions`);
});

module.exports = app;