import { LinkType, ParsedLink } from '../types';

/**
 * Record-based ClickUp link detection patterns.
 */
export const LINK_PATTERNS: Record<
    string,
    {
        regex: RegExp;
        type: LinkType;
        keys: (keyof ParsedLink)[];
    }
> = {
    DOC: {
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/v\/dc\/([^\/]+)$/,
        type: LinkType.DOC,
        keys: ['workspaceId', 'documentId'],
    },
    PAGE: {
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/v\/dc\/([^\/]+)\/([^\/]+)$/,
        type: LinkType.PAGE,
        keys: ['workspaceId', 'documentId', 'pageId'],
    },
    LINKED_PAGE: {
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/docs\/([^\/]+)\/([^\/]+)$/,
        type: LinkType.LINKED_PAGE,
        keys: ['workspaceId', 'documentId', 'pageId'],
    },
};
