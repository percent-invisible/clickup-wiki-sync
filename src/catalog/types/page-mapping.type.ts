/**
 * Type for mapping page/document IDs to their metadata for link transformation.
 * 
 * This is a simplified version of the catalog that contains only the essential
 * information needed for link transformation.
 */
export type PageMapping = Record<string, {
    /**
     * Absolute file path where the page is written.
     * This is the ONLY path property to be used for any logic or calculation.
     * Never use relative paths from the mapping for any computation.
     */
    absolutePath: string;
    
    /**
     * Name of the page for use in link text when original is empty.
     */
    name: string;
}>;
