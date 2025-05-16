import { ConfigLoader } from '../config/config.loader';
import { ClickUpAPI } from '../api/clickup-api.class';
import { ClickUpUrlParser } from './clickup-url-parser.class';

/**
 * Syncs a ClickUp doc/page (and nested pages) given a full ClickUp URL.
 * Loads config, parses the URL, fetches the doc/page tree, and returns the API result.
 */
export class ClickUpSyncer {
    public static async sync(options: { url: string }) {
        const { url } = options;

        const parsed = ClickUpUrlParser.parse({ url });
        if (!parsed) {
            throw new Error('Unsupported ClickUp URL format.');
        }

        const config = ConfigLoader.load({});
        const api = new ClickUpAPI({ apiKey: config.clickup.apiKey });

        if (!parsed.workspaceId || !parsed.documentId) {
            throw new Error('Missing workspaceId or documentId in parsed URL.');
        }

        // Always fetch the entire document tree, even if a pageId is present
        return await api.getDocument({ 
            workspaceId: parsed.workspaceId, 
            documentId: parsed.documentId, 
            maxPageDepth: -1 
        });
    }
}
