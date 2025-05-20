import fs from 'fs';
import path from 'path';
import { ClickupDoc, ClickupPage } from '../types';

/**
 * Mock implementation of the ClickUp API client for testing.
 * 
 * This implementation reads from the .clickup-data directory
 * instead of making real API calls.
 */
export class MockClickupAPI {
    /**
     * API key for authentication with ClickUp.
     */
    private readonly apiKey: string;

    /**
     * Path to mock data directory.
     */
    private readonly mockDataDir: string;

    /**
     * Creates a new Mock ClickUp API client.
     */
    constructor(options: { 
        apiKey: string;
        mockDataDir?: string;
    }) {
        const { apiKey, mockDataDir = '.clickup-data' } = options;
        this.apiKey = apiKey;
        this.mockDataDir = mockDataDir;
    }

    /**
     * Gets a document and its pages from the mock data.
     */
    public async getDocument(options: {
        workspaceId: string;
        documentId: string;
        maxPageDepth?: number;
    }): Promise<ClickupDoc> {
        const { documentId } = options;
        
        try {
            // Based on documentId, choose the right mock file
            let filename = '';
            if (documentId.includes('h5d8e-3374')) {
                filename = 'find-a-church-map-response.json';
            } else if (documentId.includes('h5d8e-3194')) {
                filename = 'field-glossary-response.json';
            } else {
                throw new Error(`Unknown document ID: ${documentId}`);
            }
            
            // Read the mock data
            const filePath = path.join(this.mockDataDir, filename);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Create a synthetic root document with the pages
            return {
                id: documentId,
                workspaceId: options.workspaceId,
                name: this.getDocumentName(filename),
                content: '',
                isRoot: true,
                pages: data,
            };
        } catch (error) {
            console.error(`Error loading mock data:`, error);
            throw new Error(`Mock API error: Failed to load document ${documentId}`);
        }
    }

    /**
     * Extract document name from filename.
     */
    private getDocumentName(filename: string): string {
        if (filename.includes('find-a-church-map')) {
            return 'HUB: Church - Find-A-Church Map Status';
        } else if (filename.includes('field-glossary')) {
            return 'Field Types Glossary';
        }
        return 'Unknown Document';
    }

    /**
     * Gets a specific page from a document.
     */
    public async getPage(options: { 
        workspaceId: string; 
        documentId: string; 
        pageId: string 
    }): Promise<ClickupPage> {
        const { documentId, pageId } = options;
        
        try {
            // Get the full document
            const doc = await this.getDocument({
                workspaceId: options.workspaceId,
                documentId,
            });
            
            // Find the specific page
            const page = doc.pages?.find(p => p.id === pageId);
            
            if (!page) {
                throw new Error(`Page ${pageId} not found in document ${documentId}`);
            }
            
            return page;
        } catch (error) {
            console.error(`Error getting mock page:`, error);
            throw new Error(`Mock API error: Failed to get page ${pageId}`);
        }
    }
}
