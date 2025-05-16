import { ParsedLink } from '../types';

/**
 * Record-based handler for creating local links from parsed ClickUp links.
 */
export const LOCAL_LINK_HANDLERS: Record<string, (options: {
    link: ParsedLink;
    basePath: string;
    pageMapping: Record<string, string>;
}) => string | null> = {
    unknown: () => null,
    external: ({ link }) => link.url,
    doc: ({ link, basePath }) => link.documentId ? `${basePath}/index.md` : null,
    page: ({ link, pageMapping }) => link.pageId ? pageMapping[link.pageId] || null : null,
    linked_page: ({ link, pageMapping }) => link.pageId ? pageMapping[link.pageId] || null : null
};

