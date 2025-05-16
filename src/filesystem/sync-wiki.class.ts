import { promises as fs } from 'fs';
import * as path from 'path';
import { ClickupDoc, ClickupPage } from '../types';
import { MarkdownTransformer } from '../markdown/markdown-transformer.class';

/**
 * Recursively syncs ClickUp docs/pages to local markdown files and folders.
 * Applies project standards: record-based programming, class preference, single object params, etc.
 */
export class SyncWiki {
    private readonly DIST_ROOT: string;
    private readonly markdownTransformer: MarkdownTransformer;

    constructor(options: { distRoot: string }) {
        const { distRoot } = options;
        this.DIST_ROOT = distRoot;
        this.markdownTransformer = new MarkdownTransformer();
    }

    /**
     * Entry point for syncing a ClickUp doc tree to the local filesystem.
     */
    public async syncDocTree(options: { doc: ClickupDoc; basePath: string }): Promise<void> {
        const { doc, basePath } = options;
        
        try {
            // Always work inside DIST_ROOT
            const rootOutputBase = this.DIST_ROOT;
            await fs.mkdir(rootOutputBase, { recursive: true });

            // Create a single document folder under DIST_ROOT
            const docFolder = path.join(rootOutputBase, this.pageDirname({ name: doc.name }));
            await fs.mkdir(docFolder, { recursive: true });

            // Build page mapping (ClickUp pageId => local file path)
            const pageMapping: Record<string, string> = {};
            this.collectPageMapping({ doc, basePath: docFolder, pageMapping });

            // Start recursion from the document folder
            await this.syncNode({ node: doc, basePath: docFolder, pageMapping });
            
        } catch (err) {
            console.error('[ERROR] Error in syncDocTree:', err);
            throw err;
        }
    }

    /**
     * Recursively collect pageId => local file path mapping.
     */
    private collectPageMapping(options: { doc: ClickupPage; basePath: string; pageMapping: Record<string, string> }): void {
        const { doc, basePath, pageMapping } = options;
        if (doc.id) {
            const filename = this.pageFilename({ name: doc.name });
            const filePath = path.join(basePath, filename);
            pageMapping[doc.id] = filePath;
        }
        if (doc.pages && Array.isArray(doc.pages)) {
            for (const page of doc.pages) {
                this.collectPageMapping({ doc: page, basePath: path.join(basePath, this.pageDirname({ name: doc.name })), pageMapping });
            }
        }
    }

    /**
     * Recursively sync a ClickUp doc/page node to local files/folders.
     */
    // Type guard for ClickupDoc (root)
    private isRootDoc(node: ClickupPage | ClickupDoc): node is ClickupDoc {
        return (node as ClickupDoc).isRoot === true;
    }

    /**
     * Recursively sync a ClickUp doc/page node to local files/folders.
     * - Only create a folder if the node has subpages and is not the synthetic root.
     * - Leaf pages are written as .md files in their parent directory.
     * - The synthetic root is used only as a recursion entry point.
     */
    private async syncNode(options: { node: ClickupPage; basePath: string; pageMapping: Record<string, string> }): Promise<void> {
        const { node, basePath, pageMapping } = options;

        try {
            if (typeof node.name !== 'string' || !node.name) {
                console.error('[ERROR] syncNode: node.name is invalid:', node);
                throw new Error('syncNode: node.name is invalid: ' + JSON.stringify(node));
            }

            // Synthetic root: do not create a folder, just recurse into its children using basePath (the document folder)
            if (this.isRootDoc(node)) {
                for (const page of node.pages || []) {
                    // For top-level pages, always use the document folder as basePath
                    await this.syncNode({ node: page, basePath, pageMapping });
                }
                return;
            }

            
            const hasSubpages = node.pages && Array.isArray(node.pages) && node.pages.length > 0;
            let targetDir = basePath;

            if (hasSubpages) {
                // Create a directory for this node
                targetDir = path.join(basePath, this.pageDirname({ name: node.name }));
                try {
                    await fs.mkdir(targetDir, { recursive: true });
                    
                } catch (dirErr) {
                    console.error('[ERROR] Failed to create directory:', targetDir, dirErr);
                    throw dirErr;
                }
            }

            // Write the markdown file for this node in the current directory (not in a subfolder unless it has subpages)
            if (node.content) {
                const mdPath = path.join(targetDir, this.pageFilename({ name: node.name }));
                
                
                // Transform markdown
                const transformed = this.markdownTransformer.transform({
                    content: node.content,
                    basePath,
                    pageMapping
                });

                if (/\[\]\([^\)]+\)/.test(node.content)) {
                    
                }

                try {
                    await fs.writeFile(mdPath, transformed, 'utf-8');
                    
                } catch (fileErr) {
                    console.error('[ERROR] Failed to write file:', mdPath, fileErr);
                    throw fileErr;
                }
            }

            // Recurse into subpages if any
            if (hasSubpages) {
                for (const page of node.pages || []) {
                    await this.syncNode({ node: page, basePath: targetDir, pageMapping });
                }
            }
        } catch (err) {
            console.error('[ERROR] Error in syncNode for node:', node.name, err);
            throw err;
        }
    }

    /**
     * Returns the directory name for a given page (for nesting/folder creation).
     */
    private pageDirname(options: { name: string }): string {
        const { name } = options;
        if (typeof name !== 'string' || !name) {
            console.error('Invalid page name in pageDirname:', name, options);
            throw new Error('SyncWiki.pageDirname called with invalid name: ' + name);
        }
        return name.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Returns the filename for a given page (markdown file).
     */
    private pageFilename(options: { name: string }): string {
        const { name } = options;
        if (typeof name !== 'string' || !name) {
            console.error('Invalid page name in pageFilename:', name, options);
            throw new Error('SyncWiki.pageFilename called with invalid name: ' + name);
        }
        return this.pageDirname({ name }) + '.md';
    }
}
