import { LINK_PATTERNS } from '../markdown/consts/link-patterns.const';
import { LinkPatternType } from '../markdown/types/link-pattern-type.enum';
import { LinkType, ParsedLink } from '../types';

/**
 * Extracts workspaceId, documentId, and pageId from a ClickUp doc/page URL.
 * Returns null if the URL does not match any supported pattern.
 */
export class ClickUpUrlParser {
    public static parse(options: { url: string; text: string }): ParsedLink | null {
        const { url, text } = options;

        // Skip image links: ![](url)
        if (text === '' && url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
            return null;
        }

        for (const key of Object.keys(LINK_PATTERNS)) {
            const { regex, type, keys } = LINK_PATTERNS[key as LinkPatternType];
            const match = url.match(regex);
            if (match) {
                const record: ParsedLink = {
                    type,
                    text,
                    url,
                };
                keys.forEach((k: keyof ParsedLink, idx: number) => {
                    (record as any)[k] = match[idx + 1];
                });
                return record;
            }
        }

        return null;
    }
}
