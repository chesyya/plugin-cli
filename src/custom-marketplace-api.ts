import { HttpClient, HttpClientResponse } from 'typed-rest-client/HttpClient';

/**
 * VSX Extension Raw format (compatible with Open-VSX API)
 */
export interface VSXExtensionRaw {
  namespaceUrl: string;
  reviewsUrl: string;
  name: string;
  namespace: string;
  publishedBy: {
    loginName: string;
    fullName: string;
    avatarUrl: string;
    homepage: string;
    provider: string;
  };
  preRelease: boolean;
  namespaceAccess: string;
  files: {
    download: string;
    manifest: string;
    readme: string;
    license: string;
    icon: string;
  };
  allVersions: { [version: string]: string };
  allVersionsUrl?: string;
  averageRating?: number;
  downloadCount: number;
  reviewCount: number;
  version: string;
  timestamp: string;
  preview?: boolean;
  verified?: boolean;
  displayName?: string;
  namespaceDisplayName: string;
  description?: string;
  categories?: string[];
  extensionKind?: string[];
  tags?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
  markdown?: string;
  galleryTheme?: string;
  url?: string;
  engines?: { [engine: string]: string };
}

/**
 * Custom extension interface (extends VSX format)
 */
export interface CustomExtension extends VSXExtensionRaw {
  id?: string;
  publisher?: string;
  releaseTag?: 'release' | 'alpha' | 'beta';
}

/**
 * Response format for extension query
 */
export interface ExtensionQueryResponse {
  extension: CustomExtension | null;
}

/**
 * Response format for extension search
 */
export interface ExtensionSearchResponse {
  extensions: CustomExtension[];
  totalCount: number;
}

/**
 * Options for querying extensions
 */
export interface QueryOptions {
  id: string;
  tag?: 'release' | 'alpha' | 'beta';
  includeAllVersions?: boolean;
}

/**
 * Options for searching extensions
 */
export interface SearchOptions {
  tag: string | string[];
  releaseTag?: 'release' | 'alpha' | 'beta';
}

/**
 * Configuration for the custom marketplace API
 */
export interface MarketplaceConfig {
  devServerUrl?: string;  // For alpha/beta versions
  prodServerUrl?: string; // For release versions
  baseUrl?: string;       // Legacy: fallback URL
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Custom Marketplace API client
 * Provides integration with custom extension marketplace instead of Microsoft's
 */
export class CustomMarketplaceAPI {
  private readonly client: HttpClient;
  private readonly devServerUrl: string;
  private readonly prodServerUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(config: MarketplaceConfig) {
    // Support dual server architecture
    this.devServerUrl = config.devServerUrl?.replace(/\/$/, '') || config.baseUrl?.replace(/\/$/, '') || 'http://localhost:8991';
    this.prodServerUrl = config.prodServerUrl?.replace(/\/$/, '') || config.baseUrl?.replace(/\/$/, '') || 'http://localhost:8992';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    
    this.client = new HttpClient('vsce-custom-marketplace', [], {
      socketTimeout: this.timeout,
    });
  }

  /**
   * Get the appropriate server URL based on release tag
   */
  private getServerUrl(releaseTag: 'release' | 'alpha' | 'beta' = 'release'): string {
    return releaseTag === 'release' ? this.prodServerUrl : this.devServerUrl;
  }

  /**
   * Query a single extension by ID and optional release tag (VSX compatible)
   */
  async queryExtension(options: QueryOptions): Promise<CustomExtension | null> {
    const { id, tag = 'release', includeAllVersions = false } = options;
    
    if (!id) {
      throw new Error('Extension ID is required');
    }

    const serverUrl = this.getServerUrl(tag);
    const [namespace, name] = id.split('.');
    
    // Use VSX-compatible API
    let url: string;
    if (includeAllVersions) {
      url = `${serverUrl}/api/${namespace}/${name}?includeAllVersions=true`;
    } else {
      url = `${serverUrl}/api/${namespace}/${name}`;
    }
    
    try {
      const response = await this.makeRequest(url);
      
      if (response.message.statusCode && response.message.statusCode !== 200) {
        if (response.message.statusCode === 404) {
          return null; // Extension not found
        }
        throw new Error(`Query failed with status ${response.message.statusCode}`);
      }

      const data: CustomExtension | CustomExtension[] = JSON.parse(await response.readBody());
      
      // Handle both single extension and array of extensions (for includeAllVersions)
      if (Array.isArray(data)) {
        return data.length > 0 ? data[0] : null; // Return latest version
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to query extension ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search extensions by tags
   */
  async searchExtensions(options: SearchOptions): Promise<CustomExtension[]> {
    const { tag, releaseTag = 'stable' } = options;
    
    if (!tag) {
      throw new Error('Search tag is required');
    }

    const serverUrl = this.getServerUrl(releaseTag as 'release' | 'alpha' | 'beta');
    const url = `${serverUrl}/api/-/search`;
    const tagString = Array.isArray(tag) ? tag.join(',') : tag;
    const params = new URLSearchParams({ tag: tagString });
    
    if (releaseTag !== 'stable') {
      params.append('releaseTag', releaseTag);
    }

    const fullUrl = `${url}?${params.toString()}`;
    
    try {
      const response = await this.makeRequest(fullUrl);
      const data: ExtensionSearchResponse = JSON.parse(await response.readBody());
      
      if (response.message.statusCode !== 200) {
        throw new Error(`Search failed with status ${response.message.statusCode}`);
      }

      return data.extensions;
    } catch (error) {
      throw new Error(`Failed to search extensions with tags ${tagString}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all versions of an extension (like Theia does)
   */
  async getAllVersions(extensionId: string, releaseTag: 'release' | 'alpha' | 'beta' = 'release'): Promise<CustomExtension[]> {
    const serverUrl = this.getServerUrl(releaseTag);
    const [namespace, name] = extensionId.split('.');
    const url = `${serverUrl}/api/${namespace}/${name}?includeAllVersions=true`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (response.message.statusCode && response.message.statusCode !== 200) {
        return [];
      }

      const data: CustomExtension[] = JSON.parse(await response.readBody());
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the latest version of an extension for a specific release tag
   */
  async getLatestVersion(extensionId: string, releaseTag: 'release' | 'alpha' | 'beta' = 'release'): Promise<string | null> {
    const extension = await this.queryExtension({ id: extensionId, tag: releaseTag });
    return extension ? extension.version : null;
  }

  /**
   * Check if marketplace servers are healthy
   */
  async healthCheck(releaseTag: 'release' | 'alpha' | 'beta' = 'release'): Promise<boolean> {
    try {
      const serverUrl = this.getServerUrl(releaseTag);
      const response = await this.makeRequest(`${serverUrl}/health`);
      return response.message.statusCode === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(url: string, attempt: number = 1): Promise<HttpClientResponse> {
    try {
      const response = await this.client.get(url);
      
      // If server error and we have retries left, try again
      if (response.message.statusCode && response.message.statusCode >= 500 && attempt < this.retryAttempts) {
        await this.delay(1000 * attempt); // Exponential backoff
        return this.makeRequest(url, attempt + 1);
      }
      
      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await this.delay(1000 * attempt);
        return this.makeRequest(url, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse extension ID into publisher and name components
   */
  static parseExtensionId(extensionId: string): { publisher: string; name: string } {
    const parts = extensionId.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid extension ID format: ${extensionId}. Expected: publisher.name`);
    }
    return {
      publisher: parts[0],
      name: parts[1]
    };
  }

  /**
   * Format extension ID from publisher and name
   */
  static formatExtensionId(publisher: string, name: string): string {
    return `${publisher}.${name}`;
  }
}