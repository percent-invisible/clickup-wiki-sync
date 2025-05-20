/**
 * Type for mapping page/document IDs to their metadata for link transformation.
 * 
 * This is a simplified version of the catalog that contains only the essential
 * information needed for link transformation.
 */
export type PageMapping = Record<string, {
    /**
     * Local file path where the page is written.
     */
    path: string;
    
    /**
     * Name of the page for use in link text when original is empty.
     */
    name: string;
}>;
