/**
 * Interface for entries in the page catalog that stores metadata for each page.
 */
export interface PageCatalogEntry {
    /**
     * The unique ID of the page.
     */
    pageId: string;
    
    /**
     * The document ID that contains this page.
     */
    documentId: string;
    
    /**
     * The workspace ID.
     */
    workspaceId: string;
    
    /**
     * The original ClickUp URL for the page.
     */
    clickupUrl: string;
    
    /**
     * The name of the page.
     */
    name: string;
    
    /**
     * The absolute file path where the page is written.
     * This is the ONLY path property to be used for any logic or calculation.
     * Never use relative paths from the catalog for any computation.
     */
    absolutePath: string;
    
    /**
     * Optional parent page ID for nested pages.
     */
    parentPageId?: string;
}
