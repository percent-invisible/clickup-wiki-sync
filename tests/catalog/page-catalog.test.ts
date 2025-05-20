import { describe, it, expect, beforeEach } from 'vitest';
import { PageCatalog } from '../../src/catalog/page-catalog.class';
import { PageCatalogEntry } from '../../src/catalog/types';

describe('PageCatalog', () => {
    let catalog: PageCatalog;
    
    // Sample page entries for testing
    const sampleEntries: PageCatalogEntry[] = [
        {
            pageId: 'page-123',
            documentId: 'doc-abc',
            workspaceId: 'workspace-1',
            clickupUrl: 'https://app.clickup.com/workspace-1/v/dc/doc-abc/page-123',
            name: 'Test Page',
            path: '/wiki/Doc_Title/Test_Page.md'
        },
        {
            pageId: 'page-456',
            documentId: 'doc-abc',
            workspaceId: 'workspace-1',
            clickupUrl: 'https://app.clickup.com/workspace-1/v/dc/doc-abc/page-456',
            name: 'Child Page',
            path: '/wiki/Doc_Title/Test_Page/Child_Page.md',
            parentPageId: 'page-123'
        },
        {
            pageId: 'page-789',
            documentId: 'doc-def',
            workspaceId: 'workspace-1',
            clickupUrl: 'https://app.clickup.com/workspace-1/v/dc/doc-def/page-789',
            name: 'Another Doc Page',
            path: '/wiki/Another_Doc/Another_Doc_Page.md'
        }
    ];
    
    beforeEach(() => {
        catalog = new PageCatalog();
        
        // Add sample entries
        for (const entry of sampleEntries) {
            catalog.addEntry({ entry });
        }
    });
    
    describe('addEntry', () => {
        it('should add entries to the catalog', () => {
            expect(catalog.getEntryCount()).toBe(3);
        });
        
        it('should be able to retrieve entries by pageId', () => {
            const entry = catalog.getEntryByPageId({ pageId: 'page-123' });
            expect(entry).toBeDefined();
            expect(entry?.name).toBe('Test Page');
        });
    });
    
    describe('getEntryByUrl', () => {
        it('should retrieve entries by URL', () => {
            const url = 'https://app.clickup.com/workspace-1/v/dc/doc-abc/page-123';
            const entry = catalog.getEntryByUrl({ url });
            
            expect(entry).toBeDefined();
            expect(entry?.pageId).toBe('page-123');
        });
        
        it('should return undefined for unknown URLs', () => {
            const url = 'https://app.clickup.com/workspace-1/v/dc/doc-xyz/unknown';
            const entry = catalog.getEntryByUrl({ url });
            
            expect(entry).toBeUndefined();
        });
    });
    
    describe('getEntriesByDocId', () => {
        it('should retrieve all entries for a document', () => {
            const entries = catalog.getEntriesByDocId({ documentId: 'doc-abc' });
            
            expect(entries).toHaveLength(2);
            expect(entries.map(e => e.pageId).sort()).toEqual(['page-123', 'page-456'].sort());
        });
        
        it('should return an empty array for unknown document IDs', () => {
            const entries = catalog.getEntriesByDocId({ documentId: 'doc-unknown' });
            
            expect(entries).toHaveLength(0);
        });
    });
    
    describe('createPageMapping', () => {
        it('should create a simplified page mapping for link transformation', () => {
            const mapping = catalog.createPageMapping();
            
            // Should have all page entries
            expect(mapping['page-123']).toBeDefined();
            expect(mapping['page-456']).toBeDefined();
            expect(mapping['page-789']).toBeDefined();
            
            // Should have document entries
            expect(mapping['doc-abc']).toBeDefined();
            expect(mapping['doc-def']).toBeDefined();
            
            // Should have correct paths
            expect(mapping['page-123'].path).toBe('/wiki/Doc_Title/Test_Page.md');
            
            // Should have correct names for empty link text replacement
            expect(mapping['page-456'].name).toBe('Child Page');
        });
    });
});
