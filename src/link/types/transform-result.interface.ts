/**
 * Interface for detailed information about link replacements.
 */
export interface LinkReplacementInfo {
    /**
     * Original text of the link.
     */
    text: string;
    
    /**
     * New text of the link (may be the same if preserved).
     */
    newText: string;
    
    /**
     * Original URL of the link.
     */
    originalUrl: string;
    
    /**
     * New local file path for the link.
     */
    localLink: string;
    
    /**
     * The page ID if this was a page link.
     */
    pageId?: string;
    
    /**
     * The document ID if this was a document link.
     */
    documentId?: string;
}

/**
 * Interface for the result of a link transformation operation.
 */
export interface TransformResult {
    /**
     * The transformed content with links replaced.
     */
    transformedContent: string;
    
    /**
     * Information about links that were replaced.
     */
    replacedLinks: LinkReplacementInfo[];
}
