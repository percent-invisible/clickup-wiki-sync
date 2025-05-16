import { LINK_PATTERNS } from '../markdown/link-patterns.const';
import { ParsedLink } from '../types';

/**
 * Extracts workspaceId, documentId, and pageId from a ClickUp doc/page URL.
 * Returns null if the URL does not match any supported pattern.
 */
export class ClickUpUrlParser {
    public static parse(options: { url: string }): ParsedLink | null {
        const { url } = options;

        for (const key of Object.keys(LINK_PATTERNS)) {
            const { regex, type, keys } = LINK_PATTERNS[key];
            const match = url.match(regex);

            if (match) {
                const record: ParsedLink = {
                    type,
                    text: '',
                    url,
                };

                keys.forEach((k, i) => {
                    (record as any)[k] = match[i + 1];
                });

                return record;
            }
        }

        return null;
    }
}
