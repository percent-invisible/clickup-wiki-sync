import * as path from 'path';
import { PageMapping } from '../filesystem/types';
import { ParsedLink } from '../types';
import { LinkType } from '../types/link-type.enum';
import { LinkParser } from './link-parser.class';
import { LinkHandlerFn, LinkReplacementInfo, TransformResult } from './types';

/**
 * Transforms ClickUp markdown content to local wiki format.
 */
export class MarkdownTransformer {
    private readonly linkParser: LinkParser;

    constructor() {
        this.linkParser = new LinkParser();
    }

    /**
     * Transforms markdown content, replacing ClickUp links with local equivalents.
     */
    public async transform({
        content,
        pageMapping,
        currentFilePath,
        diagnoseLinks = false,
    }: {
        content: string;
        pageMapping: PageMapping;
        currentFilePath: string;
        diagnoseLinks?: boolean;
    }): Promise<string | TransformResult> {
        const links = await this.linkParser.parseLinks({ content });
        let transformedContent = content;
        const currentDir = path.dirname(currentFilePath);
        const replacedLinks: LinkReplacementInfo[] = [];

        for (const link of links) {
            const lookupId =
                link.type === LinkType.DOC && link.documentId && pageMapping[link.documentId]
                    ? link.documentId
                    : (link.type === LinkType.PAGE || link.type === LinkType.LINKED_PAGE) &&
                        link.pageId &&
                        pageMapping[link.pageId]
                      ? link.pageId
                      : null;

            if (lookupId == null) {
                continue;
            }

            let localLink: string = path.relative(currentDir, pageMapping[lookupId].path);
            const pageName: string = pageMapping[lookupId].name;

            if (localLink) {
                if (!localLink.startsWith('.')) {
                    localLink = './' + localLink;
                }

                let newText = link.text;
                if (pageName) {
                    newText = pageName;
                } else if (!newText && [LinkType.PAGE, LinkType.LINKED_PAGE, LinkType.DOC].includes(link.type)) {
                    newText = 'Untitled';
                }
                const pattern = new RegExp(
                    `\\[${this.escapeRegExp(link.text)}\\]\\(${this.escapeRegExp(link.url)}\\)`,
                    'g',
                );
                transformedContent = transformedContent.replace(pattern, `[${newText}](${localLink})`);
                
                // If diagnostics are requested, record details about this replacement
                if (diagnoseLinks) {
                    replacedLinks.push({
                        text: link.text,
                        newText,
                        originalUrl: link.url,
                        localLink,
                        pageId: link.pageId,
                        documentId: link.documentId,
                    });
                }
            }
        }

        // Return diagnostics if requested, otherwise just the transformed content
        return diagnoseLinks 
            ? { transformedContent, replacedLinks } 
            : transformedContent;
    }

    /**
     * Record-based local link handlers for ClickUp links.
     */
    public static readonly LOCAL_LINK_HANDLERS: Record<LinkType, LinkHandlerFn> = {
        [LinkType.UNKNOWN]: () => null,
        [LinkType.EXTERNAL]: ({ link }) => link.url,
        [LinkType.DOC]: ({ link, basePath, pageMapping }) => {
            return link.documentId && pageMapping[link.documentId]
                ? pageMapping[link.documentId].path
                : link.documentId
                  ? `${basePath}/index.md`
                  : null;
        },
        [LinkType.PAGE]: ({ link, pageMapping }) => {
            return link.pageId && pageMapping[link.pageId] ? pageMapping[link.pageId].path : null;
        },
        [LinkType.LINKED_PAGE]: ({ link, pageMapping }) => {
            return link.pageId && pageMapping[link.pageId] ? pageMapping[link.pageId].path : null;
        },
    };

    private createLocalLink({
        link,
        basePath,
        pageMapping,
    }: {
        link: ParsedLink;
        basePath: string;
        pageMapping: Record<string, { path: string; name: string }>;
    }): string | null {
        // Use enum for key lookup
        return MarkdownTransformer.LOCAL_LINK_HANDLERS[link.type]?.({ link, basePath, pageMapping }) ?? null;
    }

    /**
     * Escapes special characters for use in a regular expression.
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
