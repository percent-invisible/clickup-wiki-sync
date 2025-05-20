/**
 * Information about a replaced link
 */
export interface LinkReplacementInfo {
    text: string;
    newText: string;
    originalUrl: string;
    localLink: string;
    pageId?: string;
    documentId?: string;
}
