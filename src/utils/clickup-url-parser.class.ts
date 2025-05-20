import { ParsedLink, LINK_TYPE } from '../link/types';
import { LINK_PATTERNS } from '../link/consts/link-patterns.const';

/**
 * Parses ClickUp URLs to extract workspace, document, and page IDs.
 */
export class ClickupUrlParser {
    /**
     * Parses a ClickUp URL and extracts identifiers.
     */
    public static parse(options: { url: string; text: string }): ParsedLink | null {
        const { url, text } = options;
        
        if (!url) {
            return null;
        }
        
        // Clean the URL by removing block references or other parameters
        const cleanUrl = this.cleanUrl(url);
        
        // Try each pattern to find a match
        for (const pattern of Object.values(LINK_PATTERNS)) {
            const match = cleanUrl.match(pattern.regex);
            
            if (match) {
                // Create base parsed link
                const parsedLink: ParsedLink = {
                    url: cleanUrl,
                    text,
                    type: pattern.type,
                };
                
                // Extract capture groups if present
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
        
        // If no pattern matched, return as an external/unknown link
        return {
            url: cleanUrl,
            text,
            type: LINK_TYPE.EXTERNAL,
        };
    }
    
    /**
     * Cleans a URL by removing block references and other unnecessary parts.
     */
    private static cleanUrl(url: string): string {
        // Remove block references (e.g., ?block=block-xxxxx)
        return url.replace(/\?block=[^)]+/, '');
    }
}
