import { relative, dirname, resolve, basename } from 'path';
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
        
        // Get both relative dirname and absolute path for accurate path calculations
        const currentDir = dirname(currentFilePath);
        // Ensure we have the full absolute path for accurate path calculations
        const currentAbsoluteDir = resolve(currentDir);
        
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
            currentAbsoluteDir,
            replacedLinks,
        });

        // Handle table cell links
        transformedContent = this.replaceTableCellLinks({
            content: transformedContent,
            links,
            pageMapping,
            currentDir,
            currentAbsoluteDir,
            replacedLinks,
        });

        // Handle nested links (more complex patterns)
        transformedContent = this.replaceNestedLinks({
            content: transformedContent,
            links,
            pageMapping,
            currentDir,
            currentAbsoluteDir,
            replacedLinks,
        });

        // Return diagnostics if requested, otherwise just the transformed content
        return diagnoseLinks 
            ? { transformedContent, replacedLinks } 
            : transformedContent;
    }

    /**
     * Finds the appropriate target ID for a link in the page mapping.
     * Attempts to match based on URL, page ID, document ID, and more advanced matching.
     */
    private findTargetIdForLink(link: ParsedLink, pageMapping: PageMapping): string | null {
        const keys = Object.keys(pageMapping);
        
        // Step 1: Try to find an exact match with the complete URL (cleaned or original)
        // This is the most reliable way to match a link to its target
        for (const key of keys) {
            if (key === link.url || key === link.originalUrl) {
                return key;
            }
        }
        
        // Step 2: For page-specific links, match both documentId and pageId
        if (link.pageId && link.documentId) {
            // Try to find a direct match by comparing the keys
            // Use the clickupUrl if available, as it may contain both IDs
            for (const key of keys) {
                const entry = pageMapping[key];
                
                // If the key contains both the document ID and page ID, it's likely a match
                if (link.documentId && 
                    link.pageId && 
                    key.includes(link.documentId) && 
                    key.includes(link.pageId)) {
                    return key;
                }
            }
        }
        
        // Step 3: For page-specific links, try matching just the page ID
        // This is helpful for links within the same document
        if (link.pageId) {
            for (const key of keys) {
                if (link.pageId && key.includes(link.pageId)) {
                    return key;
                }
            }
        }
        
        // Step 4: For document-only links, try to find a match with the document ID
        if (link.documentId) {
            for (const key of keys) {
                // For document IDs, prefer keys that don't have a page ID component
                // This helps match document links to the root document, not a specific page
                if (link.documentId && 
                    key.includes(link.documentId) && 
                    !key.includes('_')) {
                    return key;
                }
            }
            
            // Fallback: Try any key with the document ID if we can't find a better match
            for (const key of keys) {
                if (link.documentId && key.includes(link.documentId)) {
                    return key;
                }
            }
        }
        
        // Step 5: Final fallback - try to match by the URL pattern
        const urlParts = link.url.split('/');
        const lastUrlPart = urlParts[urlParts.length - 1];
        
        if (lastUrlPart && lastUrlPart.length > 5) {
            for (const key of keys) {
                if (key.includes(lastUrlPart)) {
                    return key;
                }
            }
        }
        
        return null;
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
        currentAbsoluteDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, currentAbsoluteDir, replacedLinks } = options;
        
        // Use a regex that captures the full markdown link pattern
        // The capture groups allow us to preserve text formatting while only replacing the URL
        const markdownLinkRegex = /(\[([^\]]*)\])(\(([^)]+)\))/g;
        
        return content.replace(markdownLinkRegex, (match, textPart, text, urlPart, url) => {
            // Find the corresponding parsed link - check both cleaned and original URLs
            const link = links.find(l => l.url === url || l.originalUrl === url);
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
            
            const currentFileAbsoluteDir = currentAbsoluteDir;
            let localPath;
            
            // Calculate relative path from current file directory to target file
            // This ensures we get the full, correct path between documents
            localPath = relative(currentFileAbsoluteDir, mapping.absolutePath);
            
            if (!localPath.startsWith('.')) {
                localPath = './' + localPath;
            }
            
            // Preserve anchor references if present
            const anchorMatch = url.match(/#[^)]+$/);
            if (anchorMatch) {
                localPath += anchorMatch[0];
            }
            
            // Preserve block references if present in the original URL
            if (link.blockReference) {
                // If there's already an anchor, don't add a block reference
                if (!anchorMatch) {
                    localPath += `?block=${link.blockReference}`;
                }
            }
            
            // Determine what text to use (preserve original if available)
            let newText = text;
            
            // If the text is empty, use the page name
            if (!newText && mapping.name) {
                newText = mapping.name;
            }
            
            // If the text is a URL (happens in ClickUp exports), use the page name instead
            if (text.startsWith('https://app.clickup.com/') && mapping.name) {
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
            
            // If we need to replace the text part (empty or URL text)
            if (newText !== text) {
                // Replace both text and URL parts
                return `[${newText}](${localPath})`;
            } else {
                // Replace only the URL part, preserving the exact text part
                // This is critical for WYSIWYG compliance
                return `${textPart}(${localPath})`;
            }
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
        currentAbsoluteDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, currentAbsoluteDir, replacedLinks } = options;
        
        // First, identify table rows
        const tableRowRegex = /^\s*\|.*\|.*\n/gm;
        
        return content.replace(tableRowRegex, (tableRow) => {
            // For each table row, replace links using the standard method
            return this.replaceStandardLinks({
                content: tableRow,
                links,
                pageMapping,
                currentDir,
                currentAbsoluteDir,
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
        currentAbsoluteDir: string;
        replacedLinks: any[];
    }): string {
        const { content, links, pageMapping, currentDir, currentAbsoluteDir, replacedLinks } = options;
        
        // Handle more complex nested patterns - find outer link patterns first
        const nestedLinkRegex = /\[([^\]]*)\]\((\[[^\]]*\]\([^)]+\))\)/g;
        
        return content.replace(nestedLinkRegex, (match, outerText, innerLinkFull) => {
            // Process the inner link using the standard replacement
            const processedInner = this.replaceStandardLinks({
                content: innerLinkFull,
                links,
                pageMapping,
                currentDir,
                currentAbsoluteDir,
                replacedLinks,
            });
            
            // Reconstruct with the processed inner link
            return `[${outerText}](${processedInner})`;
        });
    }


}
