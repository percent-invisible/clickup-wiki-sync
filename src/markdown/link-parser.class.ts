import MarkdownIt from 'markdown-it';
import { LinkType, ParsedLink } from '../types';
import { LINK_PATTERNS } from './link-patterns.const';
import { MarkdownTransformer } from './markdown-transformer.class';

/**
 * Parses ClickUp and Markdown links from content using markdown-it.
 */
export class LinkParser {

    private readonly MD: MarkdownIt;

    constructor() {
        this.MD = new MarkdownIt();
    }

    /**
     * Extracts all links from markdown content using markdown-it tokens.
     * Handles ClickUp and standard markdown links, including ClickUp's URL-encoded nested pattern.
     */
    public parseLinks(options: { content: string }): ParsedLink[] {
        const { content } = options;

        const tokens = this.MD.parse(content, {});
        const links: ParsedLink[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'inline' && token.children) {
                for (let j = 0; j < token.children.length; j++) {
                    const child = token.children[j];

                    if (child.type === 'link_open') {
                        const href = child.attrGet('href');

                        // The next token should be the link text
                        let text = '';
                        if (
                            j + 1 < token.children.length &&
                            token.children[j + 1].type === 'text'
                        ) {
                            text = token.children[j + 1].content;
                        }

                        // Handle ClickUp URL-encoded markdown links
                        let parsedLinks: ParsedLink[] = [];
                        if (href && this.isUrlEncodedMarkdownLink({ href })) {
                            const decoded = decodeURIComponent(href);
                            parsedLinks = this.parseLinks({ content: decoded });
                        }

                        if (parsedLinks.length > 0) {
                            links.push(...parsedLinks);
                        } else {
                            const parsedLink = this.parseLinkUrl({ url: href || '', text });
                            if (parsedLink) {
                                links.push(parsedLink);
                            }
                        }
                    }
                }
            }
        }

        return links;
    }

    /**
     * Returns true if the given string is a URL-encoded markdown link (ClickUp nested pattern).
     */
    private isUrlEncodedMarkdownLink(options: { href: string }): boolean {
        const { href } = options;
        try {
            const decoded = decodeURIComponent(href);
            return /^\[.*\]\(.*\)$/.test(decoded);
        } catch {
            return false;
        }
    }

    /**
     * Parses a single link URL and text into a ParsedLink.
     * Handles ClickUp doc/page/linked_page, relative, and unknown links.
     */
    private parseLinkUrl(options: { url: string; text: string }): ParsedLink | null {
        const { url, text } = options;

        // Skip image links: ![](url)
        if (text === '' && url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
            return null;
        }

        for (const key of Object.keys(LINK_PATTERNS)) {
            const { regex, type, keys } = LINK_PATTERNS[key];
            const match = url.match(regex);
            if (match) {
                const record: ParsedLink = {
                    type,
                    text,
                    url
                };
                keys.forEach((k: keyof ParsedLink, idx: number) => {
                    (record as any)[k] = match[idx + 1];
                });
                return record;
            }
        }

        if (url.startsWith('.') || url.includes('.md')) {
            return {
                type: LinkType.EXTERNAL,
                text,
                url
            };
        }

        return {
            type: LinkType.UNKNOWN,
            text,
            url
        };
    }
}
