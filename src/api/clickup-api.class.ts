import axios from 'axios';
import { ClickupDoc, ClickupPage } from '../types';
import { DocumentMetaResponse, DocumentPagesResponse } from './types';

/**
 * Client for interacting with the ClickUp API to fetch documents and pages.
 */
export class ClickupAPI {
    /**
     * Base URL for the ClickUp API.
     */
    private readonly BASE_URL = 'https://api.clickup.com/api/v3';
    
    /**
     * API key for authentication with ClickUp.
     */
    private readonly apiKey: string;

    /**
     * Creates a new ClickUp API client.
     */
    constructor(options: { apiKey: string }) {
        const { apiKey } = options;
        this.apiKey = apiKey;
    }

    /**
     * Fetches a document and its pages from ClickUp.
     */
    public async getDocument(options: {
        workspaceId: string;
        documentId: string;
        maxPageDepth?: number;
    }): Promise<ClickupDoc> {
        const { workspaceId, documentId, maxPageDepth = -1 } = options;
        
        try {
            // Fetch pages and document metadata in parallel for efficiency
            const pagesUrl = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}/pages`;
            const metaPromise = this.getDocumentMeta({ workspaceId, documentId });
            const pagesPromise = axios.get<DocumentPagesResponse>(pagesUrl, {
                headers: this.getHeaders(),
                params: {
                    max_page_depth: maxPageDepth,
                    content_format: 'text/md',
                },
            });
            
            // Wait for both requests to complete
            const [meta, response] = await Promise.all([metaPromise, pagesPromise]);

            // Handle different response formats
            if (Array.isArray(response.data)) {
                // If response is an array, wrap it in a document object
                return {
                    id: documentId,
                    workspaceId: workspaceId,
                    name: meta?.name || 'Root',
                    content: '',
                    isRoot: true,
                    pages: response.data,
                };
            }
            
            // If it's already a document object, ensure workspaceId is set
            const doc = response.data as ClickupDoc;
            doc.workspaceId = doc.workspaceId || workspaceId;
            return doc;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `ClickUp API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Fetches document metadata to get the document name.
     */
    private async getDocumentMeta(options: { 
        workspaceId: string; 
        documentId: string 
    }): Promise<DocumentMetaResponse> {
        const { workspaceId, documentId } = options;
        const metaUrl = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}`;
        
        try {
            const response = await axios.get<DocumentMetaResponse>(metaUrl, {
                headers: this.getHeaders(),
            });
            
            return response.data;
        } catch (error) {
            // If the document metadata fetch fails, return a default response
            // This allows the main document fetch to continue
            console.error(`Failed to fetch document metadata: ${error}`);
            return { 
                id: documentId, 
                name: 'Unknown Document', 
                workspace_id: workspaceId 
            };
        }
    }

    /**
     * Fetches a specific page from a document.
     */
    public async getPage(options: { 
        workspaceId: string; 
        documentId: string; 
        pageId: string 
    }): Promise<ClickupPage> {
        const { workspaceId, documentId, pageId } = options;
        
        try {
            const url = `${this.BASE_URL}/workspaces/${workspaceId}/docs/${documentId}/pages/${pageId}`;
            const response = await axios.get<ClickupPage>(url, {
                headers: this.getHeaders(),
                params: {
                    content_format: 'text/md',
                },
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `ClickUp API error: ${error.response?.status} - ${error.response?.data?.error || error.message}`
                );
            }
            throw error;
        }
    }
    
    /**
     * Creates the headers needed for ClickUp API requests.
     */
    private getHeaders(): Record<string, string> {
        return {
            Authorization: this.apiKey,
            Accept: 'application/json',
        };
    }
}
