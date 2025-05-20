import { promises as fs } from 'fs';
import { PageCatalogEntry, PageMapping } from './types';

/**
 * Manages a catalog of pages for efficient lookup during link transformation.
 * 
 * This is a central component that stores metadata about each page, allowing
 * quick lookup by different identifiers during the link transformation phase.
 */
export class PageCatalog {
    /**
     * Map of page entries indexed by page ID.
     */
    private readonly entriesByPageId = new Map<string, PageCatalogEntry>();
    
    /**
     * Map of page entries indexed by URL.
     */
    private readonly entriesByUrl = new Map<string, PageCatalogEntry>();
    
    /**
     * Map of page entries indexed by document ID.
     * 
     * Since a document can have multiple pages, this maps to an array.
     */
    private readonly entriesByDocId = new Map<string, PageCatalogEntry[]>();
    
    /**
     * Adds a new page entry to the catalog with appropriate indexing.
     */
    public addEntry(options: { entry: PageCatalogEntry }): void {
        const { entry } = options;
        
        // Store by page ID (primary key)
        this.entriesByPageId.set(entry.pageId, entry);
        
        // Store by URL
        if (entry.clickupUrl) {
            this.entriesByUrl.set(entry.clickupUrl, entry);
        }
        
        // Store by document ID (in an array)
        if (entry.documentId) {
            const docEntries = this.entriesByDocId.get(entry.documentId) || [];
            docEntries.push(entry);
            this.entriesByDocId.set(entry.documentId, docEntries);
        }
    }
    
    /**
     * Gets an entry by its page ID.
     */
    public getEntryByPageId(options: { pageId: string }): PageCatalogEntry | undefined {
        const { pageId } = options;
        return this.entriesByPageId.get(pageId);
    }
    
    /**
     * Gets an entry by its original ClickUp URL.
     */
    public getEntryByUrl(options: { url: string }): PageCatalogEntry | undefined {
        const { url } = options;
        return this.entriesByUrl.get(url);
    }
    
    /**
     * Gets all entries for a document by its ID.
     */
    public getEntriesByDocId(options: { documentId: string }): PageCatalogEntry[] {
        const { documentId } = options;
        return this.entriesByDocId.get(documentId) || [];
    }
    
    /**
     * Creates a simplified page mapping for use in link transformation.
     */
    public createPageMapping(): PageMapping {
        const mapping: PageMapping = {};
        
        // Add all page entries
        for (const [pageId, entry] of this.entriesByPageId.entries()) {
            mapping[pageId] = {
                path: entry.path,
                name: entry.name,
            };
        }
        
        // Add document entries (useful for document-level links)
        for (const [docId, entries] of this.entriesByDocId.entries()) {
            if (entries.length > 0) {
                const rootEntry = entries.find(e => !e.parentPageId) || entries[0];
                
                // Create a document-level entry using the document's root page
                mapping[docId] = {
                    path: rootEntry.path,
                    name: rootEntry.name,
                };
            }
        }
        
        return mapping;
    }
    
    /**
     * Gets the total number of entries in the catalog.
     */
    public getEntryCount(): number {
        return this.entriesByPageId.size;
    }
    
    /**
     * Dumps the catalog to a JSON file for debugging purposes.
     * This is a developer-only feature, not intended for production use.
     */
    public async dumpToFile(options: { filePath: string }): Promise<void> {
        const { filePath } = options;
        
        try {
            // Convert the catalog to a serializable structure
            const entries = Array.from(this.entriesByPageId.values());
            
            // Write to file with pretty formatting
            await fs.writeFile(
                filePath,
                JSON.stringify({ entries }, null, 2),
                'utf-8'
            );
            
            console.log(`Catalog dumped to ${filePath} (${entries.length} entries)`);
        } catch (error) {
            console.error('Failed to dump catalog:', error);
        }
    }
}
