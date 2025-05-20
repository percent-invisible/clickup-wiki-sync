import { LINK_PATTERNS } from './consts/link-patterns.const';
import { LINK_TYPE, ParsedLink } from './types';

/**
 * Class for parsing links from ClickUp markdown content.
 */
export class LinkParser {
    /**
     * Regular expression to match markdown links: [text](url)
     */
    private readonly MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

    /**
     * Parses all links in the provided markdown content.
     */
    public async parseLinks(options: { content: string }): Promise<ParsedLink[]> {
        const { content } = options;
        const links: ParsedLink[] = [];
        
        // Find all markdown links in the content
        let match;
        while ((match = this.MARKDOWN_LINK_REGEX.exec(content)) !== null) {
            const [fullMatch, text, url] = match;
            
            // Parse each link to extract relevant IDs
            const parsedLink = this.parseLink({ 
                text, 
                url, 
                fullMatch 
            });
            
            if (parsedLink) {
                links.push(parsedLink);
            }
        }
        
        return links;
    }
    
    /**
     * Parses a single link to determine its type and extract relevant IDs.
     */
    private parseLink(options: { 
        text: string; 
        url: string; 
        fullMatch?: string;
    }): ParsedLink {
        const { text, url, fullMatch } = options;
        
        // Clean the URL (remove query parameters if needed)
        const cleanUrl = this.cleanUrl(url);
        
        // Check against all defined patterns
        for (const pattern of Object.values(LINK_PATTERNS)) {
            const match = cleanUrl.match(pattern.regex);
            
            if (match) {
                // Create base parsed link with type and URL
                const parsedLink: ParsedLink = {
                    text,
                    url: cleanUrl,
                    type: pattern.type,
                    fullMatch
                };
                
                // Extract capture groups if specified
                if (pattern.captureGroups && match.length > 1) {
                    // Skip full match at index 0
                    for (let i = 1; i < match.length; i++) {
                        const groupName = pattern.captureGroups[i - 1];
                        if (groupName) {
                            // TypeScript requires this approach for dynamic property assignment
                            (parsedLink as any)[groupName] = match[i];
                        }
                    }
                }
                
                return parsedLink;
            }
        }
        
        // If no pattern matched, return as an external link
        return {
            text,
            url: cleanUrl,
            type: LINK_TYPE.EXTERNAL,
            fullMatch
        };
    }
    
    /**
     * Cleans a URL by removing block references and other unnecessary parts.
     */
    private cleanUrl(url: string): string {
        // Remove block references (e.g., ?block=block-xxxxx)
        return url.replace(/\?block=[^)]+/, '');
    }
}
