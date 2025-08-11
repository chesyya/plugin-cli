import * as semver from 'semver';
import { CustomMarketplaceAPI } from './custom-marketplace-api';
import { log } from './util';

/**
 * Result of version validation
 */
export interface VersionValidationResult {
  isValid: boolean;
  serverVersion?: string;
  localVersion: string;
  releaseTag: 'release' | 'alpha' | 'beta';
  message: string;
  recommendation?: string;
}

/**
 * Options for version validation
 */
export interface ValidationOptions {
  extensionId: string;
  localVersion: string;
  releaseTag?: 'release' | 'alpha' | 'beta';
  allowEqual?: boolean; // Allow publishing same version (useful for re-publishing)
}

/**
 * Version validator for custom marketplace
 * Handles version conflict detection and provides recommendations
 */
export class VersionValidator {
  constructor(private marketplaceAPI: CustomMarketplaceAPI) {}

  /**
   * Validate if local version can be published
   */
  async validateVersion(options: ValidationOptions): Promise<VersionValidationResult> {
    const {
      extensionId,
      localVersion,
      releaseTag = 'release',
      allowEqual = false
    } = options;

    try {
      // Query the marketplace for the latest version
      // For production (release), we don't need tag since there's only one version per number
      // For development (alpha/beta), we need tag to distinguish between alpha and beta of same version
      const queryOptions: any = { id: extensionId };
      if (releaseTag !== 'release') {
        queryOptions.tag = releaseTag;
      }
      
      const extension = await this.marketplaceAPI.queryExtension(queryOptions);

      const result: VersionValidationResult = {
        isValid: false,
        localVersion,
        releaseTag,
        message: '',
        serverVersion: extension?.version
      };

      // If no extension exists on server, allow publishing
      if (!extension) {
        result.isValid = true;
        result.message = `No existing ${releaseTag} version found. Ready to publish ${localVersion}.`;
        return result;
      }

      const serverVersion = extension.version;
      result.serverVersion = serverVersion;

      // Compare versions directly (no prefix needed - tag handles the distinction)
      const comparison = semver.compare(localVersion, serverVersion);

      if (comparison > 0) {
        // Local version is higher - good to publish
        result.isValid = true;
        result.message = `Local version ${localVersion} is higher than server version ${serverVersion}. Ready to publish.`;
      } else if (comparison === 0) {
        // Same version
        if (allowEqual) {
          result.isValid = true;
          result.message = `Re-publishing same version ${localVersion}. This will overwrite the existing version.`;
        } else {
          result.isValid = false;
          result.message = `Local version ${localVersion} already exists on server.`;
          result.recommendation = this.generateVersionRecommendation(localVersion, releaseTag);
        }
      } else {
        // Local version is lower
        result.isValid = false;
        result.message = `Local version ${localVersion} is lower than server version ${serverVersion}.`;
        result.recommendation = this.generateVersionRecommendation(serverVersion, releaseTag);
      }

      return result;
    } catch (error) {
      throw new Error(`Version validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate version bump recommendations
   */
  private generateVersionRecommendation(baseVersion: string, releaseTag: 'release' | 'alpha' | 'beta'): string {
    try {
      const cleaned = semver.clean(baseVersion);
      if (!cleaned) {
        return `Please update your version to be higher than ${baseVersion}`;
      }

      const patch = semver.inc(cleaned, 'patch');
      const minor = semver.inc(cleaned, 'minor');
      const major = semver.inc(cleaned, 'major');

      let recommendations = [
        `  • Patch: ${patch} (for bug fixes)`,
        `  • Minor: ${minor} (for new features)`,
        `  • Major: ${major} (for breaking changes)`
      ];

      if (releaseTag !== 'release') {
        const prereleasePatch = semver.inc(cleaned, 'prerelease', releaseTag);
        const prereleaseMinor = semver.inc(cleaned, 'preminor', releaseTag);
        const prereleaseMajor = semver.inc(cleaned, 'premajor', releaseTag);
        
        recommendations = [
          `  • Pre-patch: ${prereleasePatch}`,
          `  • Pre-minor: ${prereleaseMinor}`,
          `  • Pre-major: ${prereleaseMajor}`,
          ...recommendations
        ];
      }

      return `Suggested version bumps:\n${recommendations.join('\n')}\n\nUse --auto-increment to automatically bump the version.`;
    } catch (error) {
      return `Please update your version to be higher than ${baseVersion}`;
    }
  }

  /**
   * Auto-increment version based on bump type
   */
  static bumpVersion(
    currentVersion: string, 
    bumpType: 'patch' | 'minor' | 'major' | 'prerelease',
    releaseTag?: 'alpha' | 'beta'
  ): string {
    const cleaned = semver.clean(currentVersion);
    if (!cleaned) {
      throw new Error(`Invalid version format: ${currentVersion}`);
    }

    let newVersion: string | null;

    // For alpha/beta, use prerelease versions
    if (releaseTag === 'alpha' || releaseTag === 'beta') {
      if (bumpType === 'prerelease') {
        newVersion = semver.inc(cleaned, 'prerelease', releaseTag);
      } else {
        // Convert bump type to prerelease equivalent
        const prereleaseType = bumpType === 'patch' ? 'prepatch' : 
                             bumpType === 'minor' ? 'preminor' : 'premajor';
        newVersion = semver.inc(cleaned, prereleaseType as any, releaseTag);
      }
    } else {
      // Regular version bump for release
      newVersion = semver.inc(cleaned, bumpType);
    }

    if (!newVersion) {
      throw new Error(`Failed to bump version ${currentVersion} with type ${bumpType}`);
    }

    return newVersion;
  }

  /**
   * Validate version format (standard semver)
   */
  static isValidVersion(version: string): boolean {
    return semver.valid(version) !== null;
  }

  /**
   * Extract release tag from version string
   */
  static extractReleaseTag(version: string): 'release' | 'alpha' | 'beta' {
    // Check semver prerelease tags
    const prerelease = semver.prerelease(version);
    if (prerelease && prerelease.length > 0) {
      const tag = prerelease[0];
      if (typeof tag === 'string') {
        if (tag.includes('alpha')) return 'alpha';
        if (tag.includes('beta')) return 'beta';
      }
    }

    return 'release';
  }

  /**
   * Display validation result to user
   */
  static displayValidationResult(result: VersionValidationResult): void {
    const { isValid, message, recommendation } = result;

    if (isValid) {
      log.done('✅ Version validation passed:');
      log.info(`   ${message}`);
    } else {
      log.error('❌ Version validation failed:');
      log.error(`   ${message}`);
      
      if (recommendation) {
        log.warn('\n💡 Recommendations:');
        log.info(recommendation);
      }
    }
  }
}