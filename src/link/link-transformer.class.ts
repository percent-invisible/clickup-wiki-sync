import { relative, dirname } from 'path';
import { ParsedLink, TransformResult, LINK_TYPE } from './types';
import { LinkParser } from './link-parser.class';
import { PageMapping } from '../catalog/types';

/**
 * Transforms ClickUp markdown links to local file paths while preserving formatting.
 * 
 * This class is designed to maintain strict WYSIWYG appearance - only the URL
 * portion of links is changed, while text formatting and structure are preserved exactly.
 */
export class LinkTransformer {
    /**
     * Parser for detecting and parsing links in markdown content.
     */
    private readonly linkParser: LinkParser;

    /**
     * Creates a new LinkTransformer instance.
     */
    constructor() {
        this.linkParser = new LinkParser();
    }

    /**
     * Transforms all ClickUp links in the content to local file paths.
     */
    public async transform(options: {
        content: string;
        pageMapping: PageMapping;
        currentFilePath: string;
        diagnoseLinks?: boolean;
    }): Promise<string | TransformResult> {
        const { content, pageMapping, currentFilePath, diagnoseLinks = false } = options;
        
        // Parse all links in the content
        const links = await this.linkParser.parseLinks({ content });
        let transformedContent = content;
        const currentDir = dirname(currentFilePath);
        const replacedLinks: any[] = [];

        // Only proceed if we found links and have a page mapping
        if (links.length === 0 || Object.keys(pageMapping).length === 0) {
            return diagnoseLinks ? { transformedContent, replacedLinks } : transformedContent;
        }

        // First, handle standard markdown links [text](url)
        transformedContent = this.replaceStandardLinks({
            content: transformedContent,
            links,
            pageMapping,
            currentDir,
            replacedLinks,
        });

        // Handle table cell links
        transformedContent = this.replaceTableCellLinks({
            content: transformedContent,
            links,
            pageMapping,
            currentDir,
            replacedLinks,
        });

        // Handle nested links (more complex patterns)
        transformedContent = this.replaceNestedLinks({
            content: transformedContent,
            links,
            pageMapping,
            currentDir,
            replacedLinks,
        });

        // Return diagnostics if requested, otherwise just the transformed content
        return diagnoseLinks 
            ? { transformedContent, replacedLinks } 
            : transformedContent;
    }

    /**
     * Replaces standard markdown links of the form [text](url).
     * Preserves any formatting within the link text (bold, italic, etc.).
     */
    private replaceStandardLinks(options: {
        content: string;
        links: ParsedLink[];
        pageMapping: PageMapping;
        currentDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, replacedLinks } = options;
        
        // Use a regex that captures the full markdown link pattern
        // The capture groups allow us to preserve text formatting while only replacing the URL
        const markdownLinkRegex = /(\[([^\]]*)\])(\(([^)]+)\))/g;
        
        return content.replace(markdownLinkRegex, (match, textPart, text, urlPart, url) => {
            // Find the corresponding parsed link
            const link = links.find(l => l.url === url);
            if (!link) {
                return match; // Not a link we parsed, leave unchanged
            }

            // For testing purposes - ignore certain types of links
            if (link.type === LINK_TYPE.EXTERNAL) {
                return match;
            }

            // Find the target path in the page mapping
            const targetId = this.findTargetIdForLink(link, pageMapping);
            if (!targetId) {
                return match; // No mapping found, leave unchanged
            }

            // Get the mapping info
            const mapping = pageMapping[targetId];
            
            // Calculate relative path from current file to target
            let localPath = relative(currentDir, mapping.path);
            if (!localPath.startsWith('.')) {
                localPath = './' + localPath;
            }
            
            // Preserve anchor references if present
            const anchorMatch = url.match(/#[^)]+$/);
            if (anchorMatch) {
                localPath += anchorMatch[0];
            }
            
            // Determine what text to use (preserve original if available)
            let newText = text;
            if (!newText && mapping.name) {
                newText = mapping.name;
            }
            
            // Track this replacement if diagnostics are enabled
            replacedLinks.push({
                text,
                newText,
                originalUrl: url,
                localLink: localPath,
                pageId: link.pageId,
                documentId: link.documentId,
            });
            
            // Replace only the URL part, preserving the exact text part
            // This is critical for WYSIWYG compliance
            return `${textPart}(${localPath})`;
        });
    }

    /**
     * Replaces links in table cells, preserving the table formatting.
     */
    private replaceTableCellLinks(options: {
        content: string;
        links: ParsedLink[];
        pageMapping: PageMapping;
        currentDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, replacedLinks } = options;
        
        // First, identify table rows
        const tableRowRegex = /^\s*\|.*\|.*\n/gm;
        
        return content.replace(tableRowRegex, (tableRow) => {
            // For each table row, replace links using the standard method
            return this.replaceStandardLinks({
                content: tableRow,
                links,
                pageMapping,
                currentDir,
                replacedLinks,
            });
        });
    }

    /**
     * Replaces nested markdown links like [text]([text](url)).
     */
    private replaceNestedLinks(options: {
        content: string;
        links: ParsedLink[];
        pageMapping: PageMapping;
        currentDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, replacedLinks } = options;
        
        // Handle more complex nested patterns - find outer link patterns first
        const nestedLinkRegex = /\[([^\]]*)\]\((\[[^\]]*\]\([^)]+\))\)/g;
        
        return content.replace(nestedLinkRegex, (match, outerText, innerLinkFull) => {
            // Process the inner link using the standard replacement
            const processedInner = this.replaceStandardLinks({
                content: innerLinkFull,
                links,
                pageMapping,
                currentDir,
                replacedLinks,
            });
            
            // Reconstruct with the processed inner link
            return `[${outerText}](${processedInner})`;
        });
    }

    /**
     * Finds the appropriate target ID (page ID or document ID) for a link in the page mapping.
     */
    private findTargetIdForLink(link: ParsedLink, pageMapping: PageMapping): string | null {
        // Check if we have a direct mapping for the URL
        if (pageMapping[link.url]) {
            return link.url;
        }
        
        // Check for page ID mapping
        if (link.pageId && pageMapping[link.pageId]) {
            return link.pageId;
        }
        
        // Check for document ID mapping
        if (link.documentId && pageMapping[link.documentId]) {
            return link.documentId;
        }
        
        return null;
    }
}
