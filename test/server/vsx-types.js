// VSX Extension Types (based on Open-VSX API)

/**
 * VSX Extension Raw format compatible with Theia
 */
function createVSXExtensionRaw(extension) {
    const baseUrl = process.env.SERVER_URL || 'http://localhost:8991';
    const { publisher, name, version, displayName, description, tags = [], releaseTag = 'release' } = extension;
    const extensionId = `${publisher}.${name}`;
    
    // Generate all versions based on release tag pattern
    const allVersions = {};
    const versionNum = version.replace(/^(alpha|beta)-/, ''); // Remove prefix if exists
    
    if (releaseTag === 'alpha') {
        allVersions[version] = `${baseUrl}/api/${publisher}/${name}/${version}`;
    } else if (releaseTag === 'beta') {
        allVersions[version] = `${baseUrl}/api/${publisher}/${name}/${version}`;
    } else {
        // Release version
        allVersions[versionNum] = `${baseUrl}/api/${publisher}/${name}/${versionNum}`;
    }
    
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
        allVersions: allVersions,
        allVersionsUrl: `${baseUrl}/api/${publisher}/${name}/versions`,
        averageRating: 0,
        downloadCount: 0,
        reviewCount: 0,
        version: version,
        timestamp: extension.lastUpdated || new Date().toISOString(),
        preview: releaseTag !== 'release',
        verified: false,
        displayName: displayName || name,
        namespaceDisplayName: publisher,
        description: description || '',
        categories: extension.categories || [],
        extensionKind: extension.extensionKind || ['ui'],
        tags: tags,
        license: extension.license || 'MIT',
        homepage: extension.homepage,
        repository: extension.repository,
        sponsorLink: extension.sponsorLink,
        bugs: extension.bugs,
        markdown: 'github',
        galleryColor: extension.galleryColor,
        galleryTheme: extension.galleryTheme || 'light',
        localizedLanguages: extension.localizedLanguages || [],
        qna: extension.qna || 'marketplace',
        badges: extension.badges || [],
        dependencies: extension.dependencies || [],
        bundledExtensions: extension.bundledExtensions || [],
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

/**
 * Create extension query response in VSX format
 */
function createVSXQueryResponse(extensions) {
    return {
        extensions: extensions.map(ext => createVSXExtensionRaw(ext)),
        totalCount: extensions.length
    };
}

/**
 * Extract latest version from extensions array (like Theia does)
 */
function findLatestCompatibleVersion(extensions, releaseTag = 'release') {
    if (!extensions || extensions.length === 0) return null;
    
    // Filter by release tag
    const compatibleExtensions = extensions.filter(ext => {
        if (releaseTag === 'release') {
            return ext.releaseTag === 'release';
        } else {
            return ext.releaseTag === releaseTag;
        }
    });
    
    if (compatibleExtensions.length === 0) return null;
    
    // Sort by version (semantic versioning)
    compatibleExtensions.sort((a, b) => {
        const versionA = a.version.replace(/^(alpha|beta)-/, '');
        const versionB = b.version.replace(/^(alpha|beta)-/, '');
        
        // Simple version comparison (should use semver for production)
        const partsA = versionA.split('.').map(Number);
        const partsB = versionB.split('.').map(Number);
        
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const a = partsA[i] || 0;
            const b = partsB[i] || 0;
            if (a !== b) return b - a; // Descending order
        }
        return 0;
    });
    
    return compatibleExtensions[0];
}

module.exports = {
    createVSXExtensionRaw,
    createVSXQueryResponse,
    findLatestCompatibleVersion
};