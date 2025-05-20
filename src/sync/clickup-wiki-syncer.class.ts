import path from 'path';
import { ClickupUrlParser } from '../utils/clickup-url-parser.class';
import { ClickupAPI } from '../api/clickup-api.class';
import { WikiFileSystem } from '../filesystem/wiki-file-system.class';
import { PageCatalog } from '../catalog/page-catalog.class';
import { LinkTransformer } from '../link/link-transformer.class';
import { ParsedLink, LINK_TYPE } from '../link/types';
import { LinkParser } from '../link/link-parser.class';

/**
 * Main class that orchestrates the syncing process for ClickUp Offline Wiki.
 * 
 * This class implements the two-phase sync process:
 * 1. First phase: Downloads documents and pages, writes them to disk, and builds a catalog
 * 2. Second phase: Transforms links in all documents to use local filesystem paths
 */
export class ClickupWikiSyncer {
    /**
     * The ClickUp API client.
     */
    private readonly api: ClickupAPI;
    
    /**
     * The file system handler.
     */
    private readonly fileSystem: WikiFileSystem;
    
    /**
     * The page catalog for tracking page metadata.
     */
    private readonly catalog: PageCatalog;
    
    /**
     * The link transformer.
     */
    private readonly linkTransformer: LinkTransformer;
    
    /**
     * The link parser.
     */
    private readonly linkParser: LinkParser;
    
    /**
     * Set of document IDs that have been synced.
     */
    private readonly syncedDocIds = new Set<string>();
    
    /**
     * Output directory for wiki files.
     */
    private readonly outputDir: string;
    
    /**
     * Maximum depth to recursively fetch documents.
     */
    private readonly maxDepth: number;
    
    /**
     * Debug mode flag.
     */
    private readonly debug: boolean;

    /**
     * Creates a new ClickupWikiSyncer instance.
     */
    constructor(options: { 
        apiKey: string; 
        outputDir: string;
        maxDepth?: number;
        debug?: boolean;
    }) {
        const { apiKey, outputDir, maxDepth = 3, debug = false } = options;
        
        this.api = new ClickupAPI({ apiKey });
        this.fileSystem = new WikiFileSystem({ rootDir: outputDir });
        this.catalog = new PageCatalog();
        this.linkTransformer = new LinkTransformer();
        this.linkParser = new LinkParser();
        this.outputDir = outputDir;
        this.maxDepth = maxDepth;
        this.debug = debug;
    }

    /**
     * Main entry point to run the sync process.
     */
    public async run(options: { url: string }): Promise<void> {
        const { url } = options;
        console.log('Starting ClickUp Offline Wiki sync...');
        
        try {
            // Parse the URL
            const parsedUrl = ClickupUrlParser.parse({ url, text: '' });
            
            if (!parsedUrl || !parsedUrl.workspaceId) {
                throw new Error(`Invalid ClickUp URL: ${url}`);
            }
            
            if (!parsedUrl.documentId) {
                throw new Error(`URL must point to a ClickUp document: ${url}`);
            }
            
            // Phase 1: Sync documents and pages, build catalog
            await this.syncDocuments({
                initialUrl: url,
                workspaceId: parsedUrl.workspaceId,
                documentId: parsedUrl.documentId,
                currentDepth: 0,
            });
            
            console.log(`Phase 1 complete: ${this.catalog.getEntryCount()} pages cataloged`);
            
            // Dump catalog if in debug mode
            if (this.debug) {
                await this.catalog.dumpToFile({
                    filePath: path.join(this.outputDir, 'catalog-debug.json'),
                });
            }

            // Phase 2: Transform links in all documents
            await this.transformLinks();
            
            console.log('Sync complete!');
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }

    /**
     * Phase 1: Syncs documents and their pages to the file system.
     */
    private async syncDocuments(options: {
        initialUrl: string;
        workspaceId: string;
        documentId: string;
        currentDepth: number;
        previousDocs?: Set<string>;
    }): Promise<void> {
        const { 
            initialUrl, 
            workspaceId, 
            documentId, 
            currentDepth,
            previousDocs = new Set<string>(),
        } = options;
        
        // Prevent infinite loops from circular references
        if (previousDocs.has(documentId)) {
            console.log(`Skipping already visited document: ${documentId}`);
            return;
        }
        
        // Add to the tracking set
        previousDocs.add(documentId);
        
        // Check if we've already synced this document
        if (this.syncedDocIds.has(documentId)) {
            console.log(`Document already synced: ${documentId}`);
            return;
        }
        
        // Check depth limit
        if (currentDepth > this.maxDepth && this.maxDepth !== -1) {
            console.log(`Reached maximum depth (${this.maxDepth}), stopping recursion`);
            return;
        }
        
        // Add to synced set
        this.syncedDocIds.add(documentId);
        
        try {
            // Fetch the document from ClickUp
            console.log(`Fetching document: ${documentId}`);
            const doc = await this.api.getDocument({
                workspaceId,
                documentId,
            });
            
            // Write the document tree to disk
            const syncResult = await this.fileSystem.writeDocTree({
                doc,
            });
            
            console.log(`Wrote ${syncResult.pageCount} pages to ${syncResult.docPath}`);
            
            // Add entries to the catalog
            this.addPageMappingToCatalog({
                pageMapping: syncResult.pageMapping,
                documentId,
                workspaceId,
            });
            
            // Find cross-document links in pages to sync those documents too
            await this.findAndSyncReferencedDocs({
                doc,
                initialUrl,
                workspaceId,
                currentDepth: currentDepth + 1,
                previousDocs,
            });
        } catch (error) {
            console.error(`Failed to sync document ${documentId}:`, error);
            throw error;
        }
    }

    /**
     * Finds cross-document links and syncs the referenced documents.
     */
    private async findAndSyncReferencedDocs(options: {
        doc: any;
        initialUrl: string;
        workspaceId: string;
        currentDepth: number;
        previousDocs: Set<string>;
    }): Promise<void> {
        const { doc, initialUrl, workspaceId, currentDepth, previousDocs } = options;
        
        // Extract all page content for analysis
        const pageContents: string[] = [];
        
        // Add document content if available
        if (doc.content) {
            pageContents.push(doc.content);
        }
        
        // Add page content recursively
        const addPageContents = (pages: any[]) => {
            if (!pages) return;
            
            for (const page of pages) {
                if (page.content) {
                    pageContents.push(page.content);
                }
                if (page.pages) {
                    addPageContents(page.pages);
                }
            }
        };
        
        if (doc.pages) {
            addPageContents(doc.pages);
        }
        
        // Search for cross-document links in all content
        const docIds = new Set<string>();
        
        for (const content of pageContents) {
            const links = await this.linkParser.parseLinks({ content });
            
            for (const link of links) {
                // Only consider links to other documents
                if (
                    link.type === LINK_TYPE.DOCUMENT || 
                    link.type === LINK_TYPE.CROSS_DOC
                ) {
                    if (link.documentId && link.documentId !== doc.id) {
                        docIds.add(link.documentId);
                    }
                }
            }
        }
        
        // Sync all referenced documents recursively
        for (const docId of docIds) {
            try {
                await this.syncDocuments({
                    initialUrl,
                    workspaceId,
                    documentId: docId,
                    currentDepth,
                    previousDocs,
                });
            } catch (error: unknown) {
                // Log error but continue with other documents
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Could not sync referenced document ${docId}: ${errorMessage}`);
                if (this.debug) {
                    console.debug('Reference error details:', error);
                }
                // Continue with other documents rather than failing the entire process
                continue;
            }
        }
    }

    /**
     * Adds page mapping entries to the catalog.
     */
    private addPageMappingToCatalog(options: {
        pageMapping: Record<string, { absolutePath: string; name: string }>;
        documentId: string;
        workspaceId: string;
    }): void {
        const { pageMapping, documentId, workspaceId } = options;
        
        for (const [key, value] of Object.entries(pageMapping)) {
            // Skip entries that don't look like IDs or URLs
            if (!key || key.length < 8) {
                continue;
            }
            
            // If it's a URL, try to parse it
            let pageId = key;
            let clickupUrl = key.startsWith('http') ? key : '';
            
            if (clickupUrl) {
                const parsed = ClickupUrlParser.parse({
                    url: clickupUrl,
                    text: '',
                });
                
                if (parsed && parsed.pageId) {
                    pageId = parsed.pageId;
                }
            }
            
            // Add to catalog
            this.catalog.addEntry({
                entry: {
                    pageId,
                    documentId,
                    workspaceId,
                    clickupUrl,
                    name: value.name,
                    absolutePath: value.absolutePath,
                },
            });
        }
    }

    /**
     * Phase 2: Transforms all links in documents to local paths.
     */
    private async transformLinks(): Promise<void> {
        console.log('Starting Phase 2: Transforming links...');
        
        // Create page mapping from catalog
        const pageMapping = this.catalog.createPageMapping();
        
        // Find all markdown files
        const files = await this.fileSystem.findAllMarkdownFiles({
            directory: this.outputDir,
        });
        
        console.log(`Found ${files.length} markdown files to process`);
        
        // Transform links in each file
        for (const filePath of files) {
            await this.transformFileLinks({
                filePath,
                pageMapping,
            });
        }
    }

    /**
     * Transforms links in a specific file.
     */
    private async transformFileLinks(options: {
        filePath: string;
        pageMapping: Record<string, { absolutePath: string; name: string }>;
    }): Promise<void> {
        const { filePath, pageMapping } = options;
        
        try {
            // Read the file
            const content = await import('fs').then(fs => 
                fs.promises.readFile(filePath, 'utf-8')
            );
            
            // Transform links
            const transformed = await this.linkTransformer.transform({
                content,
                pageMapping,
                currentFilePath: filePath,
                diagnoseLinks: this.debug,
            });
            
            // Write the transformed content back
            const transformedContent = typeof transformed === 'string' 
                ? transformed 
                : transformed.transformedContent;
            
            await import('fs').then(fs => 
                fs.promises.writeFile(filePath, transformedContent, 'utf-8')
            );
            
            // Log diagnostic information if in debug mode
            if (this.debug && typeof transformed !== 'string') {
                console.log(`Transformed ${transformed.replacedLinks.length} links in ${filePath}`);
            }
        } catch (error) {
            console.error(`Failed to transform links in ${filePath}:`, error);
        }
    }
}
