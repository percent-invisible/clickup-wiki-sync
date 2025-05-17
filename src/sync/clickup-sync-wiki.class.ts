import { resolve } from 'path';
import { ClickUpAPI } from '../api/clickup-api.class';
import { ConfigLoader } from '../config/config.loader';
import { SyncWiki } from '../filesystem/sync-wiki.class';
import { ClickUpUrlParser } from '../utils/clickup-url-parser.class';

/**
 * CLI entrypoint for syncing ClickUp docs/pages to local wiki.
 * Usage: ts-node src/cli/sync-wiki-cli.class.ts <ClickUp URL>
 */
export class ClickupSyncWiki {
    private static loadedDocIds = new Set<string>();

    public static async run(options: { url: string }): Promise<void> {
        const { url } = options;

        try {
            // Load YAML config from default path
            const config = ConfigLoader.load({});
            // Use outputFolder from config, or default to '.clickup'
            const outputFolder = config.outputFolder || '.clickup';

            // Parse URL
            const parsed = ClickUpUrlParser.parse({ url });

            if (parsed == null || parsed.documentId == null) {
                throw new Error('Unsupported ClickUp URL format.');
            }

            // Don't re-fetch document if it has already been synced
            if (this.loadedDocIds.has(parsed.documentId)) {
                return;
            }

            // 1. Fetch doc tree from ClickUp
            console.log(`Syncing ${url}.`);
            const api = new ClickUpAPI({ apiKey: config.clickup.apiKey });

            if (parsed.workspaceId == null || parsed.documentId == null) {
                throw new Error('Missing workspaceId or documentId in parsed URL.');
            }

            // Always fetch the entire document tree, even if a pageId is present
            const doc = await api.getDocument({
                workspaceId: parsed.workspaceId,
                documentId: parsed.documentId,
                maxPageDepth: -1,
            });

            this.loadedDocIds.add(doc.id);

            // 2. Write to local wiki using existing syncer
            const syncWiki = new SyncWiki({ distRoot: resolve(outputFolder) });
            await syncWiki.syncDocTree({ doc, basePath: '' });
        } catch (err) {
            console.error(`Sync for ${url} failed:`, err);
            throw err;
        }
    }
}
