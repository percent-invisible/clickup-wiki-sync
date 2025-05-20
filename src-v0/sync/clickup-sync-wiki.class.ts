import { resolve } from 'path';
import { promises as fs } from 'fs';
import { ClickUpAPI } from '../api/clickup-api.class';
import { ConfigLoader } from '../config/config.loader';
import { SyncWiki } from '../filesystem/sync-wiki.class';
import { ClickUpUrlParser } from '../utils/clickup-url-parser.class';
import { MarkdownTransformer } from '../markdown/markdown.transformer';
import { PageMapping } from '../filesystem/types';

/**
 * CLI entrypoint for syncing ClickUp docs/pages to local wiki.
 * Usage: ts-node src/cli/sync-wiki-cli.class.ts <ClickUp URL>
 */
export class ClickupSyncWiki {
    private static loadedDocIds = new Set<string>();
    private static syncedDocPaths: Record<string, string> = {}; // Maps docId to root folder path
    private static lastPageMapping: PageMapping = {};

    public static async run(options: { url: string }): Promise<void> {
        const { url } = options;

        try {
            // Load YAML config from default path
            const config = ConfigLoader.load({});
            // Use outputFolder from config, or default to '.clickup'
            const outputFolder = config.outputFolder || '.clickup';

            // Parse URL
            const parsed = ClickUpUrlParser.parse({ url, text: '' });

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
            const result = await syncWiki.syncDocTree({ doc, basePath: '' });

            // Store the page mapping and doc path for cross-doc link replacement
            Object.assign(this.lastPageMapping, result.pageMapping);
            this.syncedDocPaths[doc.id] = result.docPath;

            // 3. Re-process cross-document links if multiple docs have been synced
            if (Object.keys(this.syncedDocPaths).length > 1) {
                await this.replaceAllCrossDocLinks({ outputFolder });
            }
        } catch (err) {
            console.error(`Sync for ${url} failed:`, err);
            throw err;
        }
    }

    /**
     * Re-processes all synced documents to ensure cross-document links are properly replaced.
     */
    private static async replaceAllCrossDocLinks(options: { outputFolder: string }): Promise<void> {
        const { outputFolder } = options;

        if (Object.keys(this.syncedDocPaths).length <= 1) {
            return; // No cross-doc links possible with only one document
        }

        try {
            // Create a new transformer for updating cross-doc links
            const transformer = new MarkdownTransformer();
            let totalFilesProcessed = 0;
            let totalLinksReplaced = 0;

            // Get all markdown files from synced docs
            for (const [docId, docPath] of Object.entries(this.syncedDocPaths)) {
                const files = await this.findAllMarkdownFiles({ directory: docPath });

                // Process each file
                for (const filePath of files) {
                    // Read the file content
                    const content = await fs.readFile(filePath, 'utf-8');

                    // Transform content with all known page mappings
                    const transformResult = await transformer.transform({
                        content,
                        pageMapping: this.lastPageMapping,
                        currentFilePath: filePath,
                        diagnoseLinks: true,
                    });

                    // Extract the transformed content and diagnostics
                    const { transformedContent, replacedLinks } =
                        typeof transformResult === 'object'
                            ? transformResult
                            : { transformedContent: transformResult, replacedLinks: [] };

                    // Write back only if content changed
                    if (content !== transformedContent) {
                        await fs.writeFile(filePath, transformedContent, 'utf-8');
                        totalLinksReplaced += replacedLinks.length;
                    }

                    totalFilesProcessed++;
                }
            }
        } catch (err) {
            console.error('[ERROR] Failed to replace cross-doc links:', err);
        }
    }

    /**
     * Recursively finds all markdown files in a directory.
     */
    private static async findAllMarkdownFiles(options: { directory: string }): Promise<string[]> {
        const { directory } = options;
        const files: string[] = [];

        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = resolve(directory, entry.name);

                if (entry.isDirectory()) {
                    const subFiles = await this.findAllMarkdownFiles({ directory: fullPath });
                    files.push(...subFiles);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        } catch (err) {
            console.error('[ERROR] Failed to read directory:', directory, err);
        }

        return files;
    }
}
