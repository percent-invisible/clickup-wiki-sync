import { LINK_TYPE, LinkPattern } from '../types';

/**
 * Patterns for matching different types of ClickUp links.
 */
export const LINK_PATTERNS: Record<string, LinkPattern> = {
    // Page links with format: https://app.clickup.com/{workspace_id}/v/dc/{doc_id}/{page_id}
    // Must be checked before the document links pattern
    PAGE_LINK: {
        type: LINK_TYPE.PAGE,
        regex: /https:\/\/app\.clickup\.com\/(\d+)\/v\/dc\/([-a-zA-Z0-9]+)\/([-a-zA-Z0-9]+)/,
        captureGroups: ['workspaceId', 'documentId', 'pageId'],
        description: 'Links to a page within a ClickUp document',
    },
    
    // Cross-document page links with format: https://app.clickup.com/{workspace_id}/docs/{doc_id}/{page_id}
    // Listed first to ensure it's checked before the more generic document link pattern
    CROSS_DOC_LINK: {
        type: LINK_TYPE.CROSS_DOC,
        regex: /https:\/\/app\.clickup\.com\/(\d+)\/docs\/([-a-zA-Z0-9]+)\/([-a-zA-Z0-9]+)/,
        captureGroups: ['workspaceId', 'documentId', 'pageId'],
        description: 'Links to a page in a different ClickUp document',
    },
    
    // Document links with format: https://app.clickup.com/{workspace_id}/v/dc/{doc_id} (without page ID)
    DOC_V_DC_LINK: {
        type: LINK_TYPE.DOCUMENT,
        regex: /https:\/\/app\.clickup\.com\/(\d+)\/v\/dc\/([-a-zA-Z0-9]+)(?!\/.+)/,
        captureGroups: ['workspaceId', 'documentId'],
        description: 'Links to a ClickUp document using the v/dc format',
    },
    
    // Document links with format: https://app.clickup.com/{workspace_id}/docs/{doc_id}
    DOC_LINK: {
        type: LINK_TYPE.DOCUMENT,
        regex: /https:\/\/app\.clickup\.com\/(\d+)\/docs\/([-a-zA-Z0-9]+)(?!\/.+)/,
        captureGroups: ['workspaceId', 'documentId'],
        description: 'Links to a ClickUp document',
    },
};
