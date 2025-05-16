import MarkdownIt from 'markdown-it';
import { LinkType, ParsedLink } from '../types';
import { LinkParser } from './link-parser.class';

/**
 * Transforms ClickUp markdown content to local wiki format.
 */
export class MarkdownTransformer {

    private linkParser: LinkParser;

    constructor() {
        this.linkParser = new LinkParser();
    }

    /**
     * Transform markdown content, replacing ClickUp links with local equivalents.
     */
    public transform(options: { content: string; basePath: string; pageMapping: Record<string, string> }): string {

        const { content, basePath, pageMapping } = options;

        const links = this.linkParser.parseLinks({ content });
        let transformedContent = content;

        for (const link of links) {

            const localLink = this.createLocalLink({ link, basePath, pageMapping });

            if (localLink) {

                let newText = link.text;
                // If the link text is empty and this is a page/doc/linked_page, substitute the page name from mapping
                if (!newText && [LinkType.PAGE, LinkType.LINKED_PAGE, LinkType.DOC].includes(link.type)) {
                    // Try to get the page name from mapping using pageId or documentId
                    let pageName = '';
                    if (link.pageId && pageMapping[link.pageId]) {
                        const mapped = pageMapping[link.pageId];
                        pageName = mapped.split('/').pop()?.replace(/\.md$/, '') || '';
                    } else if (link.documentId && pageMapping[link.documentId]) {
                        const mapped = pageMapping[link.documentId];
                        pageName = mapped.split('/').pop()?.replace(/\.md$/, '') || '';
                    }
                    newText = pageName || 'Untitled';
                }
                // Always match the original text (may be empty)
                const pattern = new RegExp(`\\[${this.escapeRegExp(link.text)}\\]\\(${this.escapeRegExp(link.url)}\\)`, 'g');
                transformedContent = transformedContent.replace(pattern, `[${newText}](${localLink})`);
            }
        }

        return transformedContent;
    }

    /**
     * Create a local link from a parsed ClickUp link using record-based programming.
     */
    private static readonly localLinkHandlers: Record<string, (options: {
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

    private createLocalLink(options: { link: ParsedLink; basePath: string; pageMapping: Record<string, string> }): string | null {
        const { link, basePath, pageMapping } = options;

        return MarkdownTransformer.localLinkHandlers[link.type]?.({ link, basePath, pageMapping }) ?? null;
    }

    /**
     * Escape special characters for use in a regular expression.
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
