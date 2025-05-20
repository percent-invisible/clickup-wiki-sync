/**
 * Interface for ClickUp API configuration.
 */
export interface ClickupConfig {
    /**
     * ClickUp API key.
     */
    apiKey: string;
    
    /**
     * Output path for wiki files (relative to project root).
     */
    outputPath: string;
    
    /**
     * Maximum depth for recursively fetching documents.
     * Use -1 for unlimited depth.
     */
    maxPageFetchDepth: number;
    
    /**
     * Enable debug mode for additional logging.
     */
    debug: boolean;
}
