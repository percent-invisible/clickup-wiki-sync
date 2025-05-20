import { LINK_TYPE } from './link-type.enum';

/**
 * Interface for a parsed link from ClickUp markdown content.
 */
export interface ParsedLink {
    /**
     * The original URL of the link.
     */
    url: string;
    
    /**
     * The text content of the link.
     */
    text: string;
    
    /**
     * The type of link based on its pattern.
     */
    type: LINK_TYPE;
    
    /**
     * The workspace ID if present in the URL.
     */
    workspaceId?: string;
    
    /**
     * The document ID if present in the URL.
     */
    documentId?: string;
    
    /**
     * The page ID if present in the URL.
     */
    pageId?: string;
    
    /**
     * The original full match string.
     */
    fullMatch?: string;
}
