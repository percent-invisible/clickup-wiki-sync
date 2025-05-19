import * as path from 'path';
import { PageMapping } from '../filesystem/types';
import { LinkType } from '../types/link-type.enum';
import { LINK_PATTERNS } from './consts/link-patterns.const';
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

        // Replace all ClickUp links in the content using the precomputed regex
        transformedContent = transformedContent.replace(this.CLICKUP_URL_REGEX, (match, text, ...groups) => {
            // Find which regex matched
            const url =
                groups.slice(0, this.CLICKUP_URL_PATTERNS.length).find(Boolean) +
                (groups[this.CLICKUP_URL_PATTERNS.length] || '');
            const link = links.find((l) => l.url === url);
            if (!link) {
                return match;
            }

            // Determine the lookup id and local path
            const lookupId =
                link.type === LinkType.DOC && link.documentId && pageMapping[link.documentId]
                    ? link.documentId
                    : (link.type === LinkType.PAGE || link.type === LinkType.LINKED_PAGE) &&
                        link.pageId &&
                        pageMapping[link.pageId]
                      ? link.pageId
                      : null;

            if (lookupId == null) {
                return match;
            }

            let localLink: string = path.relative(currentDir, pageMapping[lookupId].path);
            const pageName: string = pageMapping[lookupId].name;
            if (!localLink.startsWith('.')) {
                localLink = './' + localLink;
            }
            let newText = text;
            if (pageName) {
                newText = pageName;
            } else if (!newText && [LinkType.PAGE, LinkType.LINKED_PAGE, LinkType.DOC].includes(link.type)) {
                newText = 'Untitled';
            }

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
            return `[${newText}](${localLink})`;
        });

        // Return diagnostics if requested, otherwise just the transformed content
        return diagnoseLinks ? { transformedContent, replacedLinks } : transformedContent;
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

    /**
     * Precompute ClickUp URL patterns and regex for markdown links
     */
    private readonly CLICKUP_URL_PATTERNS: string[] = Object.values(LinkType)
        .filter((type) => type !== LinkType.EXTERNAL && type !== LinkType.UNKNOWN)
        .map((type) => {
            return Object.values(LINK_PATTERNS)
                .filter((p: any) => p.type === type)
                .map((p: any) => p.regex.source);
        })
        .flat();

    /**
     * Precomputed regex for ClickUp URL patterns in markdown links
     */
    private readonly CLICKUP_URL_REGEX = new RegExp(
        String.raw`\[([^\]]*)\]\(((${this.CLICKUP_URL_PATTERNS.join(')|(')}))(\?[^\)]*)?\)`,
        'g',
    );
}
