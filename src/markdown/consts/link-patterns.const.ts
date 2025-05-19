import { LinkType, ParsedLink } from '../../types';
import { LinkPatternType } from '../types/link-pattern-type.enum';

/**
 * Record-based ClickUp link detection patterns.
 */
export const LINK_PATTERNS: Record<
    LinkPatternType,
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
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/docs\/([^\/]+)\/([^\/]+)(?:\?.*)?$/,
        type: LinkType.LINKED_PAGE,
        keys: ['workspaceId', 'documentId', 'pageId'],
    },
    // Add a more relaxed pattern to catch field type links and other variations
    TABLE_CELL_LINK: {
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/v?\/(?:dc|docs)\/([^\/\?]+)(?:\/([^\/\?]+))?/,
        type: LinkType.LINKED_PAGE,
        keys: ['workspaceId', 'documentId', 'pageId'],
    },
    // Specific pattern for block links
    BLOCK_LINK: {
        regex: /https:\/\/app\.clickup\.com\/([^\/]+)\/v\/dc\/([^\/]+)\/([^\/]+)\?block=([\w-]+)/,
        type: LinkType.PAGE,
        keys: ['workspaceId', 'documentId', 'pageId'],
    },
};
