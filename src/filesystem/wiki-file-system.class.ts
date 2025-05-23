import { join, resolve, dirname } from 'path';
import { promises as fs } from 'fs';
import { ClickupDoc, ClickupPage } from '../types';
import { PageMapping } from '../catalog/types';
import { SyncResult } from './types';

/**
 * Handles all file system operations for the ClickUp Offline Wiki.
 * 
 * Responsible for creating directory structures, writing files,
 * and sanitizing file paths.
 */
export class WikiFileSystem {
    /**
     * Root directory for all wiki content.
     */
    private readonly rootDir: string;

    /**
     * Creates a new WikiFileSystem instance.
     */
    constructor(options: { rootDir: string }) {
        const { rootDir } = options;
        this.rootDir = rootDir;
    }

    /**
     * Writes a ClickUp document tree to the file system.
     * 
     * This includes creating the document directory and all page files,
     * preserving the hierarchical structure.
     */
    public async writeDocTree(options: { 
        doc: ClickupDoc; 
        basePath?: string 
    }): Promise<SyncResult> {
        const { doc, basePath = '' } = options;
        const pageMapping: PageMapping = {};
        let pageCount = 0;

        // Create a safe directory name for the document
        const docDirName = this.sanitizeFileName(doc.name);
        const docPath = join(this.rootDir, basePath, docDirName);

        // Ensure the document directory exists
        await this.ensureDir(docPath);

        console.log(`Writing document "${doc.name}" to ${docPath}`);

        // If document has its own content, write it as index.md
        if (doc.content) {
            const indexPath = join(docPath, 'index.md');
            await fs.writeFile( doc.content, 'utf-8');
            
            // Add document to page mapping
            pageMapping[doc.id] = {
                
                absolutePath: resolve(indexPath),
                name: doc.name
            };
            pageCount++;
        }

        // Process all pages in the document
        if (doc.pages && doc.pages.length > 0) {
            for (const page of doc.pages) {
                const result = await this.writePage({
                    page,
                    docId: doc.id,
                    basePath: docPath,
                    workspaceId: doc.workspaceId
                });
                
                // Merge the page mapping from this page
                Object.assign(pageMapping, result.pageMapping);
                pageCount += result.pageCount;
            }
        }

        return {
            pageMapping,
            docPath,
            pageCount
        };
    }

    /**
     * Writes a single page and its child pages to the file system.
     */
    private async writePage(options: { 
        page: ClickupPage; 
        docId: string; 
        basePath: string; 
        workspaceId: string;
        parentPath?: string;
    }): Promise<SyncResult> {
        const { page, docId, basePath, workspaceId, parentPath } = options;
        const pageMapping: PageMapping = {};
        let pageCount = 0;

        // Create a safe file name for the page
        const pageName = this.sanitizeFileName(page.name);
        const pagePath = join(basePath, pageName);
        
        const hasChildren = Array.isArray(page.pages) && page.pages.length > 0;
        const hasContent = !!(page.content && page.content.trim().length > 0);
        let wroteMdFile = false;

        // Determine the file path
        // For pages with children, .md file goes inside the folder: <basePath>/<pageName>/<pageName>.md
        // For leaf pages, .md file is at <basePath>/<pageName>.md
        const mdFilePath = hasChildren
            ? join(pagePath, `${pageName}.md`)
            : `${pagePath}.md`;

        // Always ensure the directory for the file exists
        // For pages with children, this is the page directory
        // For leaf pages, this is the parent directory
        await this.ensureDir(dirname(mdFilePath));

        // Write the .md file only if:
        // - the page has content (regardless of children), OR
        // - the page is a leaf (no children)
        if (hasContent || !hasChildren) {
            // For pages with children, the .md file should be inside the folder
            // For leaf pages, it's just the .md file
            console.log(`Writing page "${page.name}" to ${mdFilePath}`);
            await fs.writeFile(mdFilePath, page.content || '', 'utf-8');
            wroteMdFile = true;
            pageCount++;

            // Add page to mapping using the actual written location
            pageMapping[page.id] = {
                absolutePath: resolve(mdFilePath),
                name: page.name
            };
            
            // Track URL format too (useful for cross-doc links)
            if (workspaceId) {
                const pageUrl = `https://app.clickup.com/${workspaceId}/v/dc/${docId}/${page.id}`;
                pageMapping[pageUrl] = {
                    absolutePath: resolve(mdFilePath),
                    name: page.name
                };
            }
        }

        // If page has children, write them
        if (hasChildren) {
            const pageDir = pagePath;
            for (const childPage of page.pages || []) {
                const result = await this.writePage({
                    page: childPage,
                    docId,
                    basePath: pageDir,
                    workspaceId,
                    parentPath: join(parentPath || '', pageName)
                });
                Object.assign(pageMapping, result.pageMapping);
                pageCount += result.pageCount;
            }
        }

        return {
            pageMapping,
            docPath: basePath,
            pageCount
        };
    }

    /**
     * Recursively finds all markdown files in a directory.
     */
    public async findAllMarkdownFiles(options: { directory: string }): Promise<string[]> {
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
            console.error(`Failed to read directory ${directory}:`, err);
        }

        return files;
    }

    /**
     * Ensures a directory exists, creating it and parent directories if needed.
     */
    private async ensureDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            throw new Error(`Failed to create directory ${dirPath}: ${error}`);
        }
    }

    /**
     * Sanitizes a file name by replacing invalid characters with underscores.
     */
    private sanitizeFileName(name: string): string {
        if (name == null || name === '') {
            return 'Untitled';
        }
        
        // Replace spaces and special characters with underscores
        // Keep alphanumeric characters, underscores, and hyphens
        return name
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '_')  // Invalid file chars
            .replace(/\s+/g, '_')           // Spaces to underscores
            .replace(/__+/g, '_');          // Collapse multiple underscores
    }
}
