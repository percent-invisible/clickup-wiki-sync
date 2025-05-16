import MarkdownIt from 'markdown-it';
import { ParsedLink } from '../types';
import { LinkParser } from './link-parser.class';
import * as path from 'path';

/**
 * Transforms ClickUp markdown content to local wiki format.
 */
export class MarkdownTransformer {
    private readonly linkParser: LinkParser;

    constructor() {
        this.linkParser = new LinkParser();
    }

    /**
     * Transform markdown content, replacing ClickUp links with local equivalents.
     */
    public transform(options: { content: string; basePath: string; pageMapping: Record<string, { path: string; name: string }>; currentFilePath: string }): string {
        const { content, basePath, pageMapping, currentFilePath } = options;

        const links = this.linkParser.parseLinks({ content });
        let transformedContent = content;
        const currentDir = path.dirname(currentFilePath);

        for (const link of links) {
            let localLink: string | null = null;
            let pageName: string | null = null;
            console.log('transform', JSON.stringify({ link, currentDir }));
            if (link.type === 'doc' && link.documentId && pageMapping[link.documentId]) {
                localLink = path.relative(currentDir, pageMapping[link.documentId].path);

                console.log('transform doc', JSON.stringify({ link, currentDir,  mappingPath: pageMapping[link.documentId].path, localLink }));

                pageName = pageMapping[link.documentId].name;
            } else if ((link.type === 'page' || link.type === 'linked_page') && link.pageId && pageMapping[link.pageId]) {
                localLink = path.relative(currentDir, pageMapping[link.pageId].path);

                console.log('transform doc', JSON.stringify({ link, currentDir, mappingPath: pageMapping[link.pageId].path, localLink }));

                pageName = pageMapping[link.pageId].name;
            }

            if (localLink) {
                if (!localLink.startsWith('.')) localLink = './' + localLink;
                let newText = link.text;
                if (pageName) {
                    newText = pageName;
                } else if (!newText && ['page', 'linked_page', 'doc'].includes(link.type)) {
                    newText = 'Untitled';
                }
                const pattern = new RegExp(`\\[${this.escapeRegExp(link.text)}\\]\\(${this.escapeRegExp(link.url)}\\)`, 'g');
                transformedContent = transformedContent.replace(pattern, `[${newText}](${localLink})`);
            }
        }

        return transformedContent;
    }

    /**
     * Create a local link from a parsed ClickUp link using record-based programming.
     */
    public static readonly LOCAL_LINK_HANDLERS: Record<string, (options: {
        link: ParsedLink;
        basePath: string;
        pageMapping: Record<string, { path: string; name: string }>;
    }) => string | null> = {
        unknown: () => null,
        external: ({ link }) => link.url,
        doc: ({ link, basePath, pageMapping }) => link.documentId && pageMapping[link.documentId] ? pageMapping[link.documentId].path : (link.documentId ? `${basePath}/index.md` : null),
        page: ({ link, pageMapping }) => link.pageId && pageMapping[link.pageId] ? pageMapping[link.pageId].path : null,
        linked_page: ({ link, pageMapping }) => link.pageId && pageMapping[link.pageId] ? pageMapping[link.pageId].path : null
    };

    private createLocalLink(options: { link: ParsedLink; basePath: string; pageMapping: Record<string, { path: string; name: string }>; }): string | null {
        const { link, basePath, pageMapping } = options;

        return MarkdownTransformer.LOCAL_LINK_HANDLERS[link.type]?.({ link, basePath, pageMapping }) ?? null;
    }

    /**
     * Escape special characters for use in a regular expression.
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
